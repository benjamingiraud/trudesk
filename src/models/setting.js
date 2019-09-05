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

var mongoose = require('mongoose')

var COLLECTION = 'settings'

var settingSchema = mongoose.Schema({
  name: { type: String, required: true },
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'organizations', required: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true }
})
settingSchema.index({ name: 1, organizationId: 1 }, { unique: true })

settingSchema.statics.getSettings = function (callback, organizationId) {
  return this.model(COLLECTION)
    .find({ organizationId: organizationId })
    .select('name value')
    .exec(callback)
}

settingSchema.statics.getSettingByName = function (name, callback, organizationId) {
  return this.model(COLLECTION).findOne({ name: name, organizationId: organizationId }, callback)
}

settingSchema.statics.getSettingsByName = function (names, callback, organizationId) {
  return this.model(COLLECTION).find({ name: names, organizationId }, callback)
}

settingSchema.statics.getSetting = settingSchema.statics.getSettingByName

module.exports = mongoose.model(COLLECTION, settingSchema)
