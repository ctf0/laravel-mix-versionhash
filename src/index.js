const mix = require('laravel-mix')
const forIn = require('lodash/forIn')
const jsonfile = require('jsonfile')
const removeHashFromKeyRegex = /\.(.+)\.(.+)$/g

class VersionHash {
    register(options = {}) {
        this.options = Object.assign(
            {
                length: 6
            },
            options
        )

        const mixManifest = `${Config.publicPath}/mix-manifest.json`

        return mix.webpackConfig().then(() => {
            jsonfile.readFile(mixManifest, (err, obj) => {
                const newJson = {}

                forIn(obj, (value, key) => {
                    key = key.replace(removeHashFromKeyRegex, '.$2')
                    newJson[key] = value
                })

                jsonfile.writeFile(mixManifest, newJson, {spaces: 2}, (err) => {
                    if (err) console.error(err)
                })
            })
        })
    }

    webpackConfig(webpackConfig) {
        let length = this.options.length

        webpackConfig.output.filename = `[name].[chunkhash:${length}].js`
        webpackConfig.output.chunkFilename = `[name].[chunkhash:${length}].js`
    }
}

mix.extend('versionHash', new VersionHash())
