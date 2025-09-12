
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
  lateMinutes: { type: Number, default: 0 },
  earlyLeaveMinutes: { type: Number, default: 0 },
  
  // إضافة حقول جديدة للأمان والتتبع
  deviceFingerprint: { 
    type: String,
    required: true 
  },
  deviceId: String, 
  deviceInfo: {
    userAgent: String,
    platform: String,
    browserFingerprint: String
  },
  
  // معلومات التحقق والأمان
  verificationMethods: [{
    method: {
      type: String,
      enum: ['location', 'wifi', 'biometrics', 'device', 'emergency']
    },
    verified: Boolean,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  
  // معلومات الاتصال والشبكة
  ipAddress: String,
  isRemoteCheckin: {
    type: Boolean,
    default: false
  },
  isRemoteCheckout: {
    type: Boolean,
    default: false
  },
  
  // حالة الموافقة والمراجعة
  approved: {
    type: Boolean,
    default: true
  },
  reviewRequired: {
    type: Boolean,
    default: false
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: Date,
  
  // ملاحظات
  notes: String,
  adminNotes: String,
  
  // تقييم الأمان
  securityScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 100
  },
  
 
  metadata: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// إضافة فهارس للأداء
attendanceSchema.index({ user: 1, checkInTime: -1 });
attendanceSchema.index({ branch: 1, checkInTime: -1 });
attendanceSchema.index({ checkInTime: -1 });
attendanceSchema.index({ dayStatus: 1 });
attendanceSchema.index({ deviceFingerprint: 1 });
attendanceSchema.index({ deviceId: 1 });
attendanceSchema.index({ approved: 1 });
attendanceSchema.index({ reviewRequired: 1 });

// إضافة دالة لحساب مدة العمل
attendanceSchema.methods.calculateWorkDuration = function() {
  if (this.checkInTime && this.checkOutTime) {
    const duration = this.checkOutTime - this.checkInTime;
    this.durationMinutes = Math.floor(duration / 60000);
    return this.durationMinutes;
  }
  return 0;
};

// إضافة دالة لتقييم الأمان
attendanceSchema.methods.calculateSecurityScore = function() {
  let score = 100;
  
  // خصم نقاط حسب العوامل المختلفة
  if (this.outOfLocation) score -= 20;
  if (this.isRemoteCheckin) score -= 10;
  if (this.lateMinutes > 0) score -= Math.min(this.lateMinutes / 2, 15);
  if (this.earlyLeaveMinutes > 0) score -= Math.min(this.earlyLeaveMinutes / 2, 15);
  
  // زيادة النقاط للتحقق الإضافي
  const verifiedMethods = this.verificationMethods.filter(v => v.verified).length;
  if (verifiedMethods > 2) score += 5;
  
  this.securityScore = Math.max(0, Math.min(100, score));
  return this.securityScore;
};

module.exports = mongoose.model('Attendance', attendanceSchema);