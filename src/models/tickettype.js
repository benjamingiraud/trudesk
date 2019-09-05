/*
 *       .                             .o8                     oooo
 *    .o8                             "888                     `888
 *  .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
 *    888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
 *    888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
 *    888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
 *    "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 *  ========================================================================
 *  Author:     Chris Brame
 *  Updated:    1/20/19 4:43 PM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

var _ = require('lodash')
var mongoose = require('mongoose')

var COLLECTION = 'tickettypes'

// Needed for Population
require('./ticketpriority')

/**
 * TicketType Schema
 * @module models/tickettype
 * @class TicketType

 *
 * @property {object} _id ```Required``` ```unique``` MongoDB Object ID
 * @property {String} name ```Required``` ```unique``` Name of Ticket Type
 */
var ticketTypeSchema = mongoose.Schema({
  name: { type: String, required: true },
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'organizations', required: true },
  priorities: [{ type: mongoose.Schema.Types.ObjectId, ref: 'priorities' }]
})
ticketTypeSchema.index({ name: 1, organizationId: 1 }, { unique: true })

var autoPopulatePriorities = function (next) {
  this.populate('priorities')
  return next()
}

ticketTypeSchema.pre('find', autoPopulatePriorities)
ticketTypeSchema.pre('findOne', autoPopulatePriorities)

ticketTypeSchema.pre('save', function (next) {
  this.name = this.name.trim()

  return next()
})

/**
 * Return all Ticket Types
 *
 * @memberof TicketType
 * @static
 * @method getTypes
 *
 * @param {String} organizationId Object Id of organizationId
 * @param {QueryCallback} callback MongoDB Query Callback
 */
ticketTypeSchema.statics.getTypes = function (callback, organizationId) {
  var q
  if (organizationId) {
    q = this.model(COLLECTION).find({ organizationId: organizationId })
    return q.exec(callback)
  } else {
    q = this.model(COLLECTION).find({})
    return q.exec(callback)
  }
}

/**
 * Return Single Ticket Types
 *
 * @memberof TicketType
 * @static
 * @method getType
 *
 * @param {String} organizationId Object Id of organizationId
 * @param {String} id Object Id of ticket type
 * @param {QueryCallback} callback MongoDB Query Callback
 */
ticketTypeSchema.statics.getType = function (id, callback, organizationId) {
  var q = this.model(COLLECTION).findOne({ organizationId: organizationId, _id: id })

  return q.exec(callback)
}

/**
 * Return Single Ticket Type based on given type name
 *
 * @memberof TicketType
 * @static
 * @method getTypeByName
 *
 * @param {String} name Name of Ticket Type to search for
 * @param {QueryCallback} callback MongoDB Query Callback
 */
ticketTypeSchema.statics.getTypeByName = function (name, callback) {
  var q = this.model(COLLECTION).findOne({ name: name })

  return q.exec(callback)
}

ticketTypeSchema.methods.addPriority = function (priorityId, callback) {
  if (!priorityId) return callback({ message: 'Invalid Priority Id' })

  var self = this

  if (!_.isArray(self.priorities)) {
    self.priorities = []
  }

  self.priorities.push(priorityId)

  return callback(null, self)
}

ticketTypeSchema.methods.removePriority = function (priorityId, callback) {
  if (!priorityId) return callback({ message: 'Invalid Priority Id' })

  var self = this

  self.priorities = _.reject(self.priorities, function (p) {
    return p._id.toString() === priorityId.toString()
  })

  return callback(null, self)
}

module.exports = mongoose.model(COLLECTION, ticketTypeSchema)
