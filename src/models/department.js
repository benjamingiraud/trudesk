/*
      .                              .o8                     oooo
   .o8                             "888                     `888
 .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
   888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
   888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
   888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
   "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 ========================================================================
 Created:    11/1/2018
 Author:     Chris Brame

 **/

var _ = require('lodash')
var async = require('async')
var mongoose = require('mongoose')

// Refs
require('./group')
var Teams = require('./team')
var Groups = require('./group')

var COLLECTION = 'departments'

var departmentSchema = mongoose.Schema({
  name: { type: String, required: true },
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'organizations', required: true },
  normalized: { type: String },
  teams: [{ type: mongoose.Schema.Types.ObjectId, ref: 'teams', autopopulate: true }],
  allGroups: { type: Boolean, default: false },
  groups: [{ type: mongoose.Schema.Types.ObjectId, ref: 'groups', autopopulate: true }]
})
departmentSchema.index({ name: 1, organizationId: 1 }, { unique: true })

departmentSchema.plugin(require('mongoose-autopopulate'))

departmentSchema.pre('save', function (next) {
  this.name = this.name.trim()
  this.normalized = this.name.trim().toLowerCase()

  return next()
})

departmentSchema.statics.getDepartmentsByTeam = function (teamIds, callback, organizationId) {
  return this.model(COLLECTION)
    .find({ teams: { $in: teamIds }, organizationId: organizationId })
    .exec(callback)
}

departmentSchema.statics.getUserDepartments = function (userId, callback, organizationId) {
  var self = this

  Teams.getTeamsOfUser(
    userId,
    function (err, teams) {
      if (err) return callback(err)

      return self
        .model(COLLECTION)
        .find({ teams: { $in: teams }, organizationId: organizationId })
        .exec(callback)
    },
    organizationId
  )
}

departmentSchema.statics.getDepartmentGroupsOfUser = function (userId, callback, organizationId) {
  var self = this

  Teams.getTeamsOfUser(
    userId,
    function (err, teams) {
      if (err) return callback(err)

      return self
        .model(COLLECTION)
        .find({ teams: { $in: teams }, organizationId: organizationId })
        .exec(function (err, departments) {
          if (err) return callback(err)

          var hasAllGroups = _.some(departments, { allGroups: true })
          if (hasAllGroups) {
            return Groups.getAllGroups(callback)
          }

          var groups = _.flattenDeep(
            departments.map(function (department) {
              return department.groups
            })
          )

          return callback(null, groups)
        })
    },
    organizationId
  )
}

departmentSchema.statics.getDepartmentsByGroup = function (groupId, callback) {
  var self = this

  return self
    .model(COLLECTION)
    .find({ $or: [{ groups: groupId }, { allGroups: true }] })
    .exec(callback)
}

module.exports = mongoose.model(COLLECTION, departmentSchema)
