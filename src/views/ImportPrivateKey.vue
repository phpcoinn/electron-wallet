<template>
    <div class="d-flex flex-column flex-fill">

        <div class="flex-grow-0 p-3">
            <div class="fs-5">Import private key</div>
            <div class="fs-7 text-muted">Create new wallet from imported private key</div>
        </div>

        <hr class="mx-3 my-0"/>

        <form class="row flex-grow-1 d-flex align-content-start p-3 max-width-600">
            <div class="form-group mb-2">
                <label class="fs-6 mb-2">Private key</label>
                <textarea class="form-control" rows="5" v-model="privateKey"/>
            </div>
        </form>
        <div class="flex-grow-0 p-3">
            <button type="button" class="btn btn-large btn-primary me-2" @click="importPrivateKey">Import</button>
            <button type="button" class="btn btn-large btn-outline-secondary" @click="cancel">Cancel</button>
        </div>
    </div>
</template>

<script>
import {ipcRenderer} from "electron";

export default {
    name: "ImportPrivateKey",
    data() {
        return {
            privateKey: '',
        }
    },
    methods:{
        cancel() {
            this.$router.push('/')
        },
        importPrivateKey() {
            if(this.privateKey.length < 8) {
                alert("You did not enter private key!")
                return
            }

            let res = ipcRenderer.sendSync('import-private-key', this.privateKey)
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
