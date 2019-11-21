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

var apiUtils = require('../apiUtils')
var Ticket = require('../../../models/ticket')
var Group = require('../../../models/group')
var Department = require('../../../models/department')
var SwiziConnector = require('../../../connectors/SwiziConnector')
var _ = require('lodash')

var apiGroups = {}

apiGroups.create = function (req, res) {
  var organizationId = req.user.organizationId
  if (!organizationId) return apiUtils.sendApiError(res, 400, 'Invalid Organization Id')

  var postGroup = req.body
  postGroup.organizationId = organizationId
  if (!postGroup) return apiUtils.sendApiError_InvalidPostData(res)

  Group.create(postGroup, function (err, group) {
    if (err) return apiUtils.sendApiError(res, 500, err.message)
    if (group.members.length) {
      let Swizi = new SwiziConnector({ apikey: req.user.swiziApiKey })
      let usersId = _.uniq(group.members)
      Swizi.findUserByIds(usersId).then(users => {
        for (let j = 0; j < group.members.length; j++) {
          if (users.find(u => u.id === group.members[j])) group.members[j] = users.find(u => u.id === group.members[j])
        }
        return apiUtils.sendApiSuccess(res, { group: group })
      })
    } else {
      return apiUtils.sendApiSuccess(res, { group: group })
    }
    // group.populate('members sendMailTo', function (err, group) {
    //   if (err) return apiUtils.sendApiError(res, 500, err.message)

    // })
  })
}

apiGroups.get = function (req, res) {
  var limit = Number(req.query.limit) || 50
  var page = Number(req.query.page) || 0
  var type = req.query.type || 'user'
  var organizationId = req.user.organizationId
  if (!organizationId) return apiUtils.sendApiError(res, 400, 'Invalid Organization Id')

  if (type === 'all') {
    Group.getWithObject({ limit: limit, page: page, organizationId: organizationId }, function (err, groups) {
      if (err) return apiUtils.sendApiError(res, 500, err.message)
      let Swizi = new SwiziConnector({ apikey: req.user.swiziApiKey })

      let usersId = []
      for (let i = 0; i < groups.length; i++) {
        if (groups[i].members.length) {
          usersId = usersId.concat(groups[i].members)
        }
      }
      usersId = _.uniq(usersId)
      if (usersId.length) {
        Swizi.findUserByIds(usersId).then(users => {
          for (let i = 0; i < groups.length; i++) {
            if (groups[i].members.length) {
              for (let j = 0; j < groups[i].members.length; j++) {
                if (users.find(u => u.id === groups[i].members[j]))
                  groups[i].members[j] = users.find(u => u.id === groups[i].members[j])
              }
            }
          }
          if (req.query.locale) {
            groups = groups.map(d => d.localize(req.query.locale))
          }
          return apiUtils.sendApiSuccess(res, { groups: groups, count: groups.length })
        })
      } else {
        if (req.query.locale) {
          groups = groups.map(d => d.localize(req.query.locale))
        }
        return apiUtils.sendApiSuccess(res, { groups: groups, count: groups.length })
      }
    })
  } else {
    if (req.user.role.isAdmin || req.user.role.isAgent) {
      Department.getDepartmentGroupsOfUser(
        req.user.id,
        function (err, groups) {
          if (err) return apiUtils.sendApiError(res, 500, err.message)
          if (req.query.locale) {
            groups = groups.map(d => d.localize(req.query.locale))
          }
          return apiUtils.sendApiSuccess(res, { groups: groups, count: groups.length })
        },
        organizationId
      )
    } else {
      Group.getAllGroupsOfUser(
        req.user.id,
        function (err, groups) {
          if (err) return apiUtils.sendApiError(res, 500, err.message)
          if (req.query.locale) {
            groups = groups.map(d => d.localize(req.query.locale))
          }
          return apiUtils.sendApiSuccess(res, { groups: groups, count: groups.length })
        },
        organizationId
      )
    }
  }
}

apiGroups.update = function (req, res) {
  var organizationId = req.user.organizationId
  if (!organizationId) return apiUtils.sendApiError(res, 400, 'Invalid Organization Id')

  var id = req.params.id
  if (!id) return apiUtils.sendApiError(res, 400, 'Invalid Group Id')

  var putData = req.body
  if (!putData) return apiUtils.sendApiError_InvalidPostData(res)

  Group.findOne({ _id: id, organizationId: organizationId }, function (err, group) {
    if (err || !group) return apiUtils.sendApiError(res, 400, 'Invalid Group')

    if (putData.name) group.name = putData.name
    if (putData.members) group.members = putData.members
    if (putData.sendMailTo) group.sendMailTo = putData.sendMailTo

    group.save(function (err, group) {
      if (err) return apiUtils.sendApiError(res, 500, err.message)
      if (group.members.length) {
        let Swizi = new SwiziConnector({ apikey: req.user.swiziApiKey })
        let usersId = _.uniq(group.members)
        Swizi.findUserByIds(usersId).then(users => {
          for (let j = 0; j < group.members.length; j++) {
            if (users.find(u => u.id === group.members[j]))
              group.members[j] = users.find(u => u.id === group.members[j])
          }
          return apiUtils.sendApiSuccess(res, { group: group })
        })
      } else {
        return apiUtils.sendApiSuccess(res, { group: group })
      }
      // group.populate('members sendMailTo', function (err, group) {
      //   if (err) return apiUtils.sendApiError(res, 500, err.message)

      //   return apiUtils.sendApiSuccess(res, { group: group })
      // })
    })
  })
}

apiGroups.delete = function (req, res) {
  var id = req.params.id
  if (!id) return apiUtils.sendApiError_InvalidPostData(res)

  var organizationId = req.user.organizationId
  if (!organizationId) return apiUtils.sendApiError(res, 400, 'Invalid Organization Id')

  Ticket.countDocuments({ group: { $in: [id] } }, function (err, tickets) {
    if (err) return apiUtils.sendApiError(res, 500, err.message)
    if (tickets > 0) return apiUtils.sendApiError(res, 400, 'Impossible de supprimer un groupe ayant des tickets.')

    Group.deleteOne({ _id: id, organizationId: organizationId }, function (err, success) {
      if (err) return apiUtils.sendApiError(res, 500, err.message)
      if (!success)
        return apiUtils.sendApiError(res, 500, 'Impossible de supprimer le groupe, contactez votre administrateur.')

      return apiUtils.sendApiSuccess(res, { _id: id })
    })
  })
}

module.exports = apiGroups
