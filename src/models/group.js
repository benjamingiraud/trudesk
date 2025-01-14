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
 *  Updated:    1/20/19 4:46 PM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

var _ = require('lodash')
var mongoose = require('mongoose')

var COLLECTION = 'groups'

/**
 * Group Schema
 * @module models/ticket
 * @class Group
 * @requires {@link User}
 *
 * @property {object} _id ```Required``` ```unique``` MongoDB Object ID
 * @property {String} name ```Required``` ```unique``` Name of Group
 * @property {Array} members Members in this group
 * @property {Array} sendMailTo Members to email when a new / updated ticket has triggered
 */
var groupSchema = mongoose.Schema({
  name: { type: Map, of: String },
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'organizations', required: true },
  members: { type: [Number], required: true, default: [] },
  sendMailTo: [{ type: mongoose.Schema.Types.Number }],
  public: { type: Boolean, required: true, default: false }
})
groupSchema.index({ name: 1, organizationId: 1 }, { unique: true })

groupSchema.plugin(require('mongoose-autopopulate'))

// groupSchema.pre('save', function (next) {
//   next()
// })
groupSchema.methods.localize = function (locale) {
  let toReturn = this.toJSON()
  toReturn.name = this.name.get(locale) || this.name
  return toReturn
}

groupSchema.methods.addMember = function (memberId, callback) {
  if (_.isUndefined(memberId)) return callback('Invalid MemberId - $Group.AddMember()')

  if (this.members === null) this.members = []

  if (isMember(this.members, memberId)) return callback(null, false)

  this.members.push(memberId)
  this.members = _.uniq(this.members)

  return callback(null, true)
}

groupSchema.methods.removeMember = function (memberId, callback) {
  if (_.isUndefined(memberId)) return callback('Invalid MemberId - $Group.RemoveMember()')

  if (!isMember(this.members, memberId)) return callback(null, false)

  this.members.splice(_.indexOf(this.members, _.find(this.members, { _id: memberId })), 1)

  this.members = _.uniq(this.members)

  return callback(null, true)
}

groupSchema.methods.isMember = function (memberId) {
  return isMember(this.members, memberId)
}

groupSchema.methods.addSendMailTo = function (memberId, callback) {
  if (_.isUndefined(memberId)) return callback('Invalid MemberId - $Group.AddSendMailTo()')

  if (this.sendMailTo === null) this.sendMailTo = []

  if (isMember(this.sendMailTo, memberId)) return callback(null, false)

  this.sendMailTo.push(memberId)
  this.sendMailTo = _.uniq(this.sendMailTo)

  return callback(null, true)
}

groupSchema.methods.removeSendMailTo = function (memberId, callback) {
  if (_.isUndefined(memberId)) return callback('Invalid MemberId - $Group.RemoveSendMailTo()')

  if (!isMember(this.sendMailTo, memberId)) return callback(null, false)

  this.sendMailTo.splice(_.indexOf(this.sendMailTo, _.find(this.sendMailTo, { _id: memberId })), 1)

  return callback(null, true)
}

groupSchema.statics.getGroupByName = function (name, callback) {
  if (_.isUndefined(name) || name.length < 1) return callback('Invalid Group Name - GroupSchema.GetGroupByName()')

  var q = this.model(COLLECTION).findOne({ name: name })
  // .populate('members', '_id username fullname email role preferences image title deleted')
  // .populate('sendMailTo', '_id username fullname email role preferences image title deleted')

  return q.exec(callback)
}

groupSchema.statics.getWithObject = function (obj, callback) {
  var limit = obj.limit ? Number(obj.limit) : 100
  var page = obj.page ? Number(obj.page) : 0
  var userId = obj.userId
  var organizationId = obj.organizationId

  if (userId) {
    return (
      this.model(COLLECTION)
        .find({ members: userId, organizationId: organizationId })
        .limit(limit)
        .skip(page * limit)
        // .populate('members', '_id username fullname email role preferences image title deleted')
        .populate('sendMailTo', '_id username fullname email role preferences image title deleted')
        .sort('name')
        .exec(callback)
    )
  }

  return (
    this.model(COLLECTION)
      .find({ organizationId: organizationId })
      .limit(limit)
      .skip(page * limit)
      // .populate('members', '_id username fullname email role preferences image title deleted')
      .populate('sendMailTo', '_id username fullname email role preferences image title deleted')
      .sort('name')
      .exec(callback)
  )
}

groupSchema.statics.getAllGroups = function (callback, organizationId) {
  var q = this.model(COLLECTION)
    .find({ organizationId: organizationId })
    // .populate('members', '_id username fullname email role preferences image title deleted')
    .populate('sendMailTo', '_id username fullname email role preferences image title deleted')
    .sort('name')

  return q.exec(callback)
}

groupSchema.statics.getAllGroupsNoPopulate = function (callback, organizationId) {
  var q = this.model(COLLECTION)
    .find({ organizationId: organizationId })
    .sort('name')

  return q.exec(callback)
}

groupSchema.statics.getAllPublicGroups = function (callback) {
  var q = this.model(COLLECTION)
    .find({ public: true })
    .sort('name')

  return q.exec(callback)
}

groupSchema.statics.getGroups = function (groupIds, callback, organizationId) {
  if (_.isUndefined(groupIds)) return callback('Invalid Array of Group IDs - GroupSchema.GetGroups()')

  this.model(COLLECTION)
    .find({ _id: { $in: groupIds }, organizationId: organizationId })
    // .populate('members', '_id username fullname email role preferences image title deleted')
    .sort('name')
    .exec(callback)
}

groupSchema.statics.getAllGroupsOfUser = function (userId, callback, organizationId) {
  if (_.isUndefined(userId)) return callback('Invalid UserId - GroupSchema.GetAllGroupsOfUser()')
  if (_.isUndefined(organizationId)) return callback('Invalid Organization Id - GroupSchema.GetAllGroupsOfUser()')

  var q = this.model(COLLECTION)
    .find({ members: userId, organizationId: organizationId })
    // .populate('members', '_id username fullname email role preferences image title deleted')
    .populate('sendMailTo', '_id username fullname email role preferences image title deleted')
    .sort('name')

  return q.exec(callback)
}

groupSchema.statics.getAllGroupsOfUserNoPopulate = function (userId, callback, organizationId) {
  if (_.isUndefined(userId)) return callback('Invalid UserId - GroupSchema.GetAllGroupsOfUserNoPopulate()')

  var q = this.model(COLLECTION)
    .find({ members: userId, organizationId })
    .sort('name')

  return q.exec(callback)
}

groupSchema.statics.getGroupById = function (gId, callback, organizationId) {
  if (_.isUndefined(gId)) return callback('Invalid GroupId - GroupSchema.GetGroupById()')
  if (_.isUndefined(organizationId)) return callback('Invalid Organization Id - GroupSchema.GetGroupById()')

  var q = this.model(COLLECTION)
    .findOne({ _id: gId, organizationId: organizationId })
    // .populate('members', '_id username fullname email role preferences image title')
    .populate('sendMailTo', '_id username fullname email role preferences image title')

  return q.exec(callback)
}

function isMember (arr, id) {
  var matches = _.filter(arr, function (value) {
    if (value._id.toString() === id.toString()) {
      return value
    }
  })

  return matches.length > 0
}

module.exports = mongoose.model(COLLECTION, groupSchema)
