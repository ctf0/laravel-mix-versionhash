const mix = require('laravel-mix')
const forIn = require('lodash/forIn')
const jsonfile = require('jsonfile')
const ExtractTextPlugin = require('extract-text-webpack-plugin')

class VersionHash {
    register(options = {}) {
        this.options = Object.assign(
            {
                length: 6,
                delimiter: '.'
            },
            options
        )

        let delimiter = this.getDelimiter()
        const mixManifest = `${Config.publicPath}/mix-manifest.json`
        const removeHashFromKeyRegex = new RegExp(delimiter + '(.+)\\.(.+)$', 'g')

        return mix.webpackConfig().then(() => {
            jsonfile.readFile(mixManifest, (err, obj) => {
                let newJson = {}

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

    getDelimiter() {
        return this.options.delimiter.replace(/[^\.|\-|_]/g, '')
    }

    webpackConfig(webpackConfig) {
        const length = this.options.length
        const delimiter = this.getDelimiter()

        // js
        webpackConfig.output.filename = `[name]${delimiter}[chunkhash:${length}].js`
        webpackConfig.output.chunkFilename = `[name]${delimiter}[chunkhash:${length}].js`

        // css
        let contenthash = `[contenthash:${length}].css`

        forIn(webpackConfig.plugins, (value, key) => {
            if (value instanceof ExtractTextPlugin && !value.filename.includes(contenthash)) {

                let csspath = value.filename.substring(0, value.filename.lastIndexOf('.'))
                let filename = `${csspath}${delimiter}[contenthash:${length}].css`

                if (value.filename != filename) {
                    value.filename = filename
                }
            }
        })
    }
}

mix.extend('versionHash', new VersionHash())
