const ExcelJS = require("exceljs");
const User = require("../models/User");
const Attendance = require("../models/Attendance");

exports.generateUserExcel = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).populate("branch");
    if (!user) return res.status(404).json({ message: "الموظف غير موجود" });

    const attendance = await Attendance.find({ user: userId }).sort({ checkInTime: -1 });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("تقرير الحضور");

    worksheet.columns = [
      { header: "التاريخ", key: "date", width: 15 },
      { header: "دخول", key: "checkIn", width: 15 },
      { header: "خروج", key: "checkOut", width: 15 },
      { header: "المدة (دقائق)", key: "duration", width: 20 },
    ];

    attendance.forEach((item) => {
      worksheet.addRow({
        date: item.checkInTime?.toISOString().split("T")[0],
        checkIn: item.checkInTime?.toISOString().split("T")[1]?.substring(0, 5),
        checkOut: item.checkOutTime ? item.checkOutTime.toISOString().split("T")[1].substring(0, 5) : "لم يسجل",
        duration: item.durationMinutes || "غير محسوبة",
      });
    });

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${user.name}_report.xlsx`
    );
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "فشل توليد تقرير Excel" });
  }
};
