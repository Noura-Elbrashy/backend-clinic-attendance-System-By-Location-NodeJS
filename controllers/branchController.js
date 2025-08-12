// const Branch = require("../models/Branch");

// // ➕ إنشاء فرع جديد
// exports.createBranch = async (req, res) => {
//   const { name, location, radius } = req.body;

//   try {
//     const branch = await Branch.create({
//       name,
//       location,
//       radius,
//     });

//     res.status(201).json(branch);
//   } catch (err) {
//     res.status(500).json({ message: "فشل في إنشاء الفرع", error: err.message });
//   }
// };

// // 📄 جلب كل الفروع
// exports.getBranches = async (req, res) => {
//   try {
//     const branches = await Branch.find();
//     res.json(branches);
//   } catch (err) {
//     res.status(500).json({ message: "خطأ في تحميل الفروع" });
//   }
// };

// // ✏️ تعديل فرع
// exports.updateBranch = async (req, res) => {
//   try {
//     const updated = await Branch.findByIdAndUpdate(
//       req.params.id,
//       req.body,
//       { new: true }
//     );
//     res.json(updated);
//   } catch (err) {
//     res.status(500).json({ message: "فشل في التعديل", error: err.message });
//   }
// };

// // 🗑 حذف فرع
// exports.deleteBranch = async (req, res) => {
//   try {
//     await Branch.findByIdAndDelete(req.params.id);
//     res.json({ message: "تم حذف الفرع" });
//   } catch (err) {
//     res.status(500).json({ message: "فشل في الحذف" });
//   }
// };
const Branch = require("../models/Branch");

// ➕ إنشاء فرع جديد
exports.createBranch = async (req, res) => {
  const { name, location, radius, allowedIPs } = req.body;

  try {
    const branch = await Branch.create({
      name,
      location,
      radius,
      allowedIPs: allowedIPs || [],
    });

    res.status(201).json(branch);
  } catch (err) {
    res.status(500).json({ message: "فشل في إنشاء الفرع", error: err.message });
  }
};

// 📄 جلب كل الفروع
exports.getBranches = async (req, res) => {
  try {
    const branches = await Branch.find();
    res.json(branches);
  } catch (err) {
    res.status(500).json({ message: "خطأ في تحميل الفروع" });
  }
};

// ✏️ تعديل فرع
exports.updateBranch = async (req, res) => {
  try {
    const updated = await Branch.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "فشل في التعديل", error: err.message });
  }
};

// 🗑 حذف فرع
exports.deleteBranch = async (req, res) => {
  try {
    await Branch.findByIdAndDelete(req.params.id);
    res.json({ message: "تم حذف الفرع" });
  } catch (err) {
    res.status(500).json({ message: "فشل في الحذف" });
  }
};

