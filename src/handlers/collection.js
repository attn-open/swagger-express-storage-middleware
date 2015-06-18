'use strict'

// let debug = require('debug')('swagger:storage')

import _ from 'lodash'

import {respond} from './helpers'

const methods = {
  GET: find,
  HEAD: find,
  OPTIONS: find
  // POST: create,
  // PATCH: update,
  // PUT: replace,
  // DELETE: delete
}

let Storage

export default function handler (storage) {
  Storage = storage
  return (req, res, next) => {
    return methods[req.method](req, res, next)
  }
}

function find (req, res, next) {
  // Remove undefined query paramaters.
  let query = _.omit(req.query, _.isUndefined)
  // Merge in path parameters (to limit query by relationships).
  query = _.merge(req.query, req.pathParams)
  // Find the resources.
  Storage.find(req.swagger.resourceType, query, (err, resources) => {
    return respond(err, resources, res, next)
  })
}
