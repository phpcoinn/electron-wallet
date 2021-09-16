<template>
    <div class="d-flex flex-column flex-fill">

        <div class="flex-grow-0 p-3">
            <div class="fs-5">Settings</div>
            <div class="fs-7 text-muted">Modify settings of wallet</div>
        </div>

        <hr class="mx-3 my-0"/>

        <form class="row flex-grow-1 d-flex align-content-start p-3">
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
      }
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
