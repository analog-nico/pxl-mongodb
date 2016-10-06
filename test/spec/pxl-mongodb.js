'use strict'

let PxlMongodb = require('../../')

describe('PxlMongodb', () => {

    let pxl = null

    before(() => {

        pxl = new PxlMongodb({
            collectionPxls: 'pxl-mongodb-text-pxls',
            collectionLinks: 'pxl-mongodb-text-links'
        })

    })

    after(() => {

        return pxl.disconnect()

    })

    it('should return the collection from connect(...)', () => {

        return pxl.connect()
            .then((collections) => {

                return collections.pxls.stats()
                    .then(() => {
                        return collections.links.stats()
                    })

            })

    })

    it('creates and logs a pxl', () => {

        let user = String(Math.random())
        let pxlKey = null

        return pxl.createPxl({ user })
            .then((doc) => {

                expect(doc.user).to.eql(user)
                expect(doc.count).to.eql(0)

                pxlKey = doc.pxl

                return pxl.logPxl(pxlKey)

            })
            .then(() => {

                return pxl.persistenceLayer.db.collection('pxl-mongodb-text-pxls').findOne({ pxl: pxlKey })
                    .then((doc) => {

                        expect(doc.user).to.eql(user)
                        expect(doc.count).to.eql(1)

                    })

            })
            .then(() => {

                return pxl.logPxl(pxlKey)

            })
            .then(() => {

                return pxl.persistenceLayer.db.collection('pxl-mongodb-text-pxls').findOne({ pxl: pxlKey })
                    .then((doc) => {

                        expect(doc.user).to.eql(user)
                        expect(doc.count).to.eql(2)

                    })

            })

    })

    it('does not log a not existing pxl', () => {

        return pxl.logPxl('impossible pxl')
            .then(() => {
                throw new Error('Expected error')
            })
            .catch((err) => {
                expect(err.message).to.eql('Pxl not found.')
            })

    })

    it('shortens and unshortens a link', () => {

        let link = String(Math.random())

        return pxl.shorten(link)
            .then((doc) => {

                expect(doc.link).to.eql(link)

                return pxl.unshorten(doc.linkId)

            })
            .then((doc) => {

                expect(doc.link).to.eql(link)

            })

    })

    it('does not unshorten a not existing link', () => {

        return pxl.unshorten('impossible link')
            .then(() => {
                throw new Error('Expected error')
            })
            .catch((err) => {
                expect(err.message).to.eql('Link not found.')
            })

    })

})
