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
 *  Updated:    1/20/19 9:57 PM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

var mongoose = require('mongoose')

var COLLECTION = 'templates'

var templateSchema = mongoose.Schema({
  name: { type: String, required: true },
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'organizations', required: true },
  subject: { type: String, required: true },
  displayName: String,
  description: String,
  data: { type: Object, required: true }
})

templateSchema.pre('save', function (next) {
  this.name = this.name.trim()

  return next()
})

templateSchema.statics.get = function (name, callback, organizationId) {
  return this.model(COLLECTION)
    .findOne({ name: name, organizationId: organizationId })
    .exec(callback)
}

module.exports = mongoose.model(COLLECTION, templateSchema)
