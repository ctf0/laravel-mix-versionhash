const laravel_mix = require('laravel-mix')
const File = require('laravel-mix/src/File')
const proxyMethod = require('proxy-method')
const ConcatenateFilesTask = require('laravel-mix/src/tasks/ConcatenateFilesTask')
const forIn = require('lodash/forIn')
const escapeStringRegexp = require('escape-string-regexp')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const path = require('path')
const collect = require('collect.js')
const separator = '.'

/**
 * Version Hash for Laravel mix.
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
     * @param {length: Number, delimiter: String, exclude: String[]} options
     */
    register(options = {}) {
        this.options = Object.assign({
            length   : 6,
            delimiter: separator,
            exclude  : []
        }, options)
    }

    /**
     * Apply configuration to webpack configuration.
     *
     * @param {Object} webpackConfig
     */
    webpackConfig(webpackConfig) {
        if (!this.options) {
            this.register({})
        }

        const length = this.options.length
        const delimiter = this.getDelimiter()

        /* Js ----------------------------------------------------------------------- */

        let chunkhash = `[name]${delimiter}[chunkhash:${length}].js`
        let usesExtract = webpackConfig.optimization && webpackConfig.optimization.runtimeChunk
        webpackConfig.output.filename = chunkhash

        if (typeof webpackConfig.output.chunkFilename != "function" && !usesExtract) {
            // merge chunkFilename paths
            let directory = path.dirname(webpackConfig.output.chunkFilename)
            webpackConfig.output.chunkFilename = `${directory}/${chunkhash}`
        } else {
            webpackConfig.output.chunkFilename = chunkhash
        }

        /* Css ---------------------------------------------------------------------- */

        let contenthash = `[hash:${length}].css`

        forIn(webpackConfig.plugins, (value) => {
            if (value instanceof MiniCssExtractPlugin && !value.options.filename.includes(contenthash)) {
                let csspath = value.options.filename.substring(0, value.options.filename.lastIndexOf('.'))
                let filename = `${csspath}${delimiter}${contenthash}`

                if (value.options.filename != filename) {
                    value.options.filename = filename
                }
            }
        })

        /* Files Inside Css --------------------------------------------------------- */

        forIn(webpackConfig.module.rules, (rule) => {

            // check if the rule is /(\.(png|jpe?g|gif|webp)$|^((?!font).)*\.svg$)/
            if ('.png'.match(new RegExp(rule.test))) {
                forIn(rule.loaders, (loader) => {
                    if (loader.loader === 'file-loader') {
                        loader.options.name = (path) => {
                            if (!/node_modules|bower_components/.test(path)) {
                                return Config.fileLoaderDirs.images + `/[name]${delimiter}[hash:${length}].[ext]`
                            }

                            return Config.fileLoaderDirs.images +
                                '/vendor/' +
                                path.replace(/\\/g, '/').replace(/((.*(node_modules|bower_components))|images|image|img|assets)\//g, '') +
                                `?[hash:${length}]`
                        }
                    }
                })
            }

            // check if the rule is /(\.(woff2?|ttf|eot|otf)$|font.*\.svg$)/
            if ('.woff'.match(new RegExp(rule.test))) {
                forIn(rule.loaders, (loader) => {
                    if (loader.loader === 'file-loader') {
                        loader.options.name = (path) => {
                            if (!/node_modules|bower_components/.test(path)) {
                                return Config.fileLoaderDirs.fonts + `/[name]${delimiter}[hash:${length}].[ext]`
                            }

                            return Config.fileLoaderDirs.fonts +
                                '/vendor/' +
                                path.replace(/\\/g, '/').replace(/((.*(node_modules|bower_components))|fonts|font|assets)\//g, '') +
                                `?[hash:${length}]`
                        }
                    }
                })
            }

            // check if the rule is /\.(cur|ani)$/
            if ('.cur'.match(new RegExp(rule.test))) {
                forIn(rule.loaders, (loader) => {
                    if (loader.loader === 'file-loader') {
                        loader.options.name = `[name]${delimiter}[hash:${length}].[ext]`
                    }
                })
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
                compiler.hooks.done.tapAsync('done', (stats) => {
                    forIn(stats.compilation.assets, (asset, path) => {
                        if (combinedFiles[path]) {
                            delete stats.compilation.assets[path]
                            stats.compilation.assets[path.replace(/\\/g, '/')] = asset
                        }
                    })
                })
            }
        }()
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
     * TODO
     */
    exclude(key) {
        return this.options.exclude.some((e) => e == key)
    }

    /**
     * Add listener to account for hashing in filename(s) persisted to manifest.
     *
     * @return {this}
     */
    registerHashAssets() {
        Mix.listen('build', () => {
            if (!this.options) {
                this.register({})
            }

            let op_length = this.options.length
            const delimiter = escapeStringRegexp(this.getDelimiter())
            const removeHashFromKeyRegex = new RegExp(`${delimiter}([a-f0-9]{${op_length}})\\.([^.]+)$`, 'g')
            const removeHashFromKeyRegexWithMap = new RegExp(`${delimiter}([a-f0-9]{${op_length}})\\.([^.]+)\\.map$`, 'g')

            const file = File.find(`${Config.publicPath}/${Mix.manifest.name}`)
            let newJson = {}

            forIn(JSON.parse(file.read()), (value, key) => {
                key = key.endsWith('.map')
                    ? key.replace(removeHashFromKeyRegexWithMap, '.$2.map')
                    : key.replace(removeHashFromKeyRegex, '.$2')

                newJson[key] = value
            })

            file.write(collect(newJson)
                .sortKeys()
                .all()
            )
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
        forIn(Mix.tasks, (task) => {
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

laravel_mix.extend('versionHash', new VersionHash())
