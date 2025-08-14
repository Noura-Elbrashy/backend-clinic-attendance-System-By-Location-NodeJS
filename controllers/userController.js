

const User = require('../models/User');
const Attendance = require('../models/Attendance');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendAlert } = require('../config/nodemailer');

exports.getAllUsers = async (req, res) => {
  try {
    // نجيب الـ page و limit من الـ query string
    let { page = 1, limit = 10 } = req.query;

    // تحويلهم لأرقام
    page = parseInt(page);
    limit = parseInt(limit);

    // حساب عدد العناصر اللي هنسيبها
    const skip = (page - 1) * limit;

    // جلب البيانات مع الباجينيشن
    const users = await User.find()
      .select('-password')
      .populate('branches')
      .skip(skip)
      .limit(limit);

    // إجمالي عدد المستخدمين (لإظهار عدد الصفحات)
    const totalUsers = await User.countDocuments();

    res.json({
      totalUsers,
      totalPages: Math.ceil(totalUsers / limit),
      currentPage: page,
      users
    });

  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ message: 'Failed to fetch users', error: err.message });
  }
};


exports.getUserById = async (req, res) => {
  try {
    const requestedId = req.params.id === 'me' ? req.user.id : req.params.id;

    // لو مش أدمن ومش بيطلب بياناته
    if (req.user.role !== 'admin' && requestedId !== req.user.id) {
      return res.status(403).json({ message: 'غير مسموح لك بالوصول لهذه البيانات' });
    }

    const user = await User.findById(requestedId)
      .select('-password')
      .populate('branches');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const attendance = await Attendance.find({ user: requestedId })
      .populate('branch')
      .sort({ checkInTime: -1 });

    res.json({ user, attendance });
  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).json({ message: 'Failed to fetch user', error: err.message });
  }
};




// userController.js - exports.updateUser المحدث
exports.updateUser = async (req, res) => {
  try {
    const {
      name, email, branches, role, password, phone, address, salary,
      requiredWorkingDays, workingDaysNames, workingHoursPerDay,
      workStartTime, workEndTime, absenceDeductionRate, lateDeductionRate,
      earlyLeaveDeductionRate, allowRemoteAbsence
    } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (branches && Array.isArray(branches)) updateData.branches = branches;
    if (phone) updateData.phone = phone;
    if (address) updateData.address = address;
    if (salary !== undefined) updateData.salary = Number(salary);
    if (requiredWorkingDays !== undefined) updateData.requiredWorkingDays = Number(requiredWorkingDays);
    if (workingDaysNames) updateData.workingDaysNames = workingDaysNames.split(',').map(day => day.trim());
    if (workingHoursPerDay !== undefined) updateData.workingHoursPerDay = Number(workingHoursPerDay);
    if (workStartTime) updateData.workStartTime = workStartTime;
    if (workEndTime) updateData.workEndTime = workEndTime;
    if (absenceDeductionRate !== undefined) updateData.absenceDeductionRate = Number(absenceDeductionRate);
    if (lateDeductionRate !== undefined) updateData.lateDeductionRate = Number(lateDeductionRate);
    if (earlyLeaveDeductionRate !== undefined) updateData.earlyLeaveDeductionRate = Number(earlyLeaveDeductionRate);
    if (allowRemoteAbsence !== undefined) updateData.allowRemoteAbsence = allowRemoteAbsence;

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const user = await User.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true }).select('-password').populate('branches');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User updated successfully', user });
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({ message: 'Failed to update user', error: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User deleted' });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ message: 'Failed to delete user', error: err.message });
  }
};

exports.addFeedback = async (req, res) => {
  try {
    const { message, isWarning } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $push: { feedback: { message, isWarning } } },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'Feedback added', user });
  } catch (err) {
    console.error('Error adding feedback:', err);
    res.status(500).json({ message: 'Failed to add feedback', error: err.message });
  }
};

exports.getMonthlyReport = async (req, res) => {
  try {
    const { userId, year, month } = req.params;
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    const daysInMonth = endDate.getDate();

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const attendance = await Attendance.find({
      user: userId,
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
          totalLateMinutes += record.lateMinutes || 0;
          totalEarlyLeaveMinutes += record.earlyLeaveMinutes || 0;
        } else if (record.dayStatus === 'holiday') holidays.push(date);
        else if (record.dayStatus === 'absent') absences.push(date);
      } else {
        absences.push(date);
      }
    }

    const expectedWorkingDays = user.workingDaysNames.length * 4; // Approx 4 weeks
    const absenceDeduction = absences.length * (user.salary / expectedWorkingDays) * user.absenceDeductionRate;
    const lateDeduction = (totalLateMinutes / 60) * (user.salary / (expectedWorkingDays * user.workingHoursPerDay)) * user.lateDeductionRate;
    const earlyDeduction = (totalEarlyLeaveMinutes / 60) * (user.salary / (expectedWorkingDays * user.workingHoursPerDay)) * user.earlyLeaveDeductionRate;
    const netSalary = user.salary - absenceDeduction - lateDeduction - earlyDeduction;

    res.json({
      workingDays: workingDays.length,
      holidays: holidays.length,
      absences: absences.length,
      totalLateMinutes,
      totalEarlyLeaveMinutes,
      deductions: { absence: absenceDeduction, late: lateDeduction, early: earlyDeduction },
      netSalary,
      records: attendance,
    });
  } catch (err) {
    console.error('Error generating report:', err);
    res.status(500).json({ message: 'Failed to generate report', error: err.message });
  }
};

// authController.js - exports.registerUser المحدث
exports.registerUser = async (req, res) => {
  try {
    const { name, email, password, role, branches } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Create with plain password (pre('save') will hash)
    const user = await User.create({ 
      name, 
      email, 
      password,  // <--- plain text
      role: role || 'staff', 
      branches: branches || [] 
    });
    
    res.json({ message: 'User registered', user: { _id: user._id, name: user.name, email: user.email, role: user.role, branches: user.branches } });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Failed to register', error: err.message });
  }
};


exports.registerDevice = async (req, res) => {
  try {
    const { deviceFingerprint } = req.body;
    if (!deviceFingerprint) return res.status(400).json({ success: false, message: 'Device fingerprint required' });

    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (user.registeredDevices.some(d => d.deviceFingerprint === deviceFingerprint)) {
      return res.status(400).json({ success: false, message: 'Device already registered' });
    }

    user.registeredDevices.push({ deviceFingerprint, approved: false });
    await user.save();

    res.status(201).json({ success: true, message: 'Device registered, awaiting approval' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error registering device' });
  }
};
exports.approveDevice = async (req, res) => {
  try {
    const { userId, deviceFingerprint } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const device = user.registeredDevices.find(d => d.deviceFingerprint === deviceFingerprint);
    if (!device) return res.status(404).json({ success: false, message: 'Device not found' });

    device.approved = true;
    await user.save();

    res.json({ success: true, message: 'Device approved' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error approving device' });
  }
};

exports.rejectDevice = async (req, res) => {
  try {
    const { userId, deviceFingerprint } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.registeredDevices = user.registeredDevices.filter(d => d.deviceFingerprint !== deviceFingerprint);
    await user.save();

    res.json({ success: true, message: 'Device rejected' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error rejecting device' });
  }
};
exports.getPendingDevices = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const users = await User.find({ 'registeredDevices.approved': false }).select('name email registeredDevices');
    const pending = users.flatMap(u => u.registeredDevices.filter(d => !d.approved).map(d => ({ userId: u._id, userName: u.name, userEmail: u.email, deviceFingerprint: d.deviceFingerprint })));

    const total = pending.length;
    const paginated = pending.slice((page - 1) * limit, page * limit);

    res.json({ pendingDevices: paginated, pagination: { total, page: Number(page), pages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching pending devices' });
  }
};

// New: Create employee and send activation email
// New: Create employee and send activation email
exports.addUser = async (req, res) => {
  try {
    const {
      name,
      email,
      role,
      branches,
      phone,
      address,
      salary,
      requiredWorkingDays,
      workingDaysNames,
      workingHoursPerDay,
      workStartTime,
      workEndTime,
      absenceDeductionRate,
      lateDeductionRate,
      earlyLeaveDeductionRate,
      allowRemoteAbsence,
    } = req.body;

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already in use' });
    }

    // Generate activation token valid for 24h
    const activationToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1d' });

    // Create user without password (will set it after activation)
    const user = new User({
      name,
      email,
      role,
      branches,
      phone,
      address,
      salary,
      requiredWorkingDays,
      workingDaysNames,
      workingHoursPerDay,
      workStartTime,
      workEndTime,
      absenceDeductionRate,
      lateDeductionRate,
      earlyLeaveDeductionRate,
      allowRemoteAbsence,
      activationToken,
      isActive: false,
    });

    await user.save();

    // Send activation email
    const activationUrl = `${process.env.FRONTEND_URL}/activate/${activationToken}`;
    await sendAlert(
      email,
      'Activate Your RAN Clinic Account',
      `Hello ${name},\n\nPlease activate your account by clicking the following link:\n${activationUrl}\n\nThe link is valid for 24 hours.`
    );

    res.status(201).json({
      success: true,
      message: 'Employee created successfully and activation email sent',
      data: user,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to create employee' });
  }
};


// New: Resend activation email
exports.resendActivation = async (req, res) => {
  const { userId } = req.body;
  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.isActive) return res.status(400).json({ message: 'User already active' });

    const activationToken = jwt.sign({ email: user.email }, process.env.JWT_SECRET, { expiresIn: '1d' });
    user.activationToken = activationToken;
    await user.save();

    const activationUrl = `${process.env.FRONTEND_URL}/activate/${activationToken}`;
    await sendAlert(
      user.email,
      'Activate Your RAN Clinic Account',
      `Hello ${user.name},\n\nPlease activate your account by clicking the following link:\n${activationUrl}\n\nThe link is valid for 24 hours.`
    );

    res.json({ message: 'Activation email resent' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to resend activation email' });
  }
};

// Activate account with hashing
// Activate account with hashing
// userController.js - exports.activateAccount المحدث
exports.activateAccount = async (req, res) => {
  try {
    const { token, password } = req.body;

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ email: decoded.email, activationToken: token });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired activation link' });
    }

    // Check if user already activated
    if (user.isActive) {
      return res.status(400).json({ success: false, message: 'Account already activated' });
    }

    // Set plain password (pre('save') will hash it)
    user.password = password;  // <--- تغيير هنا: plain text بدلاً من hashed

    // Clear activation token & mark active
    user.activationToken = null;
    user.isActive = true;
    await user.save();  // <--- pre('save') يهاش مرة واحدة

    res.json({ success: true, message: 'Account activated successfully, you can now log in.' });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(400).json({ success: false, message: 'Activation link expired' });
    }
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to activate account' });
  }
};

exports.validateToken = async (req, res) => {
  try {
    const { token } = req.body;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ email: decoded.email, activationToken: token });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired activation link' });
    }

    res.json({ success: true, message: 'Token is valid' });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(400).json({ success: false, message: 'Activation link expired' });
    }
    res.status(500).json({ success: false, message: 'Failed to validate token' });
  }
};
