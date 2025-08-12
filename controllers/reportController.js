const Attendance = require("../models/Attendance");
const User = require("../models/User");

exports.getUserReport = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId).populate("branch");
    if (!user) return res.status(404).json({ message: "الموظف غير موجود" });

    const attendance = await Attendance.find({ user: userId }).sort({ checkInTime: -1 });

    res.json({ user, attendance });
  } catch (err) {
    res.status(500).json({ message: "خطأ في تحميل التقرير" });
  }
};
