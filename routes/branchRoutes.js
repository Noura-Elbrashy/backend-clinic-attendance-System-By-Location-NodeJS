// const express = require("express");
// const router = express.Router();
// const {
//   createBranch,
//   getBranches,
//   updateBranch,
//   deleteBranch,
// } = require("../controllers/branchController");

// const { protect, adminOnly } = require("../middleware/auth");

// router.post("/", protect, adminOnly, createBranch);
// router.get("/", protect, getBranches);
// router.put("/:id", protect, adminOnly, updateBranch);
// router.delete("/:id", protect, adminOnly, deleteBranch);

// module.exports = router;
const express = require("express");
const router = express.Router();
const { createBranch, getBranches, updateBranch, deleteBranch ,mybranches} = require("../controllers/branchController");
const { protect, adminOnly } = require("../middleware/auth");

router.post("/", protect, adminOnly, createBranch);
router.get("/", protect, getBranches);
router.put("/:id", protect, adminOnly, updateBranch);
router.delete("/:id", protect, adminOnly, deleteBranch);
router.get("/mybranches", protect, mybranches); // New endpoint for employee-specific branches

module.exports = router;