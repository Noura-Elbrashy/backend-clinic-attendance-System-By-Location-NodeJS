
// const Attendance = require('../models/Attendance');
// const Branch = require('../models/Branch');

// exports.getAllAttendance = async (req, res) => {
//   try {
//     const { branch, page = 1, limit = 10 } = req.query;
//     const branches = branch ? await Branch.find({ _id: branch }) : await Branch.find();
//     const result = [];
    
//     for (const branch of branches) {
//       const query = { branch: branch._id };
//       const attendance = await Attendance.find(query)
//         .populate('user branch')
//         .sort({ checkInTime: -1 })
//         .skip((page - 1) * limit)
//         .limit(Number(limit));
      
//       const total = await Attendance.countDocuments(query);
//       result.push({ 
//         branch, 
//         attendance,
//         pagination: {
//           total,
//           page: Number(page),
//           pages: Math.ceil(total / limit)
//         }
//       });
//     }
    
//     res.json(result);
//   } catch (err) {
//     res.status(500).json({ message: 'Failed to fetch attendance', error: err.message });
//   }
// };

// exports.getAttendanceByUser = async (req, res) => {
//   try {
//     const { page = 1, limit = 10 } = req.query;
//     const attendance = await Attendance.find({ user: req.params.id })
//       .populate('user branch')
//       .sort({ checkInTime: -1 })
//       .skip((page - 1) * limit)
//       .limit(Number(limit));
    
//     const total = await Attendance.countDocuments({ user: req.params.id });
//     res.json({
//       attendance,
//       pagination: {
//         total,
//         page: Number(page),
//         pages: Math.ceil(total / limit)
//       }
//     });
//   } catch (err) {
//     res.status(500).json({ message: 'Failed to fetch attendance', error: err.message });
//   }
// };



const Attendance = require('../models/Attendance');
const Branch = require('../models/Branch');
const User = require('../models/User');

exports.getAllAttendance = async (req, res) => {
  try {
    const { branch, page = 1, limit = 10, date } = req.query;
    const branches = branch ? await Branch.find({ _id: branch }) : await Branch.find();
    const result = [];

    const queryDate = date ? new Date(date) : null;

    for (const branch of branches) {
      let query = { branch: branch._id };
      if (queryDate) {
        const startDate = new Date(queryDate.setHours(0, 0, 0, 0));
        const endDate = new Date(queryDate.setHours(23, 59, 59, 999));
        query.checkInTime = { $gte: startDate, $lte: endDate };
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

    for (const user of users) {
      const attendance = await Attendance.find({
        user: user._id,
        checkInTime: { $gte: startDate, $lte: endDate },
      }).populate('branch');

      const workingDays = [];
      const holidays = [];
      const absences = [];
      let totalLateMinutes = 0;
      let totalEarlyLeaveMinutes = 0;

      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month - 1, day);
        const dayName = date.toLocaleString('en-us', { weekday: 'long' });
        if (!user.workingDaysNames.includes(dayName)) continue; // Skip non-working days

        const record = attendance.find(
          (r) => new Date(r.checkInTime).toDateString() === date.toDateString()
        );
        if (record) {
          if (record.dayStatus === 'working') {
            workingDays.push(date);
            // Calculate late minutes
            const workStart = new Date(date);
            const [startHour, startMin] = user.workStartTime.split(':').map(Number);
            workStart.setHours(startHour, startMin, 0, 0);
            const lateMs = record.checkInTime - workStart;
            if (lateMs > 0) totalLateMinutes += Math.floor(lateMs / 60000);

            // Calculate early leave if checked out
            if (record.checkOutTime) {
              const workEnd = new Date(date);
              const [endHour, endMin] = user.workEndTime.split(':').map(Number);
              workEnd.setHours(endHour, endMin, 0, 0);
              const earlyMs = workEnd - record.checkOutTime;
              if (earlyMs > 0) totalEarlyLeaveMinutes += Math.floor(earlyMs / 60000);
            }
          } else if (record.dayStatus === 'holiday') holidays.push(date);
          else if (record.dayStatus === 'absent') absences.push(date);
        } else {
          absences.push(date);
        }
      }

      const expectedWorkingDays = user.workingDaysNames.length * 4; // Approximate 4 weeks/month
      const absenceDeduction = absences.length * (user.salary / expectedWorkingDays) * user.absenceDeductionRate;
      const lateDeduction = (totalLateMinutes / 60) * (user.salary / (expectedWorkingDays * user.workingHoursPerDay)) * user.lateDeductionRate;
      const earlyDeduction = (totalEarlyLeaveMinutes / 60) * (user.salary / (expectedWorkingDays * user.workingHoursPerDay)) * user.earlyLeaveDeductionRate;
      const netSalary = user.salary - absenceDeduction - lateDeduction - earlyDeduction;

      totalSalaries += netSalary;

      user.branches.forEach(branch => {
        if (!branchTotals[branch._id]) branchTotals[branch._id] = 0;
        branchTotals[branch._id] += netSalary / user.branches.length; // Split if multiple branches
      });
    }

    res.json({
      totalSalaries,
      branchTotals,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to calculate total salaries', error: err.message });
  }
};