<template>
    <div class="d-flex flex-column flex-fill">

        <div class="flex-grow-0 p-3">
            <div class="fs-5">Encrypt</div>
            <div class="fs-7 text-muted">Encrypt wallet to prevent access to private key</div>
        </div>

        <form class="row flex-grow-1 d-flex align-content-start p-3">
            <div class="form-group mb-2">
                <label class="fs-6 mb-2">Wallet password</label>
                <input class="form-control" type="password" v-model="password">
            </div>
            <div class="form-group">
                <label class="fs-6 mb-2">Repeat password</label>
                <input class="form-control" type="password" v-model="password2">
            </div>
        </form>
        <div class="flex-grow-0 p-3">
            <button type="button" class="btn btn-large btn-primary me-2" @click="encryptWallet()">Create</button>
            <button type="button" class="btn btn-large btn-outline-secondary" @click="closeEncrypt()">Cancel</button>
        </div>
    </div>
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
