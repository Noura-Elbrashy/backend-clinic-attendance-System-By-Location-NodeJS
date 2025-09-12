
const mongoose = require("mongoose");

const branchSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  radius: { type: Number, required: true },
  allowRemoteCheckin: { type: Boolean, default: false },
  allowedIPs: [{ type: String }] 
});

module.exports = mongoose.model("Branch", branchSchema);