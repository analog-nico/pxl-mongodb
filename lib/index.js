
const EsPersistenceLayer = require('./EsPersistenceLayer.js');
const SqldbPersistenceLayer = require('./SqldbPersistenceLayer.js');
let MongodbPersistenceLayer = require('./MongodbPersistenceLayer.js');
let Pxl = require('pxl');

class PxlStorage extends Pxl {

    constructor(options) {
        switch(options.type) {
            case 'sql': options.persistenceLayer = new MongodbPersistenceLayer(options); break;
            case 'elasticsearch': options.persistenceLayer = new EsPersistenceLayer(options); break;
            default: options.persistenceLayer = new MongodbPersistenceLayer(options); break;
        }
        super(options)

    }

    connect(uri, connectionOptions) {
        return this.persistenceLayer.connect(uri, connectionOptions)
    }

    disconnect() {
        return this.persistenceLayer.disconnect()
    }

}

module.exports = PxlStorage;
