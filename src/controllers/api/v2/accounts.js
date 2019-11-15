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
 *  Updated:    4/8/19 1:00 AM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

var _ = require('lodash')
var async = require('async')
var apiUtil = require('../apiUtils')
var User = require('../../../models/user')
var Role = require('../../../models/role')
var Group = require('../../../models/group')
var Team = require('../../../models/team')
var Department = require('../../../models/department')
var SwiziConnector = require('../../../connectors/SwiziConnector')
var accountsApi = {}

accountsApi.create = function (req, res) {
  var postData = req.body
  if (!postData) return apiUtil.sendApiError_InvalidPostData(res)
  var organizationId = req.user.organizationId
  var savedId = null

  async.series(
    {
      user: function (next) {
        User.create(
          {
            username: postData.username,
            email: postData.email,
            password: postData.password,
            fullname: postData.fullname,
            title: postData.title,
            role: postData.role,
            organizationId: organizationId
          },
          function (err, user) {
            if (err) return apiUtil.sendApiError(res, 500, err.message)

            savedId = user.id

            return user.populate('role', next)
          }
        )
      },
      groups: function (next) {
        if (!postData.groups) return next(null, [])

        Group.getGroups(
          postData.groups,
          function (err, groups) {
            if (err) return next(err)

            async.each(
              groups,
              function (group, callback) {
                group.addMember(savedId, function (err) {
                  if (err) return callback(err)
                  group.save(callback)
                })
              },
              function (err) {
                if (err) return next(err)

                return next(null, groups)
              }
            )
          },
          organizationId
        )
      },
      teams: function (next) {
        if (!postData.teams) return next()

        Team.getTeamsByIds(
          postData.teams,
          function (err, teams) {
            if (err) return next(err)

            async.each(
              teams,
              function (team, callback) {
                team.addMember(savedId, function () {
                  team.save(callback)
                })
              },
              function (err) {
                if (err) return next(err)

                return next(null, teams)
              }
            )
          },
          organizationId
        )
      },
      departments: function (next) {
        Department.getUserDepartments(savedId, next, organizationId)
      }
    },
    function (err, results) {
      if (err) return apiUtil.sendApiError(res, 500, err.message)

      var user = results.user.toJSON()
      user.groups = results.groups.map(function (g) {
        return { _id: g._id, name: g.name }
      })

      if ((user.role.isAgent || user.role.isAdmin) && results.teams) {
        user.teams = results.teams.map(function (t) {
          return { _id: t._id, name: t.name }
        })

        user.departments = results.departments.map(function (d) {
          return { _id: d._id, name: d.name }
        })
      }

      return apiUtil.sendApiSuccess(res, { account: user })
    }
  )
}

accountsApi.get = function (req, res) {
  var query = req.query
  var type = query.type || 'customers'
  var limit = query.limit ? Number(query.limit) : 25
  var page = query.page ? Number(query.page) : 0
  var organizationId = req.user.organizationId
  console.log(req.organization)
  var obj = {
    limit: limit === -1 ? 999999 : limit,
    page: page,
    showDeleted: query.showDeleted && query.showDeleted === 'true',
    organizationId: organizationId
  }

  switch (type) {
    case 'all':
      Role.getRolesLean(function (err, roles) {
        if (err) return apiUtil.sendApiError(res, 500, err.message)
        if (roles.length) {
          let swiziGrpsId = []
          for (let i = 0; i < roles.length; i++) swiziGrpsId = swiziGrpsId.concat(roles[i].swiziGroupIds)
          swiziGrpsId = _.uniq(swiziGrpsId)

          let Swizi = new SwiziConnector({ apikey: req.user.swiziApiKey })
          let promsiseUsers = []
          for (let i = 0; i < swiziGrpsId.length; i++) {
            promsiseUsers.push(Swizi.findUsersByGroup(swiziGrpsId[i]))
          }
          Promise.all(promsiseUsers).then(users => {
            let resAccounts = _.flatten(users)
            resAccounts = _.uniqBy(resAccounts, 'id')
            async.eachSeries(
              resAccounts,
              function (account, next) {
                Role.getRoleBySwiziGroup(
                  account.groups,
                  function (err, role) {
                    if (err) return apiUtil.sendApiError(res, 500, err.message)
                    if (role) {
                      account.role = role
                    }
                    next()
                  },
                  organizationId
                )
              },
              function (err) {
                if (err) return apiUtil.sendApiError(res, 500, err.message)
                return apiUtil.sendApiSuccess(res, { accounts: resAccounts, count: resAccounts.length })
              }
            )
          })
        }
      }, organizationId)
      break
    case 'customers':
      Role.getCustomerRoles(function (err, roles) {
        if (err) return apiUtil.sendApiError(res, 500, err.message)
        if (roles.length) {
          let swiziGrpsId = []
          for (let i = 0; i < roles.length; i++) swiziGrpsId = swiziGrpsId.concat(roles[i].swiziGroupIds)
          swiziGrpsId = _.uniq(swiziGrpsId)

          let Swizi = new SwiziConnector({ apikey: req.user.swiziApiKey })
          let promsiseUsers = []
          for (let i = 0; i < swiziGrpsId.length; i++) {
            promsiseUsers.push(Swizi.findUsersByGroup(swiziGrpsId[i]))
          }
          Promise.all(promsiseUsers).then(users => {
            let resAccounts = _.flatten(users)
            resAccounts = _.uniqBy(resAccounts, 'id')
            async.eachSeries(
              resAccounts,
              function (account, next) {
                Role.getRoleBySwiziGroup(
                  account.groups,
                  function (err, role) {
                    if (err) return apiUtil.sendApiError(res, 500, err.message)
                    if (role) {
                      account.role = role
                    }
                    Group.getAllGroupsOfUser(
                      account.id,
                      function (err, groups) {
                        if (err) return apiUtil.sendApiError(res, 500, err.message)
                        account.tgroups = groups
                        next()
                      },
                      organizationId
                    )
                  },
                  organizationId
                )
              },
              function (err) {
                if (err) return apiUtil.sendApiError(res, 500, err.message)
                return apiUtil.sendApiSuccess(res, { accounts: resAccounts, count: resAccounts.length })
              }
            )
          })
        }
      }, organizationId)

      // User.getCustomers(obj, function (err, accounts) {
      //   if (err) return apiUtil.sendApiError(res, 500, err.message)

      //   var resAccounts = []

      //   async.eachSeries(
      //     accounts,
      //     function (account, next) {
      //       Group.getAllGroupsOfUser(
      //         account._id,
      //         function (err, groups) {
      //           if (err) return next(err)
      //           var a = account.toObject()
      //           a.groups = groups.map(function (group) {
      //             return { name: group.name, _id: group._id }
      //           })
      //           resAccounts.push(a)
      //           next()
      //         },
      //         organizationId
      //       )
      //     },
      //     function (err) {
      //       if (err) return apiUtil.sendApiError(res, 500, err.message)

      //       return apiUtil.sendApiSuccess(res, { accounts: resAccounts, count: resAccounts.length })
      //     }
      //   )
      // })
      break
    case 'agents':
      Role.getAgentRoles(function (err, roles) {
        if (err) return apiUtil.sendApiError(res, 500, err.message)
        if (roles.length) {
          let swiziGrpsId = []
          for (let i = 0; i < roles.length; i++) swiziGrpsId = swiziGrpsId.concat(roles[i].swiziGroupIds)
          swiziGrpsId = _.uniq(swiziGrpsId)

          let Swizi = new SwiziConnector({ apikey: req.user.swiziApiKey })
          let promsiseUsers = []
          for (let i = 0; i < swiziGrpsId.length; i++) {
            promsiseUsers.push(Swizi.findUsersByGroup(swiziGrpsId[i]))
          }
          Promise.all(promsiseUsers).then(users => {
            let resAccounts = _.flatten(users)
            resAccounts = _.uniqBy(resAccounts, 'id')
            async.eachSeries(
              resAccounts,
              function (account, next) {
                Role.getRoleBySwiziGroup(
                  account.groups,
                  function (err, role) {
                    if (err) return apiUtil.sendApiError(res, 500, err.message)
                    if (role) {
                      account.role = role
                    }
                    next()
                  },
                  organizationId
                )
              },
              function (err) {
                if (err) return apiUtil.sendApiError(res, 500, err.message)
                return apiUtil.sendApiSuccess(res, { accounts: resAccounts, count: resAccounts.length })
              }
            )
          })
        }
      }, organizationId)
      // User.getAgents(obj, function (err, accounts) {
      //   if (err) return apiUtil.sendApiError(res, 500, err.message)

      //   var resAccounts = []
      //   async.eachSeries(
      //     accounts,
      //     function (account, next) {
      //       var a = account.toObject()
      //       Department.getUserDepartments(
      //         account._id,
      //         function (err, departments) {
      //           if (err) return next(err)

      //           a.departments = departments.map(function (department) {
      //             return { name: department.name, _id: department._id }
      //           })

      //           Team.getTeamsOfUser(
      //             account._id,
      //             function (err, teams) {
      //               if (err) return next(err)
      //               a.teams = teams.map(function (team) {
      //                 return { name: team.name, _id: team._id }
      //               })
      //               resAccounts.push(a)
      //               next()
      //             },
      //             organizationId
      //           )
      //         },
      //         organizationId
      //       )
      //     },
      //     function (err) {
      //       if (err) return apiUtil.sendApiError(res, 500, err.message)

      //       return apiUtil.sendApiSuccess(res, { accounts: resAccounts, count: resAccounts.length })
      //     }
      //   )
      // })
      break
    case 'admins':
      Role.getAdminRoles(function (err, roles) {
        if (err) return apiUtil.sendApiError(res, 500, err.message)
        if (roles.length) {
          let swiziGrpsId = []
          for (let i = 0; i < roles.length; i++) swiziGrpsId = swiziGrpsId.concat(roles[i].swiziGroupIds)
          swiziGrpsId = _.uniq(swiziGrpsId)

          let Swizi = new SwiziConnector({ apikey: req.user.swiziApiKey })
          let promsiseUsers = []
          for (let i = 0; i < swiziGrpsId.length; i++) {
            promsiseUsers.push(Swizi.findUsersByGroup(swiziGrpsId[i]))
          }
          Promise.all(promsiseUsers).then(users => {
            let resAccounts = _.flatten(users)
            resAccounts = _.uniqBy(resAccounts, 'id')
            async.eachSeries(
              resAccounts,
              function (account, next) {
                Role.getRoleBySwiziGroup(
                  account.groups,
                  function (err, role) {
                    if (err) return apiUtil.sendApiError(res, 500, err.message)
                    if (role) {
                      account.role = role
                    }
                    next()
                  },
                  organizationId
                )
              },
              function (err) {
                if (err) return apiUtil.sendApiError(res, 500, err.message)
                return apiUtil.sendApiSuccess(res, { accounts: resAccounts, count: resAccounts.length })
              }
            )
          })
        }
      }, organizationId)
      // User.getAdmins(obj, function (err, accounts) {
      //   if (err) return apiUtil.sendApiError(res, 500, err.message)

      //   var resAccounts = []
      //   async.eachSeries(
      //     accounts,
      //     function (account, next) {
      //       var a = account.toObject()
      //       Department.getUserDepartments(
      //         account._id,
      //         function (err, departments) {
      //           if (err) return next(err)

      //           a.departments = departments.map(function (department) {
      //             return { name: department.name, _id: department._id }
      //           })

      //           Team.getTeamsOfUser(
      //             account._id,
      //             function (err, teams) {
      //               if (err) return next(err)
      //               a.teams = teams.map(function (team) {
      //                 return { name: team.name, _id: team._id }
      //               })
      //               resAccounts.push(a)
      //               next()
      //             },
      //             organizationId
      //           )
      //         },
      //         organizationId
      //       )
      //     },
      //     function (err) {
      //       if (err) return apiUtil.sendApiError(res, 500, err.message)

      //       return apiUtil.sendApiSuccess(res, { accounts: resAccounts, count: resAccounts.length })
      //     }
      //   )
      // })
      break
    default:
      return apiUtil.sendApiError_InvalidPostData(res)
  }
}

accountsApi.update = function (req, res) {
  var username = req.params.username
  var postData = req.body
  if (!username || !postData) return apiUtil.sendApiError_InvalidPostData(res)
  var organizationId = req.user.organizationId

  async.series(
    {
      user: function (next) {
        User.getByUsername(
          username,
          function (err, user) {
            if (err) return next(err)
            if (!user) return next({ message: 'Invalid User' })

            postData._id = user.id

            if (
              !_.isUndefined(postData.password) &&
              !_.isEmpty(postData.password) &&
              !_.isUndefined(postData.passwordConfirm) &&
              !_.isEmpty(postData.passwordConfirm)
            ) {
              if (postData.password === postData.passwordConfirm) {
                user.password = postData.password
              }
            }

            if (!_.isUndefined(postData.fullname) && postData.fullname.length > 0) user.fullname = postData.fullname
            if (!_.isUndefined(postData.email) && postData.email.length > 0) user.email = postData.email
            if (!_.isUndefined(postData.title) && postData.title.length > 0) user.title = postData.title
            if (!_.isUndefined(postData.role) && postData.role.length > 0) user.role = postData.role

            user.save(function (err, user) {
              if (err) return next(err)

              user.populate('role', function (err, populatedUser) {
                if (err) return next(err)
                var resUser = apiUtil.stripUserFields(populatedUser)

                return next(null, resUser)
              })
            })
          },
          organizationId
        )
      },
      groups: function (next) {
        if (!postData.groups) return Group.getAllGroupsOfUser(postData._id, next, organizationId)

        var userGroups = []
        Group.getAllGroups(function (err, groups) {
          if (err) return next(err)
          async.each(
            groups,
            function (grp, callback) {
              if (_.includes(postData.groups, grp._id.toString())) {
                if (grp.isMember(postData._id)) {
                  userGroups.push(grp)
                  return callback()
                }
                grp.addMember(postData._id, function (err, result) {
                  if (err) return callback(err)

                  if (result) {
                    grp.save(function (err) {
                      if (err) return callback(err)
                      userGroups.push(grp)
                      return callback()
                    })
                  } else {
                    return callback()
                  }
                })
              } else {
                // Remove Member from group
                grp.removeMember(postData._id, function (err, result) {
                  if (err) return callback(err)
                  if (result) {
                    grp.save(function (err) {
                      if (err) return callback(err)

                      return callback()
                    })
                  } else {
                    return callback()
                  }
                })
              }
            },
            function (err) {
              if (err) return next(err)

              return next(null, userGroups)
            }
          )
        }, organizationId)
      },
      teams: function (next) {
        if (!postData.teams) return Team.getTeamsOfUser(postData._id, next, organizationId)

        var userTeams = []
        Team.getTeams(function (err, teams) {
          if (err) return next(err)
          async.each(
            teams,
            function (team, callback) {
              if (_.includes(postData.teams, team._id.toString())) {
                if (team.isMember(postData._id)) {
                  userTeams.push(team)
                  return callback()
                }
                team.addMember(postData._id, function (err, result) {
                  if (err) return callback(err)

                  if (result) {
                    team.save(function (err) {
                      if (err) return callback(err)
                      userTeams.push(team)
                      return callback()
                    })
                  } else {
                    return callback()
                  }
                })
              } else {
                // Remove Member from group
                team.removeMember(postData._id, function (err, result) {
                  if (err) return callback(err)
                  if (result) {
                    team.save(function (err) {
                      if (err) return callback(err)

                      return callback()
                    })
                  } else {
                    return callback()
                  }
                })
              }
            },
            function (err) {
              if (err) return next(err)

              return next(null, userTeams)
            }
          )
        }, organizationId)
      },
      departments: function (next) {
        Department.getUserDepartments(postData._id, next, organizationId)
      }
    },
    function (err, results) {
      if (err) return apiUtil.sendApiError(res, 500, err.message)

      var user = results.user.toJSON()
      user.groups = results.groups.map(function (g) {
        return { _id: g._id, name: g.name }
      })

      if ((user.role.isAgent || user.role.isAdmin) && results.teams) {
        user.teams = results.teams.map(function (t) {
          return { _id: t._id, name: t.name }
        })

        user.departments = results.departments.map(function (d) {
          return { _id: d._id, name: d.name }
        })
      }

      return apiUtil.sendApiSuccess(res, { user: user })
    }
  )
}

module.exports = accountsApi
