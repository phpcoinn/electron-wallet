import * as App from "@/App";
import * as Wallet from "@/Wallet";
import * as argon2 from "argon2"
import crypto from "crypto";
import * as Axios from "./utils/Axios";
import {dialog} from "electron";


let minerData = App.state.minerData

let hashingConfig = {
    mem: 2048,
    time: 2,
    parallelism: 1
}
let block_time = App.config.block_time

let startTime

let cpu = 0

let updateUiTimer
let mineInfoTimer

function start() {

    startTime = Date.now()


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

    updateUiTimer = setInterval(()=>{
        updateUi()
    }, 1000)

    mineInfoTimer = setInterval(()=>{
        getMineInfo().then(info=>{
            // console.log(`Node height ${info.height} we mine ${minerData.miner.height}`)
            if (info && minerData && minerData.miner && info.block !== minerData.miner.block) {
                console.log(`New block detected - starting over`)
                minerData.miningStat.dropped++
                minerData.break = true
            }
        })

    }, 10000)

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

        try {

            minerData.miningStat.cnt++
            console.log("running miner", minerData.miningStat.cnt)

            let info = await getMineInfo()
            console.log("info", info)
            if (!info) {
                minerData.miningStat.nodeStatus = false
                updateUi()
                await new Promise(resolve => setTimeout(resolve, 5000));
                continue
            }

            minerData.miningStat.nodeStatus = true

            let address = App.state.walletData.address
            let block_date = parseInt(info.date)
            let now = Math.round(Date.now() / 1000)
            let nodeTime = info.time
            let data = info.data
            let block = info.block
            let chain_id = info.chain_id
            let offset = nodeTime - now
            let elapsed = 0
            let new_block_date
            let argonBase
            let height = parseInt(info.height) + 1
            let difficulty = info.difficulty
            let argon = null, nonceBase = null, calcNonce = null, hitBase = null, hashPart = null, hitValue = null
            let hit = 0
            let maxHit = 0
            let target = 0
            let maxTarget = 0
            let signatureBase, signature, json
            let submitResponse
            let calOffset = 0
            let blockFound = false
            let times = {}
            let version = info.version
            let attempt = 0
            let runningTime

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
                attempt,
                runningTime,
                block
            }

            if (Array.isArray(data) && data.length === 0) {
                data = {}
            }

            let t1 = Date.now()
            while (!blockFound) {

                if (!minerData.running) {
                    minerData.miningStat.dropped++
                    break
                }

                if (minerData.break) {
                    minerData.break = false
                    break
                }

                attempt++
                minerData.miningStat.hashes++

                let t2 = Date.now()
                let diff = t2 - t1
                minerData.miningStat.speed = ( attempt / (diff / 1000)).toFixed(2)

                let ms = (100 - cpu) * 5
                await new Promise(resolve => setTimeout(resolve, ms));
                now = Math.round(Date.now() / 1000)
                elapsed = now + offset - block_date

                // console.log(`now=${now} offset=${offset} block_date=${block_date} elapsed=${elapsed}`)
                argonBase = `${block_date}-${elapsed}`
                new_block_date = block_date + elapsed

                minerData.miner.elapsed = elapsed
                minerData.miner.attempt = attempt
                minerData.miner.new_block_date = new_block_date

                let salt = Buffer.from(address.substr(0, 16))
                if(info.hashingOptions) {
                    hashingConfig.mem = info.hashingOptions.memory_cost
                    hashingConfig.parallelism = info.hashingOptions.threads
                    hashingConfig.time = info.hashingOptions.time_cost
                    salt = crypto.randomBytes(8).toString('hex')
                    salt = Buffer.from(salt)
                }

                argon = await argon2.hash(argonBase, {
                    salt,
                    memoryCost: hashingConfig.mem,
                    timeCost: hashingConfig.time,
                    parallelism: hashingConfig.parallelism,
                    type: argon2.argon2i,
                    hashLength: 32
                })
                //console.log("argon2 hash", argon)

                nonceBase = `${chain_id}${address}-${block_date}-${elapsed}-${argon}`

                calcNonce = sha256(nonceBase)

                hitBase = `${address}-${calcNonce}-${height}-${difficulty}`
                let hash1 = sha256(hitBase)
                let hash2 = sha256(hash1)

                hashPart = hash2.substr(0, 8)
                hitValue = hexToDec(hashPart)
                hit = Math.round(max / hitValue)
                if (hit > maxHit) {
                    maxHit = hit
                }
                if(elapsed <= 0) {
                    break
                }
                target = Math.round(difficulty * block_time / elapsed)
                if (target > maxTarget) {
                    maxTarget = target
                }
                blockFound = (hit > 0 && target > 0 && hit > target)
                // console.log(`attempt=${attempt} block_time=${block_time} elapsed=${elapsed} difficulty=${difficulty} hit=${hit} target=${target} blockFound=${blockFound}`)

                minerData.miner.hit = hit
                minerData.miner.maxHit = maxHit
                minerData.miner.target = target
                minerData.miner.maxTarget = maxTarget
                minerData.miner.runningTime = Date.now() - startTime
            }

            if (!blockFound || elapsed<=0) {
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
                elapsed,
                minerInfo: 'electron-wallet ' + App.state.info.version
            }


            console.log("postData", App.state.settings.miningNode)
            let response
            try {
                response = await Axios.post(App.state.settings.miningNode + '/mine.php?q=submitHash', postData)
            } catch (e) {
                console.error("ERROR", e)
            }
            if (response) {
                if (response.status === 'ok') {
                    minerData.miningStat.accepted++
                    minerData.logs.unshift({
                        type: 'success',
                        time: Date.now(),
                        title: 'Hash accepted',
                        message: response.data
                    })
                    await Wallet.refresh()
                } else {
                    // console.log(JSON.stringify(response))
                    minerData.miningStat.rejected++
                    minerData.miningStat.rejectedReason = response.data
                    minerData.logs.unshift({
                        type: 'danger',
                        time: Date.now(),
                        title: 'Hash rejected',
                        message: response.data
                    })
                }
            } else {
                minerData.miningStat.rejected++
                minerData.miningStat.rejectedReason = "NO_RESPONSE"
            }
            submitResponse = response
            minerData.miner.submitResponse = submitResponse
            updateUi()
            await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (e) {
            // minerData.logs.unshift({
            //     type: 'warning',
            //     time: Date.now(),
            //     title: 'Error in miner',
            //     message: 'Error: ' + e
            // })
            updateUi()
            console.error(e)
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

    }
}

function sha256(pwd) {
    return crypto.createHash('sha256').update(pwd).digest('hex');
}

async function getMineInfo() {
    let url = App.state.settings.miningNode + '/mine.php?q=info'
    let info
    try {
        info =  await Wallet.peerGet(url)
    } catch (e) {
        console.error(e)
    }
    return info
}

async function checkMineAddress() {
    let address = App.state.walletData.address
    let postData = {
        address
    }
    try {
        let response = await Axios.post(App.state.settings.miningNode + '/mine.php?q=checkAddress', postData)
        if (response.status === 'ok') {
            if(response.data === address) {
                return true
            }
        }
    } catch (e) {
        console.log(e)
        return false
    }
}

function stop() {
    console.log("stopping miner")
    minerData.status = "Stoping miner"
    clearInterval(updateUiTimer)
    clearInterval(mineInfoTimer)
    minerData.running = false
    updateUi()
}

function updateUi() {
    App.updateState()
}

function clearLog() {
    minerData.logs = []
    updateUi()
}

function updateMinerCpu(c) {
    cpu = c
}

export {
    start,
    stop,
    clearLog,
    updateMinerCpu
}
