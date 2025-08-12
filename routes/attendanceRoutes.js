const express = require("express");
const router = express.Router();
const { checkIn, checkOut , toggleEmergency,recordAbsence,grantRemotePermission} = require("../controllers/attendanceController");
const { protect,adminOnly } = require("../middleware/auth");

router.post("/checkin", protect, checkIn);
router.post("/checkout", protect, checkOut);
router.post('/toggle-emergency', protect, adminOnly, toggleEmergency);
router.post('/record-absence', protect, recordAbsence);
router.post('/grant-remote-permission', protect, adminOnly, grantRemotePermission);
module.exports = router;