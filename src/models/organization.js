var mongoose = require('mongoose')
var _ = require('lodash')
var changeCase = require('change-case')
var COLLECTION = 'organizations'

var organizationSchema = mongoose.Schema({
  name: { type: String, required: true, unique: true },
  slug: { type: String, unique: true },
  swiziApiKey: { type: String, required: true }
})

organizationSchema.pre('save', function (next) {
  this.slug = changeCase.paramCase(this.name)
  this.name = this.name.trim()
  return next()
})

organizationSchema.statics.getById = function (oId, callback) {
  if (_.isUndefined(oId)) {
    return callback('Invalid ObjectId - Organization.GetById()', null)
  }

  return this.model(COLLECTION).findOne({ _id: oId }, callback)
}

organizationSchema.statics.getBySlug = function (slug, callback) {
  if (_.isUndefined(slug)) {
    return callback('Invalid slug - Organization.getBySlug()', null)
  }

  return this.model(COLLECTION).findOne({ slug: slug }, callback)
}

module.exports = mongoose.model(COLLECTION, organizationSchema)
