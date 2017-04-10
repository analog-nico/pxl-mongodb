const debug = require('debug');
const assign = require('lodash/assign');

const Sequelize = require('sequelize');
const Pxl = require('pxl');

const log = debug('mongodbPersistence');

class SqldbPersistenceLayer extends Pxl.PersistenceLayerBase {
  constructor({ collectionPxls = 'pxls', collectionLinks = 'links',
    alwaysShortenWithNewLinkId = false } = {}) {
    super()
    this.db = null;
    this.collectionPxls = collectionPxls;
    this.collectionLinks = collectionLinks;
    this.alwaysShortenWithNewLinkId = alwaysShortenWithNewLinkId;
  }

  connect(uri = 'mysql://root@localhost:3306/test', connectionOptions = {}) {
    console.log('uri', uri)
    if (this.db) {
      return new Promise(() => {
        throw new Error('Database connection is already established. ' +
          'Please do not call PxlMongodb.connect(...) twice.');
      });
    }
    const sequelizePxl = new Sequelize(uri, connectionOptions);
    const db = { sequelizePxl };

    db[this.collectionPxls] = sequelizePxl.define(this.collectionPxls, {
      id: {
        type: Sequelize.INTEGER(14),
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
        unique: true,
      },
      type: Sequelize.STRING,
      recipient: Sequelize.STRING,
      pxl: Sequelize.STRING,
      count: Sequelize.INTEGER,
      link: Sequelize.STRING,
      ref: Sequelize.STRING,
    }, {
      tableName: this.collectionPxls,
      timestamps: true,
      underscored: true,
    });

    db[this.collectionLinks] = sequelizePxl.define(this.collectionLinks, {
      id: {
        type: Sequelize.INTEGER(14),
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
        unique: true,
      },
      linkId: Sequelize.STRING,
      link: Sequelize.STRING(2048),
    }, {
      tableName: this.collectionLinks,
      timestamps: true,
      underscored: true,
      indexes: [{
        method: 'BTREE',
        fields: ['link'],
      }],
    });
    // - To Enable Associations
    //Object.keys(db).forEach(modelName => {
    //  if ('associate' in db[modelName]) {
    //    db[modelName].associate(db);
    //  }
    //});

    this.db = db;
    return db.sequelizePxl
      .sync();
  }

  disconnect() {
    if (!this.db) {
      return new Promise(() => {
        throw new Error('Database connection is not established. ' +
          'Please call PxlMysqldb.connect(...) first.');
      });
    }

    const db = this.db;
    this.db = null;

    return db.sequelizePxl.close();
  }

  checkAndAddPxl(pxl, metadata) {
    if (!this.db) {
      return new Promise(() => {
        throw new Error('Database connection is not established. ' +
          'Please call PxlMysqldb.connect(...) first.');
      });
    }

    return this.db[this.collectionPxls]
      .create(assign({}, metadata, {
        pxl,
        count: 0,
      }))
      .then(pxl => pxl.toJSON())
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
          'Please call PxlMongodb.connect(...) first.');
      });
    }
    return this
      .db[this.collectionPxls]
      .update({count: Sequelize.literal('count + 1')}, {where: {pxl}})
      .catch(err => console.log('log pxl', err))
      .then(([updated]) => {
        console.log('update', updated);
        if (updated === 0) {
          throw new Error('Pxl not found.');
        }
        return this
          .db[this.collectionPxls]
          .find({ where: { pxl }, raw: true });
      });
  }

  checkAndAddLink(linkId, link, _skipExistingLinkCheck = false) {
    if (!this.db) {
      return new Promise(() => {
        throw new Error('Database connection is not established. ' +
          'Please call PxlMongodb.connect(...) first.');
      });
    }
    if (!_skipExistingLinkCheck && this.alwaysShortenWithNewLinkId === false) {
      return this
        .db[this.collectionLinks].find({ where: { link }, raw: true})
        .then((existingLink) => {
          if (existingLink) {
            return existingLink;
          }
          return this.checkAndAddLink(linkId, link, true);
        });
    }

    return this
      .db[this.collectionLinks]
      .create({
        linkId,
        link,
      })
      .then(pxl => pxl.toJSON())
      .catch((err) => {
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
          'Please call PxlMongodb.connect(...) first.');
      });
    }

    return this
      .db[this.collectionLinks]
      .find({ where: { linkId }, raw: true })
      .then((doc) => {
        if (!doc) {
          throw new Error('Link not found.');
        }
        return doc.link;
      });
  }
}

module.exports = SqldbPersistenceLayer;
