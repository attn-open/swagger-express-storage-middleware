'use strict'

// let debug = require('debug')('swagger:storage')

import {getId, respond} from './helpers'

const methods = {
  GET: find,
  HEAD: find,
  OPTIONS: find,
  POST: create,
  // PATCH: update,
  PUT: replace,
  DELETE: destroy
}

let Storage

export default function handler (storage) {
  Storage = storage
  return (req, res, next) => {
    return methods[req.method](req, res, next)
  }
}

function find (req, res, next) {
  Storage.findOne(req.swagger.resourceType, req.pathParams, (err, resource) => {
    return respond(err, resource, res, next)
  })
}

function create (req, res, next) {
  if (req.swagger.params && req.swagger.params.length) {
    req.swagger.params.forEach((param) => {
      if (param.in === 'body') {
        createResource(req, (err, resource) => {
          return respond(err, resource, res, next)
        })
      }
    })
  } else {
    return next()
  }
}

// function update(req, res, next) {
//   updateResource(req, (err, resource) => {
//     return respond(err, resource, res, next)
//   })
// }

function replace (req, res, next) {
  // @todo Compare ID in path with ID in body.
  // First delete the current resource.
  destroyResource(req, (err, resource) => {
    if (err) {
      return next(err)
    }
    // Then create it again!
    createResource(req, (err, resource) => {
      return respond(err, resource, res, next)
    })
  })
}

function destroy (req, res, next) {
  destroyResource(req, (err, resource) => {
    return respond(err, resource, res, next, 204)
  })
}

function createResource (req, callback) {
  Storage.create(req.swagger.resourceType, req.body, callback)
}

// function updateResource(req, callback) {
//   Storage.update(req.swagger.resourceType, getId(req), req, callback)
// }

function destroyResource (req, callback) {
  Storage.destroy(req.swagger.resourceType, getId(req), callback)
}
