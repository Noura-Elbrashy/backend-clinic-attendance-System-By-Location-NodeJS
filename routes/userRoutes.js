const express = require('express');
const router = express.Router();
const { getAllUsers, getUserById, updateUser, deleteUser, addFeedback, getMonthlyReport ,registerDevice,getPendingDevices,rejectDevice, approveDevice,addUser,
  activateAccount,validateToken} = require('../controllers/userController');
  const reportController = require('../controllers/reportController');
const { protect, adminOnly } = require('../middleware/auth');
router.get('/me', protect, getUserById);

router.get('/pending-devices', protect, adminOnly, getPendingDevices);
router.get('/:id', protect, getUserById);
router.put('/:id', protect, adminOnly, updateUser);
router.delete('/:id', protect, adminOnly, deleteUser);
router.post('/:id/feedback', protect, adminOnly, addFeedback);
// router.get('/:userId/report/:year/:month', protect, adminOnly, getMonthlyReport);
router.post('/register-device', protect, registerDevice);
router.post('/approve-device', protect, adminOnly, approveDevice);
router.post('/reject-device', protect, adminOnly, rejectDevice);
router.post('/approve-device', protect, adminOnly, approveDevice);
router.post('/', protect, adminOnly, addUser); // إنشاء موظف جديد (للأدمن فقط)
router.post('/activate', activateAccount); // تفعيل الحساب
router.post('/validate-token', validateToken);
router.get('/', protect, adminOnly, getAllUsers);
router.get('/:userId/monthly-report', protect, adminOnly, async (req, res) => {
  try {
    const { userId } = req.params;
    const { year, month } = req.query;
    
    // Validate parameters
    if (!year || !month) {
      return res.status(400).json({ message: 'السنة والشهر مطلوبان' });
    }
    
    // Call the monthly report function with proper parameters
    req.params.year = year;
    req.params.month = month;
    req.params.userId = userId;
    
    await getMonthlyReport(req, res);
  } catch (error) {
    console.error('خطأ في تحديد مسار التقرير الشهري:', error);
    res.status(500).json({ message: 'خطأ في إنشاء التقرير الشهري' });
  }
});
router.get('/:userId/report/:year/:month', protect, adminOnly, getMonthlyReport);
router.get('/:id/report', reportController.getMonthlyReport);
module.exports = router;