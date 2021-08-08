<template>
    <form>
        <div class="form-group">
            <label>Wallet password</label>
            <input class="form-control" type="password" v-model="password">
        </div>
        <div class="form-group">
            <label>Repeat password</label>
            <input class="form-control" type="password" v-model="password2">
        </div>
        <div class="form-actions">
            <button type="button" class="btn btn-form btn-primary" @click="encryptWallet()">Create</button>
            <button type="button" class="btn btn-form btn-default" @click="closeEncrypt()">Cancel</button>
        </div>
    </form>
</template>

<script>
import {ipcRenderer} from "electron";

export default {
    name: "Encrypt",
    data() {
        return {
            password: null,
            password2: null,
        }
    },
    methods:{
        closeEncrypt() {
            this.$router.push('/')
        },
        encryptWallet() {
            if(!this.password || !this.password2) {
                alert("You must enter passwords!")
                return
            }
            if(this.password !== this.password2) {
                alert("Passwords do not match!")
                return
            }
            if(this.password.length < 8) {
                alert("The password must be at least 8 characters long!")
                return
            }

            let res = ipcRenderer.sendSync('encrypt-wallet', this.password)
            if(res.error) {
                alert(res.msg)
                return
            } else {
                this.$router.push('/')
            }
        }
    }
}
</script>

<style scoped>

</style>
