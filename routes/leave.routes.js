const express = require('express');
const router = express.Router();
const Leave = require('../models/leave.model');
const { protect, adminOnly } = require("../middleware/auth");

// 📩 تقديم طلب إجازة جديد
router.post('/', protect, async (req, res) => {
  try {
    const { leaveType, startDate, endDate, reason } = req.body;
    const totalDays =
      (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24) + 1;

    const leave = await Leave.create({
      user: req.user.id,
      leaveType,
      startDate,
      endDate,
      totalDays,
      reason,
    });

    res.status(201).json({ message: 'Leave request submitted successfully', leave });
  } catch (error) {
    res.status(500).json({ message: 'Error submitting leave request', error: error.message });
  }
});

// 📋 عرض كل الإجازات للمستخدم الحالي
router.get('/my', protect, async (req, res) => {
  try {
    const leaves = await Leave.find({ user: req.user.id }).sort({ startDate: -1 });
    res.json(leaves);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching leaves', error: error.message });
  }
});

// 👩‍💼 عرض كل طلبات الإجازة (للمدير فقط)
router.get('/all', protect, adminOnly, async (req, res) => {
  try {
    const leaves = await Leave.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    res.json(leaves);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching all leaves', error: error.message });
  }
});

// ✅ اعتماد أو رفض طلب إجازة
router.put('/:id/status', protect, adminOnly, async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;
    const leave = await Leave.findById(req.params.id);
    if (!leave) return res.status(404).json({ message: 'Leave not found' });

    leave.status = status;
    if (status === 'approved') {
      leave.approvedBy = req.user.id;
      leave.approvedAt = new Date();
    } else if (status === 'rejected') {
      leave.rejectionReason = rejectionReason || 'Not specified';
    }
    await leave.save();

    res.json({ message: `Leave ${status}`, leave });
  } catch (error) {
    res.status(500).json({ message: 'Error updating leave status', error: error.message });
  }
});

module.exports = router;
