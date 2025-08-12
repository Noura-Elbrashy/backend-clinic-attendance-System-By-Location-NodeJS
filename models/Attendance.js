
// const mongoose = require('mongoose');

// const attendanceSchema = new mongoose.Schema({
//   user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//   branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
//   checkInTime: { type: Date, required: true },
//   checkOutTime: { type: Date },
//   durationMinutes: { type: Number },
//   locationIn: { lat: { type: Number, required: true }, lng: { type: Number, required: true } },
//   locationOut: { lat: { type: Number }, lng: { type: Number } },
//   outOfLocation: { type: Boolean, default: false },
//   dayStatus: { type: String, enum: ['working', 'holiday', 'absent'], default: 'working' },
// });

// module.exports = mongoose.model('Attendance', attendanceSchema);
const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  checkInTime: { type: Date, required: true },
  checkOutTime: { type: Date },
  durationMinutes: { type: Number },
  locationIn: { lat: { type: Number, required: true }, lng: { type: Number, required: true } },
  locationOut: { lat: { type: Number }, lng: { type: Number } },
  outOfLocation: { type: Boolean, default: false },
  dayStatus: { type: String, enum: ['working', 'holiday', 'absent'], default: 'working' },
  lateMinutes: { type: Number, default: 0 }, // New
  earlyLeaveMinutes: { type: Number, default: 0 } // New
});

module.exports = mongoose.model('Attendance', attendanceSchema);