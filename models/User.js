const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  firstName: { type: String, required: true },
  lastName: { type: String },
  mobile: { type: String },
  password: { type: String, required: true },
  photo: { type: String },
  otp: { type: String },
  otpExpiry: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);