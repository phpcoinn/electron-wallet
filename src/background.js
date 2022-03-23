'use strict'

import {app, protocol, BrowserWindow, shell, dialog, Menu, clipboard} from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
const isDevelopment = process.env.NODE_ENV !== 'production'
import {ipcMain} from "electron";
import * as App from './App'
import * as Wallet from './Wallet'
import * as AppMenu from "./AppMenu";
import * as Miner from "./Miner";
import {loadSettings, storeSettings, win} from "./App";
import path from 'path'

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } }
])

process.on('uncaughtException', function (error) {
  console.log(error)
  //dialog.showErrorBox('Uncaught exception', error.stack)
})

process.on('unhandledRejection', function(err) {
  console.log(err)
  dialog.showErrorBox('Unhandled rejection', err.stack)
});

async function createWindow() {
  // Create the browser window.
  let icon =  path.resolve(__dirname, '../../electron-wallet.png')
  console.log("createWindow",icon)
  let win = new BrowserWindow({
    // x:0,
    // y:0,
    width: 1200,
    height: 650,
    icon,
    webPreferences: {
      
      // Use pluginOptions.nodeIntegration, leave this alone
      // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
      nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION,
      contextIsolation: !process.env.ELECTRON_NODE_INTEGRATION
    }
  })

  App.setWin(win)

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    await App.win.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
    if (!process.env.IS_TEST) {
      App.win.webContents.openDevTools()
    }
  } else {
    createProtocol('app')
    // Load the index.html when not in development
    App.win.loadURL('app://./index.html')
  }
  AppMenu.loadMenu()
}

app.commandLine.appendSwitch('ignore-certificate-errors');
// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})



// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  await createWindow()

  App.loadSettings()

  App.getLatestVersion().then(version => {
    App.state.info.latestVersion = version
    App.updateState()
  })

  try {
    App.updateStatus('Loading wallet...')
    await Wallet.setWalletPeer()

    await Wallet.loadWallet()
    await Wallet.getTransactions()

    App.state.walletData.loaded = true
    App.updateStatus(null)
    win.webContents.send("wallet-loaded")

    setInterval(async ()=>{
      await Wallet.refresh()
    }, 30000)

  } catch (e) {
    throw new Error("Unable to load wallet: " + e)
  }


})

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', (data) => {
      if (data === 'graceful-exit') {
        app.quit()
      }
    })
  } else {
    process.on('SIGTERM', () => {
      app.quit()
    })
  }
}

ipcMain.on('wallet-send',  async (event, arg) => {
  let res = await Wallet.send(arg)
  await Wallet.getTransactions()
  event.returnValue = res
})

ipcMain.on("open-wallet", async (event, arg)=>{
  let password = arg.password
  await Wallet.openWallet(password)
  App.updateState()
})

ipcMain.on("miner-cmd", (event, cmd, args)=>{
  console.log("call miner-cmd", cmd, args)
  Miner[cmd](args)
})

ipcMain.on("encrypt-wallet", async (event, args) => {
  let res = await Wallet.encryptWallet(args)
  event.returnValue = res
})

ipcMain.on('exit-wallet', () => {
  app.quit()
})

ipcMain.on('faucet-open-link', ()=>{
  let url = App.config.faucetLink
  shell.openExternal(url)
})

ipcMain.on('clipboard-copy', (event, text)=>{
  clipboard.writeText(text);
})

ipcMain.on('save-settings', (event, settings)=>{
  App.state.settings = settings
  App.storeSettings()
  App.updateState()
})

ipcMain.on('show-context-menu', (event, data)=>{
  let functions = {
    addressMenu(tx) {
      clipboard.writeText(tx.dst);
    }
  }

  for(let i in data.menu) {
    let item = data.menu[i]
    item.click = functions[item.click](data.data)
  }
  let menu = Menu.buildFromTemplate(data.menu)
  menu.popup()
})

ipcMain.on("app-created", () => {
  App.updateState()
})

ipcMain.on("get-peers", async (event, data)=>{
  event.returnValue = await Wallet.getPeers()
})


ipcMain.on("open-url", (event, url) => {
  shell.openExternal(url)
})

ipcMain.on("get-masternodes", async (event, data)=>{
  let res = await Wallet.getMasternodes()
  event.returnValue = res
})

ipcMain.on('wallet-sign',   (event, arg) => {
  if(!arg) {
    dialog.showErrorBox('Error', 'Empty message')
    event.returnValue = null
  } else {
    let res = Wallet.sign(arg)
    event.returnValue = res
  }
})

ipcMain.on('wallet-create-masternode',   async(event, arg) => {
  let res = await Wallet.createMasternode(arg)
  event.returnValue = res
})
ipcMain.on('wallet-remove-masternode',  async (event, arg) => {
  let res = await Wallet.removeMasternode(arg)
  event.returnValue = res
})

ipcMain.on("open-update-link", (event, data) => {
  let platform = process.platform
  let url= App.config.updateLink[platform]
  if(!url) {
    dialog.showErrorBox(  'Error',`No update link for platform ${platform}`)
  } else {
    shell.openExternal(url)
  }
})
