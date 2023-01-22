import {shell} from "electron";
import config from "../config.json";
import path from "path";
import {state, win} from "@/App";
import * as Miner from "./Miner";

const fs = require("fs");
const phpcoinCrypto = require("phpcoin-crypto")
const App = require("./App");
const AppMenu = require("./AppMenu");
const app = require("electron").app
const dialog = require('electron').dialog
const Axios = require('./utils/Axios')
const QRCode = require('qrcode')
let network = config.network
let chainId = config[network].chainId

let walletData = App.state.walletData

function enableMenuItem(id, enabled) {
    let menuItem = AppMenu.findMenuItem(id)
    if(menuItem) {
        menuItem.enabled = enabled
    }
}

async function loadWallet(file = null) {
    App.state.walletData.loaded = false
    App.updateStatus(null)
    if(!file) {
        let lastWalletFile = App.state.settings.lastWalletFile
        if(lastWalletFile) {
            walletData.file = lastWalletFile
        } else {
            let walletDir = app.getPath('home')
            walletData.file = walletDir + "/phpcoin.dat"
        }
    } else {
        walletData.file = file
    }
    console.log("call load-wallet file="+walletData.file)
    let walletFile = walletData.file
    if(fs.existsSync(walletFile)) {
        walletData.exists = true
        let content = fs.readFileSync(walletFile, 'utf-8')
        if(content.substr(0, 8)==="phpcoin\n") {
            walletData.encrypted=false
            let parts = content.split("\n")
            walletData.privateKey = parts[1]
            walletData.publicKey = parts[2].trim()
            walletData.address = phpcoinCrypto.getAddress(walletData.publicKey, network)
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
        let keys = phpcoinCrypto.generateAccount()
        let str = `phpcoin\n${keys.privateKey}\n${keys.publicKey}`
        App.updateStatus('Writing wallet...')
        fs.writeFileSync(walletFile, str)

        let readCnt = fs.readFileSync(walletFile, 'utf-8')
        if(readCnt !== str) {
            App.updateStatus(null)
            App.showError('Error while creating wallet!')
            app.quit()
        }

        let address = phpcoinCrypto.getAddress(keys.publicKey, network)
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
    let settings = App.state.settings
    settings.lastWalletFile = walletFile
    if(!settings.recentWallets) {
        settings.recentWallets = []
    }
    if(settings.recentWallets.includes(walletFile)) {
        settings.recentWallets.splice( settings.recentWallets.indexOf(walletFile),1)
    }
    settings.recentWallets.unshift(walletFile)
    if(settings.recentWallets.length > 10) {
        settings.recentWallets = settings.recentWallets.slice(0, 10);
    }
    App.storeSettings()
    App.win.setTitle("PHPCoin Wallet - [" + path.basename(walletFile) + "]")
    App.state.walletData.loaded = true
    App.updateStatus(null)
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
        walletData.verifiedAddress = false
        let publicKey = await peerGet(url)
        console.log('checkAddress', url, publicKey, walletData.publicKey)
        if(publicKey === walletData.publicKey) {
            walletData.verifiedAddress = true
        }
    } catch (e) {
        walletData.verifiedAddress = false
    }
    enableMenuItem('verify_address', !walletData.verifiedAddress)
    AppMenu.loadMenu()
}

async function setWalletPeer() {

    let autoWalletNode = App.state.settings.autoWalletNode
    let walletPeer
    if(autoWalletNode) {
        let peersUrl = App.config.peersUrl
        let peerList = await Axios.get(peersUrl)
        let arr = peerList.split('\n')
        arr = arr.filter(i => {return i.length > 0})
        let len = arr.length
        let num = Math.floor(Math.random()*len)
        walletPeer = arr[num]
    } else {
        walletPeer = App.state.settings.walletNode
    }
    walletData.walletPeer = walletPeer
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
    let url = `${walletData.walletPeer}/api.php?q=currentBlock`
    return peerGet(url).then(res=>{
        walletData.peerInfo.height = res.height
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
    let signature = sign(loginCode)
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
        // console.log(App.state.transactions)
        App.state.transactions = res.data
    }
}

async function send(arg) {
    console.log("call wallet-send")
    let url = `${walletData.walletPeer}/api.php?q=getPendingBalance&address=${walletData.address}`
    console.log(`Asking peer for pending balance url=${url}`)

    let amount = arg.amount
    let fee = arg.fee

    try {

        if(!arg.address) {
            throw new Error('Address must be entered')
        }

        if(!amount || amount <=0) {
            throw new Error('Amount is invalid')
        }

        let balance = await peerGet(url)
        balance = Number(balance)
        amount = Number(amount)
        fee = Number(fee)

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

        let tx = await sendTx(amount, fee, dst, msg, type)

        await refresh()

        dialog.showMessageBoxSync(App.win, {type:'info', title:'Success', message:'Your transaction is created'})
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

    str = phpcoinCrypto.encryptString(str, password)
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
        decrypted = phpcoinCrypto.decryptString(str, password)
    } catch (e) {
        return errMsg( 'Error decrypting wallet')
    }
    if(!decrypted || typeof decrypted === 'undefined' || decrypted.substr(0, 8)!=="phpcoin\n") {
        return errMsg( 'Error decrypting wallet')
    }
    let parts = decrypted.split("\n")
    walletData.privateKey = parts[1]
    walletData.publicKey = parts[2].trim()
    walletData.address = phpcoinCrypto.getAddress(walletData.publicKey, network)
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
    try {
        await checkAddress()
        await setWalletBalance()
        await setMempoolBalance()
        await getTransactions()
        await getPeerInfo()
        App.updateState()
    } catch (e) {
        console.error("Error in wallet refresh " + e)
    }
}

async function getPeers() {
    let url = `${walletData.walletPeer}/api.php?q=getPeers`
    let res = await Axios.get(url)
    console.log("call wallet getPeers", url, res)
    return res.data
}

async function getMasternodes() {
    let url = `${walletData.walletPeer}/api.php?q=getMasternodes`
    let res = await Axios.get(url)
    let list = res.data
    let isWalletMn = list.filter(mn => mn.id === walletData.address).length > 0
    url = `${walletData.walletPeer}/api.php?q=getMasternodesForAddress&address=${walletData.address}`
    res = await Axios.get(url)
    let walletMasternodes = []
    if(res.status === 'ok' && res.data) {
        walletMasternodes = res.data
    }
    return {list, isWalletMn, walletMasternodes}
}

async function exportWallet() {
    let options = {
        title: "Export PHP Coin wallet to file",
        defaultPath: 'phpcoin.dat',
        filters :[
            {name: 'Wallet Files', extensions: ['dat']}
        ]
    }
    let filename = dialog.showSaveDialogSync(App.win, options)
    if(filename) {
        let content = 'phpcoin' + '\n'
        content += walletData.privateKey + '\n'
        content += walletData.publicKey + '\n'
        fs.writeFileSync(filename, content)
    }
}

async function openWalletFromDialog() {
    let filename = dialog.showOpenDialogSync(App.win, {
        filters: [{name: 'Wallet Files', extensions: ['dat']}]
    })
    if(filename) {
        await openWalletFromFile(filename[0]);
    }
}

async function openWalletFromFile(filename) {
    await loadWallet(filename)
    await getTransactions()
    App.updateState()
    App.goto('/')
}

async function importPrivateKey(privateKey) {
    console.log("Import private key", privateKey)
    let keys = phpcoinCrypto.importPrivateKey(privateKey)
    if(!keys) {
        return {error: true, msg: 'Can not import private key'}
    } else {
        let options = {
            title: "Save imported private key to wallet",
            defaultPath: keys.address + '.dat',
            filters :[
                {name: 'Wallet Files', extensions: ['dat']}
            ]
        }
        let filename = dialog.showSaveDialogSync(App.win, options)
        if(filename) {
            App.updateStatus('Creating wallet')
            let str = `phpcoin\n${keys.privateKey}\n${keys.publicKey}`
            fs.writeFileSync(filename, str)
            await loadWallet(filename)
            await getTransactions()
            App.updateState()
            App.goto('/')
        }
    }

    return true
}

async function newWallet() {
    let options = {
        title: "Create new PHP Coin Wallet file",
        defaultPath: 'phpcoin.dat',
        filters :[
            {name: 'Wallet Files', extensions: ['dat']}
        ]
    }
    let filename = dialog.showSaveDialogSync(App.win, options)
    if(filename) {
        App.updateStatus('Creating wallet')
        let keys = phpcoinCrypto.generateAccount()
        let str = `phpcoin\n${keys.privateKey}\n${keys.publicKey}`
        fs.writeFileSync(filename, str)
        await loadWallet(filename)
        await getTransactions()
        App.updateState()
        App.goto('/')
    }
}

function sign(message) {
    let signature = phpcoinCrypto.sign(chainId + message, walletData.privateKey)
    return signature
}

async function sendTx(amount, fee, dst, msg, type) {
    let publicKey = walletData.publicKey
    let tx = {
        dst,
        val: amount,
        public_key: publicKey,
        type,
        message: msg,
        fee
    }
    return await signAndSend(tx)
}

async function signAndSend(tx) {
    if(!tx.public_key) {
        tx.public_key = walletData.publicKey
    }
    if(!tx.date) {
        tx.date = Math.round(new Date().getTime()/1000)
    }
    if(!tx.src) {
        tx.src = walletData.address
    }
    tx.val = Number(tx.val).toFixed(8)
    tx.fee = Number(tx.fee).toFixed(8)
    let txData = `${tx.val}-${tx.fee}-${tx.dst}-${tx.message}-${tx.type}-${tx.public_key}-${tx.date}`
    let signature = sign(txData)
    tx.signature = signature

    let url = `${walletData.walletPeer}/api.php?q=sendTransaction&tx=` + Buffer.from(JSON.stringify(tx)).toString('base64')
    console.log(url)
    let res = await peerGet(url)
    return res
}

async function createMasternode(address) {

    let fee = 0

    try {
        let amount = await getMasternodeCollateral()
        let msg ='mncreate'
        amount = Number(amount).toFixed(8)
        fee = Number(fee).toFixed(8)
        let dst = address.trim()
        let type = 2

        let tx = await sendTx(amount, fee, dst, msg, type)
        await refresh()
        dialog.showMessageBoxSync(App.win, {type:'info', title:'Success', message:'Your transaction is created'})
        return tx

    } catch (e) {
        console.error("error in wallet-send", e)
        App.showError(e.message)
        return false
    }
}

async function removeMasternode(address) {
    console.log("call wallet-remove-masternode")
    let amount = await getMasternodeForAddress(walletData.address)
    let fee = 0
    try {

        let msg ='mnremove'
        amount = Number(amount).toFixed(8)
        fee = Number(fee).toFixed(8)
        let dst = address.trim()
        let type = 3

        let tx = await sendTx(amount, fee, dst, msg, type)

        await refresh()

        dialog.showMessageBoxSync(App.win, {type:'info', title:'Success', message:'Your transaction is created'})
        return tx

    } catch (e) {
        console.error("error in wallet-remove-masternode", e, e.stack)
        App.showError(e.message)
        return false
    }
}

async function getFee() {
    let url = `${walletData.walletPeer}/api.php?q=getFee`
    let res = await Axios.get(url)
    console.log("call wallet getFee", url, res)
    return res.data
}

async function getMasternodeCollateral() {
    let url = `${walletData.walletPeer}/api.php?q=getCollateral`
    let res = await Axios.get(url)
    console.log("call wallet getMasternodeCollateral", url, res)
    return res.data
}

async function getMasternodeForAddress(mnAddress) {
    let url = `${walletData.walletPeer}/api.php?q=getMasternode&address=${mnAddress}`
    let res = await Axios.get(url)
    console.log("call wallet getMasternodeForAddress", url, res)
    return res.data.collateral
}

function checkAndStartMiner() {
    let autoStartMiner = App.state.settings.autoStartMiner
    if(autoStartMiner) {
        Miner.start()
    }
}

export {
    checkAndStartMiner,
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
    getMasternodes,
    setMempoolBalance,
    exportWallet,
    openWalletFromFile,
    openWalletFromDialog,
    newWallet,
    sign,
    removeMasternode,
    createMasternode,
    getFee,
    importPrivateKey,
    signAndSend
}
