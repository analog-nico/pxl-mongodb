'use strict'

let assign = require('lodash/assign')
let mongodb = require('mongodb')
let Pxl = require('pxl')


class MongodbPersistenceLayer extends Pxl.PersistenceLayerBase {

    constructor({ collectionPxls = 'pxls', collectionLinks = 'links' } = {}) {

        super()

        this.db = null
        this.collectionPxls = collectionPxls
        this.collectionLinks = collectionLinks

    }

    connect(uri = 'mongodb://localhost:27017/test', connectionOptions = {}) {

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
            .then(() => {

                return {
                    pxls: this.db.collection(this.collectionPxls),
                    links: this.db.collection(this.collectionLinks)
                }

            })

    }

    disconnect() {

        if (!this.db) {
            return new Promise((resolve, reject) => {
                throw new Error('Database connection is not established. Please call PxlMongodb.connect(...) first.')
            })
        }

        let db = this.db
        this.db = null

        return db.close()

    }

    checkAndAddPxl(pxl, metadata) {

        if (!this.db) {
            return new Promise((resolve, reject) => {
                throw new Error('Database connection is not established. Please call PxlMongodb.connect(...) first.')
            })
        }

        return this.db.collection(this.collectionPxls).insertOne(assign({}, metadata, {
            pxl,
            count: 0
        }))
            .then((result) => {

                return result.ops[0]

            })
            .catch((err) => {

                if (err.name === 'MongoError' && err.code === 11000) {
                    throw new Pxl.errors.KeyCollisionError()
                }

                throw err

            })

    }

    logPxl(pxl) {

        if (!this.db) {
            return new Promise((resolve, reject) => {
                throw new Error('Database connection is not established. Please call PxlMongodb.connect(...) first.')
            })
        }

        return this.db.collection(this.collectionPxls).updateOne({ pxl }, { $inc: { count: 1 } })
            .then((response) => {

                if (response.modifiedCount === 0) {
                    throw new Error('Pxl not found.')
                }

                return this.db.collection(this.collectionPxls).findOne({ pxl })

            })

    }

    checkAndAddLink(linkId, link) {

        if (!this.db) {
            return new Promise((resolve, reject) => {
                throw new Error('Database connection is not established. Please call PxlMongodb.connect(...) first.')
            })
        }

        return this.db.collection(this.collectionLinks).insertOne({
            linkId,
            link
        })
            .then((result) => {

                return result.ops[0]

            })
            .catch((err) => {

                if (err.name === 'MongoError' && err.code === 11000) {
                    throw new Pxl.errors.KeyCollisionError()
                }

                throw err

            })

    }

    lookupLink(linkId) {

        if (!this.db) {
            return new Promise((resolve, reject) => {
                throw new Error('Database connection is not established. Please call PxlMongodb.connect(...) first.')
            })
        }

        return this.db.collection(this.collectionLinks).findOne({ linkId })
            .then((doc) => {

                if (!doc) {
                    throw new Error('Link not found.')
                }

                return doc

            })

    }

}

module.exports = MongodbPersistenceLayer
