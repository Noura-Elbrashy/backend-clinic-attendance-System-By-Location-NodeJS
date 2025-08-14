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
const User = require("../models/User");
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
// 📄 جلب الفروع المخصصة للموظف
exports.mybranches= async (req, res) => {
  try {
    console.log('User from request:', req.user); // للتشخيص
    
    const user = await User.findById(req.user._id).select('branches');
    if (!user) {
      return res.status(404).json({ message: "المستخدم غير موجود" });
    }

    console.log('User branches:', user.branches); // للتشخيص

    const branches = await Branch.find({ _id: { $in: user.branches } });
    
    console.log('Found branches:', branches); // للتشخيص
    
    // الحل: أرجع البيانات في data object
    res.json({ data: branches });
    
  } catch (err) {
    console.error('getMyBranches error:', err); // للتشخيص
    res.status(500).json({ message: "خطأ في تحميل الفروع المخصصة", error: err.message });
  }
};
