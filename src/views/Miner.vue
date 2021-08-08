<template>
    <div>
    Miner<hr/>
<!--        {{$store.state.minerData.miner}}-->
        <template v-if="$store.state.minerData.running">
            Miner running
        </template>
        <template v-else>
            Miner stopped
        </template>
        <hr/>
        <template v-if="$store.state.minerData">
            <template v-if="$store.state.minerData.miner">
                Height: {{$store.state.minerData.miner.height}}<br/>
                Elapsed: {{$store.state.minerData.miner.elapsed}}<br/>
                Hit: {{$store.state.minerData.miner.hit}}<br/>
                Target: {{$store.state.minerData.miner.target}}<br/>
            </template>
            <template v-if="$store.state.minerData.miningStat">
                Rounds: {{$store.state.minerData.miningStat.cnt}}<br/>
                Hashes: {{$store.state.minerData.miningStat.hashes}}<br/>
                Submits: {{$store.state.minerData.miningStat.submits}}<br/>
                Accepted: {{$store.state.minerData.miningStat.accepted}}<br/>
                Rejected: {{$store.state.minerData.miningStat.rejected}}<br/>
                Dropped: {{$store.state.minerData.miningStat.dropped}}<br/>
            </template>
            <button @click="startMiner" :disabled="$store.state.minerData.running">Start</button>
            <button @click="stopMiner" :disabled="!$store.state.minerData.running">Stop</button>
        </template>
    </div>
</template>

<script>
import {ipcRenderer} from "electron";

export default {
    name: "Miner",

    mounted() {
        console.log("mounted miner")
        ipcRenderer.send('get-miner')

        ipcRenderer.on("miner-data", (event, minerData) => {
            this.$store.state.minerData = minerData
        })
    },
    methods:{
        startMiner() {
            ipcRenderer.send('miner-cmd', 'start')
        },
        stopMiner() {
            ipcRenderer.send('miner-cmd', 'stop')
        }
    }

}
</script>

<style scoped>

</style>
