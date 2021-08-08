
const {Menu, dialog} = require("electron");
const App = require("./App");
const Wallet = require("./Wallet");

console.log("load module AppMenu")

let findMenuItem = (id) => {

    let findInList = (list) =>{
        for(let i in list) {
            let item = list[i]
            if(item.id === id) {
                return item
            }
            if(item.submenu) {
                return findInList(item.submenu)
            }
        }
    }

    return findInList(template)
}

const template = [
    {
        label: 'File',
        submenu: [
            {
                id:"test",
                label: "test update",
                click() {
                    Wallet.testUpdate()
                }
            },
            {
                id:"delete",
                label: "Delete",
                click() {
                    let response = dialog.showMessageBoxSync({
                        buttons: ["Yes","No"],
                        message: "Do you really want to delete wallet?"
                    })
                    if(response === 0) {
                        Wallet.deleteWallet()
                    }
                }
            },
            {
                id: "encrypt",
                label: "Encrypt",
                enabled: false,
                click() {
                    console.log("encrypt")
                    App.win.webContents.send("encrypt-wallet")
                }
            },
            {
                id:"decrypt",
                label: "Decrypt",
                enabled: false,
                async click() {
                    let options  = {
                        buttons: ["Yes","No"],
                        message: "Do you really want to decrypt wallet?"
                    }
                    let response = dialog.showMessageBoxSync(options)
                    if(response === 0) {
                        await Wallet.decryptWallet()
                    }
                }
            },
            {
                role: 'undo'
            },
            {
                role: 'redo'
            },
            {
                type: 'separator'
            },
            {
                role: 'cut'
            },
            {
                role: 'copy'
            },
            {
                role: 'paste'
            }
        ]
    },

    {
        label: 'View',
        submenu: [
            {
                role: 'reload',
            },
            {
                role: 'toggledevtools'
            },
            {
                type: 'separator'
            },
            {
                role: 'resetzoom'
            },
            {
                role: 'zoomin'
            },
            {
                role: 'zoomout'
            },
            {
                type: 'separator'
            },
            {
                role: 'togglefullscreen'
            }
        ]
    },

    {
        label: 'Tools',
        submenu: [
            {
                label: 'Reconnect peer',
                click() {
                    Wallet.setWalletPeer()
                }
            },
            {
                label: 'Login to online wallet...',
                click() {
                    Wallet.openLoginLink()
                }
            }
        ]
    },

    {
        role: 'window',
        submenu: [
            {
                role: 'minimize'
            },
            {
                role: 'close'
            }
        ]
    },

    {
        role: 'help',
        submenu: [
            {
                label: 'Learn More'
            }
        ]
    }
]

function loadMenu() {
    console.log("loadMenu")
    const menu = Menu.buildFromTemplate(template)
    Menu.setApplicationMenu(menu)
}

export {
    findMenuItem,
    loadMenu
}
