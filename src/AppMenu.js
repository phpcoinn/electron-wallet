import {shell} from "electron";

const {Menu, dialog} = require("electron");
const App = require("./App");
const Wallet = require("./Wallet");

console.log("load module AppMenu")

let template

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

function loadMenu() {

    let settings = App.state.settings

    let recentMenuItems = []
    if(settings.recentWallets) {
        for (let i in settings.recentWallets) {
            let recentWallet = settings.recentWallets[i]
            recentMenuItems.push(
                {
                    "id":"recent_" + i,
                    "label": recentWallet,
                    async click() {
                        await Wallet.openWalletFromFile(recentWallet)
                    }
                }
            )
        }
    }

    if(recentMenuItems.length) {

        recentMenuItems.push({
            type: 'separator'
        })
        recentMenuItems.push({
            id: 'clear_recent',
            label: "Clear recent",
            async click() {
                let options  = {
                    buttons: ["Yes","No"],
                    message: "Clear recent list"
                }
                let response = dialog.showMessageBoxSync(options)
                if(response === 0) {
                    await App.clearRecentFilesList()
                    loadMenu()
                }
            }
        })
    }

    let recentMenu = {
        id: "open_recent",
        label: "Open recent ...",
        submenu: recentMenuItems,
        enabled: recentMenuItems.length > 0
    }

    template = [
        {
            label: 'File',
            submenu: [
                {
                    id: "new",
                    label: "New...",
                    async click() {
                        await Wallet.newWallet()
                    }
                },
                {
                    id: "open",
                    label: "Open...",
                    async click() {
                        await Wallet.openWalletFromDialog()
                    }
                },
                recentMenu,
                {
                    id: "save",
                    label: "Save as...",
                    async click() {
                        await Wallet.exportWallet()
                    }
                },
                {
                    type: 'separator'
                },
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
                        App.goto( "/info")
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
                    id:'sign',
                    label: 'Sign message...',
                    click() {
                        App.goto('/sign')
                    }
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
                    label: "Masternodes",
                    click() {
                        App.goto('/masternodes')
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


    const menu = Menu.buildFromTemplate(template)
    Menu.setApplicationMenu(menu)
}

export {
    findMenuItem,
    loadMenu
}
