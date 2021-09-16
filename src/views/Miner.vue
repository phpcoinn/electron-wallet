<template>
    <div class="d-flex flex-row flex-fill">
        <div class="d-flex flex-fill flex-column max-width-600">
            <div class="flex-grow-0 p-3 d-flex flex-row justify-content-between">
                <div class="">
                    <div class="fs-5">Miner node:</div>
                    <div class="fs-7 text-muted">{{$store.state.appState.settings.miningNode}}</div>
                </div>
                <div>
                    <button @click="startMiner" class="btn btn-large btn-success fs-5 mt-2 me-2"
                        :disabled="minerData.running || !$store.state.appState.walletData.verifiedAddress">Start</button>
                    <button @click="stopMiner" class="btn btn-large btn-danger fs-5 mt-2" :disabled="!minerData.running">Stop</button>
                </div>
            </div>

            <hr class="mx-3 my-0"/>

            <div class="d-flex flex-fill p-3 flex-column max-width-600">


                <template v-if="!$store.state.appState.walletData.verifiedAddress">

                    <div class="flex-fill d-flex align-items-center justify-content-center">
                        <div class="d-flex flex-column">
                            <div class="fs-5 mb-3">To start mining you must verify your address</div>
                            <div class="fs-6 text-muted">
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
                    </div>


                </template>
                <template v-else>

                    <template v-if="minerData.running">

                        <div class="d-flex flex-column">


                        <template v-if="minerData">

                            <div class="d-flex justify-content-between">
                                <div>
                                    Mining block: <span class="badge bg-info">{{minerData.miner.height}}</span><br/>
                                </div>
                                <div>Running time: {{runningTimeHuman}}</div>
                            </div>

                            <div class="d-flex justify-content-between fs-5">
                                <div>
                                    <span class="badge bg-success">{{minerData.miningStat.accepted}}</span> Accepted
                                </div>
                                <div>
                                    <span class="badge bg-danger">{{minerData.miningStat.rejected}}</span> Rejected
                                </div>
                                <div>
                                    <span class="badge bg-warning">{{minerData.miningStat.dropped}}</span> Dropped
                                </div>
                            </div>

                            <hr/>

                            <div class="d-flex mb-1">
                                <div class="flex-grow-0 small pe-2" style="line-height: 16px;;width: 60px">
                                    Elapsed
                                </div>
                                <div class="progress flex-grow-1">
                                    <div class="progress-bar bg-warning" role="progressbar"
                                         :style="`width: ${percElapsed}%`" :aria-valuenow="percElapsed" aria-valuemin="0" :aria-valuemax="100"></div>
                                </div>
                                <div class="flex-grow-0 small ps-2 text-end" style="line-height: 16px;width: 60px">
                                    {{minerData.miner.elapsed}}
                                </div>
                            </div>


                            <div class="d-flex mb-1">
                                <div class="flex-grow-0 small pe-2" style="line-height: 16px;width: 60px">
                                    Hit
                                </div>
                                <div class="progress flex-grow-1">
                                    <div class="progress-bar bg-info" role="progressbar"
                                         :style="`width: ${percHit}%`" :aria-valuenow="percHit" aria-valuemin="0" aria-valuemax="100"></div>
                                    <div class="progress-bar" role="progressbar"
                                         :style="`width: ${percMaxHit - percHit}%; background-color:#e9ecef`" :aria-valuenow="percMaxHit" aria-valuemin="0" aria-valuemax="100"></div>
                                    <div class="progress-bar bg-info" role="progressbar"
                                         :style="`width: 3px`" :aria-valuenow="1" aria-valuemin="0" aria-valuemax="100"></div>
                                </div>
                                <div class="flex-grow-0 small ps-2 text-end" style="line-height: 16px;width: 60px">
                                    {{minerData.miner.hit}}
                                </div>
                            </div>


                            <div class="d-flex">
                                <div class="flex-grow-0 small pe-2" style="line-height: 16px;width: 60px">
                                    Target
                                </div>
                                <div class="progress flex-grow-1">
                                    <div class="progress-bar bg-warning" role="progressbar"
                                         :style="`width: ${percTarget}%`" :aria-valuenow="percTarget" aria-valuemin="0" :aria-valuemax="100"></div>
                                </div>
                                <div class="flex-grow-0 small ps-2 text-end" style="line-height: 16px;width: 60px">
                                    {{minerData.miner.target}}
                                </div>
                            </div>

                            <hr/>

                            <div>Mining stat:</div>

                            <div class="d-flex flex-row justify-content-between small">
                                <div class="text-info">Submits</div>
                                <div class="text-dark">Total</div>
                                <div class="text-warning">Dropped</div>
                            </div>


                            <div class="progress progress-outer small" style="height: 50px">
                                <div class="progress-bar bg-info" role="progressbar" style="padding: 0 10px"
                                     :style="`width: ${percSubmitted}%`" :aria-valuenow="percSubmitted" aria-valuemin="0" aria-valuemax="100"
                                        v-if="minerData.miningStat.submits">

                                    <div class="d-flex flex-row justify-content-between">
                                        <div class="text-success">Accepted</div>
                                        <div class="text-danger">Rejected</div>
                                    </div>


                                    <div class="progress progress-inner">
                                        <div class="progress-bar bg-success" role="progressbar"
                                             :style="`width: ${percAccepted}%`" :aria-valuenow="percAccepted" aria-valuemin="0" aria-valuemax="100"></div>
                                        <div class="progress-bar bg-danger" role="progressbar"
                                             :style="`width: ${100-percAccepted}%`" :aria-valuenow="100-percAccepted" aria-valuemin="0" aria-valuemax="100"></div>
                                    </div>

                                    <div class="d-flex flex-row justify-content-between">
                                        <div class="text-success">{{minerData.miningStat.accepted}}</div>
                                        <div class="text-danger">{{minerData.miningStat.rejected}}</div>
                                    </div>

                                </div>
                                <div class="progress-bar bg-warning" role="progressbar"
                                     :style="`width: ${100-percSubmitted}%`" :aria-valuenow="100-percSubmitted" aria-valuemin="0"
                                     aria-valuemax="100" v-if="minerData.miningStat.dropped">

                                </div>
                            </div>

                            <div class="d-flex flex-row justify-content-between small">
                                <div class="text-info">{{minerData.miningStat.submits}}</div>
                                <div class="text-dark">{{minerData.miningStat.cnt-1}}</div>
                                <div class="text-warning">{{minerData.miningStat.dropped}}</div>
                            </div>



                        </template>
                        </div>
                    </template>
                    <template v-else>
                        <div class="flex-fill d-flex align-items-center justify-content-center">
                            <div class="d-flex flex-column text-center">
                                <div class="fs-5">Miner stopped</div>
                                <div class="fs-6 text-muted">Click button to start mining</div>
                            </div>
                        </div>
                    </template>
                </template>
            </div>
        </div>

    </div>
</template>

<script>
import {ipcRenderer} from "electron";
import moment from "moment";

export default {
    name: "Miner",
    data() {
      return {
      }
    },
    mounted() {
        console.log("mounted miner")
    },
    methods:{
        startMiner() {
            ipcRenderer.send('miner-cmd', 'start')
        },
        stopMiner() {
            ipcRenderer.send('miner-cmd', 'stop')
        },
        openFaucet() {
            ipcRenderer.send('faucet-open-link')
        },
        openSend() {
            this.$router.push('/send')
        }
    },
    computed: {
        minerData() {
          return this.$store.state.appState.minerData
        },
        percAccepted() {
            let miningStat = this.minerData.miningStat
            if(miningStat.submits) {
                return Math.round(miningStat.accepted  * 100/ miningStat.submits)
            } else {
                return 0
            }
        },
        percSubmitted() {
            let miningStat = this.minerData.miningStat
            if(miningStat.cnt - 1) {
                return Math.round(miningStat.submits * 100 / (miningStat.cnt - 1))
            } else {
                return 0
            }
        },
        percHit() {
            let miningStat = this.minerData.miner
            if(miningStat.maxTarget) {
                return Math.round(Math.log2(miningStat.hit) * 100 / Math.log2(miningStat.maxTarget))
            } else {
                return 0
            }
        },
        percMaxHit() {
            let miningStat = this.minerData.miner
            if(miningStat.maxTarget) {
                return Math.round(Math.log2(miningStat.maxHit) * 100 / Math.log2(miningStat.maxTarget))
            } else {
                return 0
            }
        },
        percTarget() {
            let miningStat = this.minerData.miner
            if(miningStat.maxTarget) {
                return Math.round(Math.log2(miningStat.target) * 100 / Math.log2(miningStat.maxTarget))
            } else {
                return 0
            }
        },
        percElapsed() {
            let miningStat = this.minerData.miner
            let maxTime = this.$store.state.appState.config.block_time
            return Math.round(miningStat.elapsed * 100 / (maxTime * 2))
        },
        runningTimeHuman() {
            return moment.duration(this.minerData.miner.runningTime).humanize()
        }
    }

}
</script>

<style scoped>

</style>
