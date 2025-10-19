const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  leaveType: {
    type: String,
    enum: ['annual', 'sick', 'emergency', 'unpaid', 'maternity', 'paternity'],
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  totalDays: {
    type: Number,
    required: true
  },
  reason: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled'],
    default: 'pending'
  },
  rejectionReason: {
    type: String,
    trim: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: Date
});

// تحديث الحقل تلقائيًا عند أي تعديل
leaveSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// فهرسة لتحسين الأداء
leaveSchema.index({ user: 1, startDate: -1 });
leaveSchema.index({ status: 1 });
leaveSchema.index({ leaveType: 1 });

module.exports = mongoose.model('Leave', leaveSchema);
