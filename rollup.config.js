// https://open-wc.org/building/building-rollup.html#configuration

import { createCompatibilityConfig } from '@open-wc/building-rollup';
import path from 'path';
import postcss from 'rollup-plugin-postcss'
import vendorConfig from './vendor-config.js';
import buildRewrite from './rollup-plugin-build-rewrite.js';

const config = createCompatibilityConfig({
  input: path.resolve(__dirname, 'components', 'index.html'),
  indexHTMLPlugin: {
    minify: {
      minifyJS: true,
      removeComments: true
    }
  }
});

export default [
  vendorConfig,
  {
    ...config[0],
    plugins: [
      ...config[0].plugins,
      postcss()
    ]
  },
  {
    ...config[1],
    plugins: [
      ...config[1].plugins,
      buildRewrite(),
      postcss()
    ]
  }
];
