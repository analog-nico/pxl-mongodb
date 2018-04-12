# pxl-mongodb

Access counting for any Express-served url - e.g. for a [tracking pixel](https://en.wikipedia.org/wiki/Web_beacon) in emails

[![Build Status](https://img.shields.io/travis/analog-nico/pxl-mongodb.svg?style=flat-square)](https://travis-ci.org/analog-nico/pxl-mongodb)
[![Coverage Status](https://img.shields.io/coveralls/analog-nico/pxl-mongodb.svg?style=flat-square)](https://coveralls.io/r/analog-nico/pxl-mongodb)
[![Dependency Status](https://img.shields.io/david/analog-nico/pxl-mongodb.svg?style=flat-square)](https://david-dm.org/analog-nico/pxl-mongodb)
[![Known Vulnerabilities](https://snyk.io/test/npm/pxl-mongodb/badge.svg?style=flat-square)](https://snyk.io/test/npm/pxl-mongodb)

## Overview

`pxl-mongodb` is an extension of the [`pxl` library](https://github.com/analog-nico/pxl) that adds a persistence layer for mongoDB.

Please check out the [README of the `pxl` library](https://github.com/analog-nico/pxl#readme) and then come back for instructions on [installing](#installation) and [using](#usage) this library.

## Installation

[![NPM Stats](https://nodei.co/npm/pxl-mongodb.png?downloads=true)](https://npmjs.org/package/pxl-mongodb)

This is a module for node.js and is installed via npm:

``` bash
npm install pxl-mongodb --save
```

`pxl` is installed automatically with `pxl-mongodb`.

## Usage

Everything described in the [README of the `pxl` library](https://github.com/analog-nico/pxl#readme) is relevant for `pxl-mongodb` as well. The only difference is that this library includes a persistence layer for mongoDB and needs to be initialized differently.

``` js
let PxlMongodb = require('pxl-mongodb')

let pxl = new PxlMongodb({

    // Options described for the pxl lib like queryParam and logPxlFailed can be passed here as well
    
    // Additional options are:
    collectionPxls: 'pxls', // Name of the collection to store pxl documents for access tracking
    collectionLinks: 'links', // Name of the collection to store shortened links
    
    alwaysShortenWithNewLinkId: false // Set to true if you need a different linkId each time you shorten a link - even if the link was shortened before
    
    // Omit the options to use the default values equal to the example values above
    
})
```

Before you use any functions like `pxl.createdPxl(...)` you need to connect to the database:

``` js
pxl.connect('mongodb://localhost:27017/test', {}) // Passed values are the defaults
    .then((collections) => {
        
        // Returns the collections to allow creating additional indexes etc.
        
        collections.pxls.stats().then(console.dir)
        collections.lists.stats().then(console.dir)
        
    })
```

- First parameter `uri`: The mongoDB connection string that is used to connect to the database using the [`mongodb` library](https://www.npmjs.com/package/mongodb)
- Second parameter `connectionOptions`: Additional options to configure the connection. For details see the [`mongodb` API docs](http://mongodb.github.io/node-mongodb-native/2.2/api/MongoClient.html#.connect).
- Returns a promise with the collection objects as shown above. For details see the [`mongodb` API docs](http://mongodb.github.io/node-mongodb-native/2.2/api/Collection.html).

And finally:

``` js
pxl.disconnect()
    .then(() => {
        console.log('Database connection is closed')
    })
```

## Contributing

To set up your development environment for `pxl-mongodb`:

1. Clone this repo to your desktop,
2. in the shell `cd` to the main folder,
3. hit `npm install`,
4. hit `npm install gulp -g` if you haven't installed gulp globally yet, and
5. run `gulp dev`. (Or run `node ./node_modules/.bin/gulp dev` if you don't want to install gulp globally.)

`gulp dev` watches all source files and if you save some changes it will lint the code and execute all tests. The test coverage report can be viewed from `./coverage/lcov-report/index.html`.

If you want to debug a test you should use `gulp test-without-coverage` to run all tests without obscuring the code by the test coverage instrumentation.

## Change History

- v0.0.5 (2018-04-12)
    - Using latest pxl version which debounces pxl logging when a user double clicks
    - **Breaking Change**: If you call `.logPxl(...)` directly instead of using the `trackPxl` middleware then `.logPxl(...)` calls which get debounced resolve to `undefined`.
- v0.0.4 (2016-10-08)
    - Fixed unshorting links
    - Added index to speed up checking for already shortened links
- v0.0.3 (2016-10-08)
    - Per default, the same links will (almost always) get the same linkId when shortened
    - Wiring to support referenced pxls
    - Upgraded to `pxl@0.0.3`
- v0.0.2 (2016-10-06)
    - Upgraded to `pxl@0.0.2`
- v0.0.1 (2016-10-06)
    - Initial version

## License (ISC)

In case you never heard about the [ISC license](http://en.wikipedia.org/wiki/ISC_license) it is functionally equivalent to the MIT license.

See the [LICENSE file](LICENSE) for details.
