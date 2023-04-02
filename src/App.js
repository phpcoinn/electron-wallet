import {app, dialog} from "electron";
import { exec } from "child_process";
import * as Axios from "@/utils/Axios";

const fs = require("fs")
const path = require("path")

let appConfig = require("../config.json")
let pckg = require("../package.json")
let settingsFile = path.join(app.getPath("userData"),'settings.json')
let settings = {}
if(fs.existsSync(settingsFile)) {
    settings = fs.readFileSync(settingsFile, 'utf8')
    settings = JSON.parse(settings)
}
let version = pckg.version
let network = settings.network || appConfig.defaultNetwork
console.log({network})
let networks = Object.keys(appConfig.networks)
let config = appConfig.networks[network]


let state = {
    walletData: {
        file: null,
        privateKey: null,
        publicKey: null,
        address: null,
        exists: false,
        balance: null,
        encrypted: false,
        opened: false,
        status: null,
        walletPeer: null,
        verifiedAddress: false,
        loaded: false,
        qrCode: null,
        mempoolBalance: null,
        peerInfo: {},
    },
    settingsFile: settingsFile,
    settings:{
        miningNode: config.miningNode,
        autoWalletNode: false,
        walletNode: config.walletNode,
        network: network
    },
    networks: networks,
    transactions: [],
    minerData: {
        status: null,
        running: false,
        blockFound: false,
        break: false,
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
            rejectedReason: null,
            dropped: 0,
            nodeStatus: null,
            speed: 0,
        },
        logs: []
    },
    info: {
        version: version,
        network: network,
        latestVersion: null
    },
    config
}

let win = null

function updateStatus(status) {
    console.log('updateStatus',status)
    state.walletData.status = status
    updateState()
}

function setWin(w) {
    win = w
}

function goto(url) {
    win.webContents.send("goto", url)
}

function loadSettings() {
    let settings = {}
    if(fs.existsSync(settingsFile)) {
        settings = fs.readFileSync(settingsFile, 'utf8')
        settings = JSON.parse(settings)
    }
    for(let i in settings) {
        state.settings[i] = settings[i]
    }
}

async function getLatestVersion() {
    try {
        let response = await Axios.get('https://raw.githubusercontent.com/phpcoinn/electron-wallet/master/package.json')
        let data = JSON.parse(response)
        return data.version
    } catch (e) {
        console.log(e)
        return false
    }
}

function storeSettings() {

    let exit
    if(state.settings.network !== network) {
        state.settings.miningNode = appConfig.networks[state.settings.network].miningNode
        state.settings.walletNode = appConfig.networks[state.settings.network].walletNode
        exit = true
    }

	console.log("SETTINGS FILE: " + settingsFile);
    fs.writeFileSync(settingsFile, JSON.stringify(state.settings, null, 4))
    if(exit) {
        app.quit()
    }
}

function showError(message) {
    dialog.showMessageBox(win,{title: 'Error', type:'error', message})
}

function updateState() {
    // console.log("SEND STATE UPDATE", state.minerData)
    try {
        if(win && state && win.webContents) {
            win.webContents.send("state-update", state)
        }
    } catch (e) {
        console.error(e)
    }
}

function clearRecentFilesList() {
    let settings = state.settings
    delete settings.recentWallets
    storeSettings()
}

export {
    win,
    setWin,
    updateStatus,
    goto,
    storeSettings,
    loadSettings,
    showError,
    state,
    updateState,
    config,
    getLatestVersion,
    clearRecentFilesList,
    network
}
