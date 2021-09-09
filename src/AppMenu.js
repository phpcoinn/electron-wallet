import {app, shell} from "electron";

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
                let res = findInList(item.submenu)
                if(res) {
                    return res
                }
            }
        }
    }

    return findInList(template)
}

const template = [
    {
        label: 'File',
        submenu: [
            // {
            //     id:"delete",
            //     label: "Delete",
            //     click() {
            //         let response = dialog.showMessageBoxSync({
            //             buttons: ["Yes","No"],
            //             message: "Do you really want to delete wallet?"
            //         })
            //         if(response === 0) {
            //             Wallet.deleteWallet()
            //         }
            //     }
            // },
            {
                id: "encrypt",
                label: "Encrypt",
                enabled: false,
                click() {
                    App.goto("/encrypt")
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
                type: 'separator'
            },
            {
                role: 'quit'
            }
        ]
    },

    {
        label: 'Edit',
        submenu: [
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
                label: "Home",
                click() {
                    App.goto( "/")
                }
            },
            {
                label: "Send",
                click() {
                    App.goto( "/send")
                }
            },
            {
                label: "Receive",
                click() {
                    App.goto( "/receive")
                }
            },
            {
                label: "Miner",
                click() {
                    App.goto( "/miner")
                }
            },
            {
                type:'separator'
            },
            {
                label: 'Refresh',
                async click() {
                    await Wallet.refresh()
                    App.win.reload()
                }
            },
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
            },
            {
                id:'verify_address',
                label: 'Verify address...',
                click() {
                    App.goto('/verify')
                },
                enabled: false
            },
            {
                label: "Info",
                click() {
                    App.goto('/info')
                }
            },
            {
                label: "Peers",
                click() {
                    App.goto('/peers')
                }
            },
            {
                type:'separator'
            },
            {
                label:'Settings',
                click() {
                    App.goto("/settings")
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
                label: 'Learn More',
                click() {
                    shell.openExternal(App.config.aboutUrl)
                }
            },
            {
                label: "About",
                click() {
                    App.goto("/about")
                }
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
