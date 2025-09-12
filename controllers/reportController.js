
const Attendance = require("../models/Attendance");
const User = require("../models/User");

exports.getUserReport = async (req, res) => {
  try {
    const { userId } = req.params;

    // Find user and populate branches
    const user = await User.findById(userId).populate("branches", "name");
    if (!user) {
      return res.status(404).json({ message: "الموظف غير موجود" });
    }

    // Get attendance records with branch information
    const attendance = await Attendance.find({ user: userId })
      .populate('branch', 'name')
      .sort({ checkInTime: -1 });

    // Calculate statistics
    const stats = {
      totalRecords: attendance.length,
      workingDays: attendance.filter(record => record.dayStatus === 'working').length,
      absentDays: attendance.filter(record => record.dayStatus === 'absent').length,
      lateDays: attendance.filter(record => record.dayStatus === 'late').length,
      totalLateMinutes: attendance.reduce((sum, record) => sum + (record.lateMinutes || 0), 0),
      totalEarlyLeaveMinutes: attendance.reduce((sum, record) => sum + (record.earlyLeaveMinutes || 0), 0),
      totalWorkMinutes: attendance.reduce((sum, record) => sum + (record.durationMinutes || 0), 0),
      averageWorkHours: 0
    };

    // Calculate average work hours
    if (stats.workingDays > 0) {
      stats.averageWorkHours = Math.round((stats.totalWorkMinutes / stats.workingDays / 60) * 100) / 100;
    }

    // Convert total work minutes to hours
    stats.totalWorkHours = Math.round((stats.totalWorkMinutes / 60) * 100) / 100;

    res.json({ 
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        branches: user.branches,
        salary: user.salary,
        role: user.role
      }, 
      attendance,
      statistics: stats
    });
  } catch (err) {
    console.error('خطأ في تحميل التقرير:', err);
    res.status(500).json({ message: "خطأ في تحميل التقرير", error: err.message });
  }
};

exports.getMonthlyReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { year, month } = req.query; // Query parameters للسنة والشهر
    const startDate = new Date(year, month - 1, 1); // أول يوم في الشهر
    const endDate = new Date(year, month, 0); // آخر يوم في الشهر
    const daysInMonth = endDate.getDate();

    // جلب بيانات المستخدم مع الفروع
    const user = await User.findById(id).populate('branches', 'name');
    if (!user) {
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    }

    // جلب سجلات الحضور في الشهر
    const attendance = await Attendance.find({
      user: user._id,
      checkInTime: { $gte: startDate, $lte: endDate },
    }).populate('branch', 'name');

    const workingDays = [];
    const holidays = [];
    const absences = [];
    let totalLateMinutes = 0;
    let totalEarlyLeaveMinutes = 0;
    let expectedWorkingDaysInMonth = 0; // عداد الأيام المتوقعة في الشهر

    // حلقة على أيام الشهر
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const dayName = date.toLocaleString('en-us', { weekday: 'long' });

      // إذا كان اليوم في workingDaysNames، زِد العداد
      if (user.workingDaysNames.includes(dayName)) {
        expectedWorkingDaysInMonth++;
      } else {
        continue; // تخطي الأيام غير العاملة
      }

      // البحث عن سجل الحضور لهذا اليوم
      const record = attendance.find(
        (r) => new Date(r.checkInTime).toDateString() === date.toDateString()
      );

      if (record) {
        if (record.dayStatus === 'working') {
          workingDays.push(date);
          // حساب التأخير
          const workStart = new Date(date);
          const [startHour, startMin] = user.workStartTime.split(':').map(Number);
          workStart.setHours(startHour, startMin, 0, 0);
          const lateMs = record.checkInTime - workStart;
          if (lateMs > 0) totalLateMinutes += Math.floor(lateMs / 60000);

          // حساب الخروج المبكر إذا سجل checkOut
          if (record.checkOutTime) {
            const workEnd = new Date(date);
            const [endHour, endMin] = user.workEndTime.split(':').map(Number);
            workEnd.setHours(endHour, endMin, 0, 0);
            const earlyMs = workEnd - record.checkOutTime;
            if (earlyMs > 0) totalEarlyLeaveMinutes += Math.floor(earlyMs / 60000);
          }
        } else if (record.dayStatus === 'holiday') {
          holidays.push(date);
        } else if (record.dayStatus === 'absent') {
          absences.push(date);
        }
      } else {
        absences.push(date); // لا سجل = غياب
      }
    }

    // حساب الخصومات
    const absenceDeduction = absences.length * (user.salary / expectedWorkingDaysInMonth) * user.absenceDeductionRate;
    const lateDeduction = (totalLateMinutes / 60) * (user.salary / (expectedWorkingDaysInMonth * user.workingHoursPerDay)) * user.lateDeductionRate;
    const earlyDeduction = (totalEarlyLeaveMinutes / 60) * (user.salary / (expectedWorkingDaysInMonth * user.workingHoursPerDay)) * user.earlyLeaveDeductionRate;
    const netSalary = user.salary - absenceDeduction - lateDeduction - earlyDeduction;

    // إرجاع التقرير
    res.json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        branches: user.branches,
        salary: user.salary,
      },
      workingDays: workingDays.length,
      holidays: holidays.length,
      absences: absences.length,
      totalLateMinutes,
      totalEarlyLeaveMinutes,
      deductions: {
        absence: absenceDeduction.toFixed(2), 
        late: lateDeduction.toFixed(2),
        early: earlyDeduction.toFixed(2),
      },
      netSalary: netSalary.toFixed(2), 
    });
  } catch (err) {
    console.error('خطأ في توليد التقرير الشهري:', err);
    res.status(500).json({ message: 'فشل في توليد التقرير الشهري', error: err.message });
  }
};