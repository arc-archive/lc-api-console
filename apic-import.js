/**
 * This file is to be included into the Exchange or other application
 * main page that serves the console so it can detect which build
 * to use.
 * ES6 enabled browsers will use es6 build and ES5 otherwise.
 */
(function() {
  'use strict';
  if (!window.apic) {
    window.apic = {};
  }
  if (!window.apic) {
    window.apic.basePath = '';
  }
  if (!window.apic.importId) {
    window.apic.importId = 1;
  }
  /**
   * Detects ES6 support by testing arrow functions.
   * It has to be executed in eval or otherwise the script would
   * throw syntax error and won't be executed at all.
   *
   * @return {Boolean} True if the browser is a moderm browser.
   */
  function detectEs6() {
    if (typeof Symbol === 'undefined') {
      return false;
    }
    try {
      eval('{const foo = (x)=>x+1;}');
      eval('class Foo {}');
    } catch (e) {
      return false;
    }
    return true;
  }
  function supportsStaticImport() {
    var script = document.createElement('script');
    return 'noModule' in script;
  }
  var isEsm = supportsStaticImport();
  var isEs6 = !isEsm && detectEs6();
  var moduleRoot = window.apic.basePath;
  if (moduleRoot[moduleRoot.length - 1] !== '/') {
    moduleRoot += '/';
  }
  if (isEsm) {
    moduleRoot += 'esm-bundle';
  } else if (isEs6) {
    moduleRoot += 'es6-bundle';
  } else {
    moduleRoot += 'es5-bundle';
  }
  // See https://github.com/Polymer/polymer/issues/5196#issuecomment-397723878
  function bundleLoaded() {
    window.setTimeout(function() {
      ['api-console', 'api-documentation', 'api-navigation', 'api-request-panel']
      .forEach(function(cmp) {
        var element = document.body.querySelector(cmp);
        if (!element || !element.updateStyles) {
          return;
        }
        element.updateStyles({});
      });
    }, 1);
  }

  var scripts = [
    moduleRoot + '/head.js'
  ];
  for (var i = 0; i < scripts.length; i++) {
    var src = scripts[i]
    var script = document.createElement('script');
    script.src = src;
    document.head.appendChild(script);
  }

  if (isEsm) {
    // API Console is included into the DOM via AMD module
    // in ES5 and ES6 bundles.
    // ESM bundle requires inluding APIC manually as a module
    var importFile = moduleRoot + '/api-console.js';
    var apicscript = document.createElement('script');
    apicscript.setAttribute('type', 'module');
    apicscript.setAttribute('src', importFile);
    apicscript.setAttribute('id', 'apic' + (window.apic.importId++));
    if (document.readyState === 'loading') {
      document.write(apicscript.outerHTML);
      var domLink = document.querySelector('#' + apicscript.id);
      domLink.onload = bundleLoaded;
    } else {
      document.head.appendChild(apicscript);
      apicscript.onload = bundleLoaded;
    }
  }
})();
