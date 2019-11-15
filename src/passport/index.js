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

var passport = require('passport')
var Local = require('passport-local').Strategy
var TotpStrategy = require('passport-totp').Strategy
var JwtStrategy = require('passport-jwt').Strategy
var ExtractJwt = require('passport-jwt').ExtractJwt
var base32 = require('thirty-two')
var User = require('../models/user')
var Role = require('../models/role')
var nconf = require('nconf')
var SwiziConnector = require('../connectors/SwiziConnector')

module.exports = function () {
  passport.serializeUser(function (user, done) {
    console.log(user)
    done(null, `${user.id}:${user.swiziApiKey}:${user.organizationId}`)
  })

  passport.deserializeUser(async function (infos, done) {
    let userId = parseInt(infos.split(':')[0])
    let swiziApiKey = infos.split(':')[1]
    let organizationId = infos.split(':')[2]

    let Swizi = new SwiziConnector({ apikey: swiziApiKey })
    try {
      let authenticatedUser = await Swizi.findUserById(userId)
      authenticatedUser.swiziApiKey = swiziApiKey
      authenticatedUser.organizationId = organizationId
      Role.getRoleBySwiziGroup(
        authenticatedUser.groups,
        function (err, role) {
          if (role) {
            authenticatedUser.role = role
            return done(null, authenticatedUser)
          } else {
            done(null, false, { message: 'Une erreur est survenue.' })
          }
        },
        organizationId
      )
    } catch (err) {
      done(null, err)
    }
    // User.findById(id, function (err, user) {
    //   console.log(user)
    //   done(err, user)
    // })
  })

  passport.use(
    'local',
    new Local(
      {
        usernameField: 'login-username',
        passwordField: 'login-password',
        passReqToCallback: true
      },
      async function (req, username, password, done) {
        let Swizi = new SwiziConnector({ apikey: req.organization.swiziApiKey })
        let user
        try {
          user = await Swizi.authenticate(username, password)
        } catch (err) {
          return done(null, false, req.flash('loginMessage', 'Une erreur est survenue.'))
        }
        let authenticatedUser
        try {
          authenticatedUser = await Swizi.findUserById(user.id)
        } catch (err) {
          return done(null, false, req.flash('loginMessage', "Erreur dans le nom d'utilisateur et/ou mot de passe."))
        }
        authenticatedUser.swiziApiKey = req.organization.swiziApiKey
        authenticatedUser.organizationId = req.organization.id
        Role.getRoleBySwiziGroup(
          authenticatedUser.groups,
          function (err, role) {
            if (role) {
              authenticatedUser.role = role
              req.user = authenticatedUser
              return done(null, authenticatedUser)
            } else {
              return done(null, false, req.flash('loginMessage', 'Une erreur est survenue.'))
            }
          },
          req.organization.id
        )

        // User.findOne({ organizationId: req.organization.id, username: new RegExp('^' + username.trim() + '$', 'i') })
        //   .select('+password +tOTPKey +tOTPPeriod')
        //   .exec(function (err, user) {
        //     if (err) {
        //       return done(err)
        //     }

        //     if (!user || user.deleted) {
        //       return done(null, false, req.flash('loginMessage', 'No User Found.'))
        //     }

        //     if (!User.validate(password, user.password)) {
        //       return done(null, false, req.flash('loginMessage', 'Incorrect Password.'))
        //     }

        //     req.user = user
        //     return done(null, user)
        //   })
      }
    )
  )

  passport.use(
    'totp',
    new TotpStrategy(
      {
        window: 6
      },
      function (user, done) {
        if (!user.hasL2Auth) return done(false)

        User.findOne({ _id: user.id }, '+tOTPKey +tOTPPeriod', function (err, user) {
          if (err) return done(err)

          if (!user.tOTPPeriod) {
            user.tOTPPeriod = 30
          }

          return done(null, base32.decode(user.tOTPKey).toString(), user.tOTPPeriod)
        })
      }
    )
  )

  passport.use(
    'jwt',
    new JwtStrategy(
      {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: nconf.get('tokens') ? nconf.get('tokens').secret : false,
        ignoreExpiration: true
      },
      function (jwtPayload, done) {
        // console.log('jwt')
        if (jwtPayload.exp < Date.now() / 1000) return done({ type: 'exp' })

        return done(null, jwtPayload.user)

        // User.findOne({ _id: jwtPayload.user.id }, function (err, user) {
        //   if (err) return done(err)
        //   if (user) {
        //     return done(null, jwtPayload.user)
        //   } else {
        //     return done(null, false)
        //   }
        // })
      }
    )
  )

  return passport
}
