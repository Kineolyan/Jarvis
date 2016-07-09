function setUpModules() {
	if (setUpModules._init) { return; }

	// Sets the paths for absolute requires
	const path = require('path');
	process.env.NODE_PATH = [
					path.join(__dirname, 'lib')
	].join(':');
	// Resets the module paths
	require('module').Module._initPaths();
}
setUpModules._init = false;

const gulp = require('gulp');
const mocha = require('gulp-mocha');
var tsb = require('gulp-tsb');
const path = require('path');

function pathItem(name) {
	return function(children) {
		var items = [name];
		if (this instanceof Function) {
			items.unshift(this());
		}
		if (children) {
			items.push(children);
		}
		return path.join.apply(path, items);
	};
}

var PATHS = pathItem('.');
PATHS.bin = pathItem('bin');
PATHS.lib = pathItem('lib');
PATHS.dist = pathItem('dist');

function toFileUri(filePath) {
	var match = filePath.match(/^([a-z])\:(.*)$/i);

	if (match) {
		filePath = '/' + match[1].toUpperCase() + ':' + match[2];
	}

	return 'file://' + filePath.replace(/\\/g, '/');
}

gulp.task('build', function() {
	const rootDir = path.join(__dirname, 'lib');

  const opts = {
    target: 'es6',
    // declaration: false,
    // removeComments: true,
    moduleResolution: 'node',
    // noExternalResolve: true,
    declaration: false,
    module: 'commonjs',
    verbose: true,
    rootDir,
    sourceRoot: toFileUri(rootDir)
  };
  var ts = tsb.create(opts, null, null, err => console.error(err.toString()));
	return gulp.src([PATHS.lib('**/*.ts')])
		.pipe(ts())
		.pipe(gulp.dest(PATHS.dist()));
});

gulp.task('test', function() {
	setUpModules();
	const chai = require('chai');
	require('babel-register');

  chai.config.includeStack = true;

  return gulp.src([PATHS.dist('**/*.spec.js')], { read: false })
    .pipe(mocha({ ui: 'bdd', reporter: 'spec' }));
});

gulp.task('lint', function() {
	var eslint = require('gulp-eslint');

	return gulp.src([
			PATHS.bin('*.js'),
			PATHS.lib('**/*.js')//, `!${PATHS.lib('**/*.spec.js')}` // Skip specs
		])//.pipe(plumber({ errorHandler: notify.onError("test:lint : <%= error.message %>") }))
		.pipe(eslint())
		.pipe(eslint.formatEach('stylish'))
		.pipe(eslint.failOnError());
	//.pipe(plumber.stop());
});

gulp.task('git', ['test', 'lint']);
