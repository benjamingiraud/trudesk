var mongoose = require('mongoose')
var _ = require('lodash')
var changeCase = require('change-case')
var COLLECTION = 'organizations'
var Chance = require('chance')

var organizationSchema = mongoose.Schema({
  name: { type: String, required: true, unique: true },
  slug: { type: String, unique: true },
  swiziApiKey: { type: String, required: true },
  apiKey: { type: String, unique: true },
  secretKey: { type: String, unique: true }
})

organizationSchema.pre('save', function (next) {
  this.slug = changeCase.paramCase(this.name)
  this.name = this.name.trim()

  var chance = new Chance()

  this.apiKey = chance.hash({ length: 40 })
  this.secretKey = chance.hash({ length: 25 })
  return next()
})

organizationSchema.statics.getById = function (oId, callback) {
  if (_.isUndefined(oId)) {
    return callback('Invalid ObjectId - Organization.GetById()', null)
  }

  return this.model(COLLECTION).findOne({ _id: oId }, callback)
}
organizationSchema.statics.getByKeys = function (apiKey, secretKey, callback) {
  if (_.isUndefined(apiKey) || _.isUndefined(secretKey)) {
    return callback('Invalid ObjectId - Organization.getByKeys()', null)
  }
  return this.model(COLLECTION).findOne({ apiKey, secretKey }, callback)
}
organizationSchema.statics.getBySlug = function (slug, callback) {
  if (_.isUndefined(slug)) {
    return callback('Invalid slug - Organization.getBySlug()', null)
  }

  return this.model(COLLECTION).findOne({ slug: slug }, callback)
}

module.exports = mongoose.model(COLLECTION, organizationSchema)
