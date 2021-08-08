<template>
    <div>
        <form>
            <div class="form-group">
                <label>Enter wallet password to open it</label>
                <input class="form-control" type="password" v-model="password">
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-form btn-primary" @click="openWallet()">Open</button>
                <button type="button" class="btn btn-form btn-default" @click="exitWallet()">Exit</button>
            </div>
        </form>
    </div>
</template>

<script>
import {ipcRenderer} from "electron";

export default {
    name: "Decrypt",
    data() {
        return {
            password: null
        }
    },
    mounted() {
    },
    methods:{
        openWallet() {
            if(!this.password) {
                alert("You must enter password!")
                return
            }
            ipcRenderer.send('open-wallet', {password: this.password})

            ipcRenderer.on("wallet-opened", () => {
                if(this.$store.state.walletData.opened) {
                    this.$router.push('/')
                }
            })
        },
        exitWallet() {
            ipcRenderer.send('exit-wallet')
        }
    }
}
</script>

<style scoped>

</style>
