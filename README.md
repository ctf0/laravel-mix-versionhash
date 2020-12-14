<h1 align="center">
    Laravel Mix Versionhash
    <br>
    <a href="https://www.npmjs.com/package/laravel-mix-versionhash"><img src="https://img.shields.io/npm/v/laravel-mix-versionhash.svg?style=for-the-badge" alt="npm" /></a> <a href="https://www.npmjs.com/package/laravel-mix-versionhash"><img src="https://img.shields.io/npm/dt/laravel-mix-versionhash.svg?style=for-the-badge" alt="npm" /></a>
</h1>

Auto append hash to file instead of using virtual one [Read More](https://github.com/JeffreyWay/laravel-mix/issues/1022)


### :exclamation: Looking For Maintainers :exclamation: 
### as i dont have enough time to work on the package anymore, so anyone wants to join forces plz get in-touch, thanks.

<br>

## Installation

```bash
npm install laravel-mix-versionhash --save
```

## Usage

```js
require('laravel-mix-versionhash')

mix.versionHash();
```

- for removing old files use [Clean for WebPack](https://github.com/johnagan/clean-webpack-plugin)

## Options

|   option  |  type  | default |                                            description                                            |
|-----------|--------|---------|---------------------------------------------------------------------------------------------------|
| length    | int    | `6`     | the hash string length                                                                            |
| delimiter | string | `'.'`   | the delimiter for filename and hash, <br> note that anything other than `. - _` will be removed |
