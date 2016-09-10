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
  gulp.watch(config.imageFiles, ['drupal:copy-images']);
});

/**
 * Compiles Sass files.
 */
gulp.task('sass', function () {
  return gulp.src(config.sass.srcFiles)
    .pipe(sourcemaps.init())
    .pipe(sass(config.sass.options).on('error', sass.logError))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(config.sass.destDir))
    ;
});

/**
 * Task sequence to run when Sass files have changed.
 */
gulp.task('sass-change', function () {
  runSequence('sass', 'drupal:copy-css', 'pl:generate');
});

/**
 * Task sequence to run when StarterKit pattern files have changed.
 */
gulp.task('patterns-change', function () {
  runSequence('drupal:copy-patterns', 'pl:generate');
});

/**
 * Task sequence to run when Drupal theme templates have changed.
 */
gulp.task('templates-change', function () {
  runSequence('drush:cr', 'bs:reload');
});

/**
 * Copies CSS files from StarterKit to Drupal theme.
 */
gulp.task('drupal:copy-css', function () {
  if (isDirectory(config.drupal.cssDir)) {
    gulp.src([
      config.sass.destDir + '/**/*',
      '!' + config.sass.destDir + '/hidden.module.css',
      '!' + config.sass.destDir + '/normalize.css'
    ])
      .pipe(gulp.dest(config.drupal.cssDir))
      .pipe(browserSync.stream())
    ;
  }
  return;
});

/**
 * Copies pattern files from StarterKit to Drupal theme.
 */
gulp.task('drupal:copy-patterns', function () {
  if (isDirectory(config.drupal.patternsDir)) {
    gulp.src(config.patternsDir + '/**/*.html.twig')
      .pipe(flatten())
      .pipe(gulp.dest(config.drupal.patternsDir))
    ;
  }
  return;
});

/**
 * Copies image files from StarterKit to Drupal theme.
 */
gulp.task('drupal:copy-images', function () {
  if (isDirectory(config.drupal.imagesDir)) {
    gulp.src(config.imageFiles)
      .pipe(gulp.dest(config.drupal.imagesDir))
    ;
  }
  return;
});

/**
 * Task sequence to copy all StarterKit files used in Drupal theme to Drupal theme.
 */
gulp.task('drupal:copy', ['drupal:copy-css', 'drupal:copy-patterns', 'drupal:copy-images']);

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
 * Gulp default task.
 */
gulp.task('default', ['watch']);
