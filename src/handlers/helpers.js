'use strict'

let debug = require('debug')('swagger:storage')

import _ from 'lodash'

export function getId (req) {
  let idParam
  if (req.pathParams && req.swagger.params) {
    // Use the last path parameter as the ID.
    idParam = _.result(_.findLast(req.swagger.params, { in: 'path' }), 'name')
  }
  if (idParam) {
    debug("Parsed ID '%s' from path", req.pathParams[idParam])
  }
  return req.pathParams[idParam]
}

export function respond (err, resource, res, next, statusCode = 200) {
  if (!err && resource) {
    res.status(statusCode)
    if (statusCode !== 204) {
      res.swagger.data = resource
    }
  }
  return next(err)
}
