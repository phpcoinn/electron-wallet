import {dialog} from "electron";
import { exec } from "child_process";

const fs = require("fs")
const path = require("path")

let config = require("../config.json")
let pckg = require("../package.json")
let version = pckg.version
let network = config.network
console.log("network",network)
config = config[network]

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
        mempoolBalance: null
    },
    settings:{
        miningNode: config.miningNode
    },
    transactions: [],
    minerData: {
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
            rejectedReason: null,
            dropped: 0,
        }
    },
    info: {
        version: version,
        network: network
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
    let settingsFile = path.join(process.cwd(), 'settings.json')
    if(fs.existsSync(settingsFile)) {
        let data = fs.readFileSync(settingsFile, 'utf8')
        data = JSON.parse(data)
        state.settings = data
    }
}

function storeSettings(data) {
    let settingsFile = path.join(process.cwd(), 'settings.json')
    fs.writeFileSync(settingsFile, JSON.stringify(data, null, 4))
    state.settings = data
}

function showError(message) {
    dialog.showMessageBox(win,{title: 'Error', type:'error', message})
}

function updateState() {
    // console.log("SEND STATE UPDATE", state.minerData)
    win.webContents.send("state-update", state)
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
    config
}
