'use strict'

let PxlMongodb = require('../../')

describe('To initialize, PxlMongodb', () => {

    it('should not accept multiple connect(...) calls', () => {

        let pxl = new PxlMongodb({
            collectionPxls: 'pxl-mongodb-text-pxls',
            collectionLinks: 'pxl-mongodb-text-links'
        })

        return pxl.connect()
            .then(() => {

                return pxl.connect()
                    .then(
                        () => {
                            throw new Error('Expected an error')
                        },
                        (err) => {
                            // Error expected
                            expect(err.message).to.eql('Database connection is already established. Please do not call PxlMongodb.connect(...) twice.')
                        }
                    )

            })
            .then(
                () => {
                    pxl.disconnect()
                },
                (err) => {

                    return pxl.disconnect()
                        .then(() => {
                            throw err
                        })

                }
            )

    })

    it('should not accept createPxl(...) calls before connect(...)', () => {

        let pxl = new PxlMongodb({
            collectionPxls: 'pxl-mongodb-text-pxls',
            collectionLinks: 'pxl-mongodb-text-links'
        })

        return pxl.createPxl()
            .then(
                () => {
                    throw new Error('Expected an error')
                },
                (err) => {
                    // Error expected
                    expect(err.message).to.eql('Database connection is not established. Please call PxlMongodb.connect(...) first.')
                }
            )

    })

    it('should not accept logPxl(...) calls before connect(...)', () => {

        let pxl = new PxlMongodb({
            collectionPxls: 'pxl-mongodb-text-pxls',
            collectionLinks: 'pxl-mongodb-text-links'
        })

        return pxl.logPxl('abcdefgh')
            .then(
                () => {
                    throw new Error('Expected an error')
                },
                (err) => {
                    // Error expected
                    expect(err.message).to.eql('Database connection is not established. Please call PxlMongodb.connect(...) first.')
                }
            )

    })

    it('should not accept shorten(...) calls before connect(...)', () => {

        let pxl = new PxlMongodb({
            collectionPxls: 'pxl-mongodb-text-pxls',
            collectionLinks: 'pxl-mongodb-text-links'
        })

        return pxl.shorten('some link')
            .then(
                () => {
                    throw new Error('Expected an error')
                },
                (err) => {
                    // Error expected
                    expect(err.message).to.eql('Database connection is not established. Please call PxlMongodb.connect(...) first.')
                }
            )

    })

    it('should not accept unshorten(...) calls before connect(...)', () => {

        let pxl = new PxlMongodb({
            collectionPxls: 'pxl-mongodb-text-pxls',
            collectionLinks: 'pxl-mongodb-text-links'
        })

        return pxl.unshorten('abcdefgh')
            .then(
                () => {
                    throw new Error('Expected an error')
                },
                (err) => {
                    // Error expected
                    expect(err.message).to.eql('Database connection is not established. Please call PxlMongodb.connect(...) first.')
                }
            )

    })

    it('should not accept disconnect() calls before connect(...)', () => {

        let pxl = new PxlMongodb({
            collectionPxls: 'pxl-mongodb-text-pxls',
            collectionLinks: 'pxl-mongodb-text-links'
        })

        return pxl.disconnect()
            .then(
                () => {
                    throw new Error('Expected an error')
                },
                (err) => {
                    // Error expected
                    expect(err.message).to.eql('Database connection is not established. Please call PxlMongodb.connect(...) first.')
                }
            )

    })

})
