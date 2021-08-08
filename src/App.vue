<template>
    <div>
      <div class="window">

          <div class="window-content">

              <template v-if="loaded">

                  <div class="pane-group">
                      <div class="pane-sm sidebar" v-if="$store.state.walletData.opened">
                          <nav class="nav-group">
                              <router-link to="/" class="nav-group-item active">
                                  <span class="icon icon-home"></span>
                                  Home
                              </router-link>
                              <router-link to="/send" class="nav-group-item">
                                  <span class="icon icon-home"></span>
                                  Send
                              </router-link>
                              <router-link to="/miner" class="nav-group-item">
                                  <span class="icon icon-home"></span>
                                  Miner
                              </router-link>
                          </nav>
                      </div>
                      <div class="pane padded-more">
                          <router-view/>
                      </div>
                  </div>

              </template>
              <template v-else>
                  Loading wallet!
              </template>
          </div>

          <footer class="toolbar toolbar-footer">
                  <div class="footer-bar" title="Address">
                      timer {{timer}}
                      <template v-if="$store.state.walletData">{{$store.state.walletData.address}}</template>
                  </div>
                  <div class="footer-bar" title="Balance">
                      <template v-if="$store.state.walletData">{{$store.state.walletData.balance}}</template>
                  </div>
                  <div class="footer-bar" title="Peer">
                      <template v-if="$store.state.walletData">{{$store.state.walletData.walletPeer}}</template>
                  </div>
                  <div class="footer-bar" title="Blocks">
                      <template v-if="$store.state.walletData && $store.state.walletData.peerInfo">{{$store.state.walletData.peerInfo.height}}</template>
                  </div>
                  <div class="footer-bar">
                      <template v-if="$store.state.walletData.encrypted">
                          <span class="icon icon-lock"></span>
                          Encrypted
                      </template>
                      <template v-else>
                          <span class="icon icon-lock-open"></span>
                          Unencrypted
                      </template>
                  </div>
              <div class="footer-bar" title="Status">
                  <template v-if="$store.state.walletData">{{$store.state.walletData.status}}</template>
              </div>
          </footer>
      </div>
    </div>


</template>

<script>
    import {ipcRenderer} from "electron";

    export default {

        data() {
            return {
                loaded: false,
                timer: null
            }
        },

        created() {
            console.log("created app")

            ipcRenderer.on('wallet-loaded', (event, walletData) => {
                console.log("loaded",event, walletData)
                this.$store.state.walletData = walletData
                this.loaded = true
            })

            ipcRenderer.on('wallet-data', (event, walletData) => {
                console.log("wallet-data", walletData)
                this.loaded = true
                this.$store.state.walletData = walletData
                if(walletData.encrypted && !walletData.opened && this.$router.currentRoute.name !== 'Decrypt') {
                    console.log("NAVIGATE TO DECRYPT", this.$router.currentRoute.name)
                    this.$router.push('/decrypt')
                }
            })

            ipcRenderer.on("encrypt-wallet", () => {
                console.log("encrypt-wallet")
                this.$router.push('/encrypt')
            })

        },

        mounted() {
            console.log("mounted app")


            ipcRenderer.on("timer", (event, args) => {
                this.timer = args
                console.log('Received timer', args)
            })
        }

    }
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

#nav {
  padding: 30px;
}

#nav a {
  font-weight: bold;
  color: #2c3e50;
}

#nav a.router-link-exact-active {
  color: #42b983;
}
.toolbar {
    display: flex;
}
.toolbar .footer-bar {
    flex: 1;
    border-left: 1px solid #c2c0c2;
    border-right: 1px solid #c2c0c2;
    padding: 0 4px;
    margin: 0;
    font-size: 12px;
    font-weight: 400;
    color: #555;
}
</style>
