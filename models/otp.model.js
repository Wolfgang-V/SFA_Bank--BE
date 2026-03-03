const mongoose = require("mongoose");

const otpschema = new mongoose.Schema({
    email:{type:String, required:true},
    otp:{type:String, required:true},
    createdAt:{type:Date, default:Date.now, expires:300} // OTP expires after 5 minutes
})

const OTPModel = mongoose.model("otp", otpschema)

module.exports = OTPModel
