# API Console Community Cloud Edition

A version of API Console that works with Salesforce Lightning Components.

This is a bundler script that generates production ready sources for API Console. The sources has to be included into community cloud application separately.

## Usage

### Clone the project

```sh
git clone git@github.com:advanced-rest-client/lc-api-console.git
cd lc-api-console
```

### Install dependencies

```sh
npm i
```

### Create the bundle

```sh
npm run build
```

### Preview build

```
npm run start:build
```

The preview page won't show anything as components are not included into `components/index.html` page. However the point is to check DevTools console for any import errors.
The console should be empty.

## TODO

-   [ ] expand `rollup` configuration to create a bundle of non-module dependencies (CodeMirror, linters, etc)
