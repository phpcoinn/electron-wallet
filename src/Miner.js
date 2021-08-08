import * as App from "@/App";
import * as Wallet from "@/Wallet";
import * as argon2 from "argon2"
import crypto from "crypto";
import * as axios from "./utils/Axios";


let minerData = {
    status: null,
    running: false,
    blockFound: false,
    miner: {
        attempt: 0,
        block: null,
        height: null,
    },
    miningStat: {
        cnt: 0,
        hashes: 0,
        submits: 0,
        accepted: 0,
        rejected: 0,
        dropped: 0,
    }
}


let hashingConfig = {
    mem: 2048,
    time: 2,
    parallelism: 1
}
//TODO: replace for mainnet
let block_time = 30

function start() {

    new Promise(async (resolve, reject) => {

        console.log("starting miner")
        minerData.status = "Starting miner"
        minerData.running = true
        updateUi()

        await Wallet.setWalletPeer()
        await loop()

        resolve()
    }).then(res=>{
        console.log("finished miner")
    }).catch(err=>{
        console.log("Error running miner")
    })

}

function hexToDec(s) {
    let i, j, digits = [0], carry;
    for (i = 0; i < s.length; i += 1) {
        carry = parseInt(s.charAt(i), 16);
        for (j = 0; j < digits.length; j += 1) {
            digits[j] = digits[j] * 16 + carry;
            carry = digits[j] / 10 | 0;
            digits[j] %= 10;
        }
        while (carry > 0) {
            digits.push(carry % 10);
            carry = carry / 10 | 0;
        }
    }
    return digits.reverse().join('');
}

async function loop() {

    console.log("start loop")
    let max = hexToDec('FFFFFFFF') * 1000

    while(minerData.running) {

        minerData.miningStat.cnt++
        console.log("running miner", minerData.miningStat.cnt)

        let info = await getMineInfo()
        console.log("info", info)
        if(!info) {
            minerData.running = false
            break
        }

        let address = App.walletData.address
        let block_date = parseInt(info.date)
        let now = Math.round(Date.now() / 1000)
        let nodeTime = info.time
        let data = info.data
        let block = info.block
        let offset = nodeTime - now
        let elapsed
        let new_block_date
        let argonBase
        let height = parseInt(info.height) + 1
        let difficulty = info.difficulty
        let argon = null, nonceBase = null, calcNonce = null, hitBase = null, hashPart = null, hitValue = null
        let hit = 0
        let target = 0
        let signatureBase, signature, json
        let submitResponse
        let calOffset = 0
        let blockFound = false
        let times = {}
        let version = info.version
        let attempt = 0

        minerData.miner = {
            address,
            block_date,
            now,
            nodeTime,
            offset,
            elapsed,
            new_block_date,
            calOffset,
            argon,
            nonceBase,
            calcNonce,
            height,
            difficulty,
            hitBase,
            hashPart,
            hitValue,
            hit,
            target,
            blockFound,
            data,
            signatureBase,
            signature,
            json,
            version,
            submitResponse,
            times,
            attempt
        }

        if(Array.isArray(data) && data.length === 0) {
            data = {}
        }

        while(!blockFound) {

            if(!minerData.running) {
                minerData.miningStat.dropped ++
                break
            }

            attempt++
            console.log("calculating hash, attempt", attempt)
            minerData.miningStat.hashes++

            if(attempt % 10  === 0) {
                let info = await getMineInfo()
                if (info.status === 'ok') {
                    console.log(`Node height ${info.data.height} we mine ${minerData.miner.height}`)
                    if(info.data.block !==  block) {
                        console.log(`New block detected - starting over`)
                        minerData.miningStat.dropped ++
                        break
                    }
                }
            }

            await new Promise(resolve => setTimeout(resolve, 500));

            now = Math.round(Date.now() / 1000)
            elapsed = now + offset - block_date
            console.log(`now=${now} offset=${offset} block_date=${block_date} elapsed=${elapsed}`)
            argonBase = `${block_date}-${elapsed}`
            new_block_date = block_date + elapsed

            minerData.miner.elapsed = elapsed
            minerData.miner.attempt = attempt
            minerData.miner.new_block_date = new_block_date

            argon = await argon2.hash(argonBase, {
                salt: Buffer.from(address.substr(0, 16)),
                memoryCost: hashingConfig.mem,
                timeCost: hashingConfig.time,
                parallelism: hashingConfig.parallelism,
                type: argon2.argon2i,
                hashLength: 32
            })
            console.log("argon2 hash", argon)

            nonceBase = `${address}-${block_date}-${elapsed}-${argon}`

            calcNonce = sha256(nonceBase)

            hitBase = `${address}-${calcNonce}-${height}-${difficulty}`
            let hash1 = sha256(hitBase)
            let hash2 = sha256(hash1)

            hashPart = hash2.substr(0, 8)
            hitValue = hexToDec(hashPart)
            hit = Math.round(max / hitValue)
            target = Math.round(difficulty * block_time / elapsed)
            blockFound = (hit > 0 && target >= 0 && hit > target)
            console.log(`block_time=${block_time} elapsed=${elapsed} difficulty=${difficulty} hit=${hit} target=${target} blockFound=${blockFound}`)

            minerData.miner.hit = hit
            minerData.miner.target = target
            updateUi()
        }

        if(!blockFound) {
            continue
        }

        minerData.miningStat.submits++
        let postData = {
            argon,
            nonce: calcNonce,
            height,
            difficulty,
            address,
            date: new_block_date,
            data: JSON.stringify(data),
            elapsed
        }

        console.log("postData", postData)
        let response = await axios.post(App.walletData.walletPeer + '/mine.php?q=submitHash', postData)
        if(response.status === 'ok') {
            minerData.miningStat.accepted ++
        } else {
            console.log(response)
            minerData.miningStat.rejected ++
        }
        submitResponse = response
        minerData.miner.submitResponse = submitResponse
        updateUi()
        await new Promise(resolve => setTimeout(resolve, 2000));

    }
}

function sha256(pwd) {
    return crypto.createHash('sha256').update(pwd).digest('hex');
}

async function getMineInfo() {
    let url = App.walletData.walletPeer + '/mine.php?q=info'
    // console.log(`Getting mine data from peer ${url}`)
    let info =  await Wallet.peerGet(url)
    return info
}

function stop() {
    console.log("stopping miner")
    minerData.status = "Stoping miner"
    updateUi()
    minerData.running = false
}

function updateUi() {
    App.win.webContents.send("miner-data", minerData)
}

export {
    minerData,
    start,
    stop
}
