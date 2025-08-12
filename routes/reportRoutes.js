const express = require("express");
const router = express.Router();
const { getUserReport } = require("../controllers/reportController");
const { generateUserPDF } = require("../controllers/reportPDFController");
const { generateUserExcel } = require("../controllers/reportExcelController");

const { protect, adminOnly } = require("../middleware/auth");


router.get("/user/:userId", protect, adminOnly, getUserReport);
router.get("/user/:userId/pdf", protect, adminOnly, generateUserPDF);
router.get("/user/:userId/excel", protect, adminOnly, generateUserExcel);

module.exports = router;
