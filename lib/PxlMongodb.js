'use strict'

let assign = require('lodash/assign')
let MongodbPersistenceLayer = require('./MongodbPersistenceLayer.js')
let Pxl = require('pxl')


class PxlMongodb extends Pxl {

    constructor(options) {

        super(assign({
            persistenceLayer: new MongodbPersistenceLayer(options)
        }, options))

    }

    connect(uri, connectionOptions) {
        return this.persistenceLayer.connect(uri, connectionOptions)
    }

    disconnect() {
        return this.persistenceLayer.disconnect()
    }

}

module.exports = PxlMongodb
