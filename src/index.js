const mix = require('laravel-mix')
const forIn = require('lodash/forIn')
const jsonfile = require('jsonfile')
const ExtractTextPlugin = require('extract-text-webpack-plugin')

class VersionHash {
    register(options = {}) {
        this.options = Object.assign(
            {
                length: 6,
                delimaiter: '.'
            },
            options
        )

        let delimiter = this.getDelimiter()
        const mixManifest = `${Config.publicPath}/mix-manifest.json`
        const removeHashFromKeyRegex = new RegExp('(.*)\\' + delimiter + '(.*)\\.(.*)$', 'g')
        const removeHashFromKeyRegexWithMap = new RegExp('(.*)\\' + delimiter + '(.*)\\.(.*)\.map$', 'g')

        return mix.webpackConfig().then(() => {
            jsonfile.readFile(mixManifest, (err, obj) => {
                let newJson = {}

                forIn(obj, (value, key) => {
                    if(key.endsWith('.map')) {
                        key = key.replace(removeHashFromKeyRegexWithMap, '$1.$3.map')
                    } else {
                        key = key.replace(removeHashFromKeyRegex, '$1.$3')
                    }
                    newJson[key] = value
                })

                jsonfile.writeFile(mixManifest, newJson, {spaces: 2}, (err) => {
                    if (err) console.error(err)
                })
            })
        })
    }

    getDelimiter() {
        return this.options.delimiter.replace(/[^\.|\-|_]/g, '') || '.'
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
