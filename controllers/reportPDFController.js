const PDFDocument = require("pdfkit");
const moment = require("moment");
const User = require("../models/User");
const Attendance = require("../models/Attendance");

exports.generateUserPDF = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).populate("branch");
    if (!user) return res.status(404).json({ message: "الموظف غير موجود" });

    const attendance = await Attendance.find({ user: userId }).sort({ checkInTime: -1 });

    const doc = new PDFDocument();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=${user.name}_report.pdf`);

    doc.pipe(res);

    doc.fontSize(18).text(`تقرير الحضور`, { align: "center" });
    doc.moveDown();
    doc.fontSize(14).text(`الموظف: ${user.name}`);
    doc.text(`الفرع: ${user.branch.name}`);
    doc.text(`الإيميل: ${user.email}`);
    doc.moveDown();

    doc.fontSize(12).text("التفاصيل:", { underline: true });

    attendance.forEach((item, i) => {
      doc.moveDown(0.5);
      doc.text(`${i + 1}. التاريخ: ${moment(item.checkInTime).format("YYYY-MM-DD")}`);
      doc.text(`   دخول: ${moment(item.checkInTime).format("HH:mm")}`);
      doc.text(`   خروج: ${item.checkOutTime ? moment(item.checkOutTime).format("HH:mm") : "لم يسجل خروج"}`);
      doc.text(`   المدة: ${item.duration ? `${item.duration.toFixed(2)} ساعة` : "غير محسوبة"}`);
    });

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "فشل توليد التقرير" });
  }
};
