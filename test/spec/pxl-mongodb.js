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
            .then((doc) => {

                expect(doc.user).to.eql(user)
                expect(doc.count).to.eql(1)

            })
            .then(() => {

                return pxl.logPxl(pxlKey)

            })
            .then((doc) => {

                expect(doc.user).to.eql(user)
                expect(doc.count).to.eql(2)

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

    it('handles a key collision when creating a pxl', () => {

        let origCheckAndAddPxl = pxl.persistenceLayer.checkAndAddPxl

        let i = 0
        let firstPxl = null

        pxl.persistenceLayer.checkAndAddPxl = function (pxlKey, metadata) {

            i+=1

            switch (i) {
                case 1:
                    firstPxl = pxlKey
                    break
                case 2:
                    pxlKey = firstPxl
                    break
            }

            return Reflect.apply(origCheckAndAddPxl, pxl.persistenceLayer, [ pxlKey, metadata ])
                .catch((err) => {
                    if (i === 2) {
                        expect(err.name).to.eql('KeyCollisionError')
                    }
                    throw err
                })

        }

        return pxl.createPxl()
            .then(() => {

                return pxl.createPxl()
                    .then((createdPxl) => {
                        return pxl.logPxl(createdPxl.pxl)
                    })

            })
            .then(
                () => {
                    pxl.persistenceLayer.checkAndAddPxl = origCheckAndAddPxl
                },
                (err) => {
                    pxl.persistenceLayer.checkAndAddPxl = origCheckAndAddPxl
                    throw err
                }
            )

    })

    it('handles an unexpected error when creating a pxl', () => {

        let origDb = pxl.persistenceLayer.db

        pxl.persistenceLayer.db = {
            collection() {
                return {
                    insertOne() {
                        return new Promise((resolve, reject) => {
                            throw new Error('Some unexpected error')
                        })
                    }
                }
            }
        }

        return pxl.createPxl()
            .then(
                () => {
                    pxl.persistenceLayer.db = origDb
                    throw new Error('Expected error')
                },
                (err) => {
                    pxl.persistenceLayer.db = origDb
                    expect(err.message).to.eql('Some unexpected error')
                }
            )

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

    it('handles a key collision when shortening a link', () => {

        let origCheckAndAddLink = pxl.persistenceLayer.checkAndAddLink

        let i = 0
        let firstLinkId = null

        pxl.persistenceLayer.checkAndAddLink = function (linkId, link) {

            i+=1

            switch (i) {
                case 1:
                    firstLinkId = linkId
                    break
                case 2:
                    linkId = firstLinkId
                    break
            }

            return Reflect.apply(origCheckAndAddLink, pxl.persistenceLayer, [ linkId, link ])
                .catch((err) => {
                    if (i === 2) {
                        expect(err.name).to.eql('KeyCollisionError')
                    }
                    throw err
                })

        }

        return pxl.shorten('some link')
            .then(() => {

                return pxl.shorten('some other link')
                    .then((shortenedLink) => {
                        return pxl.unshorten(shortenedLink.linkId)
                    })

            })
            .then(
                () => {
                    pxl.persistenceLayer.checkAndAddLink = origCheckAndAddLink
                },
                (err) => {
                    pxl.persistenceLayer.checkAndAddLink = origCheckAndAddLink
                    throw err
                }
            )

    })

    it('handles an unexpected error when shortening a link', () => {

        let origDb = pxl.persistenceLayer.db

        pxl.persistenceLayer.db = {
            collection() {
                return {
                    insertOne() {
                        return new Promise((resolve, reject) => {
                            throw new Error('Some unexpected error')
                        })
                    }
                }
            }
        }

        return pxl.shorten('some link')
            .then(
                () => {
                    pxl.persistenceLayer.db = origDb
                    throw new Error('Expected error')
                },
                (err) => {
                    pxl.persistenceLayer.db = origDb
                    expect(err.message).to.eql('Some unexpected error')
                }
            )

    })

})
