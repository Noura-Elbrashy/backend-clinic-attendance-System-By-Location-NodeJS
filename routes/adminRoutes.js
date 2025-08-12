// // const express = require("express");
// // const router = express.Router();
// // const {
// //   getAllAttendance,
// //   getAttendanceByUser,
// // } = require("../controllers/adminController");

// // const { protect, adminOnly } = require("../middleware/auth");

// // // ✅ إحضار كل الحضور
// // router.get("/attendance", protect, adminOnly, getAllAttendance);

// // // ✅ حضور موظف معين
// // router.get("/attendance/:id", protect, adminOnly, getAttendanceByUser);

// // module.exports = router;
// const express = require("express");
// const router = express.Router();
// const { getAllAttendance, getAttendanceByUser } = require("../controllers/adminController");
// const auth = require("../middleware/auth");

// router.get("/attendance", auth, getAllAttendance);
// router.get("/attendance/:id", auth, getAttendanceByUser);

// module.exports = router;
const express = require("express");
const router = express.Router();
const { getAllAttendance, getAttendanceByUser ,getTotalSalaries} = require("../controllers/adminController");
const { protect, adminOnly } = require("../middleware/auth");

router.get("/attendance", protect, adminOnly, getAllAttendance);
router.get("/attendance/:id", protect, adminOnly, getAttendanceByUser);
router.get("/total-salaries", protect, adminOnly, getTotalSalaries);

module.exports = router;