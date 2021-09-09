<template>
    <div class="d-flex flex-column flex-fill">

        <div class="flex-grow-0 p-3">
            <div class="fs-5">About</div>
            <div class="fs-7 text-muted">Information about wallet</div>
        </div>

        <div class="row flex-grow-1 d-flex align-content-start p-3">
            <dl>
               <dd>Version</dd>
               <dt>{{info.version}}</dt>
            </dl>
            <dl>
               <dd>Github version</dd>
               <dt>{{info.gitCommit}}</dt>
            </dl>
            <dl>
                <dd>Network</dd>
                <dt>{{info.network}}</dt>
            </dl>
            <dl>
                <dd>Block time</dd>
                <dt>{{$store.state.appState.config.block_time}}</dt>
            </dl>
        </div>
    </div>
</template>

<script>
export default {
    name: "About",
    computed:{
        info() {
            return this.$store.state.appState.info
        }
    }
}
</script>

<style scoped>

</style>
