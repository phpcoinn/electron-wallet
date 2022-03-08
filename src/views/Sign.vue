<template>
    <div class="d-flex flex-column flex-fill overflow-auto">

        <div class="flex-grow-0 p-3">
            <div class="fs-5">Sign</div>
            <div class="fs-7 text-muted">Sign message with wallet private key</div>
        </div>

        <hr class="mx-3 my-0"/>
        <div class="p-3">
            <form class="row flex-grow-1 d-flex align-content-start p-3">
                <div class="row mb-3">
                    <label for="message" class="col-sm-2 col-form-label">Message: </label>
                    <div class="col-sm-6">
                        <textarea v-model="message" class="form-control" id="message"/>
                    </div>
                    <div class="col-sm-4">
                        <span class="col-form-label text-muted">
                            Message you want to sign
                        </span>
                    </div>
                </div>
                <div class="row mb-3">
                    <label for="signature" class="col-sm-2 col-form-label">Signature: </label>
                    <div class="col-sm-6">
                        <textarea v-model="signature" class="form-control" id="signature" readonly="readonly" rows="3"/>
                    </div>
                    <div class="col-sm-4">
                        <span class="col-form-label text-muted">
                            Signature created
                        </span>
                    </div>
                </div>
                <div class="row mb-3">
                    <div class="col-sm-2"></div>
                    <div class="col-sm-6 d-flex">
                        <button @click="sign()" type="button" class="btn btn-large btn-primary fs-5">Sign</button>
                        <button @click="copy()" type="button" class="btn btn-large btn-outline-secondary fs-5 ms-3" v-if="signature">Copy</button>
                        <button @click="clear()" type="button" class="btn btn-large btn-outline-secondary fs-5 ms-auto" v-if="signature">Clear</button>
                    </div>
                </div>
            </form>
        </div>

    </div>
</template>

<script>
import {ipcRenderer} from "electron";

export default {
    name: "Sign",
    data() {
        return {
            message: null,
            signature: null
        }
    },
    mounted() {
    },
    methods:{
        sign() {
            this.signature = ipcRenderer.sendSync('wallet-sign', this.message)
        },
        copy() {
            ipcRenderer.send('clipboard-copy', this.signature)
        },
        clear() {
            this.message = null
            this.signature = null
        }
    }
}
</script>

