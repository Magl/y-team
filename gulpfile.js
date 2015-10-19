'use strict';

// [Common] 
var gulp        = require('gulp'),
    sourcemaps  = require('gulp-sourcemaps'),
    rigger      = require('gulp-rigger'),
    browserSync = require("browser-sync"),
    cache       = require('gulp-cache'),
    sequence    = require('run-sequence'),
    gutil       = require('gulp-util'),
    del         = require('del'),
    rename      = require("gulp-rename");

// [CSS]
var less        = require('gulp-less'),
    prefixer    = require('gulp-autoprefixer'),
    csscomb     = require('gulp-csscomb'),
    cssmin      = require('gulp-minify-css');

// [JS]
var jshint      = require('gulp-jshint'),
    uglify      = require('gulp-uglify');
    
// [Images]
var imagemin    = require('gulp-imagemin'),
    pngquant    = require('imagemin-pngquant');
    
var reload      = browserSync.reload,
    dev         = false,
    prod        = false;


var path = {
  // Куда складывать готовые после сборки файлы
  dist: { 
    html:     'dist/',
    js:       'dist/js/',
    minJs:    'dist/js/min/',
    libJS:    'dist/lib/',
    style:    'dist/css/',
    minStyle: 'dist/css/min/',
    img:      'dist/img/',
    fonts:    'dist/fonts/'
  },

  // Пути откуда брать исходники
  src: { 
    html:  'src/*.html', 
    js:    'src/js/*.js',
    libJS: 'src/lib/*.js',
    style: 'src/styles/*.*',
    img:   'src/img/**/*.*', 
    fonts: 'src/fonts/**/*.*'
  },
  
  // За изменением каких файлов мы хотим наблюдать
  watch: { 
    html:  'src/**/*.html',   
    js:    'src/js/**/*.js',
    style: 'src/styles/**/*.*',
    img:   'src/img/**/*.*',
    fonts: 'src/fonts/**/*.*'
  }
};


// Конфигурация сервера
// -----------------------------------------------
var config = {
  server: {
    baseDir: "./dist"
  },

  host: 'localhost',
  port: 9000,
  logPrefix: "Web machine"
};


// Очиска данных в папках
// -----------------------------------------------
gulp.task('cleanFonts', function (cb) {
  del( [path.dist.fonts], cb );
});

gulp.task('cleanJS', function (cb) {
  del( [path.dist.js], cb );
});

gulp.task('cleanStyle', function (cb) {
  del( [path.dist.style], cb );
});

gulp.task('cleanImage', function (cb) {
  del( [path.dist.img], cb );
});


// Основные задачи
// -----------------------------------------------
gulp.task('server', function () {
  browserSync(config);  
});


// [HTML tasks]
gulp.task('html', function () {
  return gulp.src( path.src.html )
        .pipe( rigger() ) 
        .pipe( gulp.dest(path.dist.html) ) 
        .pipe( reload({stream: true}) ); 
});


// [Fonts tasks]
gulp.task('fonts', ['cleanFonts'], function() {
  return gulp.src( path.src.fonts )
        .pipe( gulp.dest(path.dist.fonts) )
        .pipe( reload({stream: true}) ); 
});


// [JS tasks]
gulp.task('libJS', function() {
  return gulp.src( path.src.libJS )
        .pipe( uglify() )
        .pipe( gulp.dest(path.dist.libJS) )
        .pipe( reload({stream: true}) ); 
});

gulp.task('jshint', function() {
  return gulp.src( path.src.js )
        .pipe( jshint() )
        .pipe( jshint.reporter('jshint-stylish') );
});

gulp.task('js', ['cleanJS','jshint'], function () {
  return gulp.src( path.src.js )
        .pipe( !dev && !prod ? sourcemaps.init() : gutil.noop() )
        .pipe( rigger() )
        .pipe( !dev && !prod ? sourcemaps.write() : gutil.noop() )
        .pipe( !prod ? gulp.dest(path.dist.js) : gutil.noop() )

        // Сохраняем минифицированные файлы для dev сборки в min/
        .pipe( dev || prod ? uglify() : gutil.noop() )
        .pipe( dev ? rename({extname: '.min.js'}) : gutil.noop() )
        .pipe( prod ? gulp.dest(path.dist.js) : gutil.noop() )
        .pipe( dev ? gulp.dest(path.dist.minJs) : gutil.noop() )
        .pipe( reload({stream: true}) );
});


// [Styles tasks]
gulp.task('style', ['cleanStyle'], function () {
  return gulp.src( path.src.style )
        .pipe( !dev && !prod ? sourcemaps.init() : gutil.noop() )
        .pipe( less() )
        .pipe( dev ? csscomb() : gutil.noop() )
        .pipe( prefixer() )
        .pipe( !dev && !prod ? sourcemaps.write() : gutil.noop() )
        .pipe( !prod ? gulp.dest(path.dist.style) : gutil.noop() )
        
        // Сохраняем минифицированные файлы для dev сборки в min/
        .pipe( dev || prod ? cssmin() : gutil.noop() )
        .pipe( dev ? rename({extname: '.min.css'}) : gutil.noop() )
        .pipe( prod ? gulp.dest(path.dist.style) : gutil.noop() )
        .pipe( dev ? gulp.dest(path.dist.minStyle) : gutil.noop() )
        .pipe( reload({stream: true}) ); 
});


// [Image tasks]
gulp.task('image', ['cleanImage'], function () {
  return gulp.src( path.src.img ) 
        .pipe( prod || dev ? cache( imagemin({
          progressive: true,
          svgoPlugins: [{removeViewBox: false}],
          use: [pngquant()],
          interlaced: true
         })) : gutil.noop())
        .pipe( gulp.dest(path.dist.img) )
        .pipe( reload({stream: true}) );
});


// Отслеживание изменений
// -----------------------------------------------
gulp.task('watch', function(){
  gulp.watch( path.watch.html, ['html'] );
  gulp.watch( path.watch.style, ['style'] );
  gulp.watch( path.watch.js, ['js'] );
  gulp.watch( path.watch.image, ['image'] );
  gulp.watch( path.watch.fonts, ['fonts'] );
});


// Default сборка
// -----------------------------------------------
gulp.task('build', ['html', 'libJS', 'js', 'style', 'fonts', 'image']);
gulp.task('default', ['build', 'server', 'watch']);

// Production сборка
// -----------------------------------------------
gulp.task('setProduction', function () {
  prod = true; 
});

gulp.task('prod', function () {
  // используем run-sequence module, чтобы 
  // setProduction запустилось раньше остальных задач
  sequence('setProduction', ['build', 'server', 'watch'])
});

// Dev сборка без минификации файлов и без sourcemaps
// -----------------------------------------------
gulp.task('setDevelop', function () {
  dev = true;
});

gulp.task('dev', function () {
  // сборка для тестирования на dev (без минификации)
  sequence('setDevelop', ['build', 'server', 'watch'])
});