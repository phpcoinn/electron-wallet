<template>
    <div class="window">

        <div class="sidebar">
            <div class="logo">
                <img :src="require('./assets/img/logo.png')"/>
            </div>
            <div class="menu">
                <router-link to="/" :class="`menu-item ${$route.name==='Home' ? 'active' : ''}`">
                    <span v-html="Icons.iconHome"></span>
                    <div class="title">HOME</div>
                </router-link>
                <router-link to="/send"  :class="`menu-item ${$route.name==='Send' ? 'active' : ''}`">
                    <span v-html="Icons.iconSend"></span>
                    <div class="title">SEND</div>
                </router-link>
                <router-link to="/info"  :class="`menu-item ${$route.name==='Info' ? 'active' : ''}`">
                    <span v-html="Icons.iconReceive"></span>
                    <div class="title">RECEIVE</div>
                </router-link>
                <router-link to="/miner"  :class="`menu-item ${$route.name==='Miner' ? 'active' : ''}`">
                    <span v-html="Icons.iconMiner"></span>
                    <div class="title">MINER</div>
                </router-link>
                <router-link to="/settings"  :class="`menu-item ${$route.name==='Settings' ? 'active' : ''}`">
                    <span v-html="Icons.iconSettings"></span>
                    <div class="title">SETTINGS</div>
                </router-link>
            </div>
        </div>

          <div class="window-content">

              <template v-if="loaded">
                  <template v-if="walletData.encrypted && !walletData.opened">
                      <div class="flex-fill d-flex align-items-center justify-content-center">
                          <div class="text-center">
                              <div class="fs-4 mb-3">Wallet is encrypted</div>
                              <form>
                                  <div class="form-group">
                                      <label class="mb-2">Enter wallet password to open it</label>
                                      <input class="form-control" type="password" v-model="password">
                                  </div>
                                  <div class="mt-3">
                                      <button type="button" class="btn btn-large btn-primary me-2" @click="openWallet()">Open</button>
                                      <button type="button" class="btn btn-large btn-outline-secondary" @click="exitWallet()">Exit</button>
                                  </div>
                              </form>
                          </div>
                      </div>
                  </template>
                  <template v-else>
                      <div class="window-header p-3">
                          <div class="d-flex top-bar">
                              <div class="flex-grow-1 mw-0">
                                  <div class="fs-6 text-secondary">Total</div>
                                  <div class="fs-4 text-truncate">{{walletData.balance}} PHP</div>
                                  <div class="fs-6 text-secondary">Pending</div>
                                  <div class="fs-5 text-truncate">{{walletData.mempoolBalance}} PHP</div>
                              </div>
                              <div class="flex-grow-1 mw-0">
                                  <div class="fs-6 text-secondary">Address</div>
                                  <div class="fs-4 text-truncate">
                                      <template v-if="walletData.verifiedAddress">
                                          <span class="icon" v-html="Icons.iconVerified" title="Address is verified"></span>
                                      </template>
                                      <template v-else>
                                          <span class="icon" v-html="Icons.iconAttention" title="Address is not verified"></span>
                                      </template>
                                      <span style="letter-spacing: -1px">{{walletData.address}}</span>
                                  </div>
                                  <div class="fs-6 text-secondary">Transactions</div>
                                  <div class="fs-5">
                                      <template v-if="$store.state.appState.transactions.length >= 100">&gt; </template>
                                      {{$store.state.appState.transactions.length}}
                                  </div>
                              </div>
                              <div class="flex-grow-1 mw-0">
                                  <div class="fs-6 text-secondary">Node</div>
                                  <div class="fs-4 text-truncate">{{walletData.walletPeer}}</div>
                                  <div class="fs-6 text-secondary">Blocks</div>
                                  <div class="fs-5">{{walletData.peerInfo.height}}</div>
                              </div>
                              <div class="">
                                  <img :src="walletData.qrCode" style="width: 80px; height: 80px"/>
                              </div>
                          </div>
                      </div>
                      <div class="window-main">
                        <router-view/>
                      </div>
                  </template>
              </template>
              <template v-else>
                  <div class="flex-fill d-flex align-items-center justify-content-center">
                      <div class="fs-3">
                          Loading wallet...
                      </div>
                  </div>
              </template>

          </div>


    </div>


</template>

<script>
    import {ipcRenderer} from "electron";
    import * as Icons from "./utils/Icons"

    export default {

        data() {
            return {
                password: null
            }
        },

        computed: {
            Icons() {
                return Icons
            },
            loaded() {
                return this.$store.state.appState.walletData && this.$store.state.appState.walletData.loaded
            },
            walletData() {
                return this.$store.state.appState.walletData
            }
        },

        created() {
            console.log("created app")

            ipcRenderer.send("app-created", null)

            ipcRenderer.on('goto', (event, url) => {
                this.$router.push(url).catch(()=>{});
            })

        },

        mounted() {
            console.log("mounted app")

            ipcRenderer.on('state-update', (event, state)=>{
                console.log("state-update", state)
                this.$store.state.appState = state
            })

        },
         methods: {
             openWallet() {
                 if(!this.password) {
                     alert("You must enter password!")
                     return
                 }
                 ipcRenderer.send('open-wallet', {password: this.password})
             },
             exitWallet() {
                 ipcRenderer.send('exit-wallet')
             }
         }

    }
</script>

<style>
html {
    font-size: 12px;
}
.mw-0 {
    min-width: 0;
}
.window {
    display: flex;
    flex-direction: row;
}
.sidebar {
    width: 100px;
    background-color: #111111;
}
.sidebar .logo img {
    width: 60px;
    height: auto;
    margin: 20px;
}
.window-content {
    height: 100vh;
}
.menu-item {
    display: block;
    color: #fff;
    text-align: center;
    padding: 10px 0;
    margin: 10px 0;
    text-decoration: auto;
}
.menu-item .title {
    margin-top: 10px;
    font-size: 12px;
}
.menu-item:hover {
    cursor: pointer;
    color: #fff;
    background-color: #333333;
    text-decoration: auto;
}
.menu-item:hover .title {
    color: #b5b8ef;
}
.menu-item.active .title {
    color: #b5b8ef;
}
.menu-item.active {
    background-color: #333333;
}
.window-header {
    background-color: #F5F5F5;
}
.window-main {
    background-color: #fff;
    flex: 1;
    display: flex;
    min-height: 0;
    /*overflow: auto;*/
}
.window-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}
.main-balance {
}
.footer {
    display: flex;
    height: 30px;
    background-color: #F5F5F5;
    color: #666;
    font-size: 12px;
}
.footer .footer-bar {
    flex: 1;
    border: 1px solid #EEE;
    padding: 5px;
}

.max-width-600 {
    max-width: 600px;
}

/*.icon svg {*/
/*    width: 30px;*/
/*    height: 30px;*/
/*}*/


@media (max-width: 800px) {
    /*.top-bar {*/
    /*    flex-direction: column;*/
    /*}*/
}
</style>
