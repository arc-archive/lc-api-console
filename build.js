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
    return fs.readdir(this.workingBuildOutput, {
      withFileTypes: true
    })
    .then((files) => {
      return Promise.all(files.map((item) => this._prepareLcScripts(item)));
    });
  }

  _prepareLcScripts(item) {
    if (!item.isDirectory()) {
      return Promise.resolve();
    }
    const base = path.join(this.workingBuildOutput, item.name);
    const entry = path.join(base, 'entrypoint.html');
    const depsScript = path.join(this.workingBuildOutput, item.name, 'head.js');
    let doc;
    return fs.readFile(entry, 'utf8')
    .then((content) => {
      doc = parse5.parse(content);
      const head = doc.childNodes[1].childNodes[0];
      const scripts = this._findScripts(head);
      const data = scripts.join('\n');
      return fs.writeFile(depsScript, data, 'utf8');
    })
    .catch((cause) => {
      console.error(cause);
      throw cause;
    });
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
