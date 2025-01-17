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
 *  Updated:    3/14/19 12:31 AM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

var _ = require('lodash')
var async = require('async')
var Team = require('../../../models/team')
var apiUtils = require('../apiUtils')
var SwiziConnector = require('../../../connectors/SwiziConnector')

var apiTeams = {}

apiTeams.get = function (req, res) {
  var organizationId = req.user.organizationId
  if (!organizationId) return apiUtils.sendApiError(res, 400, 'Invalid Organization Id')

  var limit = 10
  if (!_.isUndefined(req.query.limit)) {
    try {
      limit = parseInt(req.query.limit)
    } catch (err) {
      limit = 10
    }
  }

  var page = 0
  if (req.query.page) {
    try {
      page = parseInt(req.query.page)
    } catch (err) {
      page = 0
    }
  }

  var obj = {
    limit: limit,
    page: page,
    organizationId: organizationId
  }

  Team.getWithObject(obj, function (err, results) {
    if (err) return apiUtils.sendApiError(res, 400, err.message)
    let Swizi = new SwiziConnector({ apikey: req.user.swiziApiKey })

    let usersId = []
    for (let i = 0; i < results.length; i++) {
      if (results[i].members.length) {
        usersId = usersId.concat(results[i].members)
      }
    }
    usersId = _.uniq(usersId)
    if (usersId.length) {
      Swizi.findUserByIds(usersId).then(users => {
        for (let i = 0; i < results.length; i++) {
          if (results[i].members.length) {
            for (let j = 0; j < results[i].members.length; j++) {
              if (users.find(u => u.id === results[i].members[j]))
                results[i].members[j] = users.find(u => u.id === results[i].members[j])
            }
          }
        }
        if (req.query.locale) {
          results = results.map(d => d.localize(req.query.locale))
        }
        return apiUtils.sendApiSuccess(res, { count: results.length, teams: results })
      })
    } else {
      if (req.query.locale) {
        results = results.map(d => d.localize(req.query.locale))
      }
      return apiUtils.sendApiSuccess(res, { count: results.length, teams: results })
    }
  })
}

apiTeams.create = function (req, res) {
  var postData = req.body
  if (!postData) return apiUtils.sendApiError_InvalidPostData(res)

  var organizationId = req.user.organizationId
  if (!organizationId) return apiUtils.sendApiError(res, 400, 'Invalid Organization Id')

  postData.organizationId = organizationId

  Team.create(postData, function (err, team) {
    if (err) return apiUtils.sendApiError(res, 500, err.message)
    if (team.members.length) {
      let Swizi = new SwiziConnector({ apikey: req.user.swiziApiKey })
      let usersId = _.uniq(team.members)
      Swizi.findUserByIds(usersId).then(users => {
        for (let j = 0; j < team.members.length; j++) {
          if (users.find(u => u.id === team.members[j])) team.members[j] = users.find(u => u.id === team.members[j])
        }
        return apiUtils.sendApiSuccess(res, { team: team })
      })
    } else {
      return apiUtils.sendApiSuccess(res, { team: team })
    }
    // return apiUtils.sendApiSuccess(res, { team: team })

    // team.populate('members', function (err, team) {
    //   if (err) return apiUtils.sendApiError(res, 500, err.message)

    //   return apiUtils.sendApiSuccess(res, { team: team })
    // })
  })
}

apiTeams.update = function (req, res) {
  var id = req.params.id
  if (!id) return apiUtils.sendApiError(res, 400, 'Invalid Team Id')

  var putData = req.body
  if (!putData) return apiUtils.sendApiError_InvalidPostData(res)

  var organizationId = req.user.organizationId
  if (!organizationId) return apiUtils.sendApiError(res, 400, 'Invalid Organization Id')

  Team.findOne({ _id: id, organizationId: organizationId }, function (err, team) {
    if (err || !team) return apiUtils.sendApiError(res, 400, 'Invalid Team')

    if (putData.name) team.name = putData.name
    if (putData.members) team.members = putData.members

    team.save(function (err, team) {
      if (err) return apiUtils.sendApiError(res, 500, err.message)
      if (team.members.length) {
        let Swizi = new SwiziConnector({ apikey: req.user.swiziApiKey })
        let usersId = _.uniq(team.members)
        Swizi.findUserByIds(usersId).then(users => {
          for (let j = 0; j < team.members.length; j++) {
            if (users.find(u => u.id === team.members[j])) team.members[j] = users.find(u => u.id === team.members[j])
          }
          return apiUtils.sendApiSuccess(res, { team: team })
        })
      } else {
        return apiUtils.sendApiSuccess(res, { team: team })
      }
    })
  })
}
apiTeams.delete = function (req, res) {
  var id = req.params.id
  if (!id) return apiUtils.sendApiError(res, 400, 'Invalid Team Id')

  var organizationId = req.user.organizationId
  if (!organizationId) return apiUtils.sendApiError(res, 400, 'Invalid Organization Id')

  Team.deleteOne({ _id: id, organizationId: organizationId }, function (err, success) {
    if (err) return apiUtils.sendApiError(res, 500, err.message)
    if (!success) return apiUtils.sendApiError(res, 500, 'Unable to delete team. Contact your administrator.')

    return apiUtils.sendApiSuccess(res, { _id: id })
  })
}

module.exports = apiTeams
