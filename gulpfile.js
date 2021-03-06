// Project
var project_name    = 'Responsive helper';
var project_version = 'v1.0.0';
var project_repo    = 'https://github.com/Vlasterx/responsive-helper.git';

/***********
 * PLUGINS *
 ***********/

var gulp            = require('gulp'),                          // Task runner
    replace         = require('gulp-replace'),                  // Replaces strings in files
    sass            = require('gulp-sass'),                     // Converts SASS to CSS
    rename          = require('gulp-rename'),                   // Renames output file
    prefix          = require('gulp-autoprefixer'),             // Autoprefixes CSS
    insert          = require('gulp-insert'),                   // Inserts text in files 
    clc             = require('cli-color'),                     // Adds colors to console logs
    gcmq            = require('gulp-group-css-media-queries'),  // Groups styles under fewer media queries
    cleancss        = require('gulp-cleancss'),                 // Minifies CSS - used in combination with cssmin
    cssmin          = require('gulp-cssmin'),                   // Minifies CSS - best minification results
    jsonmin         = require('gulp-jsonmin'),                  // Minifies JSON
    del             = require('del'),                           // Deletes files
    plumberNotifier = require('gulp-plumber-notifier'),         // Reports compile errors through OS messages
    runSequence     = require('run-sequence').use(gulp);        // Runs tasks in order

// Colored log messages
var red     = clc.red.bold,
    yellow  = clc.yellow,
    blue    = clc.blue,
    blue2   = clc.blue.bold,
    green   = clc.green,
    cyan    = clc.cyan;

// Browsers to target when prefixing CSS.
var COMPATIBILITY = ['>1%', 'last 3 versions'];

// Files to delete from public folder before GULP task starts
var cleanup = [
  "css"
];



/***********
 * LIBSASS *
 ***********/

// SASS to CSS
gulp.task('scss', function () {
  return gulp.src(["scss/**/*.scss", "!scss/**/_*.scss"])
    .pipe(plumberNotifier())
    .pipe(sass({
      errLogToConsole: true,
      outputStyle: 'compact'
    }))
    .pipe(prefix(COMPATIBILITY))
    .pipe(cssmin())
    .pipe(gcmq())
    .pipe(cleancss({
        keepBreaks: true,
        keepSpecialComments: 1,
        debug: true,
        semanticMerging: true
      },
      function (details) {
        console.log(details.name + ': ' + details.stats.originalSize);
        console.log(details.name + ': ' + details.stats.minifiedSize);
      }))
    .pipe(gulp.dest("css/"))
    .pipe(cssmin())
    .pipe(rename(function (path) {
      path.extname = '.min.css';
    }))  
    .pipe(gulp.dest("css/"));
});




/****************************************************** 
 * MEDIA CONFIGURATION FILE                           *
 * -------------------------------------------------- *
 * This task will convert JSON to SASS map file       *
 * so that we can share variables between SCSS and JS *
 ******************************************************/

gulp.task('sassMap', function () {
  console.log(blue('nx: Converting `config_media.json` => sass map `_map_media.scss`'));
  
  return gulp.src(['scss/config_media.json'])
    .pipe(replace(/\{/g, '('))
    .pipe(replace(/\}/g, ')'))
    .pipe(replace(/\"/g, ''))
    .pipe(insert.prepend("$config : "))
    .pipe(insert.append("; \n"))
    .pipe(insert.append("$resolutions: map-get($config, resolutions) !global;"))
    .pipe(insert.prepend("// This is auto-generated file from `scss/config_media.json`. Do not change it directly! \n"))
    .pipe(rename("_map_media.scss"))
    .pipe(gulp.dest('scss/generated'));
});

gulp.task('jsonMin', function () {
  gulp.src(['scss/config_media.json'])
    .pipe(plumberNotifier())
    .pipe(jsonmin())
    .pipe(gulp.dest('css/'));
});

// Create variables
gulp.task('createMap', function(){ 
    return runSequence('sassMap', 'jsonMin');
});


// DONE message
gulp.task('done', function() {
  console.log(cyan('-------------------------------------------------------------------------------'));
  console.log(blue(project_name+'\n'));
  console.log(cyan('> Project home:  '+project_repo));
  console.log(cyan('> Author home:   https://www.bitersen.com'));
  console.log(cyan('> Author blog:   https://medium.com/@vlasterx\n'));
  console.log(blue(':) Thank you for using '+project_name+' '+project_version));
  console.log(cyan('-------------------------------------------------------------------------------'));
})


// Cleanup
// -------
gulp.task('cleanUp', function () {
  return del(cleanup);
});


/**************
 * WATCH TASK *
 **************/

gulp.task('watching', function () {
  return runSequence('sassMap', 'jsonMin', 'scss');
});


// Watch
gulp.task('watch', ['watching'], function () {
  // Watch media config file
  gulp.watch(["scss/config_media.json"], ['createMap'])
    .on('change', function (event) {
      console.log(blue2('[' + event.type + '] ' + event.path));
    });
  
  // Watch SCSS files
  gulp.watch(["scss/**/*.scss", "!scss/**/_*.scss"], ['scss'])
    .on('change', function (event) {
      console.log(blue2('[' + event.type + '] ' + event.path));
    });
});



/********
 * GULP *
 ********/

// Task list 
gulp.task('final', function () {
  runSequence('cleanUp', 'createMap', 'scss', 'done');
});


// Default task
gulp.task('default', ['final']);