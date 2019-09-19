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

### Using the bundle

The example of how to import bundle into your web application is in `demo.html` file. In essence you need to import 2 main files:

```html
<script src="dist/vendor.js"></script>
<script src="dist/apic-import.js"></script>
```

The `vendor.js` file contains bundled CodeMirror and other dynamic depndencies for API console. The `apic-import.js` file takes care of import APIC sources into the page. It decides which files should be included depdning on API availability in current browser.

Once the sources are included you can use API console. See API Console repository page for documentation.

#### API Console Element

Used by API Designeer

```html
<api-console amf="..." selectedShape="..." selectedSchapeType="..."></api-console>
```

#### API Console Application

Used by APIKit

```html
<body>
  <api-console-app></api-console-app>
  <script src="app.js"></script>
  <!-- See https://github.com/mulesoft/api-console/tree/6.0.0-preview/demo/standalone -->
</body>
```

### API Components

Used by Exchange

```html
<body>
  <api-navigation amf="..."></api-navigation>
  <api-documentation amf="..."></api-documentation>
  <api-request-panel amf="..."></api-request-panel>
</body>
```

## TODO

-   [x] expand `rollup` configuration to create a bundle of non-module dependencies (CodeMirror, linters, etc)
-   [ ] build own rollup plugin based on `webpack-index-html-plugin` to avoid rewriting generated index file to a JS import
