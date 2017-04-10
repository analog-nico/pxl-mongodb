import debug from 'debug';
import assign from 'lodash/assign';

import elasticsearch from 'elasticsearch';
import Pxl from '../../pxl';

const log = debug('esPersistence');

class EsPersistenceLayer extends Pxl.PersistenceLayerBase {
  constructor({ collectionPxls = 'pxls', collectionLinks = 'links',
    alwaysShortenWithNewLinkId = false } = {}) {
    super()
    this.db = null;
    this.collectionPxls = collectionPxls;
    this.collectionLinks = collectionLinks;
    this.alwaysShortenWithNewLinkId = alwaysShortenWithNewLinkId;
  }

  connect(uri = 'http://localhost:9200', connectionOptions = {}) {
    if (this.db) {
      return new Promise(() => {
        throw new Error('Database connection is already established. ' +
          'Please do not call PxlEs.connect(...) twice.');
      });
    }

    const db = new elasticsearch.Client({
      hosts: [uri],
      defer() {
        let resolve;
        let reject;
        const promise = new Promise((res, rej) => {
          resolve = res;
          reject = rej;
        });

        return { resolve, reject, promise };
      },
    });

    const strNotAnalyzed = { "type": "string", "index": "not_analyzed" };

    const int = { type: 'integer' };

    Promise.all([db.indices
      .exists({ index: this.collectionPxls })
      .then(found =>
        (found
          ? Promise.resolve('already exists')
          : db.indices
          .create({
            index: this.collectionPxls,
            type: 'logs',
            body: {
              mappings: {
                logs: {
                  _timestamp: {
                    enabled: true,
                  },
                  properties: {
                    type: strNotAnalyzed,
                    recipient: strNotAnalyzed,
                    count: int,
                    link: strNotAnalyzed,
                    ref: strNotAnalyzed,
                  },
                },
              },
            },
          }))),
      db.indices
        .exists({ index: this.collectionLinks })
        .then(found =>
          (found
            ? Promise.resolve('already exists')
            : db.indices
      .create({
        index: this.collectionLinks,
        type: 'logs',
        body: {
          mappings: {
            logs: {
              _timestamp: {
                enabled: true,
              },
              properties: {
                link: strNotAnalyzed,
              },
            }
          },
        },
      }))),
    ]).then(s => console.log('ss', s))
      .catch(err => console.log('err', err))

    this.db = db;
    return db.ping({
      // ping usually has a 3000ms timeout
      requestTimeout: Infinity,

      // undocumented params are appended to the query string
      hello: 'elasticsearch!',
    });
  }

  disconnect() {
    if (!this.db) {
      return new Promise(() => {
        throw new Error('Database connection is not established. ' +
          'Please call PxlMyEs.connect(...) first.');
      });
    }

    const db = this.db;
    this.db = null;

    return db.close();
  }

  checkAndAddPxl(pxl, metadata) {
    log('Manually generated pxl is not used. ', pxl);
    if (!this.db) {
      return new Promise(() => {
        throw new Error('Database connection is not established. ' +
          'Please call PxlMyEs.connect(...) first.');
      });
    }
    const body = assign({}, metadata, {
      count: 0,
    }, pxl);

    console.log('body, pxl', body, pxl)

    return this.db
      .create({
        index: this.collectionPxls,
        type: 'logs',
        body,
      })
      .then((pxl) => assign(body, { pxl : pxl._id }))
      .catch((err) => {
        // Unique
        // if (err.name === 'MongoError' && err.code === 11000) {
        //    throw new Pxl.errors.KeyCollisionError()
        // }
        throw err;
      });
  }

  logPxl(pxl) {
    if (!this.db) {
      return new Promise(() => {
        throw new Error('Database connection is not established. ' +
          'Please call PxlEs.connect(...) first.');
      });
    }
    return this
      .db
      .get({
        index: this.collectionPxls,
        type: 'logs',
        id: pxl,
      })
      .then((res) => {
        console.log('res', res)
        this.db
          .update({
            index: this.collectionPxls,
            type: 'logs',
            id: pxl,
            body: {
              doc: {
                count: res._source.count + 1,
              },
            },
          });
        return res._source;
      })
      .catch(err => {
        console.log('log pxl', err);
        return Promise.reject('Pxl not found.');
      });
  }

  checkAndAddLink(linkId, link, _skipExistingLinkCheck = false) {
    console.log('linkId not used, elasticsearch id used as linkId')
    if (!this.db) {
      return new Promise(() => {
        throw new Error('Database connection is not established. ' +
          'Please call PxlEs.connect(...) first.');
      });
    }
    if (!_skipExistingLinkCheck && this.alwaysShortenWithNewLinkId === false) {
      return this
        .db.search({
          index: this.collectionLinks,
          type: 'logs',
          q: `link:"${link}"`,
        })
        .then((existingLink) => {
          if (existingLink && existingLink.hits.total) {
            return {
              link: existingLink.hits.hits[0]._source.link,
              linkId: existingLink.hits.hits[0]._id,
            };
          }
          return this.checkAndAddLink(linkId, link, true);
        });
    }
    const body = {
      link,
    };

    return this.db
      .create({
        index: this.collectionLinks,
        type: 'logs',
        body,
      })
      .then(lnk => Object.assign(body, { linkId: lnk._id }))
      .catch((err) => {
        console.log('KeyCollisionError', err)
        //if (err.name === 'MongoError' && err.code === 11000) {
        //  throw new Pxl.errors.KeyCollisionError();
        //}
        throw err;
      });
  }

  lookupLink(linkId) {
    console.log('linkId', linkId);
    if (!this.db) {
      return new Promise(() => {
        throw new Error('Database connection is not established. ' +
          'Please call PxlEs.connect(...) first.');
      });
    }

    return this.db
      .get({
        index: this.collectionLinks,
        type: 'logs',
        id: linkId,
      })
      .then((link) => link._source.link)
      .catch(() => Promise.resolve('Link not found.'));
  }
}

export default EsPersistenceLayer;
