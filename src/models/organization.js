var mongoose = require('mongoose')
var _ = require('lodash')

var COLLECTION = 'organizations'

var organizationSchema = mongoose.Schema({
  name: { type: String, required: true, unique: true }
})

organizationSchema.pre('save', function (next) {
  this.name = this.name.trim()

  return next()
})

organizationSchema.statics.getById = function (oId, callback) {
  if (_.isUndefined(oId)) {
    return callback('Invalid ObjectId - Organization.GetById()', null)
  }

  return this.model(COLLECTION).findOne({ _id: oId }, callback)
}

module.exports = mongoose.model(COLLECTION, organizationSchema)
