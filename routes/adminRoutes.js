
const express = require("express");
const router = express.Router();
const { getAllAttendance, getAttendanceByUser ,getTotalSalaries} = require("../controllers/adminController");
const { protect, adminOnly } = require("../middleware/auth");

router.get("/attendance", protect, adminOnly, getAllAttendance);
router.get("/attendance/:id", protect, adminOnly, getAttendanceByUser);
router.get("/total-salaries", protect, adminOnly, getTotalSalaries);

module.exports = router;