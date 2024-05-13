'use strict'

let mongodb = require('mongodb')
let Pxl = require('pxl')


class MongodbPersistenceLayer extends Pxl.PersistenceLayerBase {

    constructor({ collectionPxls = 'pxls', collectionLinks = 'links', alwaysShortenWithNewLinkId = false } = {}) {

        super()

        this.client = null
        this.db = null
        this.collectionPxls = collectionPxls
        this.collectionLinks = collectionLinks
        this.alwaysShortenWithNewLinkId = alwaysShortenWithNewLinkId

    }

    connect(uri = 'mongodb://localhost:27017/test', connectionOptions = {}) {

        if (this.db) {
            return new Promise((resolve, reject) => {
                throw new Error('Database connection is already established. Please do not call PxlMongodb.connect(...) twice.')
            })
        }

        let client = null

        try {
            client = new mongodb.MongoClient(uri, connectionOptions)
        } catch (e) {
            return new Promise((resolve, reject) => {
                reject(e)
            })
        }

        return client.connect()
            .then(() => {

                this.client = client
                this.db = client.db()

            })
            .then(() => {

                return this.db.collection(this.collectionPxls).createIndex({ pxl: 1 }, { unique: true, background: true, name: 'pxl_1' })

            })
            .then(() => {

                return this.db.collection(this.collectionLinks).createIndex({ linkId: 1 }, { unique: true, background: true, name: 'linkId_1' })

            })
            .then(() => {

                // Must not be unique since race conditions can occur in checkAndAddLink that still result in the same link being shortened twice even if alwaysShortenWithNewLinkId = false
                // Must not be unique to allow easy migration from alwaysShortenWithNewLinkId = false -> true
                return this.db.collection(this.collectionLinks).createIndex({ link: 1 }, { background: true, name: 'link_1' })

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

        let client = this.client
        this.client = null
        this.db = null

        return client.close()

    }

    checkAndAddPxl(pxl, metadata) {

        if (!this.db) {
            return new Promise((resolve, reject) => {
                throw new Error('Database connection is not established. Please call PxlMongodb.connect(...) first.')
            })
        }

        let document = Object.assign({}, metadata, {
            pxl,
            count: 0
        })

        return this.db.collection(this.collectionPxls).insertOne(
            document,
            { writeConcern: { w: 'majority' } }
        )
            .then(() => {

                return document

            })
            .catch((err) => {

                if (err.name === 'MongoServerError' && err.code === 11000) {
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
            .then((result) => {

                if (result.matchedCount === 0) {
                    throw new Error('Pxl not found.')
                }

                return this.db.collection(this.collectionPxls).findOne({ pxl })

            })

    }

    checkAndAddLink(linkId, link, _skipExistingLinkCheck = false) {

        if (!this.db) {
            return new Promise((resolve, reject) => {
                throw new Error('Database connection is not established. Please call PxlMongodb.connect(...) first.')
            })
        }

        if (!_skipExistingLinkCheck && this.alwaysShortenWithNewLinkId === false) {

            return this.db.collection(this.collectionLinks).findOne({ link })
                .then((existingLink) => {

                    if (existingLink) {
                        return existingLink
                    }

                    return this.checkAndAddLink(linkId, link, true)

                })

        }

        let document = {
            linkId,
            link
        }

        return this.db.collection(this.collectionLinks).insertOne(
            document,
            { writeConcern: { w: 'majority' } }
        )
            .then(() => {

                return document

            })
            .catch((err) => {

                if (err.name === 'MongoServerError' && err.code === 11000) {
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

                return doc.link

            })

    }

}

module.exports = MongodbPersistenceLayer
