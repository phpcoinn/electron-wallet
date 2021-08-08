<template>
  <div class="home">
      Addeess: {{$store.state.walletData.address}}
      <br/>
      Balance: {{$store.state.walletData.balance}}
      <br/>
      Pending balance: {{pendingBalance}}
      <hr/>
      Latest transctions:
        <table>
            <tbody>
            <tr v-for="tx in transactions" :key="tx.id">
                <td>{{tx.block}}</td>
                <td>{{tx.confirmations}}</td>
                <td>{{tx.date}}</td>
                <td>{{tx.dst}}</td>
                <td>{{tx.height}}</td>
                <td>{{tx.fee}}</td>
                <td>{{tx.id}}</td>
                <td>{{tx.type}}</td>
                <td>{{tx.value}}</td>
            </tr>
            </tbody>
        </table>
  </div>
</template>

<script>

import {ipcRenderer} from "electron";

export default {
    name: 'Home',
    data() {
      return {
          walletExists: false,
          address: null,
          walletPeer: null,
          pendingBalance: null,
          transactions: []
      }
    },
    mounted() {
        console.log("mounted")
        this.pendingBalance = ipcRenderer.sendSync('get-pending-balance')
        this.transactions = ipcRenderer.sendSync('get-transactions')
    },
    methods: {
        createWallet(encrypt) {
            console.log("createWallet", encrypt)
            let res = ipcRenderer.sendSync('create-wallet', encrypt)
            console.log(res)
        },
        openSend() {
            this.$router.push('/send')
        }
    }

}
</script>
