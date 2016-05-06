const gulp = require('gulp');
const mocha = require('gulp-mocha');

function setUpModules() {
  if (setUpModules._init) return;

  // Sets the paths for absolute requires
  const path = require('path');
  process.env.NODE_PATH = [
          path.join(__dirname, 'lib')
  ].join(':');
  // Resets the module paths
  require('module').Module._initPaths();
}
setUpModules._init = false;

gulp.task('build', function() {
  console.log('Nothing to build');
});

gulp.task('test', function() {
  setUpModules();
  const chai = require('chai');
  require('babel-register');

  chai.config.includeStact = true;
  global.expect = chai.expect;

  return gulp.src(['lib/**/*.spec.js'], { read: false })
    .pipe(mocha({ ui: 'bdd', reporter: 'spec' }));
});
