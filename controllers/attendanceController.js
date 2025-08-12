
// const Attendance = require("../models/Attendance");
// const User = require("../models/User");
// const Branch = require("../models/Branch");
// const { isWithinRadius } = require("../helpers/location");
// const Log = require("../models/Log");
// const { sendAlert } = require("../config/nodemailer");

// exports.checkIn = async (req, res) => {
//   const { lat, lng, branchId, deviceFingerprint } = req.body;
//   const userId = req.user.userId;

//   try {
//     const user = await User.findById(userId).populate('branches');
//     if (!user || !user.branches || user.branches.length === 0) {
//       return res.status(400).json({ message: "User or branches not found" });
//     }

//     const branch = await Branch.findById(branchId);
//     if (!branch || !user.branches.some(b => b._id.toString() === branchId)) {
//       return res.status(400).json({ message: "Invalid branch or user not assigned to this branch" });
//     }

//     const isWithin = isWithinRadius({ lat, lng }, branch.location, branch.radius);
//     if (!isWithin) {
//       return res.status(400).json({ message: "You are outside the branch area!" });
//     }

//     // *** إضافة جديدة: التحقق من الجهاز ***
//     if (!deviceFingerprint) {
//       return res.status(400).json({ message: "Device fingerprint is required" });
//     }

//     // لو أول جهاز، حفظه تلقائياً مع approved: true
//     if (user.registeredDevices.length === 0) {
//       user.registeredDevices.push({ deviceFingerprint, approved: true });
//       await user.save();
//     } else {
//       // تحقق إذا الجهاز موافق
//       const device = user.registeredDevices.find(d => d.deviceFingerprint === deviceFingerprint && d.approved);
//       if (!device) {
//         // لو جهاز جديد، أضفه معلق ورفض الطلب
//         if (!user.registeredDevices.some(d => d.deviceFingerprint === deviceFingerprint)) {
//           user.registeredDevices.push({ deviceFingerprint, approved: false });
//           await user.save();
//         }
//         return res.status(403).json({ message: "Device not approved. Request sent to admin for approval." });
//       }
//     }

//     const today = new Date().setHours(0, 0, 0, 0);
//     const existingRecord = await Attendance.findOne({
//       user: userId,
//       branch: branchId,
//       checkInTime: { $gte: today },
//     });

//     if (existingRecord) {
//       return res.status(400).json({ message: "لقد سجلت حضورك اليوم بالفعل لهذا الفرع" });
//     }

//     // Calculate if late
//     const now = new Date();
//     const workStart = new Date(now);
//     const [startHour, startMin] = user.workStartTime.split(':').map(Number);
//     workStart.setHours(startHour, startMin, 0, 0);
//     const lateMinutes = now > workStart ? Math.floor((now - workStart) / 60000) : 0;

//     const attendance = await Attendance.create({
//       user: userId,
//       branch: branchId,
//       checkInTime: now,
//       locationIn: { lat, lng },
//       dayStatus: 'working',
//       lateMinutes,
//     });

//     await Log.create({
//       userId,
//       action: 'checkIn',
//       ip,
//       lat,
//       lng,
//       status: 'success'
//     });

//     res.json({ message: "تم تسجيل الحضور بنجاح", attendance });
//   } catch (err) {
//     console.error("خطأ في تسجيل الحضور:", err);
//     res.status(500).json({ message: "فشل تسجيل الحضور", error: err.message });
//   }
// };

// exports.checkOut = async (req, res) => {
//   const { lat, lng, branchId, deviceFingerprint } = req.body;
//   const userId = req.user.userId;
//   const ip = req.ip;

//   try {
//     const user = await User.findById(userId).populate('branches');
//     if (!user || !user.branches || user.branches.length === 0) {
//       return res.status(400).json({ message: "المستخدم أو الفروع غير موجودة" });
//     }

//     const branch = await Branch.findById(branchId);
//     if (!branch || !user.branches.some(b => b._id.toString() === branchId)) {
//       return res.status(400).json({ message: "فرع غير صالح أو المستخدم غير معين لهذا الفرع" });
//     }

//     // Register device if new (same as checkIn)
//     let registeredDevice = user.registeredDevices.find(d => d.fingerprint === deviceFingerprint);
//     if (!registeredDevice) {
//       const approved = user.registeredDevices.length === 0;
//       user.registeredDevices.push({ fingerprint: deviceFingerprint, approved });
//       await user.save();
//       registeredDevice = { fingerprint: deviceFingerprint, approved };

//       if (!approved) {
//         sendAlert('admin@email.com', 'طلب جهاز جديد', `المستخدم ${user.name} يطلب موافقة على جهاز جديد: ${deviceFingerprint}`);
//         await Log.create({
//           userId,
//           action: 'checkOut',
//           ip,
//           lat,
//           lng,
//           status: 'failed',
//           reason: 'جهاز جديد بانتظار الموافقة'
//         });
//         return res.status(403).json({ message: "جهاز جديد. يتطلب موافقة الأدمن." });
//       }
//     }

//     const hasRemotePermission = user.remotePermissions && user.remotePermissions.some(p => {
//       const today = new Date().setHours(0, 0, 0, 0);
//       return p.branchId === branchId && new Date(p.date).setHours(0, 0, 0, 0) === today;
//     });

//     let isWithin = true;
//     if (!branch.allowRemoteCheckin && !hasRemotePermission) {
//       if (!registeredDevice.approved) {
//         await Log.create({
//           userId,
//           action: 'checkOut',
//           ip,
//           lat,
//           lng,
//           status: 'failed',
//           reason: 'جهاز غير موافق عليه'
//         });
//         return res.status(403).json({ message: "جهاز غير موافق عليه." });
//       }

//       if (!branch.allowedIPs.includes(ip)) {
//         await Log.create({
//           userId,
//           action: 'checkOut',
//           ip,
//           lat,
//           lng,
//           status: 'failed',
//           reason: 'IP غير مسموح (واي فاي غير مسجل)'
//         });
//         return res.status(403).json({ message: "يجب الاتصال بواي فاي الفرع المسجل." });
//       }

//       isWithin = isWithinRadius({ lat, lng }, branch.location, branch.radius);
//       if (!isWithin) {
//         await Log.create({
//           userId,
//           action: 'checkOut',
//           ip,
//           lat,
//           lng,
//           status: 'failed',
//           reason: 'خارج نطاق الفرع'
//         });
//         return res.status(400).json({ message: "أنت خارج نطاق الفرع!" });
//       }
//     }

//     const today = new Date().setHours(0, 0, 0, 0);
//     const attendance = await Attendance.findOne({
//       user: userId,
//       branch: branchId,
//       checkInTime: { $gte: today },
//       checkOutTime: { $exists: false },
//     });

//     if (!attendance) {
//       return res.status(400).json({ message: "لا يوجد تسجيل حضور اليوم لهذا الفرع" });
//     }

//     const now = new Date();
//     const durationMs = now - attendance.checkInTime;
//     const durationMinutes = Math.floor(durationMs / 60000);

//     // Calculate early leave
//     const workEnd = new Date(now);
//     const [endHour, endMin] = user.workEndTime.split(':').map(Number);
//     workEnd.setHours(endHour, endMin, 0, 0);
//     const earlyLeaveMinutes = now < workEnd ? Math.floor((workEnd - now) / 60000) : 0;

//     attendance.checkOutTime = now;
//     attendance.durationMinutes = durationMinutes;
//     attendance.locationOut = { lat, lng };
//     attendance.outOfLocation = !isWithin;
//     attendance.earlyLeaveMinutes = earlyLeaveMinutes;
//     await attendance.save();

//     await Log.create({
//       userId,
//       action: 'checkOut',
//       ip,
//       lat,
//       lng,
//       status: 'success'
//     });

//     res.json({
//       message: "تم تسجيل الانصراف بنجاح",
//       durationMinutes,
//       outOfLocation: !isWithin,
//     });
//   } catch (err) {
//     console.error("خطأ في تسجيل الانصراف:", err);
//     res.status(500).json({ message: "فشل تسجيل الانصراف", error: err.message });
//   }
// };

// exports.toggleEmergency = async (req, res) => {
//   const { branchId, allowRemote } = req.body;

//   try {
//     const branch = await Branch.findById(branchId);
//     if (!branch) {
//       return res.status(404).json({ message: 'الفرع غير موجود' });
//     }

//     branch.allowRemoteCheckin = allowRemote;
//     await branch.save();

//     res.json({ message: `وضع الطوارئ ${allowRemote ? 'مفعل' : 'معطل'} للفرع` });
//   } catch (err) {
//     console.error('خطأ في تبديل وضع الطوارئ:', err);
//     res.status(500).json({ message: 'فشل تبديل وضع الطوارئ', error: err.message });
//   }
// };

// exports.recordAbsence = async (req, res) => {
//   const { lat, lng, branchId, deviceFingerprint } = req.body;
//   const userId = req.user.userId;
//   const ip = req.ip;

//   try {
//     const user = await User.findById(userId).populate('branches');
//     if (!user || !user.allowRemoteAbsence) {
//       return res.status(403).json({ message: "غير مصرح لك بتسجيل الغياب عن بعد" });
//     }

//     const branch = await Branch.findById(branchId);
//     if (!branch || !user.branches.some(b => b._id.toString() === branchId)) {
//       return res.status(400).json({ message: "فرع غير صالح" });
//     }

//     const today = new Date().setHours(0, 0, 0, 0);
//     const existingRecord = await Attendance.findOne({
//       user: userId,
//       branch: branchId,
//       checkInTime: { $gte: today },
//     });

//     if (existingRecord) {
//       return res.status(400).json({ message: "لقد تم تسجيل حضور أو غياب بالفعل اليوم" });
//     }

//     const attendance = await Attendance.create({
//       user: userId,
//       branch: branchId,
//       checkInTime: new Date(),
//       locationIn: { lat, lng },
//       dayStatus: 'absent',
//     });

//     await Log.create({
//       userId,
//       action: 'recordAbsence',
//       ip,
//       lat,
//       lng,
//       status: 'success'
//     });

//     res.json({ message: "تم تسجيل الغياب بنجاح", attendance });
//   } catch (err) {
//     console.error("خطأ في تسجيل الغياب:", err);
//     res.status(500).json({ message: "فشل تسجيل الغياب", error: err.message });
//   }
// };

// exports.grantRemotePermission = async (req, res) => {
//   const { userId, branchId, date } = req.body; // date: YYYY-MM-DD

//   try {
//     const user = await User.findById(userId);
//     if (!user) {
//       return res.status(404).json({ message: 'المستخدم غير موجود' });
//     }

//     if (!user.remotePermissions) user.remotePermissions = [];
//     user.remotePermissions.push({ branchId, date: new Date(date) });
//     await user.save();

//     res.json({ message: 'تم منح الإذن للتسجيل عن بعد لليوم المحدد' });
//   } catch (err) {
//     res.status(500).json({ message: 'فشل منح الإذن', error: err.message });
//   }
// };

const Attendance = require("../models/Attendance");
const User = require("../models/User");
const Branch = require("../models/Branch");
const { isWithinRadius } = require("../helpers/location");
const Log = require("../models/Log");
const { sendAlert } = require("../config/nodemailer");

exports.checkIn = async (req, res) => {
  const { lat, lng, branchId, deviceFingerprint } = req.body;
  const userId = req.user.userId;

  try {
    const user = await User.findById(userId).populate('branches');
    if (!user || !user.branches || user.branches.length === 0) {
      return res.status(400).json({ message: "User or branches not found" });
    }

    const branch = await Branch.findById(branchId);
    if (!branch || !user.branches.some(b => b._id.toString() === branchId)) {
      return res.status(400).json({ message: "Invalid branch or user not assigned to this branch" });
    }

    const isWithin = isWithinRadius({ lat, lng }, branch.location, branch.radius);
    if (!isWithin) {
      return res.status(400).json({ message: "You are outside the branch area!" });
    }

    if (!deviceFingerprint) {
      return res.status(400).json({ message: "Device fingerprint is required" });
    }

    // لو أول جهاز، حفظه تلقائياً مع approved: true
    if (user.registeredDevices.length === 0) {
      user.registeredDevices.push({ deviceFingerprint, approved: true });
      await user.save();
    } else {
      const device = user.registeredDevices.find(d => d.deviceFingerprint === deviceFingerprint && d.approved);
      if (!device) {
        if (!user.registeredDevices.some(d => d.deviceFingerprint === deviceFingerprint)) {
          user.registeredDevices.push({ deviceFingerprint, approved: false });
          await user.save();
        }
        return res.status(403).json({ message: "Device not approved. Request sent to admin for approval." });
      }
    }

    const today = new Date().setHours(0, 0, 0, 0);
    const existingRecord = await Attendance.findOne({
      user: userId,
      branch: branchId,
      checkInTime: { $gte: today },
    });

    if (existingRecord) {
      return res.status(400).json({ message: "You have already checked in today for this branch" });
    }

    const attendance = await Attendance.create({
      user: userId,
      branch: branchId,
      checkInTime: new Date(),
      locationIn: { lat, lng },
      dayStatus: 'working',
    });

    res.json({ message: "Check-in successful", attendance });
  } catch (err) {
    console.error("Check-in error:", err);
    res.status(500).json({ message: "Failed to check in", error: err.message });
  }
};

exports.checkOut = async (req, res) => {
  const { lat, lng, branchId, deviceFingerprint } = req.body;
  const userId = req.user.userId;

  try {
    const user = await User.findById(userId).populate('branches');
    if (!user || !user.branches || user.branches.length === 0) {
      return res.status(400).json({ message: "User or branches not found" });
    }

    const branch = await Branch.findById(branchId);
    if (!branch || !user.branches.some(b => b._id.toString() === branchId)) {
      return res.status(400).json({ message: "Invalid branch or user not assigned to this branch" });
    }

    const isWithin = isWithinRadius({ lat, lng }, branch.location, branch.radius);
    if (!isWithin) {
      return res.status(400).json({ message: "You are outside the branch area!" });
    }

    if (!deviceFingerprint) {
      return res.status(400).json({ message: "Device fingerprint is required" });
    }

    // لو أول جهاز، حفظه تلقائياً مع approved: true
    if (user.registeredDevices.length === 0) {
      user.registeredDevices.push({ deviceFingerprint, approved: true });
      await user.save();
    } else {
      const device = user.registeredDevices.find(d => d.deviceFingerprint === deviceFingerprint && d.approved);
      if (!device) {
        if (!user.registeredDevices.some(d => d.deviceFingerprint === deviceFingerprint)) {
          user.registeredDevices.push({ deviceFingerprint, approved: false });
          await user.save();
        }
        return res.status(403).json({ message: "Device not approved. Request sent to admin for approval." });
      }
    }

    const today = new Date().setHours(0, 0, 0, 0);
    const existingRecord = await Attendance.findOne({
      user: userId,
      branch: branchId,
      checkInTime: { $gte: today },
    });

    if (!existingRecord) {
      return res.status(400).json({ message: "No check-in record found for today" });
    }

    if (existingRecord.checkOutTime) {
      return res.status(400).json({ message: "You have already checked out today" });
    }

    existingRecord.checkOutTime = new Date();
    existingRecord.locationOut = { lat, lng };
    await existingRecord.save();

    res.json({ message: "Check-out successful", attendance: existingRecord });
  } catch (err) {
    console.error("Check-out error:", err);
    res.status(500).json({ message: "Failed to check out", error: err.message });
  }
};

exports.recordAbsence = async (req, res) => {
  const { lat, lng, branchId, deviceFingerprint } = req.body;
  const userId = req.user.userId;
  const ip = req.ip;

  try {
    const user = await User.findById(userId).populate('branches');
    if (!user || !user.allowRemoteAbsence) {
      return res.status(403).json({ message: "غير مصرح لك بتسجيل الغياب عن بعد" });
    }

    const branch = await Branch.findById(branchId);
    if (!branch || !user.branches.some(b => b._id.toString() === branchId)) {
      return res.status(400).json({ message: "فرع غير صالح" });
    }

    if (!deviceFingerprint) {
      return res.status(400).json({ message: "Device fingerprint is required" });
    }

    // لو أول جهاز، حفظه تلقائياً مع approved: true
    if (user.registeredDevices.length === 0) {
      user.registeredDevices.push({ deviceFingerprint, approved: true });
      await user.save();
    } else {
      const device = user.registeredDevices.find(d => d.deviceFingerprint === deviceFingerprint && d.approved);
      if (!device) {
        if (!user.registeredDevices.some(d => d.deviceFingerprint === deviceFingerprint)) {
          user.registeredDevices.push({ deviceFingerprint, approved: false });
          await user.save();
        }
        return res.status(403).json({ message: "Device not approved. Request sent to admin for approval." });
      }
    }

    const today = new Date().setHours(0, 0, 0, 0);
    const existingRecord = await Attendance.findOne({
      user: userId,
      branch: branchId,
      checkInTime: { $gte: today },
    });

    if (existingRecord) {
      return res.status(400).json({ message: "لقد تم تسجيل حضور أو غياب بالفعل اليوم" });
    }

    const attendance = await Attendance.create({
      user: userId,
      branch: branchId,
      checkInTime: new Date(),
      locationIn: { lat, lng },
      dayStatus: 'absent',
    });

    await Log.create({
      userId,
      action: 'recordAbsence',
      ip,
      lat,
      lng,
      status: 'success'
    });

    res.json({ message: "تم تسجيل الغياب بنجاح", attendance });
  } catch (err) {
    console.error("خطأ في تسجيل الغياب:", err);
    res.status(500).json({ message: "فشل تسجيل الغياب", error: err.message });
  }
};

exports.grantRemotePermission = async (req, res) => {
  const { userId, branchId, date } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    }

    if (!user.remotePermissions) user.remotePermissions = [];
    user.remotePermissions.push({ branchId, date: new Date(date) });
    await user.save();

    res.json({ message: 'تم منح الإذن للتسجيل عن بعد لليوم المحدد' });
  } catch (err) {
    res.status(500).json({ message: 'فشل منح الإذن', error: err.message });
  }
};
exports.toggleEmergency = async (req, res) => {
  const { branchId, allowRemote } = req.body;

  try {
    const branch = await Branch.findById(branchId);
    if (!branch) {
      return res.status(404).json({ message: 'الفرع غير موجود' });
    }

    branch.allowRemoteCheckin = allowRemote;
    await branch.save();

    res.json({ message: `وضع الطوارئ ${allowRemote ? 'مفعل' : 'معطل'} للفرع` });
  } catch (err) {
    console.error('خطأ في تبديل وضع الطوارئ:', err);
    res.status(500).json({ message: 'فشل تبديل وضع الطوارئ', error: err.message });
  }
};
exports.getUserAttendance = async (req, res) => {
  try {
    const records = await Attendance.find({ user: req.params.id })
      .populate('branch', 'name')
      .sort({ checkInTime: -1 });

    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};