 
const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { 
    type: String, 
    required: true,
    enum: [
      'checkIn', 
      'checkOut', 
      'recordAbsence',
      'success', 
      'failed',
      'newDeviceRegistration',
      'deviceApproval',
      'deviceRejection',
      'deviceRemoval',
      'emergencyModeToggle',
      'remotePermissionGranted',
      'remotePermissionRevoked',
      'biometricsRegistration',
      'biometricsVerification',
      'suspiciousActivity',
      'locationViolation',
      'wifiViolation',
      'multipleDeviceAttempt',
      'adminAction',
      'systemAlert',
      'forgotPassword',
      'resetPassword',
       'grantRemotePermission',
    ],
  },
  timestamp: { type: Date, default: Date.now },
  ip: { type: String },
  lat: { type: Number },
  lng: { type: Number },
  status: { 
    type: String, 
    enum: ['success', 'failed', 'pending', 'warning', 'error'], 
    required: true 
  },
  reason: { type: String },
  deviceFingerprint: String,
  deviceId: String,
  userAgent: String,
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  securityLevel: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal',
  },
  requiresAttention: { type: Boolean, default: false },
  metadata: { type: mongoose.Schema.Types.Mixed },
  errorDetails: {
    code: String,
    message: String,
    stack: String,
  },
  sessionId: String,
  readBy: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    readAt: { type: Date, default: Date.now },
  }],
  followUpStatus: {
    type: String,
    enum: ['pending', 'in_progress', 'resolved', 'dismissed'],
    default: 'pending',
  },
  followUpNotes: String,
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resolvedAt: Date,
});

logSchema.index({ userId: 1, timestamp: -1 });
logSchema.index({ action: 1, timestamp: -1 });
logSchema.index({ status: 1, timestamp: -1 });
logSchema.index({ securityLevel: 1, timestamp: -1 });
logSchema.index({ requiresAttention: 1, timestamp: -1 });
logSchema.index({ branchId: 1, timestamp: -1 });
logSchema.index({ deviceFingerprint: 1 });
logSchema.index({ deviceId: 1 });
logSchema.index({ timestamp: -1 });
logSchema.index({ followUpStatus: 1 });

logSchema.pre('save', function(next) {
  const highSecurityActions = [
    'newDeviceRegistration', 
    'suspiciousActivity', 
    'locationViolation', 
    'multipleDeviceAttempt',
    'forgotPassword',
    'resetPassword',
  ];
  const criticalActions = [
    'systemAlert',
    'emergencyModeToggle',
  ];
  if (criticalActions.includes(this.action)) {
    this.securityLevel = 'critical';
    this.requiresAttention = true;
    this.priority = 'urgent';
  } else if (highSecurityActions.includes(this.action)) {
    this.securityLevel = 'high';
    this.requiresAttention = true;
    this.priority = 'high';
  } else if (this.status === 'failed') {
    this.securityLevel = 'medium';
    this.requiresAttention = true;
  }
  next();
});

module.exports = mongoose.model('Log', logSchema);
