# laravel-mix-versionhash

[![npm](https://img.shields.io/npm/v/laravel-mix-versionhash.svg)](https://www.npmjs.com/package/laravel-mix-versionhash) [![npm](https://img.shields.io/npm/dt/laravel-mix-versionhash.svg)](https://www.npmjs.com/package/laravel-mix-versionhash)

Auto append hash to file instead of using virtual one [Read More](https://github.com/JeffreyWay/laravel-mix/issues/1022)

## Installation

```bash
npm install laravel-mix-versionhash --save
```

## Usage

```js
require('laravel-mix-versionhash')

mix.versionHash();
```

## Options

|   option  |  type  | default |                                            description                                            |
|-----------|--------|---------|---------------------------------------------------------------------------------------------------|
| length    | int    | `6`     | the hash string length                                                                            |
| delimiter | string | `'.'`   | the delimiter for filename and hash, <br> note that anything other than `., -, _` will be removed |
