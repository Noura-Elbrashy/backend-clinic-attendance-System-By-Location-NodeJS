const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'الاسم مطلوب'],
  },
  email: {
    type: String,
    required: [true, 'البريد الإلكتروني مطلوب'],
    unique: true,
    match: [/.+\@.+\..+/, 'يرجى إدخال بريد إلكتروني صالح'],
  },
  password: {
    type: String,
    required: function() {
        return this.isActive
    }, // يطلب الباسورد بس لما الحساب يكون مفعل
    minlength: 6,
  },
  passwordSet: { type: Boolean, default: false },
  activationTokenExpires: Date,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  role: {
    type: String,
    enum: ['staff', 'admin'],
    default: 'staff',
  },
  branches: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch'
    },
  ],
  phone: String,
  address: String,
  salary: Number,
  requiredWorkingDays: {
    type: Number,
    default: 5,
  },
  workingDaysNames: {
    type: [String],
    default: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'],
  },
  workingHoursPerDay: {
    type: Number,
    default: 8,
  },
  workStartTime: { type: String, required: true },
  workEndTime: { type: String, required: true },
  isNightShift: { type: Boolean, default: false },
  absenceDeductionRate: {
    type: Number,
    default: 0,
  },
  lateDeductionRate: {
    type: Number,
    default: 0,
  },
  earlyLeaveDeductionRate: {
    type: Number,
    default: 0,
  },
  allowRemoteAbsence: {
    type: Boolean,
    default: false,
  },
  feedback: [
    {
      message: String,
      isWarning: Boolean,
      date: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  // تحديث هيكل الأجهزة المسجلة مع الحفاظ على الحقول الموجودة
  registeredDevices: [
    {
      deviceFingerprint: {
        type: String,
        required: true
      },
      approved: {
        type: Boolean,
        default: false,
      },
    
      deviceId: String, 
      userAgent: String,
      platform: String,
      registeredAt: {
        type: Date,
        default: Date.now
      },
      approvedAt: Date,
      approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      lastUsed: {
        type: Date,
        default: Date.now
      },
      isActive: {
        type: Boolean,
        default: true
      },
      // معلومات إضافية للأمان
      securityFlags: {
        suspiciousActivity: {
          type: Boolean,
          default: false
        },
        multipleFailedAttempts: {
          type: Number,
          default: 0
        },
        lastFailedAttempt: Date
      }
    },
  ],
  remotePermissions: [
    {
      branchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch',
      },
      date: Date,
    
      grantedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      grantedAt: {
        type: Date,
        default: Date.now
      },
      reason: String,
      isActive: {
        type: Boolean,
        default: true
      }
    },
  ],
  activationToken: {
    type: String,
  },
  isActive: {
    type: Boolean,
    default: false,
  },
  // إضافة حقول جديدة للبيومتريكس والأمان
  biometricsEnabled: {
    type: Boolean,
    default: false
  },
  biometricsRegisteredAt: Date,
  // إحصائيات المستخدم
  stats: {
    totalCheckIns: {
      type: Number,
      default: 0
    },
    totalLateMinutes: {
      type: Number,
      default: 0
    },
    totalEarlyLeaves: {
      type: Number,
      default: 0
    },
    lastCheckIn: Date,
    lastCheckOut: Date
  },
  // إعدادات الأمان
  securitySettings: {
    maxDevicesAllowed: {
      type: Number,
      default: 3
    },
    requireBiometrics: {
      type: Boolean,
      default: false
    },
    sessionTimeout: {
      type: Number,
      default: 480 // 8 hours in minutes
    }
  }
});

// إضافة فهارس للأداء
userSchema.index({ email: 1 });
userSchema.index({ 'registeredDevices.deviceFingerprint': 1 });
userSchema.index({ 'registeredDevices.approved': 1 });
userSchema.index({ branches: 1 });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

module.exports = mongoose.model('User', userSchema);