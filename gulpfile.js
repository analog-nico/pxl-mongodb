'use strict'

const gulp = require('gulp')
const jest = require('jest')
const _ = require('lodash')
const path = require('path')


const sources = {
    libJsFiles: ['./index.js', './lib/**/*.js'],
    gulpfile: './gulpfile.js',
    specFiles: './test/spec/**/*.js',
    specRootDir: './test/spec/', // Root dir instead of a glob
    fixtureFiles: './test/fixtures/**/*.js'
}


function generateTest(withCoverage = false) {

    return async function testServer() {

        let rootDir = process.cwd()

        let options = {
            rootDir,
            roots: [
                path.join(rootDir, sources.specRootDir)
            ],
            testMatch: ['<rootDir>/test/**/*.js']
        }
        if (withCoverage) {
            options.coverage = true
            options.coverageDirectory = path.join(rootDir, './coverage')
        }

        let results = await jest.runCLI(
            options,
            [rootDir]
        )

        if (!results.results.success) {
            throw new Error('Tests failed')
        }

    }

}

let testWithoutCoverage = generateTest(false)
let testWithCoverage = generateTest(true)


function watch() {

    gulp.watch(_.flatten([
        sources.libJsFiles,
        sources.specFiles,
        sources.fixtureFiles
    ]), gulp.series(testWithCoverage))

}


module.exports = {
    dev: gulp.series(testWithCoverage, watch),
    testDebug: gulp.series(testWithoutCoverage),
    ci: gulp.series(testWithoutCoverage)
}
