# laravel-mix-versionHash

auto append hash to file instead of using virtual one [Read More](https://github.com/JeffreyWay/laravel-mix/issues/1022#issuecomment-382274649)

## Installation

```bash
npm install laravel-mix-versionhash --save
```

## Usage

```js
require('laravel-mix-versionhash')

mix.versionHash();
```

### Options

| option | type | default |      description       |
|--------|------|---------|------------------------|
| length | int  |    6    | the hash string length |
