const mergeStream = require('merge-stream');
const {PolymerProject, HtmlSplitter, forkStream, getOptimizeStreams} = require('polymer-build');
const path = require('path');
const fs = require('fs-extra');
const {dest} = require('vinyl-fs');
const parse5 = require('parse5');
// const UglifyJS = require('uglify-js');

class LcBuilder {
  get workingBuildOutput() {
    return 'build';
  }

  waitFor(stream) {
    return new Promise((resolve, reject) => {
      stream.on('end', resolve);
      stream.on('error', reject);
    });
  }

  build() {
    return fs.remove(this.workingBuildOutput)
    .then(() => fs.ensureDir(this.workingBuildOutput))
    .then(() => this.polymerBuild())
    .then(() => this.prepareLcSources())
    // return this.prepareLcSources()
    .then(() => {
      console.log('Bundled!');
    })
    .catch((cause) => {
      console.error(cause);
    });
  }

  polymerBuild() {
    if (!this.bundleIndex) {
      this.bundleIndex = 0;
    }
    const polymerProject = new PolymerProject(require('./polymer.json'));
    if (!this.bundleIndex) {
      const size = polymerProject.config.builds.length;
      console.info(`Found ${size} build configurations.`);
    }
    const conf = polymerProject.config.builds[this.bundleIndex];
    if (!conf) {
      return Promise.resolve();
    }
    return this.buildBundle(polymerProject, conf)
    .then(() => {
      this.bundleIndex++;
      return this.polymerBuild();
    });
  }

  /**
   * Pipes streams together
   * @param {Array<ReadableStream>} streams
   * @return {ReadableStream}
   */
  pipeStreams(streams) {
    return Array.prototype.concat.apply([], streams)
    .reduce((a, b) => a.pipe(b));
  }
  /**
   * Performs the build.
   *
   * @param {Object} polymerProject A PolymerProject instance.
   * @param {Object} bundle Polymer bundler configuration
   * @return {Promise}
   */
  buildBundle(polymerProject, bundle) {
    const buildName = bundle.name;
    console.info(`(${buildName}) Analyzing...`);
    const startTime = Date.now();
    const sourcesStream = forkStream(polymerProject.sources());
    const depsStream = forkStream(polymerProject.dependencies());
    let buildStream = mergeStream(sourcesStream, depsStream);
    if (buildName === 'es5-bundle') {
      buildStream = buildStream.pipe(polymerProject.addCustomElementsEs5Adapter());
    }
    const bundlerOptions = {
      rewriteUrlsInTemplates: false
    };
    Object.assign(bundlerOptions, bundle);
    buildStream = buildStream.pipe(polymerProject.bundler(bundlerOptions));
    const htmlSplitter = new HtmlSplitter();
    buildStream = this.pipeStreams([
      buildStream,
      htmlSplitter.split(),
      getOptimizeStreams({
        html: bundle.html,
        css: bundle.css,
        js: Object.assign({
          moduleResolution: polymerProject.config.moduleResolution,
        }, bundle.js),
        entrypointPath: polymerProject.config.entrypoint,
        rootDir: polymerProject.config.root,
      }),
      htmlSplitter.rejoin()
    ]);
    buildStream.once('data', () => {
      console.info(`(${buildName}) Building...`);
    });
    buildStream.on('end', () => {
      console.info(`(${buildName}) Build ready.`);
    });
    // if (bundle.basePath) {
    //   let basePath = bundle.basePath === true ? buildName : bundle.basePath;
    //   if (!basePath.startsWith('/')) {
    //     basePath = '/' + basePath;
    //   }
    //   if (!basePath.endsWith('/')) {
    //     basePath = basePath + '/';
    //   }
    //   buildStream = buildStream.pipe(polymerProject.updateBaseTag(basePath));
    // }
    const bundleDestination = path.join(this.workingBuildOutput, buildName);
    buildStream = buildStream.pipe(dest(bundleDestination));
    return this.waitFor(buildStream)
    .then(() => {
      const time = (Date.now() - startTime) / 1000;
      console.info(`(${buildName}) Build complete in ${time} seconds`);
    });
  }

  prepareLcSources() {
    let libs;
    return this.readLibraries()
    .then((data) => {
      libs = data;
      return fs.readdir(this.workingBuildOutput, {
        withFileTypes: true
      });
    })
    .then((files) => {
      return Promise.all(files.map((item) => this._prepareLcScripts(item, libs)));
    });
  }

  _prepareLcScripts(item, prefix) {
    console.log('aaaaaaaaa');
    console.log(prefix);
    if (!item.isDirectory()) {
      return Promise.resolve();
    }
    const base = path.join(this.workingBuildOutput, item.name);
    const entry = path.join(base, 'entrypoint.html');
    const apicFile = path.join(this.workingBuildOutput, item.name, 'api-console.js');
    let doc;
    return fs.readFile(entry, 'utf8')
    .then((content) => {
      doc = parse5.parse(content);
      const head = doc.childNodes[1].childNodes[0];
      const scripts = this._findScripts(head);
      if (!scripts.length) {
        return;
      }
      const data = fs.readFileSync(apicFile);
      const fd = fs.openSync(apicFile, 'w+');
      const insert = Buffer.from(scripts.join('\n'));
      const insert2 = Buffer.from(prefix);
      fs.writeSync(fd, insert, 0, insert.length, 0);
      fs.writeSync(fd, insert2, 0, insert2.length, insert.length);
      fs.writeSync(fd, data, 0, data.length, insert.length + insert2.length);
      return fs.close(fd);
    })
    .catch((cause) => {
      console.error(cause);
      throw cause;
    });
  }

  readLibraries() {
    const libs = [
      'node_modules/jsonlint/lib/jsonlint.js',
      'node_modules/codemirror/lib/codemirror.js',
      'node_modules/codemirror/addon/mode/loadmode.js',
      'node_modules/codemirror/mode/meta.js',
      'node_modules/codemirror/mode/javascript/javascript.js',
      'node_modules/codemirror/mode/xml/xml.js',
      'node_modules/codemirror/mode/htmlmixed/htmlmixed.js',
      'node_modules/codemirror/addon/lint/lint.js',
      'node_modules/codemirror/addon/lint/json-lint.js',
      'node_modules/@advanced-rest-client/code-mirror-hint/headers-addon.js',
      'node_modules/@advanced-rest-client/code-mirror-hint/show-hint.js',
      'node_modules/@advanced-rest-client/code-mirror-hint/hint-http-headers.js',
      'node_modules/cryptojslib/components/core.js',
      'node_modules/cryptojslib/rollups/sha1.js',
      'node_modules/cryptojslib/components/enc-base64-min.js',
      'node_modules/cryptojslib/rollups/md5.js',
      'node_modules/cryptojslib/rollups/hmac-sha1.js',
      'node_modules/jsrsasign/lib/jsrsasign-rsa-min.js',
      'node_modules/web-animations-js/web-animations-next.min.js',
    ];
    const data = [];
    for (let i = 0; i < libs.length; i++) {
      const code = fs.readFileSync(libs[i], 'utf8');
      data[data.length] = code;
    }
    return data.join('\n');
  }

  /**
   * Finds script nodes without "src" attribute and placed before web components
   * polyfill.
   * @param {Object} head Head node AST
   * @return {Array<String>}
   */
  _findScripts(head) {
    const result = [];
    for (let i = 0; i < head.childNodes.length; i++) {
      const item = head.childNodes[i];
      if (item.nodeName !== 'script') {
        continue;
      }
      const src = this._getSrcAttr(item.attrs);
      if (src) {
        if (src === 'api-console.js') {
          continue;
        }
        // const result = UglifyJS.minify(fs.readFileSync(src, 'utf8'), {
        //   mangle: false
        // });
        // result[result.length] = `/* ${src} */ ${result.code}`;
        const code = fs.readFileSync(src, 'utf8');
        result[result.length] = `/* ${src} */ ${code}`;
      } else {
        const txtNode = item.childNodes[0].value;
        if (txtNode === 'define([\'api-console.js\']);') {
          continue;
        }
        result[result.length] = txtNode;
      }
    }
    return result;
  }

  _getSrcAttr(attrs) {
    for (let i = 0; i < attrs.length; i++) {
      if (attrs[i].name === 'src') {
        return attrs[i].value;
      }
    }
  }
}

new LcBuilder().build();
