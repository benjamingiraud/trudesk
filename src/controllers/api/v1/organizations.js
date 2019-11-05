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

var winston = require('winston')
var async = require('async')
var Chance = require('chance')
var changeCase = require('change-case')

var OrganizationSchema = require('../../../models/organization')

var DefaultSettings = require('../../../settings/defaults')

var apiOrganization = {}

/**
 * @api {post} /api/v1/organization Create Organization
 * @apiName createOrganization
 * @apiDescription Creates an organization with the given post data.
 * @apiVersion 0.1.0
 * @apiGroup Organization
 * @apiHeader {string} accesstoken The access token for the logged in user
 *
 * @apiParamExample {json} Request-Example:
 * {
 *      "name": "Organization Name",
 * 			"user": {
 * 				"username": "toto",
 * 				"password": "toto",
 * 				"fullname": "toto toto",
 * 				"email": "toto@toto.com"
 * 			}
 * }
 *
 * @apiExample Example usage:
 * curl -X POST -H "accesstoken: {accesstoken}" -l http://localhost/api/v1/organization
 *
 * @apiSuccess {object} organization Organization Object that was created.
 *
 * @apiError InvalidPostData The data was invalid
 * @apiErrorExample
 *      HTTP/1.1 400 Bad Request
 {
     "error": "Invalid Post Data"
 }
 */
apiOrganization.create = function (req, res) {
  var postData = req.body
  var user = postData.user
  var swiziApiKey = postData.swiziApiKey
  var name = postData.name

  if (_.isNil(name) || _.isNil(user) || _.isNil(swiziApiKey))
    return res.status(400).send({ success: false, error: 'Invalid Post Data' })
  let slug = changeCase.paramCase(name)
  OrganizationSchema.find({ slug: slug }, function (err, r) {
    console.log(err, r)
    if (r.length) return res.status(409).send({ success: false, error: 'Organization already exists' })
    else {
      var organization = new OrganizationSchema(postData)

      organization.save(function (err, organization) {
        if (err) {
          winston.debug(err)
          return res.status(400).send({ success: false, error: 'Invalid Post Data' })
        }
        const organizationId = organization._id

        var roleSchema = require('../../../models/role')
        var UserSchema = require('../../../models/user')
        var TicketTypeSchema = require('../../../models/tickettype')
        var SettingsSchema = require('../../../models/setting')

        async.waterfall(
          [
            function (next) {
              var s = new SettingsSchema({
                name: 'gen:version',
                value: require('../../../../package.json').version,
                organizationId: organizationId
              })

              return s.save(function (err) {
                return next(err)
              })
            },
            function (next) {
              var type = new TicketTypeSchema({
                name: 'Incident',
                organizationId: organizationId
              })

              type.save(function (err) {
                return next(err)
              })
            },
            function (next) {
              var type = new TicketTypeSchema({
                name: 'Demande',
                organizationId: organizationId
              })

              type.save(function (err) {
                return next(err)
              })
            },
            function (next) {
              var defaults = DefaultSettings
              var roleResults = {}
              async.parallel(
                [
                  function (done) {
                    roleSchema.create(
                      {
                        name: 'Admin',
                        description: 'Rôle par défaut pour les administrateur',
                        grants: defaults.roleDefaults.adminGrants,
                        organizationId: organizationId
                      },
                      function (err, role) {
                        if (err) return done(err)
                        roleResults.adminRole = role
                        return done()
                      }
                    )
                  },
                  function (done) {
                    roleSchema.create(
                      {
                        name: 'Support',
                        description: "Rôle par défaut pour l'équipe support",
                        grants: defaults.roleDefaults.supportGrants,
                        organizationId: organizationId
                      },
                      function (err, role) {
                        if (err) return done(err)
                        roleResults.supportRole = role
                        return done()
                      }
                    )
                  },
                  function (done) {
                    roleSchema.create(
                      {
                        name: 'Utilisateur',
                        description: 'Rôle par défaut pour les utilisateurs',
                        grants: defaults.roleDefaults.userGrants,
                        organizationId: organizationId
                      },
                      function (err, role) {
                        if (err) return done(err)
                        roleResults.userRole = role
                        return done()
                      }
                    )
                  }
                ],
                function (err) {
                  return next(err, roleResults)
                }
              )
            },
            function (roleResults, next) {
              var TeamSchema = require('../../../models/team')
              TeamSchema.create(
                {
                  name: 'Support',
                  members: [],
                  organizationId: organizationId
                },
                function (err, team) {
                  return next(err, team, roleResults)
                }
              )
            },
            function (defaultTeam, roleResults, next) {
              UserSchema.getUserByUsername(
                user.username,
                function (err, admin) {
                  if (err) {
                    winston.error('Database Error: ' + err.message)
                    return next('Database Error: ' + err.message)
                  }

                  if (!_.isNull(admin) && !_.isUndefined(admin) && !_.isEmpty(admin)) {
                    return next('Username: ' + user.username + ' already exists.')
                  }

                  if (user.password !== user.passconfirm) {
                    return next('Passwords do not match!')
                  }

                  var chance = new Chance()
                  var adminUser = new UserSchema({
                    username: user.username,
                    password: user.password,
                    fullname: user.fullname,
                    email: user.email,
                    role: roleResults.adminRole._id,
                    title: 'Administrateur',
                    accessToken: chance.hash(),
                    organizationId: organizationId
                  })

                  adminUser.save(function (err, savedUser) {
                    if (err) {
                      winston.error('Database Error: ' + err.message)
                      return next('Database Error: ' + err.message)
                    }

                    defaultTeam.addMember(savedUser._id, function (err, success) {
                      if (err) {
                        winston.error('Database Error: ' + err.message)
                        return next('Database Error: ' + err.message)
                      }

                      if (!success) {
                        return next('Unable to add user to Administrator group!')
                      }

                      defaultTeam.save(function (err) {
                        if (err) {
                          winston.error('Database Error: ' + err.message)
                          return next('Database Error: ' + err.message)
                        }

                        return next(null, defaultTeam)
                      })
                    })
                  })
                },
                organizationId
              )
            },
            function (defaultTeam, next) {
              var DepartmentSchema = require('../../../models/department')
              DepartmentSchema.create(
                {
                  name: 'Support - Tout les groupes',
                  teams: [defaultTeam._id],
                  allGroups: true,
                  groups: [],
                  organizationId: organizationId
                },
                function (err) {
                  return next(err)
                }
              )
            },
            function (next) {
              DefaultSettings.init(next, organization._id)
            }
          ],
          function (err) {
            if (err) {
              return res.status(400).json({ success: false, error: err })
            }
            console.log('hey1')
            res.json({ success: true, organization: organization })
          }
        )
        console.log('hey2')
      })
    }
  })
}

apiOrganization.get = function (req, res) {
  var organizationId = req.params.id
  if (!organizationId) return res.status(400).json({ success: false, error: 'Invalid Organization Id' })

  OrganizationSchema.find({ _id: organizationId }, function (err, r) {
    if (err) return res.status(400).json({ success: false, error: err })
    return res.json({ success: true, organization: r })
  })
}
apiOrganization.getBySlug = function (req, res) {
  var organizationId = req.params.id
  if (!organizationId) return res.status(400).json({ success: false, error: 'Invalid Organization Id' })

  OrganizationSchema.find({ slug: organizationId }, function (err, r) {
    if (err) return res.status(400).json({ success: false, error: err })
    return res.json({ success: true, organization: r })
  })
}

module.exports = apiOrganization
