<template>
  <div class="d-flex flex-row flex-fill">
      <div class="d-flex flex-fill flex-column" style="width: 50%">
          <div class="flex-grow-0 p-3">
              <div class="fs-5">Transactions</div>
              <div class="fs-7 text-muted">View your account's history</div>
          </div>

          <hr class="mx-3 my-0"/>

          <div class="flex-fill" style="min-height: 0; overflow: auto">
            <template v-for="tx in transactions" >
                <div :key="tx.id" class="px-3 py-1 d-flex flex-fill border-bottom tx-row" role="button" @click="selTransaction = tx">
                    <div class="p-2 d-flex align-items-center">
                        <span :class="`tx-icon text-${tx.listIconColor}`" v-html="tx.listIcon"></span>
                    </div>
                    <div class="flex-grow-1 p-2">
                        <div class="fs-6">{{tx.listText}}</div>
                        <div class="text-muted small">{{tx.date|df}}</div>
                    </div>
                    <div class="tx-val d-flex flex-column align-items-end p-2 fs-5">
                        <div :class="tx.sign === '+' ? 'text-success' : 'text-danger'">{{tx.sign}}{{tx.val|num}}</div>
                        <div v-if="parseFloat(tx.fee) > 0" class="text-muted small">fee: {{tx.fee|num}}</div>
                    </div>
                </div>
            </template>
          </div>

      </div>

      <div class="flex-fill d-flex" style="background-color: #eee; width: 50%">
          <div class="flex-fill d-flex align-items-center justify-content-center" v-if="!selTransaction">
              <div class="d-flex flex-column text-center">
                  <div class="fs-5">Transaction details</div>
                  <div class="fs-6 text-muted">Select transaction from list to see it's details</div>
              </div>
          </div>
            <div class="d-flex flex-column flex-fill p-2" v-else>
                <div class="fs-5">Transaction details</div>
                <dl class="row">
                    <dt class="col-sm-3">ID</dt>
                    <dd class="col-sm-9"><a href="" @click.prevent="openExplorerUrl('tx.php?id=' + selTransaction.id)">{{selTransaction.id}}</a></dd>
                    <dt class="col-sm-3">Height</dt>
                    <dd class="col-sm-9">{{selTransaction.height}}</dd>
                    <dt class="col-sm-3">Block</dt>
                    <dd class="col-sm-9"><a href="" @click.prevent="openExplorerUrl('block.php?id=' + selTransaction.block)">{{selTransaction.block}}</a></dd>
                    <dt class="col-sm-3">Confirmations</dt>
                    <dd class="col-sm-9">{{selTransaction.confirmations}}</dd>
                    <dt class="col-sm-3">Date</dt>
                    <dd class="col-sm-9">{{selTransaction.date|df}}</dd>
                    <dt class="col-sm-3">Type</dt>
                    <dd class="col-sm-9">{{selTransaction.typeLabel}}</dd>
                    <dt class="col-sm-3">Source</dt>
                    <dd class="col-sm-9" style="word-break: break-all">
                        <a href="" @click.prevent="openExplorerUrl('address.php?address=' + selTransaction.src)">{{selTransaction.src}}</a>
                    </dd>
                    <dt class="col-sm-3">Destination</dt>
                    <dd class="col-sm-9">
                        <a href="" @click.prevent="openExplorerUrl('address.php?address=' + selTransaction.dst)">{{selTransaction.dst}}</a>
                    </dd>
                    <dt class="col-sm-3">Value</dt>
                    <dd class="col-sm-9">{{selTransaction.val|num}}</dd>
                    <dt class="col-sm-3">Fee</dt>
                    <dd class="col-sm-9">{{selTransaction.fee|num}}</dd>
                    <dt class="col-sm-3">Message</dt>
                    <dd class="col-sm-9">{{selTransaction.message}}</dd>
                </dl>
            </div>

      </div>


  </div>
</template>

<script>

import {ipcRenderer} from "electron";
import * as Icons from "../utils/Icons"

export default {
    name: 'Home',
    data() {
      return {
          walletExists: false,
          address: null,
          walletPeer: null,
          pendingBalance: null,
          selTransaction: null
      }
    },
    mounted() {
        console.log("mounted")

        ipcRenderer.on('refresh', ()=>{
            this.refresh()
        })

    },
    computed: {
        Icons() {
            return Icons
        },
        transactions() {
            let transactions = this.$store.state.appState.transactions
            transactions.map(tx => {
                this.processTx(tx)
            })
            return transactions
        }
    },
    methods: {
        refresh() {
            //this.transactions = ipcRenderer.sendSync('get-transactions')
        },
        createWallet(encrypt) {
            console.log("createWallet", encrypt)
            let res = ipcRenderer.sendSync('create-wallet', encrypt)
            console.log(res)
        },
        openSend() {
            this.$router.push('/send')
        },
        copyAddress(){
            ipcRenderer.send('clipboard-copy', this.$store.state.appState.walletData.address)
        },
        showAddressMenu(row) {
            ipcRenderer.send('show-context-menu', {
                menu:
                    [
                        {label:"Copy", click:'addressMenu'}
                    ]
                ,
                data: row
            })
        },
        processTx(tx) {
            let type = tx.type
            let address = this.$store.state.appState.walletData.address
            if(tx.block) {
                switch (type) {
                    case 0:
                        tx.listText = `Mined from ${tx.src}`
                        tx.listIconColor = 'success'
                        tx.listIcon = Icons.iconMiner
                        tx.typeLabel = 'Reward'
                        break
                    case 1:
                        if(tx.dst === address) {
                            tx.listText = `Received from ${tx.src}`
                            tx.listIconColor = 'success'
                            tx.listIcon = Icons.iconReceive
                            tx.typeLabel = 'Transfer (Credit)'
                        } else {
                            tx.listText =  `Sent to ${tx.dst}`
                            tx.listIconColor = 'danger'
                            tx.listIcon = Icons.iconSend
                            tx.typeLabel = 'Transfer (Debit)'
                        }
                        break
                    case 2:
                        tx.listText =  `Created masternode ${tx.dst}`
                        tx.listIconColor = 'info'
                        tx.listIcon = Icons.iconSend
                        tx.typeLabel = 'Created masternode'
                        break
                    case 3:
                        tx.listText =  `Removed masternode ${tx.src}`
                        tx.listIconColor = 'warning'
                        tx.listIcon = Icons.iconReceive
                        tx.typeLabel = 'Removed masternode'
                        break
                    case 4:
                        tx.listText =  `Fee`
                        tx.listIconColor = 'success'
                        tx.listIcon = Icons.iconReceive
                        tx.typeLabel = 'Fee'
                        break
                    case 5:
                        tx.listText =  `Created smart contract ${tx.dst}`
                        tx.listIconColor = 'info'
                        tx.listIcon = Icons.iconSend
                        tx.typeLabel = 'Created smart contract'
                        break
                    case 6:
                        tx.listText =  `Executing smart contract ${tx.dst}`
                        tx.listIconColor = 'info'
                        tx.listIcon = Icons.iconSend
                        tx.typeLabel = 'Executed smart contract'
                        break
                    case 7:
                        tx.listText =  `Send from smart contract`
                        tx.listIconColor = 'warning'
                        tx.listIcon = Icons.iconSend
                        tx.typeLabel = 'Sent from smart contract'
                        break
                    default:
                        tx.listText =  'Other'
                        tx.listIconColor = ''
                        tx.listIcon = null
                        tx.typeLabel = 'Other'
                }
            } else {
                tx.listText =  `Pending transaction`
                tx.listIconColor = 'warning'
                tx.listIcon = Icons.iconMempool
                tx.typeLabel = 'Mempool'
            }
        },
        openExplorerUrl(url) {
            console.log(url)
            ipcRenderer.send('open-explorer-url', url)
        },
        geType(tx) {
            let type = tx.type
            let address = this.$store.state.appState.walletData.address
            if(tx.block) {
                switch (type) {
                    case 0:
                        return `Reward`
                    case 1:
                        if(tx.dst === address) {
                            return `Credit`
                        } else {
                            return `Debit`
                        }
                    case 2:
                        return `Created masternode`
                    case 3:
                        return `Removed masternode`
                    case 4:
                        return `Fee`
                    case 5:
                        return `Created smart contract`
                    case 6:
                        return `Executed smart contract`
                    case 7:
                        return `Sent from smart contract`
                }
            } else {
                return 'Other'
            }
        }
    }

}
</script>
<style>
.tx-icon svg {
    width: 30px;
    height: 30px;
}
.tx-row:hover {
    background-color: #F5F5F5;
}
</style>
