'use strict'

var babel = require('gulp-babel')
var sourcemaps = require('gulp-sourcemaps')
let gulp = require('gulp')
let runSequence = require('run-sequence')
let istanbul = require('gulp-istanbul')
let mocha = require('gulp-mocha')
let chalk = require('chalk')
let rimraf = require('rimraf')
let coveralls = require('gulp-coveralls')
let eslint = require('gulp-eslint')

let chai = require('chai')
global.expect = chai.expect


let paths = {
    libJsFiles: './lib/**/*.js',
    gulpfile: './gulpfile.js',
    specFiles: './test/spec/**/*.js',
    fixtureFiles: './test/fixtures/**/*.js'
}


gulp.task('dev', ['watch', 'validate'])

gulp.task('watch', () => {

    gulp.watch([
        paths.libJsFiles,
        paths.specFiles,
        paths.fixtureFiles
    ], [
        'validate'
    ])

    gulp.watch([
        paths.gulpfile
    ], [
        'lint'
    ])

})
gulp.task('default', ['test', 'browserify'], function() {})

gulp.task('compile', function(cb) {
    compile('lib/**/*.js', 'index.js', 'dist/lib', cb)
})

gulp.task('test0:compile', ['compile'], function(cb) {
    compile('test/**/*.js', 'test.js', 'dist/test', cb)
})

gulp.task('test0', ['compile', 'test0:compile'], function() {
    gulp.src('dist/test/unit/*.js', {
            read: false
        })
        .pipe(mocha({
            reporter: 'spec',
            ui: 'bdd',
        }))
})


gulp.task('validate', (done) => runSequence('lint', 'test', done))

gulp.task('lint', () => {

    return gulp.src([paths.libJsFiles, paths.gulpfile, paths.specFiles])
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError())

})

gulp.task('test', ['clean'], (done) => {

    let coverageVariable = `$$cov_${ new Date().getTime() }$$`

    gulp.src(paths.libJsFiles)
        .pipe(istanbul({
            coverageVariable
        }))
        .pipe(istanbul.hookRequire())
        .on('finish', () => {

            gulp.src(paths.specFiles)
                .pipe(mocha())
                .on('error', (err) => {
                    console.error(String(err))
                    console.error(chalk.bold.bgRed(' TESTS FAILED '))
                    done(new Error(' TESTS FAILED '))
                })
                .pipe(istanbul.writeReports({
                    reporters: ['lcov'],
                    coverageVariable
                }))
                .on('end', () => done())

        })

})

gulp.task('test-without-coverage', () => {
    return gulp.src(paths.specFiles)
        .pipe(mocha())
        .on('error', () => console.log(chalk.bold.bgRed(' TESTS FAILED ')))

})

gulp.task('clean', ['clean-coverage'])
gulp.task('clean-coverage', (done) => rimraf('./coverage', done))

gulp.task('ci', (done) => runSequence('validate', 'coveralls', 'test-without-coverage', done))
gulp.task('ci-no-cov', (done) => runSequence('validate', 'test-without-coverage', done))

gulp.task('coveralls', () => {
    return gulp.src('coverage/**/lcov.info')
        .pipe(coveralls())
})

function compile(src, name, dest, cb) {
    gulp.src(src)
        .pipe(sourcemaps.init())
        .pipe(babel())
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(dest))
        .on('end', function() {
            cb()
        })
}
