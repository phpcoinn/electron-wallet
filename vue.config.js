const webpack = require('webpack')
const execSync = require('child_process').execSync;
let gitRev = execSync('git rev-parse HEAD')
if(gitRev) {
    gitRev = gitRev.toString()
    gitRev = gitRev.trim()
}
module.exports = {
    pluginOptions: {
        electronBuilder: {
            nodeIntegration: true,
            builderOptions: {
            }
        }
    },
    configureWebpack: {
        devtool: 'source-map',
        plugins: [
            new webpack.DefinePlugin({
                'process.env': {
                    GIT_REV: '"' + gitRev + '"'
                }
            })
        ]
    }
}
