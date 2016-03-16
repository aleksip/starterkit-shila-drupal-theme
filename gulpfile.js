'use strict';

var config      = require('./config.json');
var gulp        = require('gulp');
var run         = require('gulp-run');
var runSequence = require('run-sequence');
var sass        = require('gulp-sass');
var sourcemaps  = require('gulp-sourcemaps');
var browserSync = require('browser-sync').create();
var fs          = require('fs');
var flatten     = require('gulp-flatten');

function isDirectory(dir) {
    try {
        return fs.statSync(dir).isDirectory();
    }
    catch (err) {
        return false;
    }
}

gulp.task('watch', ['sass-change'], function() {
    browserSync.init({
        proxy: {
            target: "localhost:8080",
            reqHeaders: function(config) {
                return {
                    "host": "www.aleksip.dev"
                }
            }
        }
    });
    gulp.watch(config.sass.srcFiles, ['sass-change']);
    gulp.watch(config.patternsDir + '/**/*', ['patterns-change']);
    gulp.watch(config.imageFiles, ['drupal:copy-images']);
    if (isDirectory(config.drupal.templatesDir)) {
        gulp.watch(
            config.drupal.templatesDir + '/**/*.html.twig',
            ['templates-change']
        );
    }
});

gulp.task('sass', function() {
    return gulp.src(config.sass.srcFiles)
        .pipe(sourcemaps.init())
        .pipe(sass(config.sass.options).on('error', sass.logError))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest(config.sass.destDir))
    ;
});

gulp.task('sass-change', function() {
    runSequence('sass', 'drupal:copy-css', 'pl:generate');
});

gulp.task('patterns-change', function() {
    runSequence('drupal:copy-patterns', 'pl:generate');
});

gulp.task('templates-change', function() {
    runSequence('drush:cr', 'bs:reload');
});

gulp.task('drupal:copy-css', function() {
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

gulp.task('drupal:copy-patterns', function() {
    if (isDirectory(config.drupal.patternsDir)) {
        gulp.src(config.patternsDir + '/**/*.html.twig')
            .pipe(flatten())
            .pipe(gulp.dest(config.drupal.patternsDir))
        ;
    }
    return;
});

gulp.task('drupal:copy-images', function() {
    if (isDirectory(config.drupal.imagesDir)) {
        gulp.src(config.imageFiles)
            .pipe(gulp.dest(config.drupal.imagesDir))
        ;
    }
    return;
});

gulp.task('drupal:copy', ['drupal:copy-css', 'drupal:copy-patterns', 'drupal:copy-images']);

gulp.task('pl:generate', function() {
    if (isDirectory(config.patternLab.dir)) {
        run('php ' + config.patternLab.dir + '/core/console --generate').exec();
    }
});

gulp.task('drush:cr', function() {
    return run('drush ' + config.drush.alias + ' cr').exec();
});

gulp.task('bs:reload', function () {
    browserSync.reload();
});

gulp.task('default', ['watch']);
