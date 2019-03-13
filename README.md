# API Console Community Cloud Edition

A version of API Console that works with Salesforce Lightning Components.
This is a bundler script that generates production ready sources for the console.

## Usage

**Use Yarn!** Npm is not adjusted to handle web components, yet developer community and browser vendors opted to use ES modules as they are right now.
Because components needs flat structure but rest of node modules requires nested structure, I suggest to install dependencies using Yarn. Npm most likely produce unexpected results.

```sh
git clone git@github.com:advanced-rest-client/lc-api-console.git
cd lc-api-console
yarn i
npm run build
```

It may take a minute to create the bundles.

The output is in `build/` directory.

To dynamically load API console sourced depending on browser capabilities,
use `apic-import.js` script. It will detect which bundle to use and will use
regular `<script>` tag to import the sources.
Set `window.apic.basePath` property to point to a location of the bundles.
By default it is relative to current location.

```html
<head>
  <script>
  const window.apic = {
    basePath: 'https://cdn.domain.com/lc-apic/'
  };
  </script>
  <script src="https://cdn.domain.com/lc-apic/build/es6prod/api-console.js"></script>
</head>
<body>
  <api-navigation></api-navigation>
  <api-documentation></api-documentation>
  <api-request-panel></api-request-panel>
</body>
