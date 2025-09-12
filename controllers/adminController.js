const Attendance = require('../models/Attendance');
const Branch = require('../models/Branch');
const User = require('../models/User');

exports.getAllAttendance = async (req, res) => {
  try {
    const { branch, page = 1, limit = 10, date, name } = req.query;
    const branches = branch ? await Branch.find({ _id: branch }) : await Branch.find();
    const result = [];

    const queryDate = date ? new Date(date) : null;

    for (const branch of branches) {
      let query = { branch: branch._id };

      // Add date filter
      if (queryDate) {
        const startDate = new Date(queryDate.setHours(0, 0, 0, 0));
        const endDate = new Date(queryDate.setHours(23, 59, 59, 999));
        query.checkInTime = { $gte: startDate, $lte: endDate };
      }

      // Add name filter
      if (name) {
        const users = await User.find({ name: { $regex: name, $options: 'i' } }).select('_id');
        const userIds = users.map(user => user._id);
        query.user = { $in: userIds };
      }

      const attendance = await Attendance.find(query)
        .populate('user branch')
        .sort({ checkInTime: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit));
      
      const total = await Attendance.countDocuments(query);
      result.push({ 
        branch, 
        attendance,
        pagination: {
          total,
          page: Number(page),
          pages: Math.ceil(total / limit)
        }
      });
    }
    
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch attendance', error: err.message });
  }
};

exports.getAttendanceByUser = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const attendance = await Attendance.find({ user: req.params.id })
      .populate('user branch')
      .sort({ checkInTime: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    
    const total = await Attendance.countDocuments({ user: req.params.id });
    res.json({
      attendance,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch attendance', error: err.message });
  }
};

// exports.getTotalSalaries = async (req, res) => {
//   try {
//     const { year, month, branchId } = req.query;
//     const startDate = new Date(year, month - 1, 1);
//     const endDate = new Date(year, month, 0);
//     const daysInMonth = endDate.getDate();

//     let usersQuery = {};
//     if (branchId) {
//       usersQuery = { branches: branchId };
//     }
//     const users = await User.find(usersQuery).populate('branches');

//     let totalSalaries = 0;
//     let branchTotals = {};

//     for (const user of users) {
//       const attendance = await Attendance.find({
//         user: user._id,
//         checkInTime: { $gte: startDate, $lte: endDate },
//       }).populate('branch');

//       const workingDays = [];
//       const holidays = [];
//       const absences = [];
//       let totalLateMinutes = 0;
//       let totalEarlyLeaveMinutes = 0;

//       for (let day = 1; day <= daysInMonth; day++) {
//         const date = new Date(year, month - 1, day);
//         const dayName = date.toLocaleString('en-us', { weekday: 'long' });
//         if (!user.workingDaysNames.includes(dayName)) continue; // Skip non-working days

//         const record = attendance.find(
//           (r) => new Date(r.checkInTime).toDateString() === date.toDateString()
//         );
//         if (record) {
//           if (record.dayStatus === 'working') {
//             workingDays.push(date);
//             // Calculate late minutes
//             const workStart = new Date(date);
//             const [startHour, startMin] = user.workStartTime.split(':').map(Number);
//             workStart.setHours(startHour, startMin, 0, 0);
//             const lateMs = record.checkInTime - workStart;
//             if (lateMs > 0) totalLateMinutes += Math.floor(lateMs / 60000);

//             // Calculate early leave if checked out
//             if (record.checkOutTime) {
//               const workEnd = new Date(date);
//               const [endHour, endMin] = user.workEndTime.split(':').map(Number);
//               workEnd.setHours(endHour, endMin, 0, 0);
//               const earlyMs = workEnd - record.checkOutTime;
//               if (earlyMs > 0) totalEarlyLeaveMinutes += Math.floor(earlyMs / 60000);
//             }
//           } else if (record.dayStatus === 'holiday') holidays.push(date);
//           else if (record.dayStatus === 'absent') absences.push(date);
//         } else {
//           absences.push(date);
//         }
//       }

//       const expectedWorkingDays = user.workingDaysNames.length * 4; // Approximate 4 weeks/month
//       const absenceDeduction = absences.length * (user.salary / expectedWorkingDays) * user.absenceDeductionRate;
//       const lateDeduction = (totalLateMinutes / 60) * (user.salary / (expectedWorkingDays * user.workingHoursPerDay)) * user.lateDeductionRate;
//       const earlyDeduction = (totalEarlyLeaveMinutes / 60) * (user.salary / (expectedWorkingDays * user.workingHoursPerDay)) * user.earlyLeaveDeductionRate;
//       const netSalary = user.salary - absenceDeduction - lateDeduction - earlyDeduction;

//       totalSalaries += netSalary;

//       user.branches.forEach(branch => {
//         if (!branchTotals[branch._id]) branchTotals[branch._id] = 0;
//         branchTotals[branch._id] += netSalary / user.branches.length; // Split if multiple branches
//       });
//     }

//     res.json({
//       totalSalaries,
//       branchTotals,
//     });
//   } catch (err) {
//     res.status(500).json({ message: 'Failed to calculate total salaries', error: err.message });
//   }
// };

// تحديث exports.getTotalSalaries في adminController.js

exports.getTotalSalaries = async (req, res) => {
  try {
    const { year, month, branchId } = req.query;
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    const daysInMonth = endDate.getDate();

    let usersQuery = {};
    if (branchId) {
      usersQuery = { branches: branchId };
    }
    const users = await User.find(usersQuery).populate('branches');

    let totalSalaries = 0;
    let branchTotals = {};
    let employeeDetails = [];

    // دالة حساب ساعات العمل من الأوقات
    const calculateWorkingHours = (startTime, endTime, isNightShift = false) => {
      const [startHour, startMin] = startTime.split(':').map(Number);
      const [endHour, endMin] = endTime.split(':').map(Number);
      
      let startMinutes = startHour * 60 + startMin;
      let endMinutes = endHour * 60 + endMin;
      
      if (isNightShift && endHour < startHour) {
        endMinutes += 24 * 60;
      }
      
      return (endMinutes - startMinutes) / 60;
    };

    for (const user of users) {
      const attendance = await Attendance.find({
        user: user._id,
        checkInTime: { $gte: startDate, $lte: endDate },
      }).populate('branch');

      // حساب الأيام العاملة المتوقعة في هذا الشهر بالتحديد
      let expectedWorkingDaysInMonth = 0;
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month - 1, day);
        const dayName = date.toLocaleString('en-us', { weekday: 'long' });
        if (user.workingDaysNames && user.workingDaysNames.includes(dayName)) {
          expectedWorkingDaysInMonth++;
        }
      }

      // إذا لم تكن هناك أيام عمل محددة، استخدم القيمة الافتراضية
      if (expectedWorkingDaysInMonth === 0) {
        expectedWorkingDaysInMonth = user.requiredWorkingDays || 22;
      }

      const workingDays = [];
      const holidays = [];
      const absences = [];
      let totalLateMinutes = 0;
      let totalEarlyLeaveMinutes = 0;

      // حساب الحضور والغياب لكل يوم عمل
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month - 1, day);
        const dayName = date.toLocaleString('en-us', { weekday: 'long' });
        
        // تخطي الأيام غير العاملة
        if (!user.workingDaysNames || !user.workingDaysNames.includes(dayName)) continue;

        const record = attendance.find(
          (r) => new Date(r.checkInTime).toDateString() === date.toDateString()
        );

        if (record) {
          if (record.dayStatus === 'working') {
            workingDays.push(date);
            
            // حساب دقائق التأخير
            const workStart = new Date(date);
            const [startHour, startMin] = user.workStartTime.split(':').map(Number);
            workStart.setHours(startHour, startMin, 0, 0);
            const lateMs = record.checkInTime - workStart;
            if (lateMs > 0) totalLateMinutes += Math.floor(lateMs / 60000);

            // حساب دقائق الانصراف المبكر
            if (record.checkOutTime) {
              const workEnd = new Date(date);
              const [endHour, endMin] = user.workEndTime.split(':').map(Number);
              workEnd.setHours(endHour, endMin, 0, 0);
              
              // تعديل للورديات الليلية
              if (user.isNightShift && endHour < startHour) {
                workEnd.setDate(workEnd.getDate() + 1);
              }
              
              const earlyMs = workEnd - record.checkOutTime;
              if (earlyMs > 0) totalEarlyLeaveMinutes += Math.floor(earlyMs / 60000);
            }
          } else if (record.dayStatus === 'holiday') {
            holidays.push(date);
          } else if (record.dayStatus === 'absent') {
            absences.push(date);
          }
        } else {
          absences.push(date);
        }
      }

      // حساب ساعات العمل الفعلية أو استخدام القيمة المحفوظة
      const actualWorkingHours = user.workStartTime && user.workEndTime 
        ? calculateWorkingHours(user.workStartTime, user.workEndTime, user.isNightShift)
        : (user.workingHoursPerDay || 8);

      // حساب الخصومات
      const dailySalary = user.salary / expectedWorkingDaysInMonth;
      const hourlySalary = dailySalary / actualWorkingHours;

      const absenceDeduction = absences.length * dailySalary * (user.absenceDeductionRate || 0);
      const lateHours = totalLateMinutes / 60;
      const lateDeduction = lateHours * hourlySalary * (user.lateDeductionRate || 0);
      const earlyLeaveHours = totalEarlyLeaveMinutes / 60;
      const earlyDeduction = earlyLeaveHours * hourlySalary * (user.earlyLeaveDeductionRate || 0);
      
      const totalDeductions = absenceDeduction + lateDeduction + earlyDeduction;
      const netSalary = user.salary - totalDeductions;

      // تفاصيل الموظف
      const employeeDetail = {
        employeeId: user._id,
        name: user.name,
        email: user.email,
        baseSalary: user.salary,
        expectedWorkingDays: expectedWorkingDaysInMonth,
        actualWorkingDays: workingDays.length,
        absentDays: absences.length,
        holidayDays: holidays.length,
        lateHours: Math.round(lateHours * 100) / 100,
        earlyLeaveHours: Math.round(earlyLeaveHours * 100) / 100,
        deductions: {
          absence: Math.round(absenceDeduction * 100) / 100,
          late: Math.round(lateDeduction * 100) / 100,
          early: Math.round(earlyDeduction * 100) / 100,
          total: Math.round(totalDeductions * 100) / 100
        },
        netSalary: Math.round(netSalary * 100) / 100,
        branches: user.branches.map(b => ({ id: b._id, name: b.name }))
      };

      employeeDetails.push(employeeDetail);
      totalSalaries += netSalary;

      // توزيع على الفروع
      user.branches.forEach(branch => {
        if (!branchTotals[branch._id]) {
          branchTotals[branch._id] = {
            branchName: branch.name,
            totalSalary: 0,
            employeeCount: 0,
            employees: []
          };
        }
        const branchShare = netSalary / user.branches.length;
        branchTotals[branch._id].totalSalary += branchShare;
        branchTotals[branch._id].employeeCount += 1 / user.branches.length;
        branchTotals[branch._id].employees.push({
          name: user.name,
          share: Math.round(branchShare * 100) / 100
        });
      });
    }

    // تقريب النتائج النهائية
    Object.keys(branchTotals).forEach(branchId => {
      branchTotals[branchId].totalSalary = Math.round(branchTotals[branchId].totalSalary * 100) / 100;
      branchTotals[branchId].employeeCount = Math.round(branchTotals[branchId].employeeCount);
    });

    res.json({
      period: { year: parseInt(year), month: parseInt(month) },
      totalSalaries: Math.round(totalSalaries * 100) / 100,
      branchTotals,
      employeeDetails,
      summary: {
        totalEmployees: users.length,
        totalExpectedWorkingDays: employeeDetails.reduce((sum, emp) => sum + emp.expectedWorkingDays, 0),
        totalActualWorkingDays: employeeDetails.reduce((sum, emp) => sum + emp.actualWorkingDays, 0),
        totalAbsentDays: employeeDetails.reduce((sum, emp) => sum + emp.absentDays, 0),
        totalDeductions: Math.round(employeeDetails.reduce((sum, emp) => sum + emp.deductions.total, 0) * 100) / 100
      }
    });
  } catch (err) {
    console.error('Error calculating salaries:', err);
    res.status(500).json({ 
      message: 'Failed to calculate total salaries', 
      error: err.message 
    });
  }
};