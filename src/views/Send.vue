<template>
    <div class="d-flex flex-row flex-fill">

        <div class="d-flex flex-fill flex-column">

            <div class="flex-grow-0 p-3">
                <div class="fs-5">Send</div>
                <div class="fs-7 text-muted">Send PHPCoin to other address</div>
            </div>

            <hr class="mx-3 my-0"/>

            <div class="d-flex flex-fill p-3 flex-column max-width-600">

                <form class="row flex-grow-1 d-flex align-content-start">
                    <div class="col-6">
                        <div class="form-group">
                            <label class="fs-6 mb-2">Address</label>
                            <input type="text" class="form-control" placeholder="Enter address"  v-model="address">
                        </div>
                    </div>
                    <div class="col-4">
                        <div class="form-group">
                            <label class="fs-6 mb-2">
                                Amount:
                            </label>
                            <input type="text" class="form-control" placeholder="0.00 PHP"  v-model="amount" @change="refreshFee">
                            <div class="d-grid gap-2 mt-2">
                                <button type="button"  @click="setMax" class="btn btn-outline-secondary">Set Max: {{$store.state.appState.walletData.balance}}</button>
                            </div>
                        </div>
                    </div>
                    <div class="col-2">
                        <div class="form-group">
                            <label class="fs-6 mb-2">
                                Fee:
                            </label>
                            <input type="text" class="form-control px-2" v-model="fee" readonly>
                            <div class="d-grid gap-2 mt-2">
                                <button type="button"  @click="refreshFee" class="btn btn-outline-secondary">Refresh</button>
                            </div>
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="fs-6 mb-2">Message (optional):</label>
                        <textarea class="form-control" rows="3" v-model="message"></textarea>
                    </div>
                </form>
                <div class="flex-grow-0">
                    <button @click="send()" class="btn btn-large btn-primary fs-5">Send</button>
                </div>

            </div>
        </div>

    </div>
</template>
<script>
    import {ipcRenderer} from "electron";

    export default {
        data() {
            return {
                address: null,
                amount: null,
                message: null,
                fee: null,
                feeRatio: null
            }
        },
        mounted() {
            this.refreshFee()
        },
        methods: {
            setMax() {
                this.amount = this.$store.state.appState.walletData.balance
                this.refreshFee()
            },
            send() {
                let ok = ipcRenderer.sendSync('wallet-send', {
                    address: this.address,
                    amount: this.amount,
                    message: this.message,
                    fee: this.fee
                })
                if(ok) {
                    this.address = null
                    this.message = null
                    this.amount = null
                }
            },
            refreshFee() {
                this.feeRatio = ipcRenderer.sendSync("get-fee", null)
                this.fee = Number(this.amount * this.feeRatio).toFixed(8)
            }
        }
    }
</script>
<style>
.amount-max {
    float: right;
}
.amount-max span:hover {
    text-decoration: underline;
    cursor: pointer;
}
</style>
