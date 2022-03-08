<template>
    <div class="d-flex flex-fill">

        <div class="d-flex flex-fill flex-column col-8 p-3 overflow-auto">
            <div class="flex-grow-0 mb-3">
                <div class="fs-5">Masternodes</div>
                <div class="fs-7 text-muted">Active masternodes on network</div>
            </div>
            <hr class="my-0"/>
            <table class="table table-striped">
                <thead>
                <tr>
                    <th>IP</th>
                    <th>Address</th>
                    <th>Height</th>
                    <th>Win height</th>
                </tr>
                </thead>
                <tbody>
                <tr v-for="masternode in masternodes" :key="masternode.ip" :class="rowClass(masternode)">
                    <td>{{masternode.ip}}</td>
                    <td>{{masternode.id}}</td>
                    <td>{{masternode.height}}</td>
                    <td>{{masternode.win_height}}</td>
                </tr>
                </tbody>
            </table>
        </div>
        <div class="d-flex flex-fill p-3 flex-column overflow-auto col-4">
            <div class="flex-grow-0 mb-3">
                <div class="fs-5">My masternodes</div>
                <div class="fs-7 text-muted">
                    <span v-if="isWalletMn">
                        This wallet is masternode
                    </span>
                    <span v-if="!isWalletMn">
                    </span>
                </div>
            </div>
            <hr class="my-0"/>
            <div class="mt-3" v-if="!isWalletMn">
                <div v-for="mn in walletMasternodes" :key="mn.masternode_address"
                     class="alert alert-info">
                    <div class="mb-2"><strong>{{mn.masternode_address}}</strong></div>
                    <div>{{mn.masternode_balance}}</div>
                </div>
                <div class="form-group">
                    <input type="text" class="form-control" placeholder="Address" v-model="newMnAddress">
                    <div class="d-grid gap-2 mt-2">
                        <button type="button"  @click="createNewMnTx" class="btn btn-outline-primary">Create new masternode</button>
                    </div>
                </div>
            </div>
            <div class="mt-3" v-if="isWalletMn">
                <div class="form-group">
                    <input type="text" class="form-control" placeholder="Payout address" v-model="removeMnAddress">
                    <div class="d-grid gap-2 mt-2">
                        <button type="button"  @click="removeMnTx" class="btn btn-outline-danger">Remove masternode</button>
                    </div>
                </div>
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
            masternodes: [],
            newMnAddress: null,
            isWalletMn: false,
            removeMnAddress: null,
            walletMasternodes: []
        }
    },
    mounted() {
        this.reload()
        ipcRenderer.on("refresh", ()=>{
            this.reload()
        })
    },
    methods:{
        reload() {
            let res = ipcRenderer.sendSync("get-masternodes", null)
            console.log("get-masternodes", res)
            this.masternodes = res.list
            this.isWalletMn = res.isWalletMn
            this.walletMasternodes = res.walletMasternodes
        },
        openUrl(url) {
            ipcRenderer.send("open-url", url)
        },
        rowClass() {
        },
        createNewMnTx() {
            if(!this.newMnAddress) {
                alert('Masternode address must be specified')
                return
            }
            if(!confirm('Are you sure to want to create masternode?')) {
                return
            }
            ipcRenderer.sendSync("wallet-create-masternode", this.newMnAddress)
            this.newMnAddress = null
        },
        removeMnTx() {
            if(!this.removeMnAddress) {
                return
            }
            if(!confirm('Are you sure to want to remove this masternode?')) {
                return
            }

            ipcRenderer.sendSync('wallet-remove-masternode', this.removeMnAddress)
            this.removeMnAddress = null
        }
    }
}
</script>

