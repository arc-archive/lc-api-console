// https://open-wc.org/building/building-rollup.html#configuration
import { createCompatibilityConfig } from '@open-wc/building-rollup';
import cpy from 'rollup-plugin-cpy';

// if you need to support IE11 use "modern-and-legacy-config" instead.
// import { createCompatibilityConfig } from '@open-wc/building-rollup';
// export default createCompatibilityConfig({ input: './index.html' });

const config = createCompatibilityConfig({
  input: './components/index.html',
});

export default [
  {
    ...config[0],
    plugins: [
      ...config[0].plugins,
      cpy({
        files: [
          './components/node_modules/jsonlint/lib/jsonlint.js',
          './components/node_modules/codemirror/lib/codemirror.js',
          './components/node_modules/codemirror/addon/mode/loadmode.js',
          './components/node_modules/codemirror/mode/meta.js',
          './components/node_modules/codemirror/mode/javascript/javascript.js',
          './components/node_modules/codemirror/mode/xml/xml.js',
          './components/node_modules/codemirror/mode/htmlmixed/htmlmixed.js',
          './components/node_modules/codemirror/addon/lint/lint.js',
          './components/node_modules/codemirror/addon/lint/json-lint.js',
          './components/node_modules/cryptojslib/components/core.js',
          './components/node_modules/cryptojslib/rollups/sha1.js',
          './components/node_modules/cryptojslib/components/enc-base64-min.js',
          './components/node_modules/cryptojslib/rollups/md5.js',
          './components/node_modules/cryptojslib/rollups/hmac-sha1.js',
          './components/node_modules/jsrsasign/lib/jsrsasign-rsa-min.js',
          './components/node_modules/web-animations-js/web-animations-next.min.js'
        ],
        dest: 'dist',
        options: {
          // parents makes sure to preserve the original folder structure
          parents: true
        }
      }),
    ],
  },

  // leave the second config untouched
  config[1],
];
