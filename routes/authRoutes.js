// const express = require("express");
// const router = express.Router();
// const { loginUser, registerUser, getProfile } = require("../controllers/authController");
// const { protect, adminOnly } = require("../middleware/auth");

// router.post("/login", loginUser);
// router.post("/register", protect, adminOnly, registerUser);
// router.get("/profile", protect, getProfile);

// module.exports = router;

const express = require("express");
const router = express.Router();
const {
  loginUser,
  registerUser,
  getProfile,
//   activateAccount,
  resendActivation,
  forgotPassword,
  resetPassword,
   verifyResetToken,
} = require("../controllers/authController");
const { protect, adminOnly } = require("../middleware/auth");

router.post("/login", loginUser);
router.post("/register", protect, adminOnly, registerUser);
router.get("/profile", protect, getProfile);
// router.post("/activate", activateAccount);
router.post("/resend-activation/:userId", protect, adminOnly, resendActivation);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/verify-reset-token/:token', verifyResetToken); // إضافة route جديدة

module.exports = router;
