# API Console Community Cloud Edition

A version of API Console that works with Salesforce Lightning Components.
This is a bundler script that generates production ready sources for the console.

## Usage

```sh
git clone git@github.com:advanced-rest-client/lc-api-console.git
cd lc-api-console
npm i
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
  <script src="https://cdn.domain.com/lc-apic/apic-import.js"></script>
</head>
<body>
  <api-console></api-console>
</body>
```
