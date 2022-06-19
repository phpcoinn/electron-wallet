<template>

    <div class="d-flex flex-row flex-fill">
        <div class="d-flex flex-fill flex-column" style="width: 50%">
            <div class="flex-grow-0 p-3">
                <div class="fs-5">Wallet info</div>
                <div class="fs-7 text-muted">Here is information about your wallet</div>
            </div>

            <hr class="mx-3 my-0"/>

            <div class="flex-fill d-flex flex-column text-center">
                <div class="flex-grow-1 d-flex justify-content-center p-4 align-items-center">
                    <img :src="$store.state.appState.walletData.qrCode" style="max-width: 300px; max-height:300px;"/>
                </div>

                <div class="flex-grow-0 fs-4 p-2" style="word-break: break-all">
                    {{$store.state.appState.walletData.address}}
                </div>

                <div class="flex-grow-0 p-2">
                    <button class="btn btn-large btn-primary" @click="copy()">Copy</button>
                </div>
            </div>

        </div>

        <div class="flex-fill d-flex p-3" style="background-color: #eee; width: 50%">
            <dl class="">
                <dt class="">Public key:</dt>
                <dd class="" style="word-break: break-all">{{$store.state.appState.walletData.publicKey}}</dd>
                <dt class="">
                    <div>
                        Private key:
                        <a href="" @click.prevent="toggleSecret">{{showSecret ? 'Hide' : 'Show'}}</a>
                    </div>
                </dt>
                <dd style="word-break: break-all">
                    <div :class="`secret ${showSecret ? 'show' : 'hide'}`">{{$store.state.appState.walletData.privateKey}}</div>
                </dd>
            </dl>
        </div>
    </div>
</template>

<script>
import {ipcRenderer} from "electron";

export default {
    name: "Info.vue",
    data() {
      return {
          showSecret: false
      }
    },
    methods: {
        copy() {
            ipcRenderer.send('clipboard-copy', this.$store.state.appState.walletData.address)
        },
        toggleSecret() {
            this.showSecret = !this.showSecret
        }
    }
}
</script>

<style scoped>
.secret.hide {
    color: transparent !important;
    text-shadow:  0 0 8px rgba(0,0,0,0.5)
}
</style>
