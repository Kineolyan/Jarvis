// From https://github.com/facebook/jest/blob/master/examples/typescript/preprocessor.js

const tsc = require('typescript');
const tsConfig = require('../tsconfig.json');

module.exports = {
  process(src, path) {
    if (/\.tsx?$/.test(path)) {
      return tsc.transpile(
        src,
        tsConfig.compilerOptions,
        path,
        []
      );
    }
    return src;
  },
};