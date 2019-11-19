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
 *  Updated:    2/14/19 12:05 AM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

var _ = require('lodash')
var async = require('async')
var winston = require('winston')
var apiUtils = require('../apiUtils')
var Ticket = require('../../../models/ticket')
var Group = require('../../../models/group')
var Role = require('../../../models/role')
var Department = require('../../../models/department')
var SwiziConnector = require('../../../connectors/SwiziConnector')

var ticketsV2 = {}

ticketsV2.create = function (req, res) {
  var postTicket = req.body
  if (!postTicket) return apiUtils.sendApiError_InvalidPostData(res)
}

ticketsV2.get = function (req, res) {
  // console.log(req.user)
  // console.log(req.user.organizationId)

  var query = req.query
  var type = query.type || 'all'

  try {
    var limit = query.limit ? parseInt(query.limit) : 50
    var page = query.page ? parseInt(query.page) : 0
  } catch (e) {
    winston.debug(e)
    return apiUtils.sendApiError_InvalidPostData(res)
  }

  var queryObject = {
    limit: limit,
    page: page,
    organizationId: req.user.organizationId
  }

  async.waterfall(
    [
      function (next) {
        if (req.user.role.isAdmin || req.user.role.isAgent) {
          Department.getUserDepartments(
            req.user.id,
            function (err, departments) {
              if (err) return next(err)

              if (_.some(departments, { allGroups: true })) {
                Group.find({ organizationId: req.user.organizationId }, next)
              } else {
                var groups = _.flattenDeep(
                  departments.map(function (d) {
                    return d.groups.map(function (g) {
                      return g._id
                    })
                  })
                )

                return next(null, groups)
              }
            },
            req.user.organizationId
          )
        } else {
          Group.getAllGroupsOfUser(req.user.id, next, req.user.organizationId)
        }
      },
      function (groups, next) {
        var mappedGroups = groups.map(function (g) {
          return g._id
        })

        switch (type.toLowerCase()) {
          case 'active':
            queryObject.status = [0, 1, 2]
            break
          case 'assigned':
            queryObject.filter = {
              assignee: [req.user.id]
            }
            break
          case 'unassigned':
            queryObject.unassigned = true
            break
          case 'new':
            queryObject.status = [0]
            break
          case 'open':
            queryObject.status = [1]
            break
          case 'pending':
            queryObject.status = [2]
            break
          case 'closed':
            queryObject.status = [3]
            break
          case 'filter':
            try {
              queryObject.filter = JSON.parse(query.filter)
              queryObject.status = queryObject.filter.status
            } catch (error) {
              winston.warn(error)
            }
            break
        }

        Ticket.getTicketsWithObject(mappedGroups, queryObject, function (err, tickets) {
          if (err) return next(err)
          let Swizi = new SwiziConnector({ apikey: req.user.swiziApiKey })
          let userIds = []
          for (let i = 0; i < tickets.length; i++) {
            userIds.push(tickets[i].owner)
            if (tickets[i].assignee) userIds.push(tickets[i].assignee)
            userIds = userIds.concat(tickets[i].subscribers)
            for (let j = 0; j < tickets[i].history.length; j++) {
              userIds.push(tickets[i].history[j].owner)
            }
            for (let j = 0; j < tickets[i].comments.length; j++) {
              userIds.push(tickets[i].history[j].owner)
            }
            for (let j = 0; j < tickets[i].notes.length; j++) {
              userIds.push(tickets[i].history[j].owner)
            }
          }
          userIds = _.uniq(userIds)
          console.log(userIds)
          tickets = JSON.parse(JSON.stringify(tickets))
          if (userIds.length) {
            Swizi.findUserByIds(userIds).then(users => {
              for (let i = 0; i < tickets.length; i++) {
                tickets[i].owner = users.find(u => u.id === tickets[i].owner)
                console.log(users.find(u => u.id === tickets[i].owner))
                console.log(tickets[i].owner)
                if (tickets[i].assignee) tickets[i].assignee = users.find(u => u.id === tickets[i].assignee)
                tickets[i].subscribers = tickets[i].subscribers.map(t => users.find(u => u.id === t))
                for (let j = 0; j < tickets[i].history.length; j++) {
                  tickets[i].history[j].owner = users.find(u => u.id === tickets[i].history[j].owner)
                }
                for (let j = 0; j < tickets[i].comments.length; j++) {
                  tickets[i].comments[j].owner = users.find(u => u.id === tickets[i].comments[j].comments)
                }
                for (let j = 0; j < tickets[i].notes.length; j++) {
                  tickets[i].notes[j].owner = users.find(u => u.id === tickets[i].notes[j].notes)
                }
              }
              console.log(users)
              return next(null, mappedGroups, tickets)
            })
          } else {
            return next(null, mappedGroups, tickets)
          }
        })
      },
      function (mappedGroups, tickets, done) {
        Ticket.getCountWithObject(mappedGroups, queryObject, function (err, count) {
          if (err) return done(err)

          return done(null, {
            tickets: tickets,
            totalCount: count
          })
        })
      }
    ],
    function (err, resultObject) {
      console.log(err)
      if (err) return apiUtils.sendApiError(res, 500, err.message)

      return apiUtils.sendApiSuccess(res, {
        tickets: resultObject.tickets,
        count: resultObject.tickets.length,
        totalCount: resultObject.totalCount,
        page: page,
        prevPage: page === 0 ? 0 : page - 1,
        nextPage: page * limit + limit <= resultObject.totalCount ? page + 1 : page
      })
    }
  )
}

ticketsV2.single = function (req, res) {
  var uid = req.params.uid
  if (!uid) return apiUtils.sendApiError(res, 400, 'Invalid Parameters')
  var organizationId = req.user.organizationId
  if (!organizationId) return apiUtils.sendApiError(res, 400, 'Invalid Organization Id')

  Ticket.getTicketByUid(req.user.organizationId, uid, function (err, ticket) {
    if (err) return apiUtils.sendApiError(res, 500, err)
    ticket = JSON.parse(JSON.stringify(ticket))
    let Swizi = new SwiziConnector({ apikey: req.user.swiziApiKey })
    let userIds = []
    userIds.push(ticket.owner)
    if (ticket.assignee) userIds.push(ticket.assignee)
    userIds = userIds.concat(ticket.subscribers)
    for (let j = 0; j < ticket.history.length; j++) {
      userIds.push(ticket.history[j].owner)
    }
    for (let j = 0; j < ticket.comments.length; j++) {
      userIds.push(ticket.comments[j].owner)
    }
    for (let j = 0; j < ticket.notes.length; j++) {
      userIds.push(ticket.notes[j].owner)
    }
    userIds = _.uniq(userIds)
    console.log(userIds)
    if (userIds.length) {
      Swizi.findUserByIds(userIds).then(users => {
        async.eachSeries(
          users,
          function (account, next) {
            Role.getRoleBySwiziGroup(
              account.groups,
              function (err, role) {
                if (err) return apiUtils.sendApiError(res, 500, err.message)
                if (role) {
                  account.role = role
                }
                Group.getAllGroupsOfUser(
                  account.id,
                  function (err, groups) {
                    if (err) return apiUtils.sendApiError(res, 500, err.message)
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
            if (err) return apiUtils.sendApiError(res, 500, err.message)
            ticket.owner = users.find(u => u.id === ticket.owner)
            if (ticket.assignee) ticket.assignee = users.find(u => u.id === ticket.assignee)
            ticket.subscribers = ticket.subscribers.map(t => users.find(u => u.id === t))
            for (let j = 0; j < ticket.history.length; j++) {
              ticket.history[j].owner = users.find(u => u.id === ticket.history[j].owner)
            }
            for (let j = 0; j < ticket.comments.length; j++) {
              ticket.comments[j].owner = users.find(u => u.id === ticket.comments[j].owner)
            }
            for (let j = 0; j < ticket.notes.length; j++) {
              ticket.notes[j].owner = users.find(u => u.id === ticket.notes[j].owner)
            }
            return apiUtils.sendApiSuccess(res, { ticket: ticket })
          }
        )
      })
    } else {
      return apiUtils.sendApiSuccess(res, { ticket: ticket })
    }
  })
}

ticketsV2.update = function (req, res) {
  var uid = req.params.uid
  var putTicket = req.body.ticket
  if (!uid || !putTicket) return apiUtils.sendApiError(res, 400, 'Invalid Parameters')

  // todo: complete this...
  Ticket.getTicketByUid(uid, function (err, ticket) {
    if (err) return apiUtils.sendApiError(res, 500, err.message)

    return apiUtils.sendApiSuccess(res, ticket)
  })
}

ticketsV2.batchUpdate = function (req, res) {
  var batch = req.body.batch
  if (!_.isArray(batch)) return apiUtils.sendApiError_InvalidPostData(res)
  var organizationId = req.user.organizationId
  if (!organizationId) return apiUtils.sendApiError(res, 400, 'Invalid Organization Id')

  async.each(
    batch,
    function (batchTicket, next) {
      Ticket.getTicketById(
        batchTicket.id,
        function (err, ticket) {
          if (err) return next(err)

          if (!_.isUndefined(batchTicket.status)) {
            ticket.status = batchTicket.status
            var HistoryItem = {
              action: 'ticket:set:status',
              description: 'status set to: ' + batchTicket.status,
              owner: req.user.id
            }

            ticket.history.push(HistoryItem)
          }

          return ticket.save(next)
        },
        organizationId
      )
    },
    function (err) {
      if (err) return apiUtils.sendApiError(res, 400, err.message)

      return apiUtils.sendApiSuccess(res)
    }
  )
}

ticketsV2.delete = function (req, res) {
  var uid = req.params.uid
  if (!uid) return apiUtils.sendApiError(res, 400, 'Invalid Parameters')

  var organizationId = req.user.organizationId
  if (!organizationId) return apiUtils.sendApiError(res, 400, 'Invalid Organization Id')

  Ticket.softDeleteUid(
    uid,
    function (err, success) {
      if (err) return apiUtils.sendApiError(res, 500, err.message)
      if (!success) return apiUtils.sendApiError(res, 500, 'Unable to delete ticket')

      return apiUtils.sendApiSuccess(res, { deleted: true })
    },
    organizationId
  )
}

module.exports = ticketsV2
