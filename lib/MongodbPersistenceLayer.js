'use strict'

let mongodb = require('mongodb')
let Pxl = require('pxl')


class MongodbPersistenceLayer extends Pxl.PersistenceLayerBase {

    constructor({ collectionPxls = 'pxls', collectionLinks = 'links' } = {}) {

        super()

        this.db = null
        this.collectionPxls = collectionPxls
        this.collectionLinks = collectionLinks

    }

    connect(uri, connectionOptions = {}) {

        if (this.db) {
            return new Promise((resolve, reject) => {
                throw new Error('Database connection is already established. Please do not call PxlMongodb.connect(...) twice.')
            })
        }

        return mongodb.MongoClient.connect(uri, connectionOptions)
            .then((db) => {

                this.db = db

            })
            .then(() => {

                return this.db.collection(this.collectionPxls).ensureIndex({ pxl: 1 }, { unique: true, background: true, name: 'pxl_1' })

            })
            .then(() => {

                return this.db.collection(this.collectionLinks).ensureIndex({ linkId: 1 }, { unique: true, background: true, name: 'linkId_1' })

            })

    }

    checkAndAddPxl(pxl, metadata) {

        if (!this.db) {
            return new Promise((resolve, reject) => {
                throw new Error('Database connection is not established. Please call PxlMongodb.connect(...) first.')
            })
        }

        return new Promise((resolve, reject) => {
            throw new Error('Mising implementation for PersistenceLayerBase.checkAndAddPxl(pxl, metadata)')
        })

    }

    logPxl(pxl) {

        if (!this.db) {
            return new Promise((resolve, reject) => {
                throw new Error('Database connection is not established. Please call PxlMongodb.connect(...) first.')
            })
        }

        return new Promise((resolve, reject) => {
            throw new Error('Mising implementation for PersistenceLayerBase.logPxl(pxl)')
        })

    }

    checkAndAddLink(linkId, link) {

        if (!this.db) {
            return new Promise((resolve, reject) => {
                throw new Error('Database connection is not established. Please call PxlMongodb.connect(...) first.')
            })
        }

        return new Promise((resolve, reject) => {
            throw new Error('Mising implementation for PersistenceLayerBase.checkAndAddLink(linkId, link)')
        })

    }

    lookupLink(linkId) {

        if (!this.db) {
            return new Promise((resolve, reject) => {
                throw new Error('Database connection is not established. Please call PxlMongodb.connect(...) first.')
            })
        }

        return new Promise((resolve, reject) => {
            throw new Error('Mising implementation for PersistenceLayerBase.lookupLink(linkId)')
        })

    }

}

module.exports = MongodbPersistenceLayer
