/* eslint-env node */

'use strict';

// Configuration.

var config = {};
config.browserSync = {
  proxyTarget: 'localhost:8080',
  proxyReqHeaders: {
    host: 'www.shila.dev'
  }
};
config.drush = {
  alias: '@local.d8.shila'
};
config.sass = {
  srcFiles: [
    './dist/sass/**/*.scss',
    './dist/_patterns/**/*.scss'
  ],
  options: {
    includePaths: [
      './dist/sass',
      './node_modules/bourbon/app/assets/stylesheets',
      './node_modules/breakpoint-sass/stylesheets',
      './node_modules/compass-mixins/lib',
      './node_modules/neat/app/assets/stylesheets',
      './node_modules/sass-toolkit/stylesheets',
      './node_modules/sassy-maps/sass',
      './node_modules/singularitygs/stylesheets'
    ],
    outputStyle: 'expanded'
  },
  destDir: './dist/css'
};
config.patternsDir = './dist/_patterns';
config.imageFiles = './dist/images/**/*';
config.patternLab = {
  dir: '../pattern-lab'
};
config.drupal = {
  cssDir: '../css',
  imagesDir: '../images',
  patternsDir: '../templates/patterns',
  templatesDir: '../templates'
};

// Load Gulp and other tools.

var gulp = require('gulp');
var run = require('gulp-run');
var runSequence = require('run-sequence');
var sass = require('gulp-sass');
var sourcemaps = require('gulp-sourcemaps');
var browserSync = require('browser-sync').create();
var fs = require('fs');
var flatten = require('gulp-flatten');
var sassLint = require('gulp-sass-lint');

// Helper functions.

function isDirectory(dir) {
  try {
    return fs.statSync(dir).isDirectory();
  }
  catch (err) {
    return false;
  }
}

// Gulp tasks.

/**
 * Sets up BrowserSync and watchers.
 */
gulp.task('watch', ['sass-change'], function () {
  browserSync.init({
    proxy: {
      target: config.browserSync.proxyTarget,
      reqHeaders: config.browserSync.proxyReqHeaders
    }
  });
  gulp.watch(config.sass.srcFiles, ['sass-change']);
  gulp.watch(config.patternsDir + '/**/*.twig', ['patterns-change']);
});

/**
 * Compiles Sass files.
 */
gulp.task('sass', function () {
  return gulp.src(config.sass.srcFiles)
    .pipe(sourcemaps.init())
    .pipe(sass(config.sass.options).on('error', sass.logError))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest(config.sass.destDir))
    ;
});

/**
 * Task sequence to run when Sass files have changed.
 */
gulp.task('sass-change', function () {
  runSequence('sass', 'pl:generate');
});

/**
 * Task sequence to run when StarterKit pattern files have changed.
 */
gulp.task('patterns-change', function () {
  runSequence('pl:generate');
});

/**
 * Task sequence to run when Drupal theme templates have changed.
 */
gulp.task('templates-change', function () {
  runSequence('drush:cr', 'bs:reload');
});

/**
 * Generates Pattern Lab front-end.
 */
gulp.task('pl:generate', function () {
  if (isDirectory(config.patternLab.dir)) {
    run('php ' + config.patternLab.dir + '/core/console --generate').exec();
  }
});

/**
 * Runs drush cr.
 */
gulp.task('drush:cr', function () {
  return run('drush ' + config.drush.alias + ' cr').exec();
});

/**
 * Calls BrowserSync reload.
 */
gulp.task('bs:reload', function () {
  browserSync.reload();
});

/**
 * Lints Sass files.
 */
gulp.task('lint:sass', function () {
  return gulp.src(config.sass.srcFiles)
    .pipe(sassLint())
    .pipe(sassLint.format());
});

/**
 * Gulp default task.
 */
gulp.task('default', ['watch']);
