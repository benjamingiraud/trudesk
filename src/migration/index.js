/*
      .                              .o8                     oooo
   .o8                             "888                     `888
 .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
   888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
   888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
   888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
   "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 ========================================================================
 Created:    10/31/2018
 Author:     Chris Brame

 **/

var _ = require('lodash')
var async = require('async')
var winston = require('winston')
var semver = require('semver')

var SettingsSchema = require('../models/setting')
var userSchema = require('../models/user')
var roleSchema = require('../models/role')

var migrations = {}

function saveVersion (callback, organizationId) {
  SettingsSchema.getSettingByName(
    'gen:version',
    function (err, setting) {
      if (err) {
        winston.warn(err)
        if (_.isFunction(callback)) return callback(err)
        return false
      }

      if (!setting) {
        var s = new SettingsSchema({
          name: 'gen:version',
          value: require('../../package.json').version,
          organizationId: organizationId
        })
        s.save(function (err) {
          if (err) {
            if (_.isFunction(callback)) return callback(err)
            return false
          }

          if (_.isFunction(callback)) return callback()
        })
      } else {
        if (setting.value) setting.value = require('../../package').version
        setting.save(function (err) {
          if (err) {
            if (_.isFunction(callback)) return callback(err)
            return false
          }

          if (_.isFunction(callback)) return callback()
          return true
        })
      }
    },
    organizationId
  )
}

function getDatabaseVersion (callback, organizationId) {
  SettingsSchema.getSettingByName(
    'gen:version',
    function (err, setting) {
      if (err) return callback(err)

      if (!setting) throw new Error('Please upgrade to v1.0.7 Exiting...')

      return callback(null, setting.value)
    },
    organizationId
  )
}

function migrateUserRoles (callback) {
  winston.debug('Migrating Roles...')
  async.waterfall(
    [
      function (next) {
        roleSchema.getRoles(next)
      },
      function (roles, next) {
        var adminRole = _.find(roles, { normalized: 'admin' })
        userSchema.collection
          .updateMany({ role: 'admin' }, { $set: { role: adminRole._id } })
          .then(function (res) {
            if (res && res.result) {
              if (res.result.ok === 1) return next(null, roles)
              else {
                winston.warn(res.message)
                return next(res.message)
              }
            } else {
              return next('Unknown Error Occurred')
            }
          })
          .catch(function (err) {
            return next(err)
          })
      },
      function (roles, next) {
        var supportRole = _.find(roles, { normalized: 'support' })
        userSchema.collection
          .updateMany({ $or: [{ role: 'support' }, { role: 'mod' }] }, { $set: { role: supportRole._id } })
          .then(function (res) {
            if (res && res.result) {
              if (res.result.ok === 1) return next(null, roles)
              else {
                winston.warn(res.message)
                return next(res.message)
              }
            } else {
              return next('Unknown Error Occurred')
            }
          })
          .catch(function (err) {
            return next(err)
          })
      },
      function (roles, next) {
        var userRole = _.find(roles, { normalized: 'user' })
        userSchema.collection
          .updateMany({ role: 'user' }, { $set: { role: userRole._id } })
          .then(function (res) {
            if (res && res.result) {
              if (res.result.ok === 1) return next(null, roles)
              else {
                winston.warn(res.message)
                return next(res.message)
              }
            } else {
              return next('Unknown Error Occurred')
            }
          })
          .catch(function (err) {
            return next(err)
          })
      }
    ],
    callback
  )
}

function createAdminTeamDepartment (callback, organizationId) {
  var Team = require('../models/team')
  var Department = require('../models/department')
  var Account = require('../models/user')

  async.waterfall(
    [
      function (next) {
        Account.getAdmins({ organizationId: organizationId }, next)
      },
      function (admins, next) {
        var adminsIds = admins.map(function (admin) {
          return admin._id
        })

        Team.create(
          {
            name: 'Support (Default)',
            members: adminsIds,
            organizationId: organizationId
          },
          next
        )
      },
      function (adminTeam, next) {
        Department.create(
          {
            name: 'Support - All Groups (Default)',
            teams: adminTeam._id,
            allGroups: true,
            groups: [],
            organizationId: organizationId
          },
          next
        )
      }
    ],
    callback
  )
}

function removeAgentsFromGroups (callback, organizationId) {
  // winston.debug('Migrating Agents from Groups...')
  var groupSchema = require('../models/group')
  groupSchema.getAllGroups(function (err, groups) {
    if (err) return callback(err)
    async.eachSeries(
      groups,
      function (group, next) {
        group.members = _.filter(group.members, function (member) {
          return !member.role.isAdmin && !member.role.isAgent
        })

        group.save(next)
      },
      callback
    )
  }, organizationId)
}

migrations.run = function (callback, organizationId) {
  var databaseVersion

  async.series(
    [
      function (next) {
        getDatabaseVersion(function (err, dbVer) {
          if (err) return next(err)
          databaseVersion = dbVer
          if (semver.satisfies(databaseVersion, '<1.0.10')) {
            throw new Error('Please upgrade to v1.0.10 Exiting...')
          }
          return next()
        }, organizationId)
      },
      function (next) {
        if (semver.satisfies(semver.coerce(databaseVersion).version, '<1.0.11')) {
          async.parallel(
            [
              function (done) {
                removeAgentsFromGroups(done, organizationId)
              },
              function (done) {
                createAdminTeamDepartment(done, organizationId)
              }
            ],
            next
          )
        } else {
          return next()
        }
      }
    ],
    function (err) {
      if (err) return callback(err)
      //  Update DB Version Num
      return saveVersion(callback, organizationId)
    }
  )
}

module.exports = migrations
