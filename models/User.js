
// const mongoose = require('mongoose');

// const userSchema = new mongoose.Schema({
//   name: { type: String, required: true },
//   email: { type: String, required: true, unique: true },
//   password: { type: String },
//   role: { type: String, enum: ['staff', 'admin'], default: 'staff' },
//   branches: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Branch' }],
//   feedback: [{
//     message: String,
//     isWarning: Boolean,
//     date: { type: Date, default: Date.now }
//   }],
//   phone: { type: String },
//   address: { type: String },
//   salary: { type: Number },
//   requiredWorkingDays: { type: Number, default: 5 }, // عدد أيام الحضور المطلوبة في الأسبوع
//   workingDaysNames: [{ type: String }], // أسماء الأيام، مثل ['Sunday', 'Monday', ...]
//   workingHoursPerDay: { type: Number, default: 8 }, // عدد ساعات العمل في اليوم
//   workStartTime: { type: String }, // ساعة بداية العمل، مثل '09:00'
//   workEndTime: { type: String }, // ساعة نهاية العمل، مثل '17:00'
//   absenceDeductionRate: { type: Number, default: 0 }, // نسبة الخصم لكل يوم غياب (مثلاً 0.05 لـ 5%)
//   isActive: { type: Boolean, default: false },
//   passwordSet: { type: Boolean, default: false },
//   activationToken: { type: String },
//   activationTokenExpires: { type: Date }
// });

// module.exports = mongoose.model('User', userSchema);
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
    required : function() {
        return this.isActive}, // يطلب الباسورد بس لما الحساب يكون مفعل
    minlength: 6,
}
,
  role: {
    type: String,
    enum: ['staff', 'admin'],
    default: 'staff',
  },
  branches: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
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
  workStartTime: {
    type: String,
    default: '09:00',
  },
  workEndTime: {
    type: String,
    default: '17:00',
  },
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
  registeredDevices: [
    {
      deviceFingerprint: String,
      approved: {
        type: Boolean,
        default: false,
      },
    },
  ],
  remotePermissions: [
    {
      branchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch',
      },
      date: Date,
    },
  ],
  activationToken: {
    type: String, // حقل جديد لتخزين توكن التفعيل
  },
  isActive: {
    type: Boolean,
    default: false, // الحساب غير مفعّل افتراضيًا لحد ما يتم التفعيل
  },
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

module.exports = mongoose.model('User', userSchema);