module.exports = {
    pluginOptions: {
        electronBuilder: {
            nodeIntegration: true,
            builderOptions: {
            }
        }
    },
    configureWebpack: {
        devtool: 'source-map'
    }
}
