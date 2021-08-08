<template>
    <div>
        Send PHPCoin to other address
        <hr/>

        Address:
        <br/>
        <input type="text" v-model="address"/>
        <br/>
        Amount: <span @click="setMax">{{$store.state.walletData.balance}}</span>
        <br/>
        <input type="text" v-model="amount"/>
        <br/>
        Message:
        <br/>
        <input type="text" v-model="message"/>
        <br/>
        <button @click="send()">Send</button>

        <hr/>

        {{$store.state.wallet}}

        <template v-if="msg">
            <div>
                {{msg.type}} - {{msg.message}}
            </div>
        </template>

    </div>
</template>
<script>
    import {ipcRenderer} from "electron";

    export default {
        data() {
            return {
                address: null,
                amount: null,
                message: null,
                msg: null
            }
        },
        methods: {
            setMax() {
                this.amount = this.$store.state.wallet.balance
            },
            send() {
                if(!this.address) {
                    this.msg = {
                        type: 'warning',
                        message: 'Address must be entered'
                    }
                    return
                }
                if(!this.amount || this.amount < 0) {
                    this.msg = {
                        type: 'warning',
                        message: 'Invalid amount'
                    }
                    return
                }
                this.msg = null
                ipcRenderer.sendSync('wallet-send', {
                    address: this.address,
                    amount: this.amount,
                    message: this.message
                })
            }
        }
    }
</script>
