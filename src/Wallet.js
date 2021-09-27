import {win} from "@/App";
import {shell} from "electron";

const fs = require("fs");
const cryptoUtil = require("./utils/cryptoUtil");
const App = require("./App");
const AppMenu = require("./AppMenu");
const app = require("electron").app
const dialog = require('electron').dialog
const Axios = require('./utils/Axios')
const QRCode = require('qrcode')

let walletData = App.state.walletData

function enableMenuItem(id, enabled) {
    let menuItem = AppMenu.findMenuItem(id)
    if(menuItem) {
        menuItem.enabled = enabled
    }
}

async function loadWallet() {
    console.log("call load-wallet")
    let walletDir = app.getPath('home');
    walletData.file = walletDir + "/phpcoin.dat"
    let walletFile = walletData.file
    if(fs.existsSync(walletFile)) {
        walletData.exists = true
        let content = fs.readFileSync(walletFile, 'utf-8')
        if(content.substr(0, 8)==="phpcoin\n") {
            walletData.encrypted=false
            let parts = content.split("\n")
            walletData.privateKey = parts[1]
            walletData.publicKey = parts[2].trim()
            walletData.address = cryptoUtil.getAddress(walletData.publicKey)
            walletData.opened = true
            enableMenuItem('encrypt', true)
            enableMenuItem('decrypt', false)
        } else {
            walletData.encrypted=true
            walletData.opened = !!walletData.privateKey
            enableMenuItem('decrypt', true)
            enableMenuItem('encrypt', false)
        }
    } else {
        enableMenuItem('encrypt', true)
        App.updateStatus('Creating wallet')
        let keys = cryptoUtil.generateKeys()
        let str = `phpcoin\n${keys.privateKey}\n${keys.publicKey}`
        App.updateStatus('Writing wallet...')
        fs.writeFileSync(walletFile, str)

        let readCnt = fs.readFileSync(walletFile, 'utf-8')
        if(readCnt !== str) {
            App.updateStatus(null)
            App.showError('Error while creating wallet!')
            app.quit()
        }

        let address = cryptoUtil.getAddress(keys.publicKey)
        walletData.privateKey = keys.privateKey
        walletData.publicKey = keys.publicKey
        walletData.address = address
        walletData.exists = true
        walletData.encrypted = false
        walletData.balance = 0
        walletData.opened = true
    }
    if(walletData.address) {
        await setWalletBalance()
        await setMempoolBalance()
        await checkAddress()
        await getQrCode()
    }
    await getPeerInfo()
    App.updateStatus('Wallet loaded')
    AppMenu.loadMenu()
}

async function getQrCode() {
    console.log("getQrCode", walletData.address)
    if(walletData.address) {
        let imageData = await QRCode.toDataURL(walletData.address, {margin:0, width: 200})
        walletData.qrCode = imageData
    }
}

async function checkAddress() {
    let url = `${walletData.walletPeer}/api.php?q=getPublicKey&address=${walletData.address}`
    try {
        let publicKey = await peerGet(url)
        console.log('checkAddress', url, publicKey, walletData.publicKey)
        if(publicKey === walletData.publicKey) {
            walletData.verifiedAddress = true
        }
    } catch (e) {
        console.log(e)
    }
    enableMenuItem('verify_address', !walletData.verifiedAddress)
    AppMenu.loadMenu()
}

async function setWalletPeer() {
    let peersUrl = App.config.peersUrl
    console.log("call setWalletPeer", peersUrl, App.config)
    let peerList = await Axios.get(peersUrl)
    console.log("peerList", peerList)
    let arr = peerList.split('\n')
    arr = arr.filter(i => {return i.length > 0})
    let len = arr.length
    let num = Math.floor(Math.random()*len)
    walletData.walletPeer = arr[num]
    console.log(`set wallet peer: `,walletData.walletPeer)
    await getPeerInfo()
    App.updateState()
}

function setWalletBalance() {
    let url = `${walletData.walletPeer}/api.php?q=getPendingBalance&address=${walletData.address}`
    console.log("getPendingBalance url",url)
    return peerGet(url).then(balance => {
        walletData.balance = balance
    })
}

function setMempoolBalance() {
    let url = `${walletData.walletPeer}/api.php?q=getMempoolBalance&address=${walletData.address}`
    console.log("setMempoolBalance", url)
    return peerGet(url).then(balance => {
        console.log("setMempoolBalance", balance)
        walletData.mempoolBalance = balance
    })
}

function getPeerInfo() {
    let url = `${walletData.walletPeer}/peer.php?q=currentBlock`
    return peerPost(url, `coin=phpcoin`).then(res=>{
        walletData.peerInfo = res.info
    })

}

let peerGet = (url) => {
    return new Promise((resolve, reject)=>{
        Axios.get(url).then(res => {
            if(res.status === 'ok') {
                resolve(res.data)
            } else {
                reject(new Error(res.data))
            }
        }).catch(err=>{
            console.log("peerGet error", err)
            reject(err)
        })
    })
}

let peerPost = (url, data) => {
    console.log("call peerPost", url)
    return new Promise((resolve, reject)=>{
        Axios.post(url, data).then(res => {
            // console.log("peerPost response", res)
            if(res.status === 'ok') {
                resolve(res.data)
            } else {
                reject(new Error(res.data))
            }
        }).catch(err=>{
            console.log("peerPost error", err)
            reject(err)
        })
    })
}

function deleteWallet() {
    console.log(walletData.file)
    fs.rmSync(walletData.file)
    app.quit()
}

function openLoginLink() {
    let loginCode = Math.round(Math.random()*(999999-100000) + 100000)
    loginCode = `${loginCode}`
    console.log("loginCode", loginCode)
    let signature = cryptoUtil.sign(loginCode, cryptoUtil.privateKeyToPem(walletData.privateKey))
    if(!signature) {
        App.showError("Error generating login link!")
        return
    }
    if(!walletData.walletPeer) {
        App.showError( "Could not connect to remote peer!")
        return
    }
    console.log("signature", signature)
    let url = `${App.config.walletUrl}/apps/wallet/login.php?action=login-link&login_code=${loginCode}&public_key=${walletData.publicKey}&login_key=${signature}`
    console.log("url", url)
    shell.openExternal(url)
}

async function getPendingBalance() {
    let url = `${walletData.walletPeer}/api.php?q=getBalance&address=${walletData.address}`
    let res = await Axios.get(url)
    console.log("call wallet getPendingBalance", url, res)
    return res.data
}
async function getTransactions() {
    if(walletData.address) {
        let url = `${walletData.walletPeer}/api.php?q=getTransactions&address=${walletData.address}`
        let res = await Axios.get(url)
        App.state.transactions = res.data
    }
}

async function send(arg) {
    console.log("call wallet-send")
    let url = `${walletData.walletPeer}/api.php?q=getPendingBalance&address=${walletData.address}`
    console.log(`Asking peer for pending balance url=${url}`)

    let amount = arg.amount
    let fee = 0

    try {

        if(!arg.address) {
            throw new Error('Address must be entered')
        }

        if(!amount || amount <=0) {
            throw new Error('Amount is invalid')
        }

        let balance = await peerGet(url)
        balance = Number(balance)

        if(balance < amount + fee) {
            throw new Error('Not enough funds in balance')
        }

        let msg =''
        if(arg.message) {
            msg = arg.message.trim()
        }

        amount = Number(amount).toFixed(8)
        fee = Number(fee).toFixed(8)
        let dst = arg.address.trim()
        let type = 1
        let publicKey = walletData.publicKey
        let date = Math.round(new Date().getTime()/1000)
        let txData = `${amount}-${fee}-${dst}-${msg}-${type}-${publicKey}-${date}`
        console.log('Created txData', txData)

        let signature = cryptoUtil.sign(txData, cryptoUtil.privateKeyToPem(walletData.privateKey))
        console.log('signature', signature)

        url = `${walletData.walletPeer}/api.php?q=send`
        let data = {
            dst,
            val: amount,
            signature,
            public_key: publicKey,
            type,
            message: msg,
            date
        }
        console.log(`Sending transaction to peer`, data)

        let tx = await peerPost(url, {data: JSON.stringify(data)})

        await refresh()

        dialog.showMessageBoxSync(win, {type:'info', title:'Success', message:'Your transaction is created'})
        return tx


    } catch (e) {
        console.error("error in wallet-send", e)
        App.showError(e.message)
        return false
    }
}

let errMsg = function(msg) {
    App.updateStatus(null)
    dialog.showErrorBox('Error', msg)
    return false
}

async function encryptWallet(password) {
    App.updateStatus('Encrypting wallet...')

    if(password.length < 8) {
        return errMsg('The password must be at least 8 characters long!')
    }

    let walletFile = walletData.file
    if(!fs.existsSync(walletFile)) {
        return errMsg('Can not open wallet file')
    }

    let str = fs.readFileSync(walletFile, 'utf-8')
    if(!str) {
        return errMsg( 'Can not read wallet file')
    }

    if(str.substr(0, 8)!=="phpcoin\n") {
        return errMsg( 'Wallet is already encrypted')
    }

    str = cryptoUtil.encryptWallet(str, password)
    if(!str) {
        return errMsg('Error encrypting wallet!')
    }

    fs.writeFileSync(walletFile, str)

    let readCnt = fs.readFileSync(walletFile, 'utf-8')
    if(readCnt !== str) {
        return errMsg('Error encrypting wallet!')
    }

    await loadWallet()

    return true

}

async function openWallet(password) {
    App.updateStatus('Opening wallet...')
    let walletFile = walletData.file
    if(!fs.existsSync(walletFile)) {
        return errMsg('Can not open wallet file')
    }
    let str = fs.readFileSync(walletFile, 'utf-8')
    if(!str) {
        return errMsg( 'Can not read wallet file')
    }
    if(str.substr(0, 8)==="phpcoin\n") {
        return errMsg( 'Wallet is not encrypted')
    }
    let decrypted
    try {
        decrypted = cryptoUtil.decryptWallet(str, password)
    } catch (e) {
        return errMsg( 'Error decrypting wallet')
    }
    if(!decrypted || typeof decrypted === 'undefined' || decrypted.substr(0, 8)!=="phpcoin\n") {
        return errMsg( 'Error decrypting wallet')
    }
    let parts = decrypted.split("\n")
    walletData.privateKey = parts[1]
    walletData.publicKey = parts[2].trim()
    walletData.address = cryptoUtil.getAddress(walletData.publicKey)
    await loadWallet()
    await getTransactions()
    return true
}

async function decryptWallet() {
    App.updateStatus('Decrypting wallet...')
    let walletFile = walletData.file
    if(!fs.existsSync(walletFile)) {
        return errMsg('Can not open wallet file')
    }
    if(!walletData.privateKey || !walletData.privateKey) {
        return errMsg('Can not decrypt keys. Reload wallet')
    }
    let str = `phpcoin\n${walletData.privateKey}\n${walletData.publicKey}`
    fs.writeFileSync(walletFile, str)

    let readCnt = fs.readFileSync(walletFile, 'utf-8')
    if(readCnt !== str) {
        return errMsg('Error writing decrypted wallet')
    }
    await loadWallet()
    return true
}

async function refresh() {
    await checkAddress()
    await setWalletBalance()
    await setMempoolBalance()
    await getTransactions()
    await getPeerInfo()
    App.updateState()
}

async function getPeers() {
    let url = `${walletData.walletPeer}/api.php?q=getPeers`
    let res = await Axios.get(url)
    console.log("call wallet getPeers", url, res)
    return res.data
}

export {
    loadWallet,
    deleteWallet,
    peerGet,
    setWalletPeer,
    openLoginLink,
    getPendingBalance,
    getTransactions,
    peerPost,
    send,
    encryptWallet,
    openWallet,
    decryptWallet,
    refresh,
    getQrCode,
    setWalletBalance,
    getPeerInfo,
    getPeers,
    setMempoolBalance
}
