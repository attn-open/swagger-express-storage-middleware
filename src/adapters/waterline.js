'use strict'

let debug = require('debug')('swagger:storage')

import _ from 'lodash'

import Storage from '../'

import Waterline from 'waterline'

export default class WaterlineAdapter extends Storage {

  constructor (config) {
    super()

    if (!config) {
      throw new Error('Waterline configuration is required')
    }

    this.config = config

    this.engine = new Waterline()
  }

  initialize (resources, callback) {
    // @todo Allow configuration for skipping resources.
    for (let resource in resources) {
      let schema = {}

      schema.attributes = {}
      // @todo Load schema attributes properly.
      // schema.attributes = _.pick(resources[resource].properties, ['type', 'enum'])
      // schema.attributes = _.clone(resources[resource].properties, true)

      schema.identity = resource.toLowerCase()

      // Allow for explicitly setting the connection per resource.
      // @todo Allow setting the connection per operation as well.
      if (resources[resource]['x-waterline-connection']) {
        schema.connection = resources[resource]['x-waterline-connection']
      } else {
        [
          resource,
          schema.identity,
          _.chain(resource).camelCase().capitalize().value() + 'Service',
          'default'
        ].some((option) => {
          // 'some' works like 'forEach', but with a 'break'.
          if (this.config.connections[option]) {
            schema.connection = option
            return schema.connection
          }
        })
      }

      // Load the resource into Waterline.
      this.engine.loadCollection(Waterline.Collection.extend(schema))
    }

    this.engine.initialize(this.config, (err, details) => {
      // Store the initialized Waterline models.
      this.models = details.collections

      // Store the Waterline connections.
      this.connections = details.connections

      debug('Initialized Waterline storage engine.')

      if (typeof callback === 'function') {
        return callback(err)
      }
    })
  }

  find (model, query, callback) {
    debug('Finding %s', model)

    // @todo Use model definition properties to filter the query parameters.
    let whereQuery = _.omit(query, ['limit', 'page'])

    // Initialize the request to the storage engine.
    let request = this.getModel(model).find(whereQuery)

    // Add pagination to the response, if requested.
    // @todo Abstract this to be a bit more flexible.
    let paginateQuery = _.pick(query, ['limit', 'page'])
    if (paginateQuery.limit && paginateQuery.page) {
      request.paginate(paginateQuery)
    }

    // Make the request to the storage engine.
    request.exec(function (error, resources) {
      return callback(error, resources)
    })
  }

  findOne (model, query, callback) {
    debug('Finding %s', model)
    this.getModel(model).findOne(query).exec(function (error, resource) {
      return callback(error, resource)
    })
  }

  // @todo Allow customizing ID parameter name.
  findById (model, id, callback) {
    debug('Finding %s %s', model, id)
    this.getModel(model).findOne({ id: id }).exec(function (error, resource) {
      callback(error, resource)
    })
  }

  create (model, properties, callback) {
    debug('Creating %s', model)
    this.getModel(model).create(properties).exec(function (error, resource) {
      return callback(error, resource)
    })
  }

  update (model, id, properties, callback) {
    debug('Updating %s %s', model, id)
    // Don't pass ID in updated properties.
    delete properties.id
    this.getModel(model).update({ id: id }, properties).exec(function (error, resource) {
      return callback(error, resource)
    })
  }

  destroy (model, id, callback) {
    debug('Deleting %s %s', model, id)
    // @todo Use findById logic? Why does exec return array?
    this.getModel(model).destroy({ id: id }).exec(function (error, resources) {
      return callback(error, resources[0] || undefined)
    })
  }

}
