// const express = require("express");
// const router = express.Router();
// const { checkIn, checkOut , toggleEmergency,recordAbsence,grantRemotePermission} = require("../controllers/attendanceController");
// const { protect,adminOnly } = require("../middleware/auth");

// router.post("/checkin", protect, checkIn);
// router.post("/checkout", protect, checkOut);
// router.post('/toggle-emergency', protect, adminOnly, toggleEmergency);
// router.post('/record-absence', protect, recordAbsence);
// router.post('/grant-remote-permission', protect, adminOnly, grantRemotePermission);
// module.exports = router;

const express = require("express");
const router = express.Router();
const { 
  checkIn, 
  checkOut, 
  toggleEmergency,
  recordAbsence,
  grantRemotePermission,
  getUserAttendance,
  approveDevice,
  getPendingDevices,
  getAttendanceReports,
  getSecurityLogs
} = require("../controllers/attendanceController");
const { protect, adminOnly } = require("../middleware/auth");

// روتس الحضور والانصراف الأساسية
router.post("/checkin", protect, checkIn);
router.post("/checkout", protect, checkOut);
router.post("/record-absence", protect, recordAbsence);

// روتس الإدارة (تتطلب صلاحيات أدمن)
router.post("/toggle-emergency", protect, adminOnly, toggleEmergency);
router.post("/grant-remote-permission", protect, adminOnly, grantRemotePermission);

// روتس إدارة الأجهزة
router.post("/approve-device", protect, adminOnly, approveDevice);
router.get("/pending-devices", protect, adminOnly, getPendingDevices);

// روتس التقارير والسجلات
router.get("/user/:id", protect, getUserAttendance);
router.get("/reports/:branchId", protect, adminOnly, getAttendanceReports);
router.get("/security-logs", protect, adminOnly, getSecurityLogs);

// روت لحذف جهاز مسجل
router.delete("/device/:userId/:deviceId", protect, adminOnly, async (req, res) => {
  try {
    const User = require("../models/User");
    const Log = require("../models/Log");
    const { userId, deviceId } = req.params;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    }

    // البحث عن الجهاز وحذفه
    const deviceIndex = user.registeredDevices.findIndex(d => d.deviceId === deviceId);
    if (deviceIndex === -1) {
      return res.status(404).json({ message: 'الجهاز غير موجود' });
    }

    const removedDevice = user.registeredDevices[deviceIndex];
    user.registeredDevices.splice(deviceIndex, 1);
    await user.save();

    // تسجيل العملية في اللوجات
    await Log.create({
      userId: req.user.userId, // المدير الذي قام بالحذف
      action: 'deviceRemoval',
      deviceId,
      status: 'success',
      reason: `تم حذف الجهاز للمستخدم ${user.name}`,
      metadata: {
        removedDeviceInfo: {
          userAgent: removedDevice.userAgent,
          registeredAt: removedDevice.registeredAt
        },
        targetUserId: userId
      }
    });

    res.json({ message: 'تم حذف الجهاز بنجاح' });
  } catch (error) {
    console.error('خطأ في حذف الجهاز:', error);
    res.status(500).json({ message: 'فشل في حذف الجهاز', error: error.message });
  }
});

// روت لتعطيل/تفعيل جهاز
router.patch("/device/:userId/:deviceId/toggle", protect, adminOnly, async (req, res) => {
  try {
    const User = require("../models/User");
    const Log = require("../models/Log");
    const { userId, deviceId } = req.params;
    const { isActive } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    }

    const device = user.registeredDevices.find(d => d.deviceId === deviceId);
    if (!device) {
      return res.status(404).json({ message: 'الجهاز غير موجود' });
    }

    device.isActive = isActive;
    await user.save();

    await Log.create({
      userId: req.user.userId,
      action: 'deviceToggle',
      deviceId,
      status: 'success',
      reason: `تم ${isActive ? 'تفعيل' : 'تعطيل'} الجهاز للمستخدم ${user.name}`,
      metadata: {
        targetUserId: userId,
        newStatus: isActive
      }
    });

    res.json({ 
      message: `تم ${isActive ? 'تفعيل' : 'تعطيل'} الجهاز بنجاح`,
      device 
    });
  } catch (error) {
    console.error('خطأ في تغيير حالة الجهاز:', error);
    res.status(500).json({ message: 'فشل في تغيير حالة الجهاز', error: error.message });
  }
});

// روت للحصول على أجهزة مستخدم محدد
router.get("/user/:userId/devices", protect, adminOnly, async (req, res) => {
  try {
    const User = require("../models/User");
    const { userId } = req.params;
    
    const user = await User.findById(userId).select('name email registeredDevices');
    if (!user) {
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    }

    res.json({
      userName: user.name,
      userEmail: user.email,
      devices: user.registeredDevices
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// روت لإحصائيات الحضور
router.get("/stats/:branchId", protect, adminOnly, async (req, res) => {
  try {
    const Attendance = require("../models/Attendance");
    const { branchId } = req.params;
    const { startDate, endDate } = req.query;

    let matchQuery = {};
    
    if (branchId !== 'all') {
      matchQuery.branch = require('mongoose').Types.ObjectId(branchId);
    }
    
    if (startDate && endDate) {
      matchQuery.checkInTime = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else {
      // آخر 30 يوم افتراضياً
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      matchQuery.checkInTime = { $gte: thirtyDaysAgo };
    }

    const stats = await Attendance.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalRecords: { $sum: 1 },
          totalWorking: { $sum: { $cond: [{ $eq: ["$dayStatus", "working"] }, 1, 0] } },
          totalAbsent: { $sum: { $cond: [{ $eq: ["$dayStatus", "absent"] }, 1, 0] } },
          totalLateMinutes: { $sum: "$lateMinutes" },
          totalEarlyLeaveMinutes: { $sum: "$earlyLeaveMinutes" },
          averageDuration: { $avg: "$durationMinutes" },
          remoteCheckIns: { $sum: { $cond: ["$isRemoteCheckin", 1, 0] } },
          outOfLocationCheckouts: { $sum: { $cond: ["$outOfLocation", 1, 0] } }
        }
      }
    ]);

    const result = stats[0] || {
      totalRecords: 0,
      totalWorking: 0,
      totalAbsent: 0,
      totalLateMinutes: 0,
      totalEarlyLeaveMinutes: 0,
      averageDuration: 0,
      remoteCheckIns: 0,
      outOfLocationCheckouts: 0
    };

    res.json(result);
  } catch (error) {
    console.error('خطأ في جلب الإحصائيات:', error);
    res.status(500).json({ message: error.message });
  }
});

// روت للتنبيهات والإشعارات الأمنية
router.get("/security-alerts", protect, adminOnly, async (req, res) => {
  try {
    const Log = require("../models/Log");
    
    const alerts = await Log.find({
      securityLevel: { $in: ['high', 'critical'] },
      requiresAttention: true,
      followUpStatus: { $in: ['pending', 'in_progress'] }
    })
    .populate('userId', 'name email')
    .populate('branchId', 'name')
    .sort({ timestamp: -1 })
    .limit(50);

    res.json(alerts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// روت لتحديث حالة التنبيه
router.patch("/security-alert/:logId", protect, adminOnly, async (req, res) => {
  try {
    const Log = require("../models/Log");
    const { logId } = req.params;
    const { followUpStatus, followUpNotes } = req.body;
    
    const log = await Log.findById(logId);
    if (!log) {
      return res.status(404).json({ message: 'السجل غير موجود' });
    }

    log.followUpStatus = followUpStatus;
    log.followUpNotes = followUpNotes;
    
    if (followUpStatus === 'resolved') {
      log.resolvedBy = req.user.userId;
      log.resolvedAt = new Date();
      log.requiresAttention = false;
    }

    await log.save();

    res.json({ message: 'تم تحديث حالة التنبيه بنجاح', log });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;