
console.log("load module App" ,global.test)

let walletData = {
    file: null,
    privateKey: null,
    publicKey: null,
    address: null,
    exists: false,
    balance: null,
    encrypted: false,
    opened: false,
    status: null,
    walletPeer: null
}

let win = null

function updateUi() {
    console.log("send update UI", JSON.stringify(walletData))
    win.webContents.send("wallet-data", walletData)
}

function updateStatus(status) {
    console.log('updateStatus',status)
    walletData.status = status
    updateUi()
}

function setWin(w) {
    win = w
}

export {
    walletData,
    win,
    setWin,
    updateStatus,
    updateUi
}
