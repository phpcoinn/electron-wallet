<template>
    <div class="d-flex flex-column flex-fill">

        <div class="flex-grow-0 p-3">
            <div class="fs-5">Settings</div>
            <div class="fs-7 text-muted">Modify settings of wallet</div>
        </div>

        <hr class="mx-3 my-0"/>

        <form class="row flex-grow-1 d-flex align-content-start p-3">
            <div class="row mb-3">
                <label for="miningNode" class="col-sm-2 col-form-label">Network:</label>
                <div class="col-sm-6">
                    <select class="form-control" v-model="settings.network">
                        <option v-for="network in networks" :key="network" :value="network" :label="network"></option>
                    </select>
                </div>
                <div class="col-sm-4">
                    <span class="col-form-label text-danger">
                        After changing network wallet will be restarted and default servers will be set
                    </span>
                </div>
            </div>
            <div class="row mb-3">
                <label for="miningNode" class="col-sm-2 col-form-label">Wallet node:</label>
                <div class="col-sm-6">
                    <input type="checkbox" v-model="settings.autoWalletNode"> Automatic
                    <input type="text" v-model="settings.walletNode" class="form-control" id="walletNode"
                        :disabled="settings.autoWalletNode">
                </div>
                <div class="col-sm-4">
                    <span class="col-form-label text-muted">
                        Address of node to which wallet is connected<br/>
                    </span>
                </div>
            </div>
            <div class="row mb-3">
                <label for="miningNode" class="col-sm-2 col-form-label">Mining node:</label>
                <div class="col-sm-6">
                    <input type="text" v-model="settings.miningNode" class="form-control" id="miningNode">
                </div>
                <div class="col-sm-4">
                    <span class="col-form-label text-muted">
                        Address of node which will be used to validate mine data.<br/>
                        This node will receive 10% of block reward
                    </span>
                </div>
                <div class="col-sm-2"></div>
                <div class="col-sm-6">
                    <input type="checkbox" v-model="settings.autoStartMiner">
                    Start mining on wallet start
                </div>
            </div>

        </form>

        <div class="flex-grow-0 p-3">
            <button type="button" class="btn btn-large btn-primary" @click="save">Save</button>
        </div>
    </div>
</template>

<script>

import {ipcRenderer} from "electron";

export default {

    computed: {
      settings() {
          return this.$store.state.appState.settings
      },
        networks() {
            return this.$store.state.appState.networks
        }
    },
    mounted() {
        ipcRenderer.removeAllListeners('state-update')
    },
    methods:{
        save() {
            ipcRenderer.send('save-settings', this.settings)
        }
    }

}
</script>

<style>
@media (max-width: 600px) {
    /*.top-bar {*/
    /*    flex-direction: column;*/
    /*}*/
}
</style>
