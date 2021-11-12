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
                        <span class="tx-icon text-success" v-html="Icons.iconReceive" v-if="tx.type_label==='credit'"></span>
                        <span class="tx-icon text-danger" v-html="Icons.iconSend" v-if="tx.type_label==='debit'"></span>
                        <span class="tx-icon text-success" v-html="Icons.iconMiner" v-if="tx.type_label==='mining'"></span>
                        <span class="tx-icon text-warning" v-html="Icons.iconMempool" v-if="tx.type_label==='mempool'"></span>
                    </div>
                    <div class="flex-grow-1 p-2">
                        <div class="fs-6" v-if="tx.type_label==='credit'">Received from {{tx.src}}</div>
                        <div class="fs-6" v-if="tx.type_label==='debit'">Send to {{tx.dst}}</div>
                        <div class="fs-6" v-if="tx.type_label==='mining'">Mined from {{tx.src}}</div>
                        <div class="fs-6" v-if="tx.type_label==='mempool'">Pending transaction</div>
                        <div class="text-muted small">{{tx.date|df}}</div>
                    </div>
                    <div class="tx-val d-flex align-items-center p-2 fs-5">
                        <span :class="tx.sign === '+' ? 'text-success' : 'text-danger'">{{tx.sign}}{{tx.val|num}}</span>
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
                    <dd class="col-sm-9">{{selTransaction.id}}</dd>
                    <dt class="col-sm-3">Height</dt>
                    <dd class="col-sm-9">{{selTransaction.height}}</dd>
                    <dt class="col-sm-3">Block</dt>
                    <dd class="col-sm-9">{{selTransaction.block}}</dd>
                    <dt class="col-sm-3">Confirmations</dt>
                    <dd class="col-sm-9">{{selTransaction.confirmations}}</dd>
                    <dt class="col-sm-3">Date</dt>
                    <dd class="col-sm-9">{{selTransaction.date|df}}</dd>
                    <dt class="col-sm-3">Type</dt>
                    <dd class="col-sm-9">{{selTransaction.type_label}}</dd>
                    <dt class="col-sm-3">Source</dt>
                    <dd class="col-sm-9" style="word-break: break-all">{{selTransaction.public_key}}</dd>
                    <dt class="col-sm-3">Destination</dt>
                    <dd class="col-sm-9">{{selTransaction.dst}}</dd>
                    <dt class="col-sm-3">Value</dt>
                    <dd class="col-sm-9">{{selTransaction.val|num}}</dd>
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
            return this.$store.state.appState.transactions
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
