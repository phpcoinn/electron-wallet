'use strict'

import {app, protocol, BrowserWindow, shell, dialog, Menu} from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
const isDevelopment = process.env.NODE_ENV !== 'production'
import {ipcMain} from "electron";
import axios from 'axios'
import * as App from './App'
import * as Wallet from './Wallet'
import * as AppMenu from "./AppMenu";
import * as Miner from "./Miner";
import {win} from "./App";


// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } }
])

async function createWindow() {
  // Create the browser window.
  let win = new BrowserWindow({
    x:0,
    y:0,
    width: 600,
    height: 400,
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
  // if (isDevelopment && !process.env.IS_TEST) {
  //   // Install Vue Devtools
  //   try {
  //     await installExtension(VUEJS_DEVTOOLS)
  //   } catch (e) {
  //     console.error('Vue Devtools failed to install:', e.toString())
  //   }
  // }
  await createWindow()

  App.updateStatus('Loading wallet...')
  await Wallet.setWalletPeer()

  await Wallet.loadWallet()

  App.updateStatus(null)
  win.webContents.send("wallet-loaded", App.walletData)

})

ipcMain.on("get-wallet-data", async (event, args) => {
  event.returnValue = walletData
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

let walletData =  App.walletData

ipcMain.on('wallet-send',  async (event, arg) => {
  event.returnValue = await Wallet.send(arg)
})

ipcMain.on("open-wallet", async (event, arg)=>{
  console.log("on open-wallet", arg)
  let password = arg.password
  await Wallet.openWallet(password)
  event.reply("wallet-opened", null)
})

ipcMain.on("get-miner", (event,args)=>{
  console.log("on get-miner")
  App.win.webContents.send("miner-data", Miner.minerData)
})
ipcMain.on("miner-cmd", (event, cmd, args)=>{
  console.log("call miner-cmd", cmd, args)
  Miner[cmd](args)
})
ipcMain.on('get-pending-balance', async (event, args)=>{
  console.log("call get-pending-balance")
  event.returnValue = await Wallet.getPendingBalance()
})
ipcMain.on('get-transactions', async (event, args)=>{
  console.log("call get-transactions")
  event.returnValue = await Wallet.getTransactions()
})
ipcMain.on("encrypt-wallet", async (event, args) => {
  let res = await Wallet.encryptWallet(args)
  event.returnValue = res
})
ipcMain.on('exit-wallet', () => {
  app.quit()
})
