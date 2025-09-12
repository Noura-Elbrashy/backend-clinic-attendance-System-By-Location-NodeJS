const ExcelJS = require("exceljs");
const User = require("../models/User");
const Attendance = require("../models/Attendance");
const moment = require("moment");

exports.generateUserExcel = async (req, res) => {
  try {
    const { userId } = req.params;

    // Find user and populate branches
    const user = await User.findById(userId).populate("branches", "name");
    if (!user) {
      return res.status(404).json({ message: "الموظف غير موجود" });
    }

    // Get attendance records
    const attendance = await Attendance.find({ user: userId })
      .populate('branch', 'name')
      .sort({ checkInTime: -1 });

    // Create workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("تقرير الحضور");

    // Set worksheet properties
    worksheet.properties.defaultRowHeight = 20;

    // Add header information
    worksheet.mergeCells('A1:H1');
    worksheet.getCell('A1').value = `تقرير الحضور والانصراف - ${user.name}`;
    worksheet.getCell('A1').font = { size: 16, bold: true };
    worksheet.getCell('A1').alignment = { horizontal: 'center' };

    worksheet.mergeCells('A2:H2');
    worksheet.getCell('A2').value = `الإيميل: ${user.email} | الراتب: ${user.salary || 'غير محدد'}`;
    worksheet.getCell('A2').font = { size: 12 };
    worksheet.getCell('A2').alignment = { horizontal: 'center' };

    // Handle branches
    const branchNames = user.branches && Array.isArray(user.branches) 
      ? user.branches.map(b => b.name || b).join(', ')
      : (user.branches?.name || 'غير محدد');
    
    worksheet.mergeCells('A3:H3');
    worksheet.getCell('A3').value = `الفرع/الأفرع: ${branchNames}`;
    worksheet.getCell('A3').font = { size: 12 };
    worksheet.getCell('A3').alignment = { horizontal: 'center' };

    // Add empty row
    worksheet.addRow([]);

    // Define columns
    worksheet.columns = [
      { header: "التاريخ", key: "date", width: 15 },
      { header: "الفرع", key: "branch", width: 15 },
      { header: "وقت الدخول", key: "checkIn", width: 15 },
      { header: "وقت الخروج", key: "checkOut", width: 15 },
      { header: "مدة العمل (دقائق)", key: "duration", width: 20 },
      { header: "دقائق التأخير", key: "lateMinutes", width: 15 },
      { header: "دقائق الخروج المبكر", key: "earlyLeave", width: 20 },
      { header: "الحالة", key: "status", width: 15 }
    ];

    // Style headers
    const headerRow = worksheet.getRow(5);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Add attendance data
    if (attendance.length === 0) {
      worksheet.addRow(['لا توجد سجلات حضور', '', '', '', '', '', '', '']);
    } else {
      attendance.forEach((item) => {
        const date = item.checkInTime ? moment(item.checkInTime).format("YYYY-MM-DD") : "غير محدد";
        const checkIn = item.checkInTime ? moment(item.checkInTime).format("HH:mm") : "لم يسجل";
        const checkOut = item.checkOutTime ? moment(item.checkOutTime).format("HH:mm") : "لم يسجل";
        const branch = item.branch?.name || "غير محدد";
        const status = item.dayStatus || "غير محدد";
        
        worksheet.addRow({
          date: date,
          branch: branch,
          checkIn: checkIn,
          checkOut: checkOut,
          duration: item.durationMinutes || 0,
          lateMinutes: item.lateMinutes || 0,
          earlyLeave: item.earlyLeaveMinutes || 0,
          status: status
        });
      });

      // Add statistics at the end
      worksheet.addRow([]); // Empty row
      
      const totalRecords = attendance.length;
      const workingDays = attendance.filter(record => record.dayStatus === 'working').length;
      const absentDays = attendance.filter(record => record.dayStatus === 'absent').length;
      const totalLateMinutes = attendance.reduce((sum, record) => sum + (record.lateMinutes || 0), 0);
      const totalEarlyLeaveMinutes = attendance.reduce((sum, record) => sum + (record.earlyLeaveMinutes || 0), 0);
      const totalWorkMinutes = attendance.reduce((sum, record) => sum + (record.durationMinutes || 0), 0);

      // Add statistics
      worksheet.addRow(['الإحصائيات:', '', '', '', '', '', '', '']);
      worksheet.addRow([`إجمالي السجلات: ${totalRecords}`, '', '', '', '', '', '', '']);
      worksheet.addRow([`أيام العمل: ${workingDays}`, '', '', '', '', '', '', '']);
      worksheet.addRow([`أيام الغياب: ${absentDays}`, '', '', '', '', '', '', '']);
      worksheet.addRow([`إجمالي دقائق العمل: ${totalWorkMinutes}`, '', '', '', '', '', '', '']);
      worksheet.addRow([`إجمالي ساعات العمل: ${Math.round((totalWorkMinutes / 60) * 100) / 100}`, '', '', '', '', '', '', '']);
      worksheet.addRow([`إجمالي دقائق التأخير: ${totalLateMinutes}`, '', '', '', '', '', '', '']);
      worksheet.addRow([`إجمالي دقائق الخروج المبكر: ${totalEarlyLeaveMinutes}`, '', '', '', '', '', '', '']);

      // Style statistics section
      const statsStartRow = worksheet.lastRow.number - 7;
      for (let i = statsStartRow; i <= worksheet.lastRow.number; i++) {
        worksheet.getRow(i).font = { bold: true };
        worksheet.getRow(i).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF0F8FF' }
        };
      }
    }

    // Add borders to all cells with data
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber >= 5) { // Start from headers
        row.eachCell((cell, colNumber) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
      }
    });

    // Add generation timestamp
    worksheet.addRow([]);
    worksheet.addRow([`تم إنشاء التقرير في: ${moment().format("YYYY-MM-DD HH:mm")}`, '', '', '', '', '', '', '']);

    // Set response headers
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${user.name}_report_${moment().format('YYYY-MM-DD')}.xlsx`
    );
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

    // Write to response
    await workbook.xlsx.write(res);
    res.end();
    
  } catch (err) {
    console.error('خطأ في توليد تقرير Excel:', err);
    res.status(500).json({ message: "فشل توليد تقرير Excel", error: err.message });
  }
};