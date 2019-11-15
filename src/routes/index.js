/*
      .                              .o8                     oooo
   .o8                             "888                     `888
 .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
   888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
   888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
   888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
   "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 ========================================================================
 **/

var express = require('express')
var router = express.Router()
var controllers = require('../controllers')
var path = require('path')
var winston = require('winston')
var packagejson = require('../../package.json')

function mainRoutes (router, middleware, controllers) {
  router.get(
    '/:organizationId',
    middleware.checkOrganization,
    middleware.redirectToDashboardIfLoggedIn,
    controllers.main.index
  )
  router.get('/healthz', function (req, res) {
    return res.status(200).send('OK')
  })
  router.get('/version', function (req, res) {
    return res.json({ version: packagejson.version })
  })
  router.get('/install', function (req, res) {
    return res.redirect('/')
  })
  router.get(
    '/:organizationId/dashboard',
    middleware.checkOrganization,
    middleware.redirectToLogin,
    middleware.redirectIfUser,
    middleware.loadCommonData,
    controllers.main.dashboard
  )

  router.get('/:organizationId/login', middleware.checkOrganization, function (req, res) {
    if (req.organization) {
      // console.log(req.organization.slug)
      res.redirect(`/${req.organization.slug}`)
    }
    return res.redirect(404)
  })

  router.post('/:organizationId/login', middleware.checkOrganization, controllers.main.loginPost)
  router.get('/l2auth', controllers.main.l2authget)
  router.post('/l2auth', controllers.main.l2AuthPost)
  router.get('/:organizationId/logout', middleware.checkOrganization, controllers.main.logout)
  router.post('/:organizationId/forgotpass', controllers.main.forgotPass)
  router.get('/:organizationId/resetpassword/:hash', controllers.main.resetPass)
  router.post('/forgotl2auth', controllers.main.forgotL2Auth)
  router.get('/resetl2auth/:hash', controllers.main.resetl2auth)

  // router.get('/about', middleware.redirectToLogin, middleware.loadCommonData, controllers.main.about)

  router.get('/captcha', function (req, res) {
    var svgCaptcha = require('svg-captcha')
    var captcha = svgCaptcha.create()
    req.session.captcha = captcha.text
    res.set('Content-Type', 'image/svg+xml')
    res.send(captcha.data)
  })

  // Public
  router.get('/:organizationId/newissue', controllers.tickets.pubNewIssue)
  router.get('/:organizationId/register', controllers.accounts.signup)
  router.get('/:organizationId/signup', controllers.accounts.signup)

  router.get('/:organizationId/logoimage', function (req, res) {
    var s = require('../models/setting')
    var _ = require('lodash')
    s.getSettingByName('gen:customlogo', function (err, hasCustomLogo) {
      if (!err && hasCustomLogo && hasCustomLogo.value) {
        s.getSettingByName('gen:customlogofilename', function (err, logoFilename) {
          if (!err && logoFilename && !_.isUndefined(logoFilename)) {
            return res.send('/assets/topLogo.png')
          }

          return res.send('/img/defaultLogoLight.png')
        })
      } else {
        return res.send('/img/defaultLogoLight.png')
      }
    })
  })

  // Tickets
  router.get(
    '/:organizationId/tickets',
    middleware.checkOrganization,
    middleware.redirectToLogin,
    middleware.loadCommonData,
    controllers.tickets.getActive,
    controllers.tickets.processor
  )
  router.get(
    '/:organizationId/tickets/filter',
    middleware.checkOrganization,
    middleware.redirectToLogin,
    middleware.loadCommonData,
    controllers.tickets.filter,
    controllers.tickets.processor
  )
  router.get(
    '/:organizationId/tickets/active',
    middleware.checkOrganization,
    middleware.redirectToLogin,
    middleware.loadCommonData,
    controllers.tickets.getActive,
    controllers.tickets.processor
  )
  router.get(
    '/:organizationId/tickets/active/page/:page',
    middleware.checkOrganization,
    middleware.redirectToLogin,
    middleware.loadCommonData,
    controllers.tickets.getActive,
    controllers.tickets.processor
  )
  router.get(
    '/:organizationId/tickets/new',
    middleware.checkOrganization,
    middleware.redirectToLogin,
    middleware.loadCommonData,
    controllers.tickets.getByStatus,
    controllers.tickets.processor
  )
  router.get(
    '/:organizationId/tickets/new/page/:page',
    middleware.checkOrganization,
    middleware.redirectToLogin,
    middleware.loadCommonData,
    controllers.tickets.getByStatus,
    controllers.tickets.processor
  )
  router.get(
    '/:organizationId/tickets/open',
    middleware.checkOrganization,
    middleware.redirectToLogin,
    middleware.loadCommonData,
    controllers.tickets.getByStatus,
    controllers.tickets.processor
  )
  router.get(
    '/:organizationId/tickets/open/page/:page',
    middleware.checkOrganization,
    middleware.redirectToLogin,
    middleware.loadCommonData,
    controllers.tickets.getByStatus,
    controllers.tickets.processor
  )
  router.get(
    '/:organizationId/tickets/pending',
    middleware.checkOrganization,
    middleware.redirectToLogin,
    middleware.loadCommonData,
    controllers.tickets.getByStatus,
    controllers.tickets.processor
  )
  router.get(
    '/:organizationId/tickets/pending/page/:page',
    middleware.checkOrganization,
    middleware.redirectToLogin,
    middleware.loadCommonData,
    controllers.tickets.getByStatus,
    controllers.tickets.processor
  )
  router.get(
    '/:organizationId/tickets/closed',
    middleware.checkOrganization,
    middleware.redirectToLogin,
    middleware.loadCommonData,
    controllers.tickets.getByStatus,
    controllers.tickets.processor
  )
  router.get(
    '/:organizationId/tickets/closed/page/:page',
    middleware.checkOrganization,
    middleware.redirectToLogin,
    middleware.loadCommonData,
    controllers.tickets.getByStatus,
    controllers.tickets.processor
  )
  router.get(
    '/:organizationId/tickets/assigned',
    middleware.checkOrganization,
    middleware.redirectToLogin,
    middleware.loadCommonData,
    controllers.tickets.getAssigned,
    controllers.tickets.processor
  )
  router.get(
    '/:organizationId/tickets/assigned/page/:page',
    middleware.checkOrganization,
    middleware.redirectToLogin,
    middleware.loadCommonData,
    controllers.tickets.getAssigned,
    controllers.tickets.processor
  )
  router.get(
    '/:organizationId/tickets/unassigned',
    middleware.checkOrganization,
    middleware.redirectToLogin,
    middleware.loadCommonData,
    controllers.tickets.getUnassigned,
    controllers.tickets.processor
  )
  router.get(
    '/:organizationId/tickets/unassigned/page/:page',
    middleware.checkOrganization,
    middleware.redirectToLogin,
    middleware.loadCommonData,
    controllers.tickets.getUnassigned,
    controllers.tickets.processor
  )
  router.get(
    '/:organizationId/tickets/print/:uid',
    middleware.checkOrganization,
    middleware.redirectToLogin,
    middleware.loadCommonData,
    controllers.tickets.print
  )
  router.get(
    '/:organizationId/tickets/:id',
    middleware.checkOrganization,
    middleware.redirectToLogin,
    middleware.loadCommonData,
    controllers.tickets.single
  )
  // router.post('/:organizationId/tickets/postcomment', middleware.checkOrganization, middleware.redirectToLogin, controllers.tickets.postcomment)
  router.post(
    '/:organizationId/tickets/uploadattachment',
    middleware.checkOrganization,
    middleware.redirectToLogin,
    controllers.tickets.uploadAttachment
  )
  router.post(
    '/:organizationId/tickets/uploadmdeimage',
    middleware.checkOrganization,
    middleware.redirectToLogin,
    controllers.tickets.uploadImageMDE
  )

  // Messages
  router.get(
    '/:organizationId/messages',
    middleware.checkOrganization,
    middleware.redirectToLogin,
    middleware.loadCommonData,
    controllers.messages.get
  )
  router.get(
    '/:organizationId/messages/startconversation',
    middleware.checkOrganization,
    middleware.redirectToLogin,
    middleware.loadCommonData,
    function (req, res, next) {
      req.showNewConvo = true
      next()
    },
    controllers.messages.get
  )
  router.get(
    '/:organizationId/messages/:convoid',
    middleware.checkOrganization,
    middleware.redirectToLogin,
    middleware.loadCommonData,
    controllers.messages.getConversation
  )

  // Accounts
  router.get(
    '/:organizationId/profile',
    middleware.checkOrganization,
    middleware.redirectToLogin,
    middleware.loadCommonData,
    controllers.accounts.profile
  )
  router.get(
    '/:organizationId/accounts',
    middleware.checkOrganization,
    middleware.redirectToLogin,
    middleware.loadCommonData,
    controllers.accounts.getCustomers
  )
  router.get(
    '/:organizationId/accounts/customer',
    middleware.checkOrganization,
    middleware.redirectToLogin,
    middleware.loadCommonData,
    controllers.accounts.getCustomers
  )
  router.get(
    '/:organizationId/accounts/agents',
    middleware.checkOrganization,
    middleware.redirectToLogin,
    middleware.loadCommonData,
    controllers.accounts.getAgents
  )
  router.get(
    '/:organizationId/accounts/admin',
    middleware.checkOrganization,
    middleware.redirectToLogin,
    middleware.loadCommonData,
    controllers.accounts.getAdmins
  )
  router.post(
    '/:organizationId/accounts/uploadimage',
    middleware.checkOrganization,
    middleware.redirectToLogin,
    controllers.accounts.uploadImage
  )
  router.get(
    '/:organizationId/accounts/import',
    middleware.checkOrganization,
    middleware.redirectToLogin,
    middleware.loadCommonData,
    controllers.accounts.importPage
  )
  router.post(
    '/:organizationId/accounts/import/csv/upload',
    middleware.checkOrganization,
    middleware.redirectToLogin,
    controllers.accounts.uploadCSV
  )
  router.post(
    '/:organizationId/accounts/import/json/upload',
    middleware.checkOrganization,
    middleware.redirectToLogin,
    controllers.accounts.uploadJSON
  )
  router.post(
    '/:organizationId/accounts/import/ldap/bind',
    middleware.checkOrganization,
    middleware.redirectToLogin,
    controllers.accounts.bindLdap
  )

  // Groups
  router.get(
    '/:organizationId/groups',
    middleware.checkOrganization,
    middleware.redirectToLogin,
    middleware.loadCommonData,
    controllers.groups.get
  )
  router.get(
    '/:organizationId/groups/create',
    middleware.checkOrganization,
    middleware.redirectToLogin,
    middleware.loadCommonData,
    controllers.groups.getCreate
  )
  router.get(
    '/:organizationId/groups/:id',
    middleware.checkOrganization,
    middleware.redirectToLogin,
    middleware.loadCommonData,
    controllers.groups.edit
  )

  // Teams
  router.get(
    '/:organizationId/teams',
    middleware.checkOrganization,
    middleware.redirectToLogin,
    middleware.loadCommonData,
    controllers.teams.get
  )

  // Departments
  router.get(
    '/:organizationId/departments',
    middleware.checkOrganization,
    middleware.redirectToLogin,
    middleware.loadCommonData,
    controllers.departments.get
  )

  // Reports
  router.get(
    '/:organizationId/reports',
    middleware.checkOrganization,
    middleware.redirectToLogin,
    middleware.loadCommonData,
    controllers.reports.overview
  )
  router.get(
    '/:organizationId/reports/overview',
    middleware.checkOrganization,
    middleware.redirectToLogin,
    middleware.loadCommonData,
    controllers.reports.overview
  )
  router.get(
    '/:organizationId/reports/generate',
    middleware.checkOrganization,
    middleware.redirectToLogin,
    middleware.loadCommonData,
    controllers.reports.generate
  )
  router.get(
    '/:organizationId/reports/breakdown/group',
    middleware.checkOrganization,
    middleware.redirectToLogin,
    middleware.loadCommonData,
    controllers.reports.breakdownGroup
  )
  router.get(
    '/:organizationId/reports/breakdown/user',
    middleware.checkOrganization,
    middleware.redirectToLogin,
    middleware.loadCommonData,
    controllers.reports.breakdownUser
  )

  // Notices
  router.get(
    '/:organizationId/notices',
    middleware.checkOrganization,
    middleware.redirectToLogin,
    middleware.loadCommonData,
    controllers.notices.get
  )
  router.get(
    '/:organizationId/notices/create',
    middleware.checkOrganization,
    middleware.redirectToLogin,
    middleware.loadCommonData,
    controllers.notices.create
  )
  router.get(
    '/:organizationId/notices/:id',
    middleware.checkOrganization,
    middleware.redirectToLogin,
    middleware.loadCommonData,
    controllers.notices.edit
  )

  router.get(
    '/:organizationId/settings',
    middleware.checkOrganization,
    middleware.redirectToLogin,
    middleware.loadCommonData,
    controllers.settings.general
  )
  router.get(
    '/:organizationId/settings/general',
    middleware.checkOrganization,
    middleware.redirectToLogin,
    middleware.loadCommonData,
    controllers.settings.general
  )
  router.get(
    '/:organizationId/settings/appearance',
    middleware.checkOrganization,
    middleware.redirectToLogin,
    middleware.loadCommonData,
    controllers.settings.appearance
  )
  router.post(
    '/:organizationId/settings/general/uploadlogo',
    middleware.checkOrganization,
    middleware.redirectToLogin,
    controllers.main.uploadLogo
  )
  router.post(
    '/:organizationId/settings/general/uploadpagelogo',
    middleware.checkOrganization,
    middleware.redirectToLogin,
    controllers.main.uploadPageLogo
  )
  router.post(
    '/:organizationId/settings/general/uploadfavicon',
    middleware.checkOrganization,
    middleware.redirectToLogin,
    controllers.main.uploadFavicon
  )
  router.get(
    '/:organizationId/settings/permissions',
    middleware.checkOrganization,
    middleware.redirectToLogin,
    middleware.loadCommonData,
    controllers.settings.permissionsSettings
  )
  router.get(
    '/:organizationId/settings/tickets',
    middleware.checkOrganization,
    middleware.redirectToLogin,
    middleware.loadCommonData,
    controllers.settings.ticketSettings
  )
  router.get(
    '/:organizationId/settings/mailer',
    middleware.checkOrganization,
    middleware.redirectToLogin,
    middleware.loadCommonData,
    controllers.settings.mailerSettings
  )
  router.get(
    '/:organizationId/settings/notifications',
    middleware.checkOrganization,
    middleware.redirectToLogin,
    middleware.loadCommonData,
    controllers.settings.notificationsSettings
  )
  router.get(
    '/:organizationId/settings/elasticsearch',
    middleware.checkOrganization,
    middleware.redirectToLogin,
    middleware.loadCommonData,
    controllers.settings.elasticsearchSettings
  )
  router.get(
    '/:organizationId/settings/tps',
    middleware.checkOrganization,
    middleware.redirectToLogin,
    middleware.loadCommonData,
    controllers.settings.tpsSettings
  )
  router.get(
    '/:organizationId/settings/backup',
    middleware.checkOrganization,
    middleware.redirectToLogin,
    middleware.loadCommonData,
    controllers.settings.backupSettings
  )
  router.get(
    '/:organizationId/settings/legal',
    middleware.checkOrganization,
    middleware.redirectToLogin,
    middleware.loadCommonData,
    controllers.settings.legal
  )
  router.get(
    '/:organizationId/settings/logs',
    middleware.checkOrganization,
    middleware.redirectToLogin,
    middleware.loadCommonData,
    controllers.settings.logs
  )

  router.get(
    '/:organizationId/settings/editor/:template',
    middleware.checkOrganization,
    middleware.redirectToLogin,
    middleware.loadCommonData,
    controllers.editor.page
  )

  // // Plugins
  // router.get('/:organizationId/plugins', middleware.redirectToLogin, middleware.loadCommonData, controllers.plugins.get)

  // API
  // v1
  require('../controllers/api/v1/routes')(middleware, router, controllers)
  // v2
  require('../controllers/api/v2/routes')(middleware, router, controllers)

  // router.get('/api/v1/plugins/list/installed', middleware.api, function (req, res) {
  //   return res.json({ success: true, loadedPlugins: global.plugins })
  // })
  // router.get(
  //   '/api/v1/plugins/install/:packageid',
  //   middleware.api,
  //   middleware.isAdmin,
  //   controllers.api.v1.plugins.installPlugin
  // )
  // router.delete(
  //   '/api/v1/plugins/remove/:packageid',
  //   middleware.api,
  //   middleware.isAdmin,
  //   controllers.api.v1.plugins.removePlugin
  // )

  router.get('/api/v1/admin/restart', middleware.api, middleware.isAdmin, function (req, res) {
    var pm2 = require('pm2')
    pm2.connect(function (err) {
      if (err) {
        winston.error(err)
        res.status(400).send(err)
        return
      }
      pm2.restart('trudesk', function (err) {
        if (err) {
          res.status(400).send(err)
          return winston.error(err)
        }

        pm2.disconnect()
        res.json({ success: true })
      })
    })
  })

  if (global.env === 'development') {
    router.post('/debug/locales/add/:lng/:ns', function (req, res) {
      // This is used to pop lng file with strings in codebase.
      var fs = require('fs')
      var path = require('path')
      var _ = require('lodash')
      var lngFile = path.join(__dirname, '../../locales/' + req.params.lng + '/' + req.params.ns + '.json')
      var obj = JSON.parse(fs.readFileSync(lngFile))
      var k = _.extend(obj, req.body)
      fs.writeFileSync(lngFile, JSON.stringify(k, null, 2))

      return res.send()
    })

    router.get('/debug/lng/:lng', function (req, res) {
      global.i18next.changeLanguage(req.params.lng, function (err) {
        if (err) return res.status(400).json({ success: false, error: err })

        return res.json({ success: true, lng: req.params.lng, message: 'Locale changed to: ' + req.params.lng })
      })
    })

    router.get('/debug/populatedb', controllers.debug.populatedatabase)
    router.get('/debug/sendmail', controllers.debug.sendmail)
    router.get('/debug/mailcheck/refetch', function (req, res) {
      var mailCheck = require('../mailer/mailCheck')
      mailCheck.refetch()
      res.send('OK')
    })

    router.get('/debug/cache/refresh', function (req, res) {
      var _ = require('lodash')

      var forkProcess = _.find(global.forks, { name: 'cache' })
      forkProcess.fork.send({ name: 'cache:refresh' })

      res.send('OK')
    })

    router.get('/debug/restart', function (req, res) {
      var pm2 = require('pm2')
      pm2.connect(function (err) {
        if (err) {
          winston.error(err)
          res.status(400).send(err)
          return
        }
        pm2.restart('trudesk', function (err) {
          if (err) {
            res.status(400).send(err)
            return winston.error(err)
          }

          pm2.disconnect()
          res.send('OK')
        })
      })
    })
  }
}

module.exports = function (app, middleware) {
  mainRoutes(router, middleware, controllers)
  app.use('/', router)

  // Load Plugin routes
  var dive = require('dive')
  var fs = require('fs')
  var pluginDir = path.join(__dirname, '../../plugins')
  if (!fs.existsSync(pluginDir)) fs.mkdirSync(pluginDir)
  dive(pluginDir, { directories: true, files: false, recursive: false }, function (err, dir) {
    if (err) throw err
    var pluginRoutes = require(path.join(dir, '/routes'))
    if (pluginRoutes) {
      pluginRoutes(router, middleware)
    } else {
      winston.warn('Unable to load plugin: ' + pluginDir)
    }
  })

  app.use(handle404)
  app.use(handleErrors)
}

function handleErrors (err, req, res) {
  var status = err.status || 500
  res.status(err.status)

  if (status === 404) {
    res.render('404', { layout: false })
    return
  }

  if (status === 503) {
    res.render('503', { layout: false })
    return
  }

  winston.warn(err.stack)

  res.render('error', {
    message: err.message,
    error: err,
    layout: false
  })
}

function handle404 (req, res) {
  return res.status(404).render('404', { layout: false })
}
