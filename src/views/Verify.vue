<template>

    <div class="d-flex flex-column flex-fill">

        <div class="flex-grow-0 p-3">
            <div class="fs-5">Verify address</div>
            <div class="fs-7 text-muted">Verify your address to start mining</div>
        </div>

        <div class="flex-grow-1 d-flex align-content-start p-3">
            <ol>
                <li>Go to <a href="" @click.prevent="openFaucet">faucet</a>,
                    enter your address to receive some amount</li>
                <li>
                    Wait to transacation to be mined to block and appear in wallet
                </li>
                <li>
                    <a href="" @click.prevent="openSend">Send</a> some amount to different address, or return back to faucet
                </li>
            </ol>
        </div>
    </div>
</template>

<script>
import {ipcRenderer} from "electron";

export default {
    name: "Verify",
    mounted() {
    },
    methods:{
        openFaucet() {
            ipcRenderer.send('faucet-open-link')
        },
        openSend() {
            this.$router.push('/send')
        }
    }
}
</script>

<style scoped>

</style>
