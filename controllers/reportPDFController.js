
const PDFDocument = require('pdfkit');
const moment = require('moment');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const fs = require('fs');
const path = require('path');
const contentDisposition = require('content-disposition');

// Path to Arabic font
const fontPath = path.join(__dirname, '../fonts/Cairo-Regular.ttf');

exports.generateUserPDF = async (req, res) => {
  try {
    const { userId } = req.params;
    const lang = req.query.lang || 'ar'; // Default to Arabic
    moment.locale(lang === 'ar' ? 'ar' : 'en'); // Set moment locale for date formatting

    // Define translations (ideally load from i18n configuration)
    const translations = {
      ar: {
        reportTitle: 'تقرير الحضور والانصراف',
        employee: 'الموظف',
        email: 'البريد الإلكتروني',
        branches: 'الفرع/الأفرع',
        salary: 'الراتب',
        attendanceDetails: 'تفاصيل الحضور',
        noRecords: 'لا توجد سجلات حضور لهذا الموظف',
        totalRecords: 'إجمالي السجلات',
        workingDays: 'أيام العمل',
        absentDays: 'أيام الغياب',
        totalLateMinutes: 'إجمالي دقائق التأخير',
        totalEarlyLeaveMinutes: 'إجمالي دقائق الخروج المبكر',
        totalWorkHours: 'إجمالي ساعات العمل',
        date: 'التاريخ',
        branch: 'الفرع',
        checkIn: 'وقت الدخول',
        checkOut: 'وقت الخروج',
        lateMinutes: 'دقائق التأخير',
        earlyLeaveMinutes: 'دقائق الخروج المبكر',
        status: 'الحالة',
        generatedAt: 'تم إنشاء التقرير في',
        currency: 'ج.م',
        page: 'الصفحة',
      },
      en: {
        reportTitle: 'Attendance Report',
        employee: 'Employee',
        email: 'Email',
        branches: 'Branch/Branches',
        salary: 'Salary',
        attendanceDetails: 'Attendance Details',
        noRecords: 'No attendance records found for this employee',
        totalRecords: 'Total Records',
        workingDays: 'Working Days',
        absentDays: 'Absent Days',
        totalLateMinutes: 'Total Late Minutes',
        totalEarlyLeaveMinutes: 'Total Early Leave Minutes',
        totalWorkHours: 'Total Work Hours',
        date: 'Date',
        branch: 'Branch',
        checkIn: 'Check-In Time',
        checkOut: 'Check-Out Time',
        lateMinutes: 'Late Minutes',
        earlyLeaveMinutes: 'Early Leave Minutes',
        status: 'Status',
        generatedAt: 'Report Generated At',
        currency: 'EGP',
        page: 'Page',
      },
    };
    const t = translations[lang] || translations.ar;

    // Find user and populate branches
    const user = await User.findById(userId).populate('branches', 'name');
    if (!user) {
      return res.status(404).json({ message: t.noRecords });
    }

    // Get attendance records
    const attendance = await Attendance.find({ user: userId })
      .populate('branch', 'name')
      .sort({ checkInTime: -1 });

    // Create PDF document
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
      info: {
        Title: t.reportTitle,
        Author: 'Your Company Name',
        Subject: `Attendance Report for ${user.name}`,
      },
      bufferPages: true, // Enable bufferPages for footer
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    // Safely encode filename with content-disposition
    const safeFileName = `${encodeURIComponent(user.name)}_report_${moment().format('YYYY-MM-DD')}.pdf`;
    res.setHeader('Content-Disposition', contentDisposition(safeFileName));

    // Pipe the PDF to the response
    doc.pipe(res);

    // Register Arabic font
    let fontLoaded = false;
    if (lang === 'ar' && fs.existsSync(fontPath)) {
      try {
        doc.registerFont('Cairo', fontPath);
        doc.font('Cairo');
        fontLoaded = true;
      } catch (fontError) {
        console.error('Error loading Cairo font:', fontError);
        doc.font('Helvetica'); // Fallback to Helvetica
      }
    } else {
      doc.font('Helvetica');
      console.warn(`Font file not found at ${fontPath} or language is ${lang}. Using Helvetica.`);
    }

    // Header
    doc
      .fontSize(20)
      .fillColor('#2c3e50')
      .text(t.reportTitle, { align: 'center' });
    doc.moveDown(0.5);
    doc
      .fontSize(12)
      .fillColor('gray')
      .text(`${t.generatedAt}: ${moment().format('YYYY-MM-DD HH:mm')}`, { align: 'center' });
    doc.moveDown(1);

    // Employee Information
    doc
      .fontSize(14)
      .fillColor('#2c3e50')
      .text(`${t.employee}: ${user.name}`, { align: lang === 'ar' ? 'right' : 'left' });
    doc.text(`${t.email}: ${user.email}`);
    const branchNames = user.branches && Array.isArray(user.branches)
      ? user.branches.map((b) => b.name || b).join(', ')
      : user.branches?.name || t.noRecords;
    doc.text(`${t.branches}: ${branchNames}`);
    if (user.salary) {
      doc.text(`${t.salary}: ${user.salary} ${t.currency}`);
    }
    doc.moveDown(1);

    // Statistics Section
    doc
      .fontSize(14)
      .fillColor('#2c3e50')
      .text(t.attendanceDetails, { underline: true });
    doc.moveDown(0.5);

    if (attendance.length === 0) {
      doc.fontSize(12).fillColor('gray').text(t.noRecords, { align: 'center' });
    } else {
      // Calculate statistics
      const totalRecords = attendance.length;
      const workingDays = attendance.filter((record) => record.dayStatus === 'working').length;
      const absentDays = attendance.filter((record) => record.dayStatus === 'absent').length;
      const totalLateMinutes = attendance.reduce((sum, record) => sum + (record.lateMinutes || 0), 0);
      const totalEarlyLeaveMinutes = attendance.reduce(
        (sum, record) => sum + (record.earlyLeaveMinutes || 0),
        0
      );
      const totalWorkMinutes = attendance.reduce((sum, record) => sum + (record.durationMinutes || 0), 0);

      // Add statistics
      doc.fontSize(12).fillColor('#2c3e50');
      doc.text(`${t.totalRecords}: ${totalRecords}`);
      doc.text(`${t.workingDays}: ${workingDays}`);
      doc.text(`${t.absentDays}: ${absentDays}`);
      doc.text(`${t.totalLateMinutes}: ${totalLateMinutes}`);
      doc.text(`${t.totalEarlyLeaveMinutes}: ${totalEarlyLeaveMinutes}`);
      doc.text(`${t.totalWorkHours}: ${Math.round((totalWorkMinutes / 60) * 100) / 100}`);
      doc.moveDown(1);

      // Attendance Table Header
      const tableTop = doc.y;
      const tableLeft = 50;
      const columnWidths = lang === 'ar' ? [80, 100, 80, 80, 60, 60, 60] : [80, 100, 80, 80, 60, 60, 60];
      const headers = [
        t.date,
        t.branch,
        t.checkIn,
        t.checkOut,
        t.lateMinutes,
        t.earlyLeaveMinutes,
        t.status,
      ];

      // Draw table header
      doc
        .fontSize(10)
        .fillColor('white')
        .font(fontLoaded && lang === 'ar' ? 'Cairo' : 'Helvetica-Bold');
      headers.forEach((header, i) => {
        doc
          .rect(tableLeft + columnWidths.slice(0, i).reduce((a, b) => a + b, 0), tableTop, columnWidths[i], 20)
          .fill('#2c3e50');
        doc.text(
          header,
          tableLeft + columnWidths.slice(0, i).reduce((a, b) => a + b, 0) + 5,
          tableTop + 5,
          {
            width: columnWidths[i] - 10,
            align: lang === 'ar' ? 'right' : 'left',
          }
        );
      });

      // Draw attendance records
      let currentY = tableTop + 20;
      attendance.forEach((item, i) => {
        if (currentY > doc.page.height - 100) {
          doc.addPage();
          currentY = 50;
          // Redraw table header on new page
          doc
            .fontSize(10)
            .fillColor('white')
            .font(fontLoaded && lang === 'ar' ? 'Cairo' : 'Helvetica-Bold');
          headers.forEach((header, j) => {
            doc
              .rect(tableLeft + columnWidths.slice(0, j).reduce((a, b) => a + b, 0), currentY, columnWidths[j], 20)
              .fill('#2c3e50');
            doc.text(
              header,
              tableLeft + columnWidths.slice(0, j).reduce((a, b) => a + b, 0) + 5,
              currentY + 5,
              {
                width: columnWidths[j] - 10,
                align: lang === 'ar' ? 'right' : 'left',
              }
            );
          });
          currentY += 20;
        }

        const date = item.checkInTime ? moment(item.checkInTime).format('YYYY-MM-DD') : t.noRecords;
        const checkIn = item.checkInTime ? moment(item.checkInTime).format('HH:mm') : t.noRecords;
        const checkOut = item.checkOutTime ? moment(item.checkOutTime).format('HH:mm') : t.noRecords;
        const branch = item.branch?.name || t.noRecords;
        const status = item.dayStatus || t.noRecords;
        const lateMinutes = item.lateMinutes || 0;
        const earlyLeaveMinutes = item.earlyLeaveMinutes || 0;

        const rowData = [date, branch, checkIn, checkOut, lateMinutes, earlyLeaveMinutes, status];

        doc
          .fontSize(10)
          .fillColor('black')
          .font(fontLoaded && lang === 'ar' ? 'Cairo' : 'Helvetica');
        rowData.forEach((data, j) => {
          doc
            .rect(tableLeft + columnWidths.slice(0, j).reduce((a, b) => a + b, 0), currentY, columnWidths[j], 20)
            .stroke();
          doc.text(
            data.toString(),
            tableLeft + columnWidths.slice(0, j).reduce((a, b) => a + b, 0) + 5,
            currentY + 5,
            {
              width: columnWidths[j] - 10,
              align: lang === 'ar' ? 'right' : 'left',
            }
          );
        });
        currentY += 20;
      });
    }

    // Footer with page number
    const pageCount = doc.bufferedPageRange().count;
    for (let i = 1; i <= pageCount; i++) {
      doc.switchToPage(i - 1);
      doc
        .fontSize(10)
        .fillColor('gray')
        .font(fontLoaded && lang === 'ar' ? 'Cairo' : 'Helvetica')
        .text(
          `${t.page} ${i} / ${pageCount}`,
          50,
          doc.page.height - 50,
          { align: 'center' }
        );
    }

    // Finalize the PDF
    doc.end();
  } catch (err) {
    console.error('خطأ في توليد تقرير PDF:', err);
    res.status(500).json({ message: t('error', 'فشل توليد التقرير'), error: err.message });
  }
};