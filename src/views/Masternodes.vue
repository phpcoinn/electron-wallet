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
                <div class="fs-5">
                    <template v-if="addressInfo.type === 'no_masternode'">
                        Masternodes
                    </template>
                    <template v-else-if="addressInfo.type === 'cold_masternode'">
                        Wallet is cold masternode
                    </template>
                    <template v-else-if="addressInfo.type === 'hot_masternode'">
                        Wallet is hot masternode
                    </template>
                    <template v-else-if="addressInfo.type === 'masternode_reward'">
                        Wallet is masternode reward
                    </template>
                </div>
            </div>
            <hr class="my-0"/>

            <div v-if="addressInfo.type === 'cold_masternode'">
                <table>
                    <tr>
                        <td><strong>Creator</strong></td>
                        <td>
                            <a href="" @click.prevent="openExplorerUrl('address.php?address=' + addressInfo.masternodes[0].src)">{{addressInfo.masternodes[0].src}}</a>
                        </td>
                    </tr>
                    <tr>
                        <td><strong>Collateral</strong></td>
                        <td>{{addressInfo.masternodes[0].collateral}}</td>
                    </tr>
                    <tr>
                        <td><strong>Height</strong></td>
                        <td>{{addressInfo.masternodes[0].height}}</td>
                    </tr>
                    <tr>
                        <td><strong>Reward address</strong></td>
                        <td>
                            <a href="" @click.prevent="openExplorerUrl('address.php?address=' + addressInfo.masternodes[0].dst)">{{addressInfo.masternodes[0].dst}}</a>
                        </td>
                    </tr>
                </table>
            </div>

            <div v-if="addressInfo.type === 'masternode_reward'">

                <template v-for="masternode of addressInfo.masternodes">
                    <div :key="masternode.masternode">
                        <table>
                            <tr>
                                <td><strong>Masternode</strong></td>
                                <td>
                                    <a href="" @click.prevent="openExplorerUrl('address.php?address=' + masternode.masternode)">{{masternode.masternode}}</a>
                                </td>
                            </tr>
                            <tr>
                                <td><strong>Creator</strong></td>
                                <td>
                                    <a href="" @click.prevent="openExplorerUrl('address.php?address=' + masternode.src)">{{masternode.src}}</a>
                                </td>
                            </tr>
                            <tr>
                                <td><strong>Collateral</strong></td>
                                <td>{{masternode.collateral}}</td>
                            </tr>
                            <tr>
                                <td><strong>Height</strong></td>
                                <td>{{masternode.height}}</td>
                            </tr>
                        </table>
                        <hr/>
                    </div>
                </template>

                <template v-if="addressInfo.masternodes.length > 1">
                    <select v-model="mnAddress" class="form-control">
                        <option>Select masternode...</option>
                        <option :key="masternode.masternode" v-for="masternode of addressInfo.masternodes" :value="masternode.masternode">{{masternode.masternode}}</option>
                    </select>
                </template>


            </div>

            <div v-if="addressInfo.type === 'hot_masternode'">
                <table>
                    <tr>
                        <td><strong>Creator</strong></td>
                        <td>
                            <a href="" @click.prevent="openExplorerUrl('address.php?address=' + addressInfo.masternodes[0].src)">{{addressInfo.masternodes[0].src}}</a>
                        </td>
                    </tr>
                    <tr>
                        <td><strong>Collateral</strong></td>
                        <td>{{addressInfo.masternodes[0].collateral}}</td>
                    </tr>
                    <tr>
                        <td><strong>Height</strong></td>
                        <td>{{addressInfo.masternodes[0].height}}</td>
                    </tr>
                </table>
            </div>

            <div class="mt-3" v-if="addressInfo.type === 'no_masternode'">
                <div v-for="mn in walletMasternodes" :key="mn.masternode_address"
                     class="alert alert-info">
                    <div class="mb-2"><strong>{{mn.masternode_address}}</strong></div>
                    <div>Type: {{mn.reward_address !== mn.masternode_address ? 'Cold' : 'Hot'}}</div>
                    <div>Balance: {{mn.masternode_balance}}</div>
                    <div>Collateral: {{mn.collateral}}</div>
                    <div v-if="mn.reward_address && mn.reward_address !== mn.masternode_address">
                        Reward address: {{mn.reward_address}}
                    </div>
                </div>
                <div class="form-group">
                    <input type="text" class="form-control" placeholder="Address" v-model="newMnAddress">
                    <input type="text" class="form-control mt-2" placeholder="Reward address" v-model="newMnRewardAdress">
                    <div class="d-grid gap-2 mt-2">
                        <button type="button"  @click="createNewMnTx" class="btn btn-outline-primary">Create new masternode</button>
                    </div>
                </div>
            </div>
            <div class="mt-3" v-if="addressInfo.type === 'hot_masternode' || addressInfo.type === 'masternode_reward'">
                <div class="form-group">
                    <input type="text" class="form-control" placeholder="Payout address" v-model="payoutAddress">
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
            newMnRewardAdress: null,
            isWalletMn: false,
            payoutAddress: null,
            mnAddress: null,
            walletMasternodes: [],
            addressInfo: {}
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
            this.addressInfo = res.addressInfo
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
            let data = {
                newMnAddress: this.newMnAddress,
                newMnRewardAdress: this.newMnRewardAdress
            }
            ipcRenderer.sendSync("wallet-create-masternode", data)
            this.newMnAddress = null
        },
        removeMnTx() {
            if(!this.payoutAddress) {
                return
            }
            if(!confirm('Are you sure to want to remove this masternode?')) {
                return
            }

            let data = {
                payoutAddress: this.payoutAddress,
                mnAddress: this.mnAddress
        }

            ipcRenderer.sendSync('wallet-remove-masternode', data)
            this.payoutAddress = null
        },
        openExplorerUrl(url) {
            ipcRenderer.send('open-explorer-url', url)
        },
    }
}
</script>

