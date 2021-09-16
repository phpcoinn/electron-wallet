<template>
    <div class="d-flex flex-column flex-fill">

        <div class="flex-grow-0 p-3">
            <div class="fs-5">Peers</div>
            <div class="fs-7 text-muted">Connected nodes on network</div>
        </div>

        <hr class="mx-3 my-0"/>

        <div class="row flex-grow-1 d-flex align-content-start p-3 mw-0">

            <div class="table-responsive">
                <table class="table table-striped">
                    <thead>
                        <tr>
                            <th>IP</th>
                            <th>Address</th>
                            <th>Blacklisted</th>
                            <th>Ping</th>
                            <th>Fails</th>
                            <th>Stuck</th>
                            <th>Height</th>
                            <th>AppsHash</th>
                            <th>Score</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="peer in peers" :key="peer.ip" :class="rowClass(peer)">
                            <td>{{peer.ip}}</td>
                            <td>
                                <a href="" @click.prevent="openUrl(peer.hostname)">
                                    {{peer.hostname}}
                                </a>
                            </td>
                            <td>
                                <template v-if="peer.blacklisted > 0">
                                    {{peer.blacklisted|df}}
                                </template>
                            </td>
                            <td>
                                <template v-if="peer.ping">
                                    {{peer.ping|df}}
                                </template>
                            </td>
                            <td>{{peer.fails}}</td>
                            <td>{{peer.stuckfail}}</td>
                            <td>{{peer.height}}</td>
                            <td>
                                <span :title="peer.appshash">{{shortHash(peer.appshash)}}</span>
                            </td>
                            <td>{{peer.score}}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

        </div>
    </div>
</template>

<script>
import {ipcRenderer} from "electron";

export default {
    name: "Peers",
    data() {
      return {
          peers: []
      }
    },
    mounted() {
        this.peers = ipcRenderer.sendSync("get-peers", null)
        ipcRenderer.on("refresh", ()=>{
            this.peers = ipcRenderer.sendSync("get-peers", null)
        })
    },
    methods:{
        openUrl(url) {
            ipcRenderer.send("open-url", url)
        },
        shortHash(hash) {
            if(!hash) {
                return
            }
            return hash.substr(0, 8)+ '...' + hash.substr(-8)
        },
        rowClass(peer) {
            if(peer.blacklisted > 0 && peer.blacklisted > Date.now()/1000) {
                return 'table-danger'
            }
        }
    }
}
</script>

