

// const express = require('express');
// const router = express.Router();
// const { getAllUsers, getUserById, updateUser, deleteUser, addFeedback, getMonthlyReport } = require('../controllers/userController');
// const { protect, adminOnly } = require('../middleware/auth');

// router.get('/', protect, adminOnly, getAllUsers);
// router.get('/:id', protect, getUserById);
// router.put('/:id', protect, adminOnly, updateUser);
// router.delete('/:id', protect, adminOnly, deleteUser);
// router.post('/:id/feedback', protect, adminOnly, addFeedback);
// router.get('/:userId/report/:year/:month', protect, adminOnly, getMonthlyReport);

// module.exports = router;
const express = require('express');
const router = express.Router();
const { getAllUsers, getUserById, updateUser, deleteUser, addFeedback, getMonthlyReport ,registerDevice,getPendingDevices,rejectDevice, approveDevice,addUser,
  activateAccount,validateToken} = require('../controllers/userController');
const { protect, adminOnly } = require('../middleware/auth');
router.get('/me', protect, getUserById);

router.get('/pending-devices', protect, adminOnly, getPendingDevices);
router.get('/:id', protect, getUserById);
router.put('/:id', protect, adminOnly, updateUser);
router.delete('/:id', protect, adminOnly, deleteUser);
router.post('/:id/feedback', protect, adminOnly, addFeedback);
router.get('/:userId/report/:year/:month', protect, adminOnly, getMonthlyReport);
router.post('/register-device', protect, registerDevice);
router.post('/approve-device', protect, adminOnly, approveDevice);
router.post('/reject-device', protect, adminOnly, rejectDevice);
router.post('/approve-device', protect, adminOnly, approveDevice);
router.post('/', protect, adminOnly, addUser); // إنشاء موظف جديد (للأدمن فقط)
router.post('/activate', activateAccount); // تفعيل الحساب
router.post('/validate-token', validateToken);
router.get('/', protect, adminOnly, getAllUsers);

module.exports = router;