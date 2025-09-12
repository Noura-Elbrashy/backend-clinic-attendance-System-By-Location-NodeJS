const mongoose = require('mongoose');

const remotePermissionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  grantedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  grantedAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  reason: {
    type: String,
    default: 'إذن حضور عن بعد'
  },
  usedAt: {
    type: Date,
    default: null
  },
  isUsed: {
    type: Boolean,
    default: false
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Index for faster queries
remotePermissionSchema.index({ user: 1, date: 1 });
remotePermissionSchema.index({ branch: 1, date: 1 });
remotePermissionSchema.index({ date: 1, isActive: 1 });

// Method to check if permission is valid for use
remotePermissionSchema.methods.isValidForUse = function() {
  const now = new Date();
  const permissionDate = new Date(this.date);
  
  // Check if it's the same day
  const isSameDay = now.getDate() === permissionDate.getDate() &&
                    now.getMonth() === permissionDate.getMonth() &&
                    now.getFullYear() === permissionDate.getFullYear();
  
  return this.isActive && !this.isUsed && isSameDay;
};

// Method to mark permission as used
remotePermissionSchema.methods.markAsUsed = async function() {
  this.isUsed = true;
  this.usedAt = new Date();
  return await this.save();
};

module.exports = mongoose.model('RemotePermission', remotePermissionSchema);