const mix = require('laravel-mix')
const File = require('laravel-mix/src/File')
const proxyMethod = require('proxy-method')
const ConcatenateFilesTask = require('laravel-mix/src/tasks/ConcatenateFilesTask')
const forIn = require('lodash/forIn')
const escapeStringRegexp = require('escape-string-regexp')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const path = require('path')
const separator = '.'

/**
 * Version Hash for Laravel Mix.
 *
 * @see https://laravel-mix.com/
 */
class VersionHash {

    /**
     * Constructor.
     */
    constructor() {
        // hash the generated assets once build is complete
        this.registerHashAssets()

        // look for instances of combining file(s)
        this.hashForCombine()
    }

    /**
     * Dependencies for plugin.
     *
     * @return {String[]}
     */
    dependencies() {
        return [
            'jsonfile', 
            'escape-string-regexp', 
            'path', 
            'proxy-method'
        ]
    }

    /**
     * Plugin functionality.
     *
     * @param {{length: {Number}, delimiter: {String}, exclude: {String[]}}} options
     */
    register(options = {}) {
        this.options = Object.assign({
            length: 6,
            delimiter: separator,
            exclude: []
        }, options)
    }

    /**
     * Apply configuration to webpack configuration.
     *
     * @param {Object} webpackConfig
     */
    webpackConfig(webpackConfig) {
        const length = this.options.length
        const delimiter = this.getDelimiter()

        // js
        let chunkhash = `[name]${delimiter}[chunkhash:${length}].js`
        let usesExtract = webpackConfig.optimization && webpackConfig.optimization.runtimeChunk
        webpackConfig.output.filename = chunkhash

        if (webpackConfig.output.chunkFilename && !usesExtract) {

            // merge chunkFilename paths
            let directory = path.dirname(webpackConfig.output.chunkFilename)
            webpackConfig.output.chunkFilename = `${directory}/${chunkhash}`

        } else {
            webpackConfig.output.chunkFilename = chunkhash
        }

        // css
        let contenthash = `[hash:${length}].css`

        forIn(webpackConfig.plugins, value => {

            if (value instanceof ExtractTextPlugin && !value.filename.includes(contenthash)) {

                let csspath = value.filename.substring(0, value.filename.lastIndexOf('.'))
                let filename = `${csspath}${delimiter}${contenthash}`

                if (value.filename != filename) {
                    value.filename = filename
                }

            }

        })
    }

    /**
     * Update backslashes to forward slashes for consistency.
     *
      * @return {Object}
     */
    webpackPlugins() {
        const combinedFiles = this.combinedFiles

        return new class {
            apply(compiler) {
                compiler.plugin('done', stats => {
                    forIn(stats.compilation.assets, (asset, path) => {
                        if (combinedFiles[path]) {
                            delete stats.compilation.assets[path]
                            stats.compilation.assets[path.replace(/\\/g, '/')] = asset
                        }
                    })
                })
            }
        }

    }

    /**
     * Get configured delimiter with appropriate filtering.
     *
     * @return {String}
     */
    getDelimiter() {
        return this.options.delimiter.replace(/[^.\-_]/g, '') || separator
    }

    /**
     * TODO vet whether or not this needs to exist...?
     */
    exclude(key) {
        return this.options.exclude.some(e => e == key)
    }

    /**
     * Add listener to account for hashing in filename(s) persisted to manifest.
     *
     * @return {this}
     */
    registerHashAssets() {
        Mix.listen('build', () => {
            let op_length = this.options.length
            const delimiter = escapeStringRegexp(this.getDelimiter())
            const removeHashFromKeyRegex = new RegExp(`${delimiter}([a-f0-9]{${op_length}})\\.([^.]+)$`, 'g')
            const removeHashFromKeyRegexWithMap = new RegExp(`${delimiter}([a-f0-9]{${op_length}})\\.([^.]+)\\.map$`, 'g')
            
            const file = File.find(`${Config.publicPath}/${Mix.manifest.name}`)
            let newJson = {}

            forIn(JSON.parse(file.read()), (value, key) => {
                if (key.endsWith('.map')) {
                    key = key.replace(removeHashFromKeyRegexWithMap, '.$2.map')
                } else {
                    key = key.replace(removeHashFromKeyRegex, '.$2')
                }

                newJson[key] = value
            })

            file.write(newJson)
        })

        return this
    }

    /**
     * Intercept functionality that generates combined asset(s).
     *
     * @return {this}
     */
    hashForCombine() {
        this.combinedFiles = {}

        // hook into Mix's task collection to update file name hashes
        proxyMethod.before(Mix, 'addTask', task => {
            if (task instanceof ConcatenateFilesTask) {
                proxyMethod.after(task, 'merge', () => {
                    const file = task.assets.pop()
                    const hash = `${this.getDelimiter()}${file.version().substr(0, this.options.length)}`
                    const hashed = file.rename(`${file.nameWithoutExtension()}${hash}${file.extension()}`)

                    task.assets.push(hashed)
                    this.combinedFiles[hashed.pathFromPublic()] = true
                })
            }
        })

        return this
    }
}

mix.extend('versionHash', new VersionHash())
