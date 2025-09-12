
const Attendance = require("../models/Attendance");
const User = require("../models/User");
const Branch = require("../models/Branch");
const { isWithinRadius } = require("../helpers/location");
const Log = require("../models/Log");
const { sendAlert } = require("../config/nodemailer");

// التحقق من الجهاز وتسجيله إذا لم يكن مسجلاً
const verifyAndRegisterDevice =async (user, deviceInfo, req) => {
  const { deviceId, browserFingerprint, userAgent } = deviceInfo;
  
  console.log('التحقق من الجهاز:', {
    deviceId,
    userAgent,
    registeredDevicesCount: user.registeredDevices.length,
    userId: user._id,
    userName: user.name
  });
  
  // البحث عن الجهاز المسجل باستخدام deviceId
  let registeredDevice = user.registeredDevices.find(d => d.deviceId === deviceId);
  
  if (!registeredDevice) {
    // جهاز جديد - تسجيله
    const approved = user.registeredDevices.length === 0; // أول جهاز يُوافق عليه تلقائيًا
    console.log('حالة الموافقة على الجهاز:', approved);
    
    const newDevice = {
      deviceId,
      deviceFingerprint: browserFingerprint,
      userAgent,
      approved,
      registeredAt: new Date(),
      lastUsed: new Date()
    };
    
    user.registeredDevices.push(newDevice);
    await user.save();
    
    // إرسال تنبيه لجميع الأدمن إذا لم يكن الجهاز الأول
    if (!approved) {
      console.log('محاولة إرسال تنبيه لجميع الأدمن...');
      try {
        // جلب جميع المستخدمين بصلاحية الأدمن والحسابات النشطة
        const admins = await User.find({ role: 'admin', isActive: true }).select('email');
        
        if (admins.length === 0) {
          console.warn('لم يتم العثور على أي مستخدمين بصلاحية الأدمن');
          await Log.create({
            userId: user._id,
            action: 'newDeviceRegistrationEmailFailed',
            ip: req.ip,
            deviceId,
            deviceFingerprint: browserFingerprint,
            userAgent,
            status: 'error',
            reason: 'لم يتم العثور على أي مستخدمين بصلاحية الأدمن لإرسال الإيميل'
          });
        } else {
          // إرسال الإيميل إلى كل أدمن
          const emailPromises = admins.map(admin =>
            sendAlert(
              admin.email,
              'طلب موافقة على جهاز جديد',
              `المستخدم ${user.name || 'غير معروف'} يطلب موافقة على جهاز جديد.\nمعلومات الجهاز: ${userAgent || 'غير متوفر'}`
            ).then(info => ({ email: admin.email, status: 'success', messageId: info.messageId }))
              .catch(err => ({ email: admin.email, status: 'error', error: err.message }))
          );
          
          const results = await Promise.all(emailPromises);
          console.log('نتائج إرسال الإيميلات:', results);
          
          // تسجيل نتائج الإرسال
          const successfulEmails = results.filter(r => r.status === 'success').map(r => r.email);
          const failedEmails = results.filter(r => r.status === 'error').map(r => ({ email: r.email, error: r.error }));
          
          await Log.create({
            userId: user._id,
            action: 'newDeviceRegistration',
            ip: req.ip,
            deviceId,
            deviceFingerprint: browserFingerprint,
            userAgent,
            status: successfulEmails.length > 0 ? 'pending' : 'error',
            reason: successfulEmails.length > 0
              ? `جهاز جديد بانتظار الموافقة، تم إرسال الإيميل إلى: ${successfulEmails.join(', ')}`
              : 'فشل إرسال الإيميل إلى جميع الأدمن',
            metadata: {
              sentTo: successfulEmails,
              failedTo: failedEmails
            }
          });
          
          // تسجيل الأخطاء الفردية إذا وجدت
          if (failedEmails.length > 0) {
            console.error('فشل إرسال الإيميل إلى بعض الأدمن:', failedEmails);
            await Log.create({
              userId: user._id,
              action: 'newDeviceRegistrationEmailFailed',
              ip: req.ip,
              deviceId,
              deviceFingerprint: browserFingerprint,
              userAgent,
              status: 'error',
              reason: `فشل إرسال الإيميل إلى: ${failedEmails.map(f => f.email).join(', ')}`,
              metadata: { errors: failedEmails }
            });
          }
        }
      } catch (error) {
        console.error('خطأ عام أثناء إرسال تنبيهات الأدمن:', error);
        await Log.create({
          userId: user._id,
          action: 'newDeviceRegistrationEmailFailed',
          ip: req.ip,
          deviceId,
          deviceFingerprint: browserFingerprint,
          userAgent,
          status: 'error',
          reason: `خطأ عام أثناء إرسال الإيميل: ${error.message}`
        });
      }
    } else {
      console.log('الجهاز الأول، تمت الموافقة التلقائية، لا حاجة لإرسال إيميل');
    }
    
    return { approved, isNewDevice: true };
  } else {
    console.log('الجهاز مسجل مسبقًا، تحديث البيانات:', { deviceId });
    registeredDevice.lastUsed = new Date();
    registeredDevice.deviceFingerprint = browserFingerprint;
    await user.save();
    
    return { approved: registeredDevice.approved, isNewDevice: false };
  }
};
exports.checkIn = async (req, res) => {
  const { lat, lng, branchId, deviceInfo } = req.body;
  const userId = req.user.userId;
  const ip = req.ip;
console.log("IP المستخدم في الطلب:", req.ip);
  try {
    // التحقق من وجود المستخدم والفروع
    const user = await User.findById(userId).populate('branches');
    if (!user || !user.branches || user.branches.length === 0) {
      return res.status(400).json({ message: "المستخدم أو الفروع غير موجودة" });
    }

    // التحقق من صحة الفرع
    const branch = await Branch.findById(branchId);
    if (!branch || !user.branches.some(b => b._id.toString() === branchId)) {
      return res.status(400).json({ message: "فرع غير صالح أو المستخدم غير معين لهذا الفرع" });
    }

    // التحقق من معلومات الجهاز
    if (!deviceInfo || !deviceInfo.deviceId) {
      return res.status(400).json({ message: "معلومات الجهاز مطلوبة" });
    }

    // التحقق من الجهاز وتسجيله
    const deviceCheck = await verifyAndRegisterDevice(user, deviceInfo, req);
    if (!deviceCheck.approved) {
      return res.status(403).json({ 
        message: "الجهاز غير موافق عليه. تم إرسال طلب للإدارة للموافقة.",
        isNewDevice: deviceCheck.isNewDevice
      });
    }

    // التحقق من الموقع (إلزامي دائماً)
    if (!lat || !lng) {
      return res.status(400).json({ message: "معلومات الموقع مطلوبة" });
    }

    const isWithin = isWithinRadius({ lat, lng }, branch.location, branch.radius);
    if (!isWithin) {
      await Log.create({
        userId,
        action: 'checkIn',
        ip,
        lat,
        lng,
        deviceId: deviceInfo.deviceId,
        deviceFingerprint: deviceInfo.browserFingerprint,
        status: 'failed',
        reason: 'خارج نطاق الفرع'
      });
      return res.status(400).json({ message: "أنت خارج نطاق الفرع!" });
    }

    // التحقق من الإذن الخاص للتسجيل عن بُعد
    const hasRemotePermission = user.remotePermissions && user.remotePermissions.some(p => {
      const today = new Date().setHours(0, 0, 0, 0);
      return p.branchId.toString() === branchId && new Date(p.date).setHours(0, 0, 0, 0) === today;
    });

    // التحقق من واي فاي الفرع (إلا في حالة الطوارئ أو الإذن الخاص)
    if (!branch.allowRemoteCheckin && !hasRemotePermission) {
      if (!branch.allowedIPs || !branch.allowedIPs.includes(ip)) {
        await Log.create({
          userId,
          action: 'checkIn',
          ip,
          lat,
          lng,
          deviceId: deviceInfo.deviceId,
          deviceFingerprint: deviceInfo.browserFingerprint,
          status: 'failed',
          reason: 'IP غير مسموح (واي فاي غير مسجل)'
        });
        return res.status(403).json({ 
          message: "يجب الاتصال بواي فاي الفرع المسجل أو الحصول على إذن خاص." 
        });
      }
    }

    // التحقق من عدم وجود تسجيل مسبق لنفس اليوم
    const today = new Date().setHours(0, 0, 0, 0);
    const existingRecord = await Attendance.findOne({
      user: userId,
      branch: branchId,
      checkInTime: { $gte: today },
    });

    if (existingRecord) {
      return res.status(400).json({ message: "لقد سجلت حضورك اليوم بالفعل لهذا الفرع" });
    }

    // حساب التأخير
 const now = new Date();
    let lateMinutes = 0;
    if (user.workStartTime) {
      const [startHour, startMin] = user.workStartTime.split(':').map(Number);
      const [endHour] = user.workEndTime.split(':').map(Number);
      let workStart = new Date(now);
      workStart.setHours(startHour, startMin, 0, 0);

      if (endHour < startHour || user.isNightShift) {
        if (now.getHours() < startHour) {
          workStart.setDate(workStart.getDate() - 1);
        }
      }

      lateMinutes = now > workStart ? Math.floor((now - workStart) / 60000) : 0;
    }

    // إنشاء سجل الحضور
    const attendance = await Attendance.create({
      user: userId,
      branch: branchId,
      checkInTime: now,
      locationIn: { lat, lng },
      dayStatus: 'working',
      lateMinutes,
      deviceFingerprint: deviceInfo.browserFingerprint,
      deviceId: deviceInfo.deviceId,
      deviceInfo: {
        userAgent: deviceInfo.userAgent,
        platform: deviceInfo.platform,
        browserFingerprint: deviceInfo.browserFingerprint
      },
      ipAddress: ip,
      isRemoteCheckin: branch.allowRemoteCheckin || hasRemotePermission
    });

    // تسجيل العملية في اللوجات
    await Log.create({
      userId,
      action: 'checkIn',
      ip,
      lat,
      lng,
      deviceId: deviceInfo.deviceId,
      deviceFingerprint: deviceInfo.browserFingerprint,
      branchId,
      status: 'success'
    });

    // تحديث إحصائيات المستخدم
    user.stats.totalCheckIns += 1;
    user.stats.lastCheckIn = now;
    if (lateMinutes > 0) {
      user.stats.totalLateMinutes += lateMinutes;
    }
    await user.save();

    res.json({ 
      message: "تم تسجيل الحضور بنجاح", 
      attendance,
      lateMinutes: lateMinutes > 0 ? lateMinutes : null
    });

  } catch (err) {
    console.error("خطأ في تسجيل الحضور:", err);
    await Log.create({
      userId,
      action: 'checkIn',
      ip: req.ip,
      status: 'error',
      reason: err.message
    });
    res.status(500).json({ message: "فشل تسجيل الحضور", error: err.message });
  }
};

exports.checkOut = async (req, res) => {
  const { lat, lng, branchId, deviceInfo } = req.body;
  const userId = req.user.userId;
  const ip = req.ip;

  try {
    // التحقق من وجود المستخدم والفروع
    const user = await User.findById(userId).populate('branches');
    if (!user || !user.branches || user.branches.length === 0) {
      return res.status(400).json({ message: "المستخدم أو الفروع غير موجودة" });
    }

    // التحقق من صحة الفرع
    const branch = await Branch.findById(branchId);
    if (!branch || !user.branches.some(b => b._id.toString() === branchId)) {
      return res.status(400).json({ message: "فرع غير صالح أو المستخدم غير معين لهذا الفرع" });
    }

    // التحقق من معلومات الجهاز
    if (!deviceInfo || !deviceInfo.deviceId) {
      return res.status(400).json({ message: "معلومات الجهاز مطلوبة" });
    }

    // التحقق من الجهاز
    const deviceCheck = await verifyAndRegisterDevice(user, deviceInfo, req);
    if (!deviceCheck.approved) {
      return res.status(403).json({ 
        message: "الجهاز غير موافق عليه. تم إرسال طلب للإدارة للموافقة.",
        isNewDevice: deviceCheck.isNewDevice
      });
    }

    // البحث عن سجل الحضور لنفس اليوم
    const today = new Date().setHours(0, 0, 0, 0);
    const attendance = await Attendance.findOne({
      user: userId,
      branch: branchId,
      checkInTime: { $gte: today },
      checkOutTime: { $exists: false },
    });

    if (!attendance) {
      return res.status(400).json({ message: "لا يوجد تسجيل حضور اليوم لهذا الفرع" });
    }

    // التحقق من الإذن الخاص للتسجيل عن بُعد
    const hasRemotePermission = user.remotePermissions && user.remotePermissions.some(p => {
      const today = new Date().setHours(0, 0, 0, 0);
      return p.branchId.toString() === branchId && new Date(p.date).setHours(0, 0, 0, 0) === today;
    });

    // التحقق من الموقع (إلزامي دائمًا ما لم يكن هناك إذن خاص)
    const isWithin = isWithinRadius({ lat, lng }, branch.location, branch.radius);
    if (!isWithin && !hasRemotePermission) {
      await Log.create({
        userId,
        action: 'checkOut',
        ip,
        lat,
        lng,
        deviceId: deviceInfo.deviceId,
        deviceFingerprint: deviceInfo.browserFingerprint,
        branchId,
        status: 'failed',
        reason: 'خارج نطاق الفرع وغير مسموح بالتسجيل عن بُعد'
      });
      return res.status(400).json({ 
        message: "أنت خارج نطاق الفرع ولا يُسمح بالتسجيل عن بُعد!" 
      });
    }

    // التحقق من واي فاي الفرع (إذا لم يكن في وضع الطوارئ أو لديه إذن خاص)
    if (!branch.allowRemoteCheckin && !hasRemotePermission) {
      if (!branch.allowedIPs || !branch.allowedIPs.includes(ip)) {
        await Log.create({
          userId,
          action: 'checkOut',
          ip,
          lat,
          lng,
          deviceId: deviceInfo.deviceId,
          deviceFingerprint: deviceInfo.browserFingerprint,
          branchId,
          status: 'failed',
          reason: 'IP غير مسموح (واي فاي غير مسجل)'
        });
        return res.status(403).json({ 
          message: "يجب الاتصال بواي فاي الفرع المسجل أو الحصول على إذن خاص." 
        });
      }
    }

    const now = new Date();
    const durationMs = now - attendance.checkInTime;
    const durationMinutes = Math.floor(durationMs / 60000);

    let earlyLeaveMinutes = 0;
    if (user.workEndTime) {
      const [endHour, endMin] = user.workEndTime.split(':').map(Number);
      const [startHour] = user.workStartTime.split(':').map(Number);
      let workEnd = new Date(attendance.checkInTime);
      workEnd.setHours(endHour, endMin, 0, 0);

      if (endHour < startHour || user.isNightShift) {
        workEnd.setDate(workEnd.getDate() + 1);
      }

      earlyLeaveMinutes = now < workEnd ? Math.floor((workEnd - now) / 60000) : 0;
    }

    // تحديث سجل الحضور
    attendance.checkOutTime = now;
    attendance.durationMinutes = durationMinutes;
    attendance.locationOut = { lat, lng };
    attendance.outOfLocation = !isWithin;
    attendance.earlyLeaveMinutes = earlyLeaveMinutes;
    attendance.isRemoteCheckout = !isWithin || branch.allowRemoteCheckin || hasRemotePermission;
    await attendance.save();

    // تسجيل العملية في اللوجات
    await Log.create({
      userId,
      action: 'checkOut',
      ip,
      lat,
      lng,
      deviceId: deviceInfo.deviceId,
      deviceFingerprint: deviceInfo.browserFingerprint,
      branchId,
      status: 'success'
    });

    // تحديث إحصائيات المستخدم
    user.stats.lastCheckOut = now;
    if (earlyLeaveMinutes > 0) {
      user.stats.totalEarlyLeaves += earlyLeaveMinutes;
    }
    await user.save();

    res.json({
      message: "تم تسجيل الانصراف بنجاح",
      attendance,
      durationMinutes,
      outOfLocation: !isWithin,
      earlyLeaveMinutes: earlyLeaveMinutes > 0 ? earlyLeaveMinutes : null
    });

  } catch (err) {
    console.error("خطأ في تسجيل الانصراف:", err);
    await Log.create({
      userId,
      action: 'checkOut',
      ip: req.ip,
      status: 'error',
      reason: err.message
    });
    res.status(500).json({ message: "فشل تسجيل الانصراف", error: err.message });
  }
};

exports.recordAbsence = async (req, res) => {
  const { lat, lng, branchId, deviceInfo } = req.body;
  const userId = req.user.userId;
  const ip = req.ip;

  try {
    const user = await User.findById(userId).populate('branches');
    if (!user || !user.allowRemoteAbsence) {
      return res.status(403).json({ message: "غير مصرح لك بتسجيل الغياب عن بُعد" });
    }

    const branch = await Branch.findById(branchId);
    if (!branch || !user.branches.some(b => b._id.toString() === branchId)) {
      return res.status(400).json({ message: "فرع غير صالح" });
    }

    // التحقق من معلومات الجهاز
    if (!deviceInfo || !deviceInfo.deviceId) {
      return res.status(400).json({ message: "معلومات الجهاز مطلوبة" });
    }

    // التحقق من الجهاز
    const deviceCheck = await verifyAndRegisterDevice(user, deviceInfo, req);
    if (!deviceCheck.approved) {
      return res.status(403).json({ 
        message: "الجهاز غير موافق عليه. تم إرسال طلب للإدارة للموافقة.",
        isNewDevice: deviceCheck.isNewDevice
      });
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
      deviceFingerprint: deviceInfo.browserFingerprint,
      deviceId: deviceInfo.deviceId,
      deviceInfo: {
        userAgent: deviceInfo.userAgent,
        platform: deviceInfo.platform,
        browserFingerprint: deviceInfo.browserFingerprint
      },
      ipAddress: ip,
      isRemoteCheckin: true
    });

    await Log.create({
      userId,
      action: 'recordAbsence',
      ip,
      lat,
      lng,
      deviceId: deviceInfo.deviceId,
      deviceFingerprint: deviceInfo.browserFingerprint,
      branchId,
      status: 'success'
    });

    res.json({ message: "تم تسجيل الغياب بنجاح", attendance });
  } catch (err) {
    console.error("خطأ في تسجيل الغياب:", err);
    res.status(500).json({ message: "فشل تسجيل الغياب", error: err.message });
  }
};

exports.grantRemotePermission = async (req, res) => {
  const { userId, branchId, date, reason } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    }

    if (!user.remotePermissions) user.remotePermissions = [];
    
    user.remotePermissions.push({ 
      branchId, 
      date: new Date(date),
      grantedBy: req.user.userId,
      reason: reason || 'إذن خاص من الإدارة'
    });
    await user.save();

    await Log.create({
      userId,
      action: 'remotePermissionGranted',
      branchId,
      status: 'success',
      reason: `تم منح إذن التسجيل عن بُعد لتاريخ ${date}`
    });

    res.json({ message: 'تم منح الإذن للتسجيل عن بُعد لليوم المحدد' });
  } catch (err) {
    res.status(500).json({ message: 'فشل منح الإذن', error: err.message });
  }
};

exports.toggleEmergency = async (req, res) => {
  const { branchId, allowRemote } = req.body;

  try {
    if (branchId) {
      // تفعيل/إلغاء لفرع محدد
      const branch = await Branch.findById(branchId);
      if (!branch) {
        return res.status(404).json({ message: 'الفرع غير موجود' });
      }
      branch.allowRemoteCheckin = allowRemote;
      await branch.save();
      
      await Log.create({
        userId: req.user.userId,
        action: 'emergencyModeToggle',
        branchId,
        status: 'success',
        reason: `وضع الطوارئ ${allowRemote ? 'مفعل' : 'معطل'} للفرع ${branch.name}`
      });
      
      res.json({ message: `وضع الطوارئ ${allowRemote ? 'مفعل' : 'معطل'} للفرع ${branch.name}` });
    } else {
      // تفعيل/إلغاء لجميع الفروع
      await Branch.updateMany({}, { allowRemoteCheckin: allowRemote });
      
      await Log.create({
        userId: req.user.userId,
        action: 'emergencyModeToggle',
        status: 'success',
        reason: `وضع الطوارئ ${allowRemote ? 'مفعل' : 'معطل'} لجميع الفروع`
      });
      
      res.json({ message: `وضع الطوارئ ${allowRemote ? 'مفعل' : 'معطل'} لجميع الفروع` });
    }
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

// إدارة موافقة الأجهزة
exports.approveDevice = async (req, res) => {
  const { userId, deviceId, approve } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    }

    const device = user.registeredDevices.find(d => d.deviceId === deviceId);
    if (!device) {
      return res.status(404).json({ message: 'الجهاز غير موجود' });
    }

    device.approved = approve;
    device.approvedAt = approve ? new Date() : null;
    device.approvedBy = req.user.userId;
    await user.save();

    await Log.create({
      userId,
      action: approve ? 'deviceApproval' : 'deviceRejection',
      deviceId,
      status: 'success',
      reason: approve ? 'تم الموافقة على الجهاز' : 'تم رفض الجهاز'
    });

    res.json({ 
      message: approve ? 'تم الموافقة على الجهاز بنجاح' : 'تم رفض الجهاز',
      device 
    });
  } catch (err) {
    console.error('خطأ في موافقة الجهاز:', err);
    res.status(500).json({ message: 'فشل في معالجة طلب الموافقة', error: err.message });
  }
};

// عرض الأجهزة المنتظرة للموافقة
exports.getPendingDevices = async (req, res) => {
  try {
    const users = await User.find({
      'registeredDevices.approved': false
    }).select('name email registeredDevices');

    const pendingDevices = [];
    users.forEach(user => {
      user.registeredDevices.forEach(device => {
        if (!device.approved) {
          pendingDevices.push({
            userId: user._id,
            userName: user.name,
            userEmail: user.email,
            deviceId: device.deviceId,
            deviceFingerprint: device.deviceFingerprint,
            userAgent: device.userAgent,
            registeredAt: device.registeredAt,
            lastUsed: device.lastUsed
          });
        }
      });
    });

    res.json(pendingDevices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// تقارير الحضور
exports.getAttendanceReports = async (req, res) => {
  try {
    const { branchId } = req.params;
    const { startDate, endDate, userId } = req.query;

    let query = {};
    
    if (branchId !== 'all') {
      query.branch = branchId;
    }
    
    if (userId) {
      query.user = userId;
    }
    
    if (startDate && endDate) {
      query.checkInTime = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const records = await Attendance.find(query)
      .populate('user', 'name email')
      .populate('branch', 'name')
      .sort({ checkInTime: -1 })
      .limit(1000); // محدود بـ 1000 سجل

    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// سجلات الأمان
exports.getSecurityLogs = async (req, res) => {
  try {
    const { page = 1, limit = 100, securityLevel, status } = req.query;

    let query = {};
    
    if (securityLevel) {
      query.securityLevel = securityLevel;
    }
    
    if (status) {
      query.status = status;
    }

    const logs = await Log.find(query)
      .populate('userId', 'name email')
      .populate('branchId', 'name')
      .sort({ timestamp: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Log.countDocuments(query);

    res.json({
      logs,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalLogs: total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};