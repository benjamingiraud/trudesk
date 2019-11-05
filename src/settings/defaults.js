/*
      .                              .o8                     oooo
   .o8                             "888                     `888
 .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
   888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
   888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
   888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
   "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 ========================================================================
 Created:    02/24/18
 Author:     Chris Brame

 **/

var _ = require('lodash')
var fs = require('fs-extra')
var path = require('path')
var async = require('async')
var winston = require('winston')
var moment = require('moment-timezone')

var SettingsSchema = require('../models/setting')
var PrioritySchema = require('../models/ticketpriority')

var settingsDefaults = {}
var roleDefaults = {}

roleDefaults.userGrants = ['tickets:create view update', 'comments:create view update']
roleDefaults.supportGrants = [
  'tickets:*',
  'agent:*',
  'accounts:create update view import',
  'teams:create update view',
  'comments:create view update create delete',
  'reports:view create',
  'notices:*'
]
roleDefaults.adminGrants = [
  'admin:*',
  'agent:*',
  'chat:*',
  'tickets:*',
  'accounts:*',
  'groups:*',
  'teams:*',
  'departments:*',
  'comments:*',
  'reports:*',
  'notices:*',
  'settings:*',
  'api:*'
]

settingsDefaults.roleDefaults = roleDefaults

function rolesDefault (callback, organizationId) {
  var roleSchema = require('../models/role')
  var userGrants = ['tickets:create view update', 'comments:create view update']
  var supportGrants = [
    'tickets:*',
    'agent:*',
    'accounts:create update view import',
    'teams:create update view',
    'comments:create view update create delete',
    'reports:view create',
    'notices:*'
  ]
  var adminGrants = [
    'admin:*',
    'agent:*',
    'chat:*',
    'tickets:*',
    'accounts:*',
    'groups:*',
    'teams:*',
    'departments:*',
    'comments:*',
    'reports:*',
    'notices:*',
    'settings:*',
    'api:*'
  ]
  async.series(
    [
      function (done) {
        roleSchema.getRoleByName(
          'User',
          function (err, role) {
            if (err) return done(err)
            if (role) return done()

            roleSchema.create(
              {
                name: 'User',
                description: 'Default role for users',
                grants: userGrants,
                organizationId: organizationId
              },
              function (err, userRole) {
                if (err) return done(err)
                SettingsSchema.getSetting(
                  'role:user:default',
                  function (err, roleUserDefault) {
                    if (err) return done(err)
                    if (roleUserDefault) return done()

                    SettingsSchema.create(
                      {
                        name: 'role:user:default',
                        value: userRole._id,
                        organizationId: organizationId
                      },
                      done
                    )
                  },
                  organizationId
                )
              }
            )
          },
          organizationId
        )
      },
      function (done) {
        roleSchema.getRoleByName(
          'Support',
          function (err, role) {
            if (err) return done(err)
            if (role) {
              return done()
              // role.updateGrants(supportGrants, done);
            } else
              roleSchema.create(
                {
                  name: 'Support',
                  description: 'Default role for agents',
                  grants: supportGrants,
                  organizationId: organizationId
                },
                done
              )
          },
          organizationId
        )
      },
      function (done) {
        roleSchema.getRoleByName(
          'Admin',
          function (err, role) {
            if (err) return done(err)
            if (role) return done()
            // role.updateGrants(adminGrants, done);
            else {
              roleSchema.create(
                {
                  name: 'Admin',
                  description: 'Default role for admins',
                  grants: adminGrants,
                  organizationId: organizationId
                },
                done
              )
            }
          },
          organizationId
        )
      },
      function (done) {
        var roleOrderSchema = require('../models/roleorder')
        roleOrderSchema.getOrder(function (err, roleOrder) {
          if (err) return done(err)
          if (roleOrder) return done()

          roleSchema.getRoles(function (err, roles) {
            if (err) return done(err)

            var roleOrder = []
            roleOrder.push(_.find(roles, { name: 'Admin' })._id)
            roleOrder.push(_.find(roles, { name: 'Support' })._id)
            roleOrder.push(_.find(roles, { name: 'User' })._id)

            roleOrderSchema.create(
              {
                order: roleOrder,
                organizationId: organizationId
              },
              done
            )
          }, organizationId)
        }, organizationId)
      }
    ],
    function (err) {
      if (err) throw err

      roleDefaults = null

      return callback()
    }
  )
}

function defaultUserRole (callback, organizationId) {
  var roleOrderSchema = require('../models/roleorder')
  roleOrderSchema.getOrderLean(function (err, roleOrder) {
    if (err) return callback(err)
    if (!roleOrder) return callback()

    SettingsSchema.getSetting(
      'role:user:default',
      function (err, roleDefault) {
        if (err) return callback(err)

        if (roleDefault) return callback()

        var lastId = _.last(roleOrder.order)
        SettingsSchema.create(
          {
            name: 'role:user:default',
            value: lastId,
            organizationId: organizationId
          },
          callback
        )
      },
      organizationId
    )
  }, organizationId)
}

function createDirectories (callback) {
  async.parallel(
    [
      function (done) {
        fs.ensureDir(path.join(__dirname, '../../backups'), done)
      },
      function (done) {
        fs.ensureDir(path.join(__dirname, '../../restores'), done)
      }
    ],
    callback
  )
}

function downloadWin32MongoDBTools (callback) {
  var http = require('http')
  var os = require('os')
  var semver = require('semver')
  var dbVersion = require('../database').db.version || '3.6.9'
  var fileVersion = semver(dbVersion).major + '.' + semver(dbVersion).minor

  if (os.platform() === 'win32') {
    var filename = 'mongodb-tools.' + fileVersion + '-win32x64.zip'
    var savePath = path.join(__dirname, '../backup/bin/win32/')
    fs.ensureDirSync(savePath)
    if (
      !fs.existsSync(path.join(savePath, 'mongodump.exe')) ||
      !fs.existsSync(path.join(savePath, 'mongorestore.exe')) ||
      !fs.existsSync(path.join(savePath, 'libeay32.dll')) ||
      !fs.existsSync(path.join(savePath, 'ssleay32.dll'))
    ) {
      winston.debug('Windows platform detected. Downloading MongoDB Tools')
      fs.emptyDirSync(savePath)
      var unzipper = require('unzipper')
      var file = fs.createWriteStream(path.join(savePath, filename))
      http
        .get('http://storage.trudesk.io/tools/' + filename, function (response) {
          response.pipe(file)
          file.on('finish', function () {
            file.close()
          })
          file.on('close', function () {
            fs.createReadStream(path.join(savePath, filename))
              .pipe(unzipper.Extract({ path: savePath }))
              .on('close', function () {
                fs.unlink(path.join(savePath, filename), callback)
              })
          })
        })
        .on('error', function (err) {
          fs.unlink(path.join(savePath, filename))
          winston.debug(err)
          return callback()
        })
    } else {
      return callback()
    }
  } else {
    return callback()
  }
}

function timezoneDefault (callback, organizationId) {
  SettingsSchema.getSettingByName(
    'gen:timezone',
    function (err, setting) {
      if (err) {
        winston.warn(err)
        if (_.isFunction(callback)) return callback(err)
        return false
      }

      if (!setting) {
        var defaultTimezone = new SettingsSchema({
          name: 'gen:timezone',
          value: 'America/New_York',
          organizationId: organizationId
        })

        defaultTimezone.save(function (err, setting) {
          if (err) {
            winston.warn(err)
            if (_.isFunction(callback)) return callback(err)
          }

          winston.debug('Timezone set to ' + setting.value)
          winston.debug('Timezone created set to ' + setting.value)

          moment.tz.setDefault(setting.value)

          global.timezone = setting.value

          if (_.isFunction(callback)) return callback()
        })
      } else {
        winston.debug('Timezone set to ' + setting.value)
        winston.debug('Timezone already set to ' + setting.value)
        moment.tz.setDefault(setting.value)

        global.timezone = setting.value

        if (_.isFunction(callback)) return callback()
      }
    },
    organizationId
  )
}

function showTourSettingDefault (callback) {
  SettingsSchema.getSettingByName('showTour:enable', function (err, setting) {
    if (err) {
      winston.warn(err)
      if (_.isFunction(callback)) return callback(err)
      return false
    }

    if (!setting) {
      var defaultShowTour = new SettingsSchema({
        name: 'showTour:enable',
        value: 0
      })

      defaultShowTour.save(function (err) {
        if (err) {
          winston.warn(err)
          if (_.isFunction(callback)) return callback(err)
        }

        if (_.isFunction(callback)) return callback()
      })
    } else if (_.isFunction(callback)) return callback()
  })
}

function ticketTypeSettingDefault (callback, organizationId) {
  SettingsSchema.getSettingByName(
    'ticket:type:default',
    function (err, setting) {
      if (err) {
        winston.warn(err)
        if (_.isFunction(callback)) {
          return callback(err)
        }
      }

      if (!setting) {
        winston.warn('no settings')
        var ticketTypeSchema = require('../models/tickettype')
        ticketTypeSchema.getTypes(function (err, types) {
          if (err) {
            winston.warn(err)
            if (_.isFunction(callback)) {
              return callback(err)
            }
            return false
          }
          winston.warn(JSON.stringify(types))

          var type = _.first(types)
          winston.warn(JSON.stringify(type))

          if (!type) return callback('No Types Defined!')
          if (!_.isObject(type) || _.isUndefined(type._id)) return callback('Invalid Type. Skipping.')

          // Save default ticket type
          var defaultTicketType = new SettingsSchema({
            name: 'ticket:type:default',
            value: type._id,
            organizationId: organizationId
          })
          winston.warn(JSON.stringify(defaultTicketType))
          defaultTicketType.save(function (err) {
            if (err) {
              winston.warn(err)
              if (_.isFunction(callback)) {
                return callback(err)
              }
            }

            if (_.isFunction(callback)) {
              winston.warn('will return callback()')
              return callback()
            }
          })
        }, organizationId)
      } else {
        if (_.isFunction(callback)) {
          return callback()
        }
      }
    },
    organizationId
  )
}

function ticketPriorityDefaults (callback, organizationId) {
  var priorities = []

  var normal = new PrioritySchema({
    name: 'Normal',
    migrationNum: 1,
    default: true,
    organizationId: organizationId
  })

  var urgent = new PrioritySchema({
    name: 'Urgent',
    migrationNum: 2,
    htmlColor: '#8e24aa',
    default: true,
    organizationId: organizationId
  })

  var critical = new PrioritySchema({
    name: 'Critical',
    migrationNum: 3,
    htmlColor: '#e65100',
    default: true,
    organizationId: organizationId
  })

  priorities.push(normal)
  priorities.push(urgent)
  priorities.push(critical)
  async.each(
    priorities,
    function (item, next) {
      winston.warn(JSON.stringify(item))
      PrioritySchema.findOne({ migrationNum: item.migrationNum, organizationId: organizationId }, function (
        err,
        priority
      ) {
        winston.warn(JSON.stringify(err), JSON.stringify(priority))
        if (!err && (_.isUndefined(priority) || _.isNull(priority))) {
          return item.save(next)
        }

        return next(err)
      })
    },
    callback
  )
}

function normalizeTags (callback, organizationId) {
  var tagSchema = require('../models/tag')
  tagSchema.find({ organizationId: organizationId }, function (err, tags) {
    if (err) return callback(err)
    async.each(
      tags,
      function (tag, next) {
        tag.save(next)
      },
      callback
    )
  })
}

function checkPriorities (callback) {
  var ticketSchema = require('../models/ticket')
  var migrateP1 = false
  var migrateP2 = false
  var migrateP3 = false

  async.parallel(
    [
      function (done) {
        ticketSchema.collection.countDocuments({ priority: 1 }).then(function (count) {
          migrateP1 = count > 0
          return done()
        })
      },
      function (done) {
        ticketSchema.collection.countDocuments({ priority: 2 }).then(function (count) {
          migrateP2 = count > 0
          return done()
        })
      },
      function (done) {
        ticketSchema.collection.countDocuments({ priority: 3 }).then(function (count) {
          migrateP3 = count > 0
          return done()
        })
      }
    ],
    function () {
      async.parallel(
        [
          function (done) {
            if (!migrateP1) return done()
            PrioritySchema.getByMigrationNum(1, function (err, normal) {
              if (!err) {
                winston.debug('Converting Priority: Normal')
                ticketSchema.collection
                  .updateMany({ priority: 1 }, { $set: { priority: normal._id } })
                  .then(function (res) {
                    if (res && res.result) {
                      if (res.result.ok === 1) {
                        return done()
                      }

                      winston.warn(res.message)
                      return done(res.message)
                    }
                  })
              } else {
                winston.warn(err.message)
                return done()
              }
            })
          },
          function (done) {
            if (!migrateP2) return done()
            PrioritySchema.getByMigrationNum(2, function (err, urgent) {
              if (!err) {
                winston.debug('Converting Priority: Urgent')
                ticketSchema.collection
                  .updateMany({ priority: 2 }, { $set: { priority: urgent._id } })
                  .then(function (res) {
                    if (res && res.result) {
                      if (res.result.ok === 1) {
                        return done()
                      }

                      winston.warn(res.message)
                      return done(res.message)
                    }
                  })
              } else {
                winston.warn(err.message)
                return done()
              }
            })
          },
          function (done) {
            if (!migrateP3) return done()
            PrioritySchema.getByMigrationNum(3, function (err, critical) {
              if (!err) {
                winston.debug('Converting Priority: Critical')
                ticketSchema.collection
                  .updateMany({ priority: 3 }, { $set: { priority: critical._id } })
                  .then(function (res) {
                    if (res && res.result) {
                      if (res.result.ok === 1) {
                        return done()
                      }

                      winston.warn(res.message)
                      return done(res.message)
                    }
                  })
              } else {
                winston.warn(err.message)
                return done()
              }
            })
          }
        ],
        callback
      )
    }
  )
}

function addedDefaultPrioritesToTicketTypes (callback, organizationId) {
  async.waterfall(
    [
      function (next) {
        PrioritySchema.find({ default: true, organizationId: organizationId })
          .then(function (results) {
            return next(null, results)
          })
          .catch(next)
      },
      function (priorities, next) {
        priorities = _.sortBy(priorities, 'migrationNum')
        var ticketTypeSchema = require('../models/tickettype')
        ticketTypeSchema.getTypes(function (err, types) {
          if (err) return next(err)

          async.each(
            types,
            function (type, done) {
              var prioritiesToAdd = []
              if (!type.priorities || type.priorities.length < 1) {
                type.priorities = []
                prioritiesToAdd = _.map(priorities, '_id')
              }

              if (prioritiesToAdd.length < 1) {
                return done()
              }

              type.priorities = _.concat(type.priorities, prioritiesToAdd)
              type.save(done)
            },
            function () {
              next(null)
            }
          )
        }, organizationId)
      }
    ],
    callback
  )
}

function mailTemplates (callback, organizationId) {
  var newTicket = require('./json/mailer-new-ticket')
  var passwordReset = require('./json/mailer-password-reset')
  var templateSchema = require('../models/template')
  async.parallel(
    [
      function (done) {
        templateSchema.findOne({ name: newTicket.name, organizationId: organizationId }, function (err, templates) {
          if (err) return done(err)
          if (!templates || templates.length < 1) {
            newTicket.organizationId = organizationId
            return templateSchema.create(newTicket, done)
          }

          return done()
        })
      },
      function (done) {
        templateSchema.findOne({ name: passwordReset.name, organizationId: organizationId }, function (err, templates) {
          winston.warn(JSON.stringify(templates))
          if (err) return done(err)
          if (!templates || templates.length < 1) {
            passwordReset.organizationId = organizationId
            return templateSchema.create(passwordReset, done)
          }

          return done()
        })
      }
    ],
    callback
  )
}

function elasticSearchConfToDB (callback, organizationId) {
  var nconf = require('nconf')
  var elasticsearch = {
    enable: nconf.get('elasticsearch:enable'),
    host: nconf.get('elasticsearch:host'),
    port: nconf.get('elasticsearch:port')
  }

  nconf.set('elasticsearch', undefined)

  async.parallel(
    [
      function (done) {
        nconf.save(done)
      },
      function (done) {
        if (!elasticsearch.enable) return done()
        SettingsSchema.getSettingByName(
          'es:enable',
          function (err, setting) {
            if (err) return done(err)
            if (!setting) {
              SettingsSchema.create(
                {
                  name: 'es:enable',
                  value: elasticsearch.enable,
                  organizationId: organizationId
                },
                done
              )
            }
          },
          organizationId
        )
      },
      function (done) {
        if (!elasticsearch.host) return done()
        SettingsSchema.getSettingByName(
          'es:host',
          function (err, setting) {
            if (err) return done(err)
            if (!setting) {
              SettingsSchema.create(
                {
                  name: 'es:host',
                  value: elasticsearch.host,
                  organizationId: organizationId
                },
                done
              )
            }
          },
          organizationId
        )
      },
      function (done) {
        if (!elasticsearch.port) return done()
        SettingsSchema.getSettingByName(
          'es:port',
          function (err, setting) {
            if (err) return done(err)
            if (!setting) {
              SettingsSchema.create(
                {
                  name: 'es:port',
                  value: elasticsearch.port,
                  organizationId: organizationId
                },
                done
              )
            }
          },
          organizationId
        )
      }
    ],
    callback
  )
}

function installationID (callback, organizationId) {
  var Chance = require('chance')
  var chance = new Chance()
  SettingsSchema.getSettingByName(
    'gen:installid',
    function (err, setting) {
      if (err) return callback(err)
      if (!setting) {
        SettingsSchema.create(
          {
            name: 'gen:installid',
            value: chance.guid(),
            organizationId: organizationId
          },
          callback
        )
      } else {
        return callback()
      }
    },
    organizationId
  )
}

settingsDefaults.init = function (callback, organizationId) {
  winston.debug('Checking Default Settings...')
  async.series(
    [
      function (done) {
        return createDirectories(done)
      },
      function (done) {
        return downloadWin32MongoDBTools(done)
      },
      function (done) {
        return rolesDefault(done, organizationId)
      },
      function (done) {
        return defaultUserRole(done, organizationId)
      },
      function (done) {
        return timezoneDefault(done, organizationId)
      },
      function (done) {
        return ticketTypeSettingDefault(done, organizationId)
      },
      function (done) {
        winston.warn('starting ticketPriorityDefaults')
        return ticketPriorityDefaults(done, organizationId)
      },
      function (done) {
        winston.warn('starting addedDefaultPrioritesToTicketTypes')
        return addedDefaultPrioritesToTicketTypes(done, organizationId)
      },
      function (done) {
        winston.warn('starting checkPriorities')

        return checkPriorities(done)
      },
      function (done) {
        winston.warn('starting normalizeTags')

        return normalizeTags(done, organizationId)
      },
      function (done) {
        winston.warn('starting mailTemplates')

        return mailTemplates(done, organizationId)
      },
      function (done) {
        winston.warn('starting elasticSearchConfToDB')
        return elasticSearchConfToDB(done, organizationId)
      },
      function (done) {
        winston.warn('starting installationID')
        return installationID(done, organizationId)
      }
    ],
    function (err) {
      if (err) winston.warn(err)
      winston.warn(JSON.stringify(callback))
      if (_.isFunction(callback)) return callback()
    }
  )
}

module.exports = settingsDefaults
