

// const jwt = require('jsonwebtoken');
// const bcrypt = require('bcryptjs');
// const User = require('../models/User');
// const crypto = require('crypto');
// const nodemailer = require('nodemailer');

// const Log = require("../models/Log");
// const { sendAlert } = require("../config/nodemailer");
// const transporter = nodemailer.createTransport({
//   service: 'Gmail',
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//   },
// });

// exports.loginUser = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     console.log('Login attempt for email:', email); // لوج للتصحيح

//     // التحقق من وجود المستخدم
//     const user = await User.findOne({ email });
//     if (!user) {
//       console.log('User not found for email:', email);
//       return res.status(400).json({ success: false, message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
//     }

//     console.log('User found:', { id: user._id, email: user.email, isActive: user.isActive, role: user.role }); // لوج للتصحيح

//     // التحقق من تفعيل الحساب
//     if (!user.isActive) {
//       console.log('Account not active for user:', email);
//       return res.status(403).json({ success: false, message: 'الحساب غير مفعل. يرجى تفعيل حسابك عبر رابط التفعيل المرسل إلى بريدك الإلكتروني.' });
//     }

//     // التحقق من كلمة المرور
//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) {
//       console.log('Password mismatch for user:', email);
//       return res.status(400).json({ success: false, message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
//     }

//     // إنشاء توكن JWT
//     const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });

//     console.log('Login successful for user:', email);
//     res.json({
//       success: true,
//       message: 'تم تسجيل الدخول بنجاح',
//       token,
//       user: { id: user._id, name: user.name, email: user.email, role: user.role },
//     });
//   } catch (err) {
//     console.error('Login error:', err);
//     res.status(500).json({ success: false, message: 'خطأ في تسجيل الدخول' });
//   }
// };
// exports.registerUser = async (req, res) => {
//   try {
//     const { name, email, role, branches, phone, address, salary, requiredWorkingDays, workingDaysNames, workingHoursPerDay, workStartTime, workEndTime, absenceDeductionRate } = req.body;
//     if (!name || !email) {
//       return res.status(400).json({ message: 'Name and email are required' });
//     }
//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       return res.status(400).json({ message: 'User already exists' });
//     }
//     if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
//       return res.status(500).json({ message: 'Email service configuration is missing' });
//     }
    
//     const activationToken = crypto.randomBytes(20).toString('hex');
//     const activationTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    
//     const user = await User.create({ 
//       name, 
//       email, 
//       role: role || 'staff', 
//       branches: branches && Array.isArray(branches) ? branches : [],
//       phone,
//       address,
//       salary: salary ? Number(salary) : undefined,
//       requiredWorkingDays: requiredWorkingDays ? Number(requiredWorkingDays) : undefined,
//       workingDaysNames: workingDaysNames && Array.isArray(workingDaysNames) ? workingDaysNames : undefined,
//       workingHoursPerDay: workingHoursPerDay ? Number(workingHoursPerDay) : undefined,
//       workStartTime,
//       workEndTime,
//       absenceDeductionRate: absenceDeductionRate ? Number(absenceDeductionRate) : undefined,
//       activationToken,
//       activationTokenExpires
//     });

//     // تحديد رابط التفعيل بناء على البيئة
//     const baseUrl = process.env.NODE_ENV === 'production' 
//       ? process.env.FRONTEND_URL 
//       : (process.env.FRONTEND_URL || 'http://localhost:5173');
    
//     const activationUrl = `${baseUrl}/activate/${activationToken}`;
    
//     // إنشاء HTML محسن للإيميل
//     const emailHtml = `
//       <!DOCTYPE html>
//       <html dir="rtl" lang="ar">
//       <head>
//         <meta charset="UTF-8">
//         <meta name="viewport" content="width=device-width, initial-scale=1.0">
//         <title>تفعيل الحساب - RAN Clinic</title>
//         <style>
//           body { font-family: Arial, sans-serif; direction: rtl; background-color: #f4f4f4; margin: 0; padding: 20px; }
//           .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
//           .header { text-align: center; color: #4A90E2; margin-bottom: 30px; }
//           .content { line-height: 1.6; color: #333; }
//           .button { display: inline-block; background-color: #4A90E2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
//           .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
//         </style>
//       </head>
//       <body>
//         <div class="container">
//           <div class="header">
//             <h1>مرحباً بك في RAN Clinic</h1>
//           </div>
//           <div class="content">
//             <p>عزيزي/عزيزتي ${name},</p>
//             <p>تم إنشاء حساب جديد لك في نظام RAN Clinic. لإكمال عملية التسجيل وتفعيل حسابك، يرجى النقر على الرابط أدناه لتعيين كلمة المرور الخاصة بك:</p>
            
//             <div style="text-align: center; margin: 30px 0;">
//               <a href="${activationUrl}" class="button">تفعيل الحساب وتعيين كلمة المرور</a>
//             </div>
            
//             <p><strong>معلومات الحساب:</strong></p>
//             <ul>
//               <li>الاسم: ${name}</li>
//               <li>البريد الإلكتروني: ${email}</li>
//               <li>الدور: ${role === 'admin' ? 'إداري' : 'موظف'}</li>
//             </ul>
            
//             <p><strong>ملاحظة مهمة:</strong> هذا الرابط صالح لمدة 24 ساعة فقط من تاريخ إرسال هذا الإيميل.</p>
            
//             <p>إذا لم تتمكن من النقر على الرابط، يمكنك نسخ الرابط التالي ولصقه في المتصفح:</p>
//             <p style="word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 5px;">${activationUrl}</p>
//           </div>
          
//           <div class="footer">
//             <p>إذا لم تطلب هذا الحساب، يرجى تجاهل هذا الإيميل.</p>
//             <p>شكراً لك،<br>فريق RAN Clinic</p>
//           </div>
//         </div>
//       </body>
//       </html>
//     `;

//     try {
//       await transporter.sendMail({
//         from: `"RAN Clinic" <${process.env.EMAIL_USER}>`,
//         to: email,
//         subject: 'تفعيل حسابك في RAN Clinic',
//         html: emailHtml,
//         text: `مرحباً ${name}, لتفعيل حسابك في RAN Clinic، يرجى زيارة الرابط التالي: ${activationUrl}`
//       });

//       console.log(`Activation email sent to ${email} with URL: ${activationUrl}`);
//     } catch (emailError) {
//       console.error('Email sending error:', emailError);
//       // حذف المستخدم إذا فشل في إرسال الإيميل
//       await User.findByIdAndDelete(user._id);
//       return res.status(500).json({ message: 'Failed to send activation email', error: emailError.message });
//     }

//     res.json({ 
//       message: 'User registered successfully. Activation email sent.', 
//       user: { 
//         _id: user._id, 
//         name: user.name, 
//         email: user.email, 
//         role: user.role, 
//         branches: user.branches,
//         activationUrl: activationUrl // إرجاع الرابط للتطوير
//       } 
//     });
//   } catch (err) {
//     console.error('Register error:', err);
//     res.status(500).json({ message: 'Failed to register', error: err.message });
//   }
// };

// // exports.activateAccount = async (req, res) => {
// //   try {
// //     const { token, password } = req.body;
// //     if (!token || !password) {
// //       return res.status(400).json({ message: 'Token and password are required' });
// //     }
    
// //     const user = await User.findOne({ 
// //       activationToken: token, 
// //       activationTokenExpires: { $gt: Date.now() } 
// //     });
    
// //     if (!user) {
// //       return res.status(400).json({ message: 'Invalid or expired activation token' });
// //     }
    
// //     const hashedPassword = await bcrypt.hash(password, 10);
// //     user.password = hashedPassword;
// //     user.isActive = true;
// //     user.passwordSet = true;
// //     user.activationToken = undefined;
// //     user.activationTokenExpires = undefined;
// //     await user.save();
    
// //     res.json({ message: 'Account activated successfully. You can now login.' });
// //   } catch (err) {
// //     console.error('Activation error:', err);
// //     res.status(500).json({ message: 'Failed to activate account', error: err.message });
// //   }
// // };

// exports.resendActivation = async (req, res) => {
//   try {
//     const { userId } = req.params;
//     const user = await User.findById(userId);
//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }
//     if (user.isActive && user.passwordSet) {
//       return res.status(400).json({ message: 'Account already activated' });
//     }
//     if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
//       return res.status(500).json({ message: 'Email service configuration is missing' });
//     }
    
//     const activationToken = crypto.randomBytes(20).toString('hex');
//     const activationTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
//     user.activationToken = activationToken;
//     user.activationTokenExpires = activationTokenExpires;
//     await user.save();

//     const baseUrl = process.env.NODE_ENV === 'production' 
//       ? process.env.FRONTEND_URL 
//       : (process.env.FRONTEND_URL || 'http://localhost:3000');
    
//     const activationUrl = `${baseUrl}/activate/${activationToken}`;

//     const emailHtml = `
//       <!DOCTYPE html>
//       <html dir="rtl" lang="ar">
//       <head>
//         <meta charset="UTF-8">
//         <style>
//           body { font-family: Arial, sans-serif; direction: rtl; background-color: #f4f4f4; margin: 0; padding: 20px; }
//           .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; }
//           .button { display: inline-block; background-color: #4A90E2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; }
//         </style>
//       </head>
//       <body>
//         <div class="container">
//           <h1 style="color: #4A90E2; text-align: center;">إعادة تفعيل الحساب</h1>
//           <p>عزيزي/عزيزتي ${user.name},</p>
//           <p>تم إرسال رابط تفعيل جديد لحسابك. يرجى النقر على الرابط أدناه:</p>
//           <div style="text-align: center; margin: 30px 0;">
//             <a href="${activationUrl}" class="button">تفعيل الحساب</a>
//           </div>
//           <p>هذا الرابط صالح لمدة 24 ساعة فقط.</p>
//         </div>
//       </body>
//       </html>
//     `;

//     await transporter.sendMail({
//       from: `"RAN Clinic" <${process.env.EMAIL_USER}>`,
//       to: user.email,
//       subject: 'إعادة تفعيل حسابك في RAN Clinic',
//       html: emailHtml
//     });

//     console.log(`Resend activation email sent to ${user.email} with URL: ${activationUrl}`);
//     res.json({ message: 'New activation email sent successfully' });
//   } catch (err) {
//     console.error('Resend activation error:', err);
//     res.status(500).json({ message: 'Failed to resend activation email', error: err.message });
//   }
// };

// exports.getProfile = async (req, res) => {
//   try {
//     const user = await User.findById(req.user.userId).populate('branches');
//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }
//     res.json({ 
//       _id: user._id, 
//       name: user.name, 
//       email: user.email, 
//       role: user.role, 
//       branches: user.branches, 
//       feedback: user.feedback 
//     });
//   } catch (err) {
//     console.error('Profile error:', err);
//     res.status(500).json({ message: 'Failed to fetch profile', error: err.message });
//   }
// };

// exports.forgotPassword = async (req, res) => {
//   try {
//     const { email } = req.body;
//     if (!email) {
//       return res.status(400).json({ message: 'Email is required' });
//     }
//     const user = await User.findOne({ email });
//     if (!user) {
//       await Log.create({
//         userId: null,
//         action: 'forgotPassword',
//         status: 'failed',
//         reason: 'User not found',
//         ip: req.ip,
//       });
//       return res.status(404).json({ message: 'User not found' });
//     }
//     const resetToken = crypto.randomBytes(20).toString('hex');
//     user.resetPasswordToken = resetToken;
//     user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
//     await user.save();
//     const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
//     await sendAlert(
//       user.email,
//       'Password Reset Request',
//       `Please click the following link to reset your password: ${resetUrl}\nThis link will expire in 1 hour.`
//     );
//     await Log.create({
//       userId: user._id,
//       action: 'forgotPassword',
//       status: 'success',
//       ip: req.ip,
//     });
//     res.json({ message: 'Password reset email sent' });
//   } catch (err) {
//     console.error('Forgot password error:', err);
//     await Log.create({
//       userId: null,
//       action: 'forgotPassword',
//       status: 'error',
//       reason: err.message,
//       ip: req.ip,
//     });
//     res.status(500).json({ message: 'Failed to send reset email', error: err.message });
//   }
// };
// exports.resetPassword = async (req, res) => {
//   try {
//     const { token, password } = req.body;
//     if (!token || !password) {
//       return res.status(400).json({ message: 'Token and password are required' });
//     }
//     const user = await User.findOne({
//       resetPasswordToken: token,
//       resetPasswordExpires: { $gt: Date.now() },
//     });
//     if (!user) {
//       await Log.create({
//         userId: null,
//         action: 'resetPassword',
//         status: 'failed',
//         reason: 'Invalid or expired token',
//         ip: req.ip,
//       });
//       return res.status(400).json({ message: 'Invalid or expired reset token' });
//     }
//     const hashedPassword = await bcrypt.hash(password, 10);
//     user.password = hashedPassword;
//     user.resetPasswordToken = undefined;
//     user.resetPasswordExpires = undefined;
//     await user.save();
//     await Log.create({
//       userId: user._id,
//       action: 'resetPassword',
//       status: 'success',
//       ip: req.ip,
//     });
//     res.json({ message: 'Password reset successfully' });
//   } catch (err) {
//     console.error('Reset password error:', err);
//     await Log.create({
//       userId: null,
//       action: 'resetPassword',
//       status: 'error',
//       reason: err.message,
//       ip: req.ip,
//     });
//     res.status(500).json({ message: 'Failed to reset password', error: err.message });
//   }
// };

// const jwt = require('jsonwebtoken');
// const bcrypt = require('bcryptjs');
// const User = require('../models/User');
// const crypto = require('crypto');
// const nodemailer = require('nodemailer');

// const Log = require("../models/Log");
// const { sendAlert } = require("../config/nodemailer");
// const transporter = nodemailer.createTransport({
//   service: 'Gmail',
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//   },
// });

// exports.loginUser = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     console.log('Login attempt for email:', email);

//     const user = await User.findOne({ email });
//     if (!user) {
//       console.log('User not found for email:', email);
//       return res.status(400).json({ success: false, message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
//     }

//     console.log('User found:', { id: user._id, email: user.email, isActive: user.isActive, role: user.role });

//     if (!user.isActive) {
//       console.log('Account not active for user:', email);
//       return res.status(403).json({ success: false, message: 'الحساب غير مفعل. يرجى تفعيل حسابك عبر رابط التفعيل المرسل إلى بريدك الإلكتروني.' });
//     }

//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) {
//       console.log('Password mismatch for user:', email);
//       return res.status(400).json({ success: false, message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
//     }

//     const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });

//     console.log('Login successful for user:', email);
//     res.json({
//       success: true,
//       message: 'تم تسجيل الدخول بنجاح',
//       token,
//       user: { id: user._id, name: user.name, email: user.email, role: user.role },
//     });
//   } catch (err) {
//     console.error('Login error:', err);
//     res.status(500).json({ success: false, message: 'خطأ في تسجيل الدخول' });
//   }
// };

// exports.registerUser = async (req, res) => {
//   try {
//     const { name, email, role, branches, phone, address, salary, requiredWorkingDays, workingDaysNames, workingHoursPerDay, workStartTime, workEndTime, absenceDeductionRate } = req.body;
//     if (!name || !email) {
//       return res.status(400).json({ message: 'Name and email are required' });
//     }
//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       return res.status(400).json({ message: 'User already exists' });
//     }
//     if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
//       return res.status(500).json({ message: 'Email service configuration is missing' });
//     }
    
//     const activationToken = crypto.randomBytes(20).toString('hex');
//     const activationTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    
//     const user = await User.create({ 
//       name, 
//       email, 
//       role: role || 'staff', 
//       branches: branches && Array.isArray(branches) ? branches : [],
//       phone,
//       address,
//       salary: salary ? Number(salary) : undefined,
//       requiredWorkingDays: requiredWorkingDays ? Number(requiredWorkingDays) : undefined,
//       workingDaysNames: workingDaysNames && Array.isArray(workingDaysNames) ? workingDaysNames : undefined,
//       workingHoursPerDay: workingHoursPerDay ? Number(workingHoursPerDay) : undefined,
//       workStartTime,
//       workEndTime,
//       absenceDeductionRate: absenceDeductionRate ? Number(absenceDeductionRate) : undefined,
//       activationToken,
//       activationTokenExpires
//     });

//     const baseUrl = process.env.NODE_ENV === 'production' 
//       ? process.env.FRONTEND_URL 
//       : (process.env.FRONTEND_URL || 'http://localhost:5173');
    
//     const activationUrl = `${baseUrl}/activate/${activationToken}`;
    
//     const emailHtml = `
//       <!DOCTYPE html>
//       <html dir="rtl" lang="ar">
//       <head>
//         <meta charset="UTF-8">
//         <meta name="viewport" content="width=device-width, initial-scale=1.0">
//         <title>تفعيل الحساب - RAN Clinic</title>
//         <style>
//           body { font-family: Arial, sans-serif; direction: rtl; background-color: #f4f4f4; margin: 0; padding: 20px; }
//           .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
//           .header { text-align: center; color: #4A90E2; margin-bottom: 30px; }
//           .content { line-height: 1.6; color: #333; }
//           .button { display: inline-block; background-color: #4A90E2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
//           .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
//         </style>
//       </head>
//       <body>
//         <div class="container">
//           <div class="header">
//             <h1>مرحباً بك في RAN Clinic</h1>
//           </div>
//           <div class="content">
//             <p>عزيزي/عزيزتي ${name},</p>
//             <p>تم إنشاء حساب جديد لك في نظام RAN Clinic. لإكمال عملية التسجيل وتفعيل حسابك، يرجى النقر على الرابط أدناه لتعيين كلمة المرور الخاصة بك:</p>
            
//             <div style="text-align: center; margin: 30px 0;">
//               <a href="${activationUrl}" class="button">تفعيل الحساب وتعيين كلمة المرور</a>
//             </div>
            
//             <p><strong>معلومات الحساب:</strong></p>
//             <ul>
//               <li>الاسم: ${name}</li>
//               <li>البريد الإلكتروني: ${email}</li>
//               <li>الدور: ${role === 'admin' ? 'إداري' : 'موظف'}</li>
//             </ul>
            
//             <p><strong>ملاحظة مهمة:</strong> هذا الرابط صالح لمدة 24 ساعة فقط من تاريخ إرسال هذا الإيميل.</p>
            
//             <p>إذا لم تتمكن من النقر على الرابط، يمكنك نسخ الرابط التالي ولصقه في المتصفح:</p>
//             <p style="word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 5px;">${activationUrl}</p>
//           </div>
          
//           <div class="footer">
//             <p>إذا لم تطلب هذا الحساب، يرجى تجاهل هذا الإيميل.</p>
//             <p>شكراً لك،<br>فريق RAN Clinic</p>
//           </div>
//         </div>
//       </body>
//       </html>
//     `;

//     try {
//       await transporter.sendMail({
//         from: `"RAN Clinic" <${process.env.EMAIL_USER}>`,
//         to: email,
//         subject: 'تفعيل حسابك في RAN Clinic',
//         html: emailHtml,
//         text: `مرحباً ${name}, لتفعيل حسابك في RAN Clinic، يرجى زيارة الرابط التالي: ${activationUrl}`
//       });

//       console.log(`Activation email sent to ${email} with URL: ${activationUrl}`);
//     } catch (emailError) {
//       console.error('Email sending error:', emailError);
//       await User.findByIdAndDelete(user._id);
//       return res.status(500).json({ message: 'Failed to send activation email', error: emailError.message });
//     }

//     res.json({ 
//       message: 'User registered successfully. Activation email sent.', 
//       user: { 
//         _id: user._id, 
//         name: user.name, 
//         email: user.email, 
//         role: user.role, 
//         branches: user.branches,
//         activationUrl: activationUrl
//       } 
//     });
//   } catch (err) {
//     console.error('Register error:', err);
//     res.status(500).json({ message: 'Failed to register', error: err.message });
//   }
// };

// exports.resendActivation = async (req, res) => {
//   try {
//     const { userId } = req.params;
//     const user = await User.findById(userId);
//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }
//     if (user.isActive && user.passwordSet) {
//       return res.status(400).json({ message: 'Account already activated' });
//     }
//     if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
//       return res.status(500).json({ message: 'Email service configuration is missing' });
//     }
    
//     const activationToken = crypto.randomBytes(20).toString('hex');
//     const activationTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
//     user.activationToken = activationToken;
//     user.activationTokenExpires = activationTokenExpires;
//     await user.save();

//     const baseUrl = process.env.NODE_ENV === 'production' 
//       ? process.env.FRONTEND_URL 
//       : (process.env.FRONTEND_URL || 'http://localhost:3000');
    
//     const activationUrl = `${baseUrl}/activate/${activationToken}`;

//     const emailHtml = `
//       <!DOCTYPE html>
//       <html dir="rtl" lang="ar">
//       <head>
//         <meta charset="UTF-8">
//         <style>
//           body { font-family: Arial, sans-serif; direction: rtl; background-color: #f4f4f4; margin: 0; padding: 20px; }
//           .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; }
//           .button { display: inline-block; background-color: #4A90E2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; }
//         </style>
//       </head>
//       <body>
//         <div class="container">
//           <h1 style="color: #4A90E2; text-align: center;">إعادة تفعيل الحساب</h1>
//           <p>عزيزي/عزيزتي ${user.name},</p>
//           <p>تم إرسال رابط تفعيل جديد لحسابك. يرجى النقر على الرابط أدناه:</p>
//           <div style="text-align: center; margin: 30px 0;">
//             <a href="${activationUrl}" class="button">تفعيل الحساب</a>
//           </div>
//           <p>هذا الرابط صالح لمدة 24 ساعة فقط.</p>
//         </div>
//       </body>
//       </html>
//     `;

//     await transporter.sendMail({
//       from: `"RAN Clinic" <${process.env.EMAIL_USER}>`,
//       to: user.email,
//       subject: 'إعادة تفعيل حسابك في RAN Clinic',
//       html: emailHtml
//     });

//     console.log(`Resend activation email sent to ${user.email} with URL: ${activationUrl}`);
//     res.json({ message: 'New activation email sent successfully' });
//   } catch (err) {
//     console.error('Resend activation error:', err);
//     res.status(500).json({ message: 'Failed to resend activation email', error: err.message });
//   }
// };

// exports.getProfile = async (req, res) => {
//   try {
//     const user = await User.findById(req.user.userId).populate('branches');
//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }
//     res.json({ 
//       _id: user._id, 
//       name: user.name, 
//       email: user.email, 
//       role: user.role, 
//       branches: user.branches, 
//       feedback: user.feedback 
//     });
//   } catch (err) {
//     console.error('Profile error:', err);
//     res.status(500).json({ message: 'Failed to fetch profile', error: err.message });
//   }
// };

// exports.forgotPassword = async (req, res) => {
//   try {
//     const { email } = req.body;
//     if (!email) {
//       return res.status(400).json({ message: 'Email is required' });
//     }
//     const user = await User.findOne({ email });
//     if (!user) {
//       await Log.create({
//         userId: null,
//         action: 'forgotPassword',
//         status: 'failed',
//         reason: 'User not found',
//         ip: req.ip,
//       });
//       return res.status(404).json({ message: 'User not found' });
//     }
//     const resetToken = crypto.randomBytes(20).toString('hex');
//     user.resetPasswordToken = resetToken;
//     user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
//     await user.save();
    
//     // تحديد الرابط بوضوح
//     const baseUrl = process.env.NODE_ENV === 'production' 
//       ? process.env.FRONTEND_URL 
//       : (process.env.FRONTEND_URL || 'http://localhost:5173'); // تأكد من port صحيح
    
//     const resetUrl = `${baseUrl}/reset-password/${resetToken}`;
    
//     // لوج الرابط للتأكد منه
//     console.log('=== DEBUG EMAIL LINK ===');
//     console.log('NODE_ENV:', process.env.NODE_ENV);
//     console.log('FRONTEND_URL:', process.env.FRONTEND_URL);
//     console.log('Base URL:', baseUrl);
//     console.log('Reset Token:', resetToken);
//     console.log('Complete Reset URL:', resetUrl);
//     console.log('========================');
    
//     const emailHtml = `
//       <!DOCTYPE html>
//       <html dir="rtl" lang="ar">
//       <head>
//         <meta charset="UTF-8">
//         <meta name="viewport" content="width=device-width, initial-scale=1.0">
//         <title>إعادة تعيين كلمة المرور - RAN Clinic</title>
//         <style>
//           body { font-family: Arial, sans-serif; direction: rtl; background-color: #f4f4f4; margin: 0; padding: 20px; }
//           .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
//           .header { text-align: center; color: #4A90E2; margin-bottom: 30px; }
//           .content { line-height: 1.6; color: #333; }
//           .button { display: inline-block; background-color: #4A90E2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
//           .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
//           .warning { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; border-radius: 5px; margin: 20px 0; }
//           .debug { background-color: #f8f9fa; border: 1px solid #dee2e6; padding: 10px; border-radius: 5px; margin: 20px 0; font-family: monospace; font-size: 12px; }
//         </style>
//       </head>
//       <body>
//         <div class="container">
//           <div class="header">
//             <h1>إعادة تعيين كلمة المرور</h1>
//           </div>
//           <div class="content">
//             <p>عزيزي/عزيزتي ${user.name},</p>
//             <p>تم طلب إعادة تعيين كلمة المرور لحسابك في نظام RAN Clinic. إذا كنت قد طلبت هذا، يرجى النقر على الرابط أدناه لتعيين كلمة مرور جديدة:</p>
            
//             <div style="text-align: center; margin: 30px 0;">
//               <a href="${resetUrl}" class="button">إعادة تعيين كلمة المرور</a>
//             </div>
            
//             <!-- معلومات التصحيح -->
//             <div class="debug">
//               <strong>معلومات التصحيح:</strong><br>
//               Base URL: ${baseUrl}<br>
//               Token: ${resetToken}<br>
//               Complete URL: ${resetUrl}<br>
//               Environment: ${process.env.NODE_ENV || 'development'}
//             </div>
            
//             <div class="warning">
//               <p><strong>تنبيه أمني مهم:</strong></p>
//               <ul>
//                 <li>هذا الرابط صالح لمدة ساعة واحدة فقط من وقت إرسال هذا الإيميل</li>
//                 <li>إذا لم تطلب إعادة تعيين كلمة المرور، يرجى تجاهل هذا الإيميل</li>
//                 <li>لا تشارك هذا الرابط مع أي شخص آخر</li>
//               </ul>
//             </div>
            
//             <p>إذا لم تتمكن من النقر على الرابط، يمكنك نسخ الرابط التالي ولصقه في المتصفح:</p>
//             <p style="word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 5px;">${resetUrl}</p>
//           </div>
          
//           <div class="footer">
//             <p>إذا لم تطلب إعادة تعيين كلمة المرور، يرجى تجاهل هذا الإيميل وستبقى كلمة المرور الحالية كما هي.</p>
//             <p>للمساعدة والدعم، يرجى التواصل مع فريق الدعم.</p>
//             <p>شكراً لك،<br>فريق RAN Clinic</p>
//           </div>
//         </div>
//       </body>
//       </html>
//     `;
    
//     await transporter.sendMail({
//       from: `"RAN Clinic" <${process.env.EMAIL_USER}>`,
//       to: user.email,
//       subject: 'إعادة تعيين كلمة المرور - RAN Clinic',
//       html: emailHtml,
//       text: `عزيزي ${user.name}, لإعادة تعيين كلمة المرور الخاصة بك في RAN Clinic، يرجى زيارة الرابط التالي: ${resetUrl}. هذا الرابط صالح لمدة ساعة واحدة فقط.`
//     });
    
//     await Log.create({
//       userId: user._id,
//       action: 'forgotPassword',
//       status: 'success',
//       ip: req.ip,
//     });
    
//     console.log(`Password reset email sent to ${user.email} with URL: ${resetUrl}`);
    
//     // إضافة الرابط في الاستجابة للتصحيح
//     res.json({ 
//       message: 'Password reset email sent',
//       debugInfo: {
//         resetUrl: resetUrl,
//         token: resetToken,
//         baseUrl: baseUrl
//       }
//     });
//   } catch (err) {
//     console.error('Forgot password error:', err);
//     await Log.create({
//       userId: null,
//       action: 'forgotPassword',
//       status: 'error',
//       reason: err.message,
//       ip: req.ip,
//     });
//     res.status(500).json({ message: 'Failed to send reset email', error: err.message });
//   }
// };

// exports.resetPassword = async (req, res) => {
//   try {
//     const { token, password } = req.body;
//     if (!token || !password) {
//       return res.status(400).json({ message: 'Token and password are required' });
//     }
//     const user = await User.findOne({
//       resetPasswordToken: token,
//       resetPasswordExpires: { $gt: Date.now() },
//     });
//     if (!user) {
//       await Log.create({
//         userId: null,
//         action: 'resetPassword',
//         status: 'failed',
//         reason: 'Invalid or expired token',
//         ip: req.ip,
//       });
//       return res.status(400).json({ message: 'Invalid or expired reset token' });
//     }
//     const hashedPassword = await bcrypt.hash(password, 10);
//     user.password = hashedPassword;
//     user.resetPasswordToken = undefined;
//     user.resetPasswordExpires = undefined;
//     await user.save();
//     await Log.create({
//       userId: user._id,
//       action: 'resetPassword',
//       status: 'success',
//       ip: req.ip,
//     });
//     res.json({ message: 'Password reset successfully' });
//   } catch (err) {
//     console.error('Reset password error:', err);
//     await Log.create({
//       userId: null,
//       action: 'resetPassword',
//       status: 'error',
//       reason: err.message,
//       ip: req.ip,
//     });
//     res.status(500).json({ message: 'Failed to reset password', error: err.message });
//   }
// };

// // إضافة دالة للتحقق من صحة رمز إعادة تعيين كلمة المرور
// exports.verifyResetToken = async (req, res) => {
//   try {
//     const { token } = req.params;
//     const user = await User.findOne({
//       resetPasswordToken: token,
//       resetPasswordExpires: { $gt: Date.now() },
//     });
    
//     if (!user) {
//       return res.status(400).json({ message: 'Invalid or expired reset token' });
//     }
    
//     res.json({ 
//       message: 'Token is valid', 
//       user: { 
//         name: user.name, 
//         email: user.email 
//       } 
//     });
//   } catch (err) {
//     console.error('Verify reset token error:', err);
//     res.status(500).json({ message: 'Failed to verify token', error: err.message });
//   }
// };











// const jwt = require('jsonwebtoken');
// const bcrypt = require('bcryptjs');
// const User = require('../models/User');
// const crypto = require('crypto');
// const nodemailer = require('nodemailer');

// const Log = require('../models/Log');
// const { sendAlert } = require('../config/nodemailer');

// const transporter = nodemailer.createTransport({
//   service: 'Gmail',
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//   },
// });

// exports.loginUser = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     console.log('Login attempt for email:', email);

//     const user = await User.findOne({ email });
//     if (!user) {
//       console.log('User not found for email:', email);
//       return res.status(400).json({ success: false, message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
//     }

//     console.log('User found:', {
//       id: user._id,
//       email: user.email,
//       isActive: user.isActive,
//       role: user.role,
//       passwordSet: user.passwordSet,
//       hasPassword: !!user.password,
//     });

//     if (!user.isActive) {
//       console.log('Account not active for user:', email);
//       return res.status(403).json({ success: false, message: 'الحساب غير مفعل. يرجى تفعيل حسابك عبر رابط التفعيل المرسل إلى بريدك الإلكتروني.' });
//     }

//     if (!user.password) {
//       console.log('No password set for user:', email);
//       return res.status(400).json({ success: false, message: 'كلمة المرور غير مُعينة. يرجى إعادة تعيين كلمة المرور.' });
//     }

//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) {
//       console.log('Password mismatch for user:', email);
//       return res.status(400).json({ success: false, message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
//     }

//     const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });

//     console.log('Login successful for user:', email);
//     res.json({
//       success: true,
//       message: 'تم تسجيل الدخول بنجاح',
//       token,
//       user: { id: user._id, name: user.name, email: user.email, role: user.role },
//     });
//   } catch (err) {
//     console.error('Login error:', err);
//     res.status(500).json({ success: false, message: 'خطأ في تسجيل الدخول' });
//   }
// };

// exports.registerUser = async (req, res) => {
//   try {
//     const { name, email, role, branches, phone, address, salary, requiredWorkingDays, workingDaysNames, workingHoursPerDay, workStartTime, workEndTime, absenceDeductionRate } = req.body;
//     if (!name || !email) {
//       return res.status(400).json({ message: 'Name and email are required' });
//     }
//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       return res.status(400).json({ message: 'User already exists' });
//     }
//     if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
//       return res.status(500).json({ message: 'Email service configuration is missing' });
//     }

//     const activationToken = crypto.randomBytes(20).toString('hex');
//     const activationTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

//     const user = await User.create({
//       name,
//       email,
//       role: role || 'staff',
//       branches: branches && Array.isArray(branches) ? branches : [],
//       phone,
//       address,
//       salary: salary ? Number(salary) : undefined,
//       requiredWorkingDays: requiredWorkingDays ? Number(requiredWorkingDays) : undefined,
//       workingDaysNames: workingDaysNames && Array.isArray(workingDaysNames) ? workingDaysNames : undefined,
//       workingHoursPerDay: workingHoursPerDay ? Number(workingHoursPerDay) : undefined,
//       workStartTime,
//       workEndTime,
//       absenceDeductionRate: absenceDeductionRate ? Number(absenceDeductionRate) : undefined,
//       activationToken,
//       activationTokenExpires,
//     });

//     const baseUrl = process.env.NODE_ENV === 'production'
//       ? process.env.FRONTEND_URL
//       : (process.env.FRONTEND_URL || 'http://localhost:5173');

//     const activationUrl = `${baseUrl}/activate/${activationToken}`;

//     const emailHtml = `
//       <!DOCTYPE html>
//       <html dir="rtl" lang="ar">
//       <head>
//         <meta charset="UTF-8">
//         <meta name="viewport" content="width=device-width, initial-scale=1.0">
//         <title>تفعيل الحساب - RAN Clinic</title>
//         <style>
//           body { font-family: Arial, sans-serif; direction: rtl; background-color: #f4f4f4; margin: 0; padding: 20px; }
//           .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
//           .header { text-align: center; color: #4A90E2; margin-bottom: 30px; }
//           .content { line-height: 1.6; color: #333; }
//           .button { display: inline-block; background-color: #4A90E2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
//           .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
//         </style>
//       </head>
//       <body>
//         <div class="container">
//           <div class="header">
//             <h1>مرحباً بك في RAN Clinic</h1>
//           </div>
//           <div class="content">
//             <p>عزيزي/عزيزتي ${name},</p>
//             <p>تم إنشاء حساب جديد لك في نظام RAN Clinic. لإكمال عملية التسجيل وتفعيل حسابك، يرجى النقر على الرابط أدناه لتعيين كلمة المرور الخاصة بك:</p>
            
//             <div style="text-align: center; margin: 30px 0;">
//               <a href="${activationUrl}" class="button">تفعيل الحساب وتعيين كلمة المرور</a>
//             </div>
            
//             <p><strong>معلومات الحساب:</strong></p>
//             <ul>
//               <li>الاسم: ${name}</li>
//               <li>البريد الإلكتروني: ${email}</li>
//               <li>الدور: ${role === 'admin' ? 'إداري' : 'موظف'}</li>
//             </ul>
            
//             <p><strong>ملاحظة مهمة:</strong> هذا الرابط صالح لمدة 24 ساعة فقط من تاريخ إرسال هذا الإيميل.</p>
            
//             <p>إذا لم تتمكن من النقر على الرابط، يمكنك نسخ الرابط التالي ولصقه في المتصفح:</p>
//             <p style="word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 5px;">${activationUrl}</p>
//           </div>
          
//           <div class="footer">
//             <p>إذا لم تطلب هذا الحساب، يرجى تجاهل هذا الإيميل.</p>
//             <p>شكراً لك،<br>فريق RAN Clinic</p>
//           </div>
//         </div>
//       </body>
//       </html>
//     `;

//     try {
//       await transporter.sendMail({
//         from: `"RAN Clinic" <${process.env.EMAIL_USER}>`,
//         to: email,
//         subject: 'تفعيل حسابك في RAN Clinic',
//         html: emailHtml,
//         text: `مرحباً ${name}, لتفعيل حسابك في RAN Clinic، يرجى زيارة الرابط التالي: ${activationUrl}`,
//       });

//       console.log(`Activation email sent to ${email} with URL: ${activationUrl}`);
//       res.json({
//         message: 'User registered successfully. Activation email sent.',
//         user: {
//           _id: user._id,
//           name: user.name,
//           email: user.email,
//           role: user.role,
//           branches: user.branches,
//           activationUrl,
//         },
//       });
//     } catch (emailError) {
//       console.error('Email sending error:', emailError);
//       await User.findByIdAndDelete(user._id);
//       return res.status(500).json({ message: 'Failed to send activation email', error: emailError.message });
//     }
//   } catch (err) {
//     console.error('Register error:', err);
//     res.status(500).json({ message: 'Failed to register', error: err.message });
//   }
// };

// exports.resendActivation = async (req, res) => {
//   try {
//     const { userId } = req.params;
//     const user = await User.findById(userId);
//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }
//     if (user.isActive && user.passwordSet) {
//       return res.status(400).json({ message: 'Account already activated' });
//     }
//     if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
//       return res.status(500).json({ message: 'Email service configuration is missing' });
//     }

//     const activationToken = crypto.randomBytes(20).toString('hex');
//     const activationTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
//     user.activationToken = activationToken;
//     user.activationTokenExpires = activationTokenExpires;
//     await user.save();

//     const baseUrl = process.env.NODE_ENV === 'production'
//       ? process.env.FRONTEND_URL
//       : (process.env.FRONTEND_URL || 'http://localhost:5173');

//     const activationUrl = `${baseUrl}/activate/${activationToken}`;

//     const emailHtml = `
//       <!DOCTYPE html>
//       <html dir="rtl" lang="ar">
//       <head>
//         <meta charset="UTF-8">
//         <style>
//           body { font-family: Arial, sans-serif; direction: rtl; background-color: #f4f4f4; margin: 0; padding: 20px; }
//           .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; }
//           .button { display: inline-block; background-color: #4A90E2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; }
//         </style>
//       </head>
//       <body>
//         <div class="container">
//           <h1 style="color: #4A90E2; text-align: center;">إعادة تفعيل الحساب</h1>
//           <p>عزيزي/عزيزتي ${user.name},</p>
//           <p>تم إرسال رابط تفعيل جديد لحسابك. يرجى النقر على الرابط أدناه:</p>
//           <div style="text-align: center; margin: 30px 0;">
//             <a href="${activationUrl}" class="button">تفعيل الحساب</a>
//           </div>
//           <p>هذا الرابط صالح لمدة 24 ساعة فقط.</p>
//         </div>
//       </body>
//       </html>
//     `;

//     await transporter.sendMail({
//       from: `"RAN Clinic" <${process.env.EMAIL_USER}>`,
//       to: user.email,
//       subject: 'إعادة تفعيل حسابك في RAN Clinic',
//       html: emailHtml,
//     });

//     console.log(`Resend activation email sent to ${user.email} with URL: ${activationUrl}`);
//     res.json({ message: 'New activation email sent successfully' });
//   } catch (err) {
//     console.error('Resend activation error:', err);
//     res.status(500).json({ message: 'Failed to resend activation email', error: err.message });
//   }
// };

// exports.getProfile = async (req, res) => {
//   try {
//     const user = await User.findById(req.user.userId).populate('branches');
//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }
//     res.json({
//       _id: user._id,
//       name: user.name,
//       email: user.email,
//       role: user.role,
//       branches: user.branches,
//       feedback: user.feedback,
//     });
//   } catch (err) {
//     console.error('Profile error:', err);
//     res.status(500).json({ message: 'Failed to fetch profile', error: err.message });
//   }
// };

// exports.forgotPassword = async (req, res) => {
//   try {
//     const { email } = req.body;
//     if (!email) {
//       return res.status(400).json({ message: 'Email is required' });
//     }
//     const user = await User.findOne({ email });
//     if (!user) {
//       await Log.create({
//         userId: null,
//         action: 'forgotPassword',
//         status: 'failed',
//         reason: 'User not found',
//         ip: req.ip,
//       });
//       return res.status(404).json({ message: 'User not found' });
//     }
//     const resetToken = crypto.randomBytes(20).toString('hex');
//     const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
//     user.resetPasswordToken = hashedToken;
//     user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
//     await user.save();

//     console.log('Stored user data:', {
//       email: user.email,
//       resetPasswordToken: user.resetPasswordToken,
//       resetPasswordExpires: user.resetPasswordExpires,
//       isActive: user.isActive,
//       passwordSet: user.passwordSet,
//     });

//     const baseUrl = process.env.NODE_ENV === 'production'
//       ? process.env.FRONTEND_URL
//       : (process.env.FRONTEND_URL || 'http://localhost:5173');

//     const resetUrl = `${baseUrl}/reset-password/${resetToken}`;

//     console.log('=== DEBUG EMAIL LINK ===');
//     console.log('NODE_ENV:', process.env.NODE_ENV);
//     console.log('FRONTEND_URL:', process.env.FRONTEND_URL);
//     console.log('Base URL:', baseUrl);
//     console.log('Reset Token (plain):', resetToken);
//     console.log('Hashed Token:', hashedToken);
//     console.log('Complete Reset URL:', resetUrl);
//     console.log('========================');

//     const emailHtml = `
//       <!DOCTYPE html>
//       <html dir="rtl" lang="ar">
//       <head>
//         <meta charset="UTF-8">
//         <meta name="viewport" content="width=device-width, initial-scale=1.0">
//         <title>إعادة تعيين كلمة المرور - RAN Clinic</title>
//         <style>
//           body { font-family: Arial, sans-serif; direction: rtl; background-color: #f4f4f4; margin: 0; padding: 20px; }
//           .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
//           .header { text-align: center; color: #4A90E2; margin-bottom: 30px; }
//           .content { line-height: 1.6; color: #333; }
//           .button { display: inline-block; background-color: #4A90E2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
//           .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
//           .warning { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; border-radius: 5px; margin: 20px 0; }
//           .debug { background-color: #f8f9fa; border: 1px solid #dee2e6; padding: 10px; border-radius: 5px; margin: 20px 0; font-family: monospace; font-size: 12px; }
//         </style>
//       </head>
//       <body>
//         <div class="container">
//           <div class="header">
//             <h1>إعادة تعيين كلمة المرور</h1>
//           </div>
//           <div class="content">
//             <p>عزيزي/عزيزتي ${user.name},</p>
//             <p>تم طلب إعادة تعيين كلمة المرور لحسابك في نظام RAN Clinic. إذا كنت قد طلبت هذا، يرجى النقر على الرابط أدناه لتعيين كلمة مرور جديدة:</p>
            
//             <div style="text-align: center; margin: 30px 0;">
//               <a href="${resetUrl}" class="button">إعادة تعيين كلمة المرور</a>
//             </div>
            

            
//             <div class="warning">
//               <p><strong>تنبيه أمني مهم:</strong></p>
//               <ul>
//                 <li>هذا الرابط صالح لمدة ساعة واحدة فقط من وقت إرسال هذا الإيميل</li>
//                 <li>إذا لم تطلب إعادة تعيين كلمة المرور، يرجى تجاهل هذا الإيميل</li>
//                 <li>لا تشارك هذا الرابط مع أي شخص آخر</li>
//               </ul>
//             </div>
            
//             <p>إذا لم تتمكن من النقر على الرابط، يمكنك نسخ الرابط التالي ولصقه في المتصفح:</p>
//             <p style="word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 5px;">${resetUrl}</p>
//           </div>
          
//           <div class="footer">
//             <p>إذا لم تطلب إعادة تعيين كلمة المرور، يرجى تجاهل هذا الإيميل وستبقى كلمة المرور الحالية كما هي.</p>
//             <p>للمساعدة والدعم، يرجى التواصل مع فريق الدعم.</p>
//             <p>شكراً لك،<br>فريق RAN Clinic</p>
//           </div>
//         </div>
//       </body>
//       </html>
//     `;

//     await transporter.sendMail({
//       from: `"RAN Clinic" <${process.env.EMAIL_USER}>`,
//       to: user.email,
//       subject: 'إعادة تعيين كلمة المرور - RAN Clinic',
//       html: emailHtml,
//       text: `عزيزي ${user.name}, لإعادة تعيين كلمة المرور الخاصة بك في RAN Clinic، يرجى زيارة الرابط التالي: ${resetUrl}. هذا الرابط صالح لمدة ساعة واحدة فقط.`,
//     });

//     await Log.create({
//       userId: user._id,
//       action: 'forgotPassword',
//       status: 'success',
//       ip: req.ip,
//     });

//     console.log(`Password reset email sent to ${user.email} with URL: ${resetUrl}`);

//     res.json({
//       message: 'Password reset email sent',
//       debugInfo: {
//         resetUrl,
//         token: resetToken,
//         baseUrl,
//       },
//     });
//   } catch (err) {
//     console.error('Forgot password error:', err);
//     await Log.create({
//       userId: null,
//       action: 'forgotPassword',
//       status: 'error',
//       reason: err.message,
//       ip: req.ip,
//     });
//     res.status(500).json({ message: 'Failed to send reset email', error: err.message });
//   }
// };

// exports.verifyResetToken = async (req, res) => {
//   try {
//     const { token } = req.params;
//     const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
//     console.log('Verifying token:', { plainToken: token, hashedToken });

//     const user = await User.findOne({
//       resetPasswordToken: hashedToken,
//       resetPasswordExpires: { $gt: Date.now() },
//     });

//     if (!user) {
//       console.log('No user found for hashed token:', hashedToken);
//       return res.status(400).json({ message: 'Invalid or expired reset token' });
//     }

//     console.log('Token verified successfully for user:', user.email);
//     res.json({
//       message: 'Token is valid',
//       user: {
//         name: user.name,
//         email: user.email,
//       },
//     });
//   } catch (err) {
//     console.error('Verify reset token error:', err);
//     res.status(500).json({ message: 'Failed to verify token', error: err.message });
//   }
// };

// exports.resetPassword = async (req, res) => {
//   try {
//     const { token, password } = req.body;
//     if (!token || !password) {
//       return res.status(400).json({ message: 'Token and password are required' });
//     }
//     const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
//     console.log('Resetting password with token:', { plainToken: token, hashedToken });

//     const user = await User.findOne({
//       resetPasswordToken: hashedToken,
//       resetPasswordExpires: { $gt: Date.now() },
//     });
//     if (!user) {
//       console.log('No user found for hashed token:', hashedToken);
//       await Log.create({
//         userId: null,
//         action: 'resetPassword',
//         status: 'failed',
//         reason: 'Invalid or expired token',
//         ip: req.ip,
//       });
//       return res.status(400).json({ message: 'Invalid or expired reset token' });
//     }

//     // Ensure the user is active and passwordSet is true
//     user.password = password; // Will be hashed by pre-save hook
//     user.isActive = true;
//     user.passwordSet = true;
//     user.resetPasswordToken = undefined;
//     user.resetPasswordExpires = undefined;
//     await user.save();

//     console.log('Password reset successfully for user:', user.email, {
//       isActive: user.isActive,
//       passwordSet: user.passwordSet,
//       hasPassword: !!user.password,
//     });

//     await Log.create({
//       userId: user._id,
//       action: 'resetPassword',
//       status: 'success',
//       ip: req.ip,
//     });

//     res.json({ message: 'Password reset successfully' });
//   } catch (err) {
//     console.error('Reset password error:', err);
//     await Log.create({
//       userId: null,
//       action: 'resetPassword',
//       status: 'error',
//       reason: err.message,
//       ip: req.ip,
//     });
//     res.status(500).json({ message: 'Failed to reset password', error: err.message });
//   }
// };












const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const Log = require('../models/Log');
const { sendAlert } = require('../config/nodemailer');

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('Login attempt for email:', email);

    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found for email:', email);
      return res.status(400).json({ success: false, message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
    }

    console.log('User found:', {
      id: user._id,
      email: user.email,
      isActive: user.isActive,
      role: user.role,
      passwordSet: user.passwordSet,
      hasPassword: !!user.password,
    });

    if (!user.isActive) {
      console.log('Account not active for user:', email);
      return res.status(403).json({ success: false, message: 'الحساب غير مفعل. يرجى تفعيل حسابك عبر رابط التفعيل المرسل إلى بريدك الإلكتروني.' });
    }

    if (!user.password) {
      console.log('No password set for user:', email);
      return res.status(400).json({ success: false, message: 'كلمة المرور غير مُعينة. يرجى إعادة تعيين كلمة المرور.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Password mismatch for user:', email);
      return res.status(400).json({ success: false, message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
    }

    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });

    console.log('Login successful for user:', email);
    res.json({
      success: true,
      message: 'تم تسجيل الدخول بنجاح',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'خطأ في تسجيل الدخول' });
  }
};

// exports.registerUser = async (req, res) => {
//   try {
//     const { name, email, role, branches, phone, address, salary, requiredWorkingDays, workingDaysNames, workingHoursPerDay, workStartTime, workEndTime, absenceDeductionRate } = req.body;
//     if (!name || !email) {
//       return res.status(400).json({ message: 'Name and email are required' });
//     }
//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       return res.status(400).json({ message: 'User already exists' });
//     }
//     if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
//       return res.status(500).json({ message: 'Email service configuration is missing' });
//     }

//     const activationToken = crypto.randomBytes(20).toString('hex');
//     const hashedActivationToken = crypto.createHash('sha256').update(activationToken).digest('hex');
//     const activationTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

//     const user = await User.create({
//       name,
//       email,
//       role: role || 'staff',
//       branches: branches && Array.isArray(branches) ? branches : [],
//       phone,
//       address,
//       salary: salary ? Number(salary) : undefined,
//       requiredWorkingDays: requiredWorkingDays ? Number(requiredWorkingDays) : undefined,
//       workingDaysNames: workingDaysNames && Array.isArray(workingDaysNames) ? workingDaysNames : undefined,
//       workingHoursPerDay: workingHoursPerDay ? Number(workingHoursPerDay) : undefined,
//       workStartTime,
//       workEndTime,
//       absenceDeductionRate: absenceDeductionRate ? Number(absenceDeductionRate) : undefined,
//       activationToken: hashedActivationToken,
//       activationTokenExpires,
//     });

//     const baseUrl = process.env.NODE_ENV === 'production'
//       ? process.env.FRONTEND_URL
//       : (process.env.FRONTEND_URL || 'http://localhost:5173');

//     const activationUrl = `${baseUrl}/activate/${activationToken}`;

//     console.log('=== DEBUG ACTIVATION LINK ===');
//     console.log('NODE_ENV:', process.env.NODE_ENV);
//     console.log('FRONTEND_URL:', process.env.FRONTEND_URL);
//     console.log('Base URL:', baseUrl);
//     console.log('Activation Token (plain):', activationToken);
//     console.log('Hashed Activation Token:', hashedActivationToken);
//     console.log('Complete Activation URL:', activationUrl);
//     console.log('Stored user data:', {
//       email: user.email,
//       activationToken: user.activationToken,
//       activationTokenExpires: user.activationTokenExpires,
//     });
//     console.log('========================');

//     const emailHtml = `
//       <!DOCTYPE html>
//       <html dir="rtl" lang="ar">
//       <head>
//         <meta charset="UTF-8">
//         <meta name="viewport" content="width=device-width, initial-scale=1.0">
//         <title>تفعيل الحساب - RAN Clinic</title>
//         <style>
//           body { font-family: Arial, sans-serif; direction: rtl; background-color: #f4f4f4; margin: 0; padding: 20px; }
//           .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
//           .header { text-align: center; color: #4A90E2; margin-bottom: 30px; }
//           .content { line-height: 1.6; color: #333; }
//           .button { display: inline-block; background-color: #4A90E2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
//           .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
//           .warning { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; border-radius: 5px; margin: 20px 0; }
//           .debug { background-color: #f8f9fa; border: 1px solid #dee2e6; padding: 10px; border-radius: 5px; margin: 20px 0; font-family: monospace; font-size: 12px; }
//         </style>
//       </head>
//       <body>
//         <div class="container">
//           <div class="header">
//             <h1>مرحباً بك في RAN Clinic</h1>
//           </div>
//           <div class="content">
//             <p>عزيزي/عزيزتي ${name},</p>
//             <p>تم إنشاء حساب جديد لك في نظام RAN Clinic. لإكمال عملية التسجيل وتفعيل حسابك، يرجى النقر على الرابط أدناه لتعيين كلمة المرور الخاصة بك:</p>
            
//             <div style="text-align: center; margin: 30px 0;">
//               <a href="${activationUrl}" class="button">تفعيل الحساب وتعيين كلمة المرور</a>
//             </div>
            
//             <div class="debug">
//               <strong>معلومات التصحيح:</strong><br>
//               Base URL: ${baseUrl}<br>
//               Token: ${activationToken}<br>
//               Complete URL: ${activationUrl}<br>
//               Environment: ${process.env.NODE_ENV || 'development'}
//             </div>
            
//             <div class="warning">
//               <p><strong>تنبيه أمني مهم:</strong></p>
//               <ul>
//                 <li>هذا الرابط صالح لمدة 24 ساعة فقط من وقت إرسال هذا الإيميل</li>
//                 <li>إذا لم تطلب إنشاء هذا الحساب، يرجى تجاهل هذا الإيميل</li>
//                 <li>لا تشارك هذا الرابط مع أي شخص آخر</li>
//               </ul>
//             </div>
            
//             <p>إذا لم تتمكن من النقر على الرابط، يمكنك نسخ الرابط التالي ولصقه في المتصفح:</p>
//             <p style="word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 5px;">${activationUrl}</p>
//           </div>
          
//           <div class="footer">
//             <p>إذا لم تطلب هذا الحساب، يرجى تجاهل هذا الإيميل.</p>
//             <p>للمساعدة والدعم، يرجى التواصل مع فريق الدعم.</p>
//             <p>شكراً لك،<br>فريق RAN Clinic</p>
//           </div>
//         </div>
//       </body>
//       </html>
//     `;

//     try {
//       await transporter.sendMail({
//         from: `"RAN Clinic" <${process.env.EMAIL_USER}>`,
//         to: email,
//         subject: 'تفعيل حسابك في RAN Clinic',
//         html: emailHtml,
//         text: `مرحباً ${name}, لتفعيل حسابك في RAN Clinic، يرجى زيارة الرابط التالي: ${activationUrl}`,
//       });

//       console.log(`Activation email sent to ${email} with URL: ${activationUrl}`);
//       res.json({
//         message: 'User registered successfully. Activation email sent.',
//         user: {
//           _id: user._id,
//           name: user.name,
//           email: user.email,
//           role: user.role,
//           branches: user.branches,
//           activationUrl,
//         },
//       });
//     } catch (emailError) {
//       console.error('Email sending error:', emailError);
//       await User.findByIdAndDelete(user._id);
//       return res.status(500).json({ message: 'Failed to send activation email', error: emailError.message });
//     }
//   } catch (err) {
//     console.error('Register error:', err);
//     res.status(500).json({ message: 'Failed to register', error: err.message });
//   }
// };

// exports.resendActivation = async (req, res) => {
//   try {
//     const { userId } = req.params;
//     const user = await User.findById(userId);
//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }
//     if (user.isActive && user.passwordSet) {
//       return res.status(400).json({ message: 'Account already activated' });
//     }
//     if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
//       return res.status(500).json({ message: 'Email service configuration is missing' });
//     }

//     const activationToken = crypto.randomBytes(20).toString('hex');
//     const hashedActivationToken = crypto.createHash('sha256').update(activationToken).digest('hex');
//     const activationTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
//     user.activationToken = hashedActivationToken;
//     user.activationTokenExpires = activationTokenExpires;
//     await user.save();

//     const baseUrl = process.env.NODE_ENV === 'production'
//       ? process.env.FRONTEND_URL
//       : (process.env.FRONTEND_URL || 'http://localhost:5173');

//     const activationUrl = `${baseUrl}/activate/${activationToken}`;

//     console.log('=== DEBUG RESEND ACTIVATION LINK ===');
//     console.log('NODE_ENV:', process.env.NODE_ENV);
//     console.log('FRONTEND_URL:', process.env.FRONTEND_URL);
//     console.log('Base URL:', baseUrl);
//     console.log('Activation Token (plain):', activationToken);
//     console.log('Hashed Activation Token:', hashedActivationToken);
//     console.log('Complete Activation URL:', activationUrl);
//     console.log('Stored user data:', {
//       email: user.email,
//       activationToken: user.activationToken,
//       activationTokenExpires: user.activationTokenExpires,
//     });
//     console.log('========================');

//     const emailHtml = `
//       <!DOCTYPE html>
//       <html dir="rtl" lang="ar">
//       <head>
//         <meta charset="UTF-8">
//         <meta name="viewport" content="width=device-width, initial-scale=1.0">
//         <title>إعادة تفعيل الحساب - RAN Clinic</title>
//         <style>
//           body { font-family: Arial, sans-serif; direction: rtl; background-color: #f4f4f4; margin: 0; padding: 20px; }
//           .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
//           .header { text-align: center; color: #4A90E2; margin-bottom: 30px; }
//           .content { line-height: 1.6; color: #333; }
//           .button { display: inline-block; background-color: #4A90E2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
//           .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
//           .warning { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; border-radius: 5px; margin: 20px 0; }
//           .debug { background-color: #f8f9fa; border: 1px solid #dee2e6; padding: 10px; border-radius: 5px; margin: 20px 0; font-family: monospace; font-size: 12px; }
//         </style>
//       </head>
//       <body>
//         <div class="container">
//           <div class="header">
//             <h1>إعادة تفعيل الحساب</h1>
//           </div>
//           <div class="content">
//             <p>عزيزي/عزيزتي ${user.name},</p>
//             <p>تم إرسال رابط تفعيل جديد لحسابك. يرجى النقر على الرابط أدناه لتفعيل حسابك وتعيين كلمة المرور:</p>
//             <div style="text-align: center; margin: 30px 0;">
//               <a href="${activationUrl}" class="button">تفعيل الحساب</a>
//             </div>
//             <div class="debug">
//               <strong>معلومات التصحيح:</strong><br>
//               Base URL: ${baseUrl}<br>
//               Token: ${activationToken}<br>
//               Complete URL: ${activationUrl}<br>
//               Environment: ${process.env.NODE_ENV || 'development'}
//             </div>
//             <div class="warning">
//               <p><strong>تنبيه أمني مهم:</strong></p>
//               <ul>
//                 <li>هذا الرابط صالح لمدة 24 ساعة فقط من وقت إرسال هذا الإيميل</li>
//                 <li>إذا لم تطلب إعادة تفعيل الحساب، يرجى تجاهل هذا الإيميل</li>
//                 <li>لا تشارك هذا الرابط مع أي شخص آخر</li>
//               </ul>
//             </div>
//             <p>إذا لم تتمكن من النقر على الرابط، يمكنك نسخ الرابط التالي ولصقه في المتصفح:</p>
//             <p style="word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 5px;">${activationUrl}</p>
//           </div>
//           <div class="footer">
//             <p>إذا لم تطلب إعادة تفعيل الحساب، يرجى تجاهل هذا الإيميل.</p>
//             <p>للمساعدة والدعم، يرجى التواصل مع فريق الدعم.</p>
//             <p>شكراً لك،<br>فريق RAN Clinic</p>
//           </div>
//         </div>
//       </body>
//       </html>
//     `;

//     await transporter.sendMail({
//       from: `"RAN Clinic" <${process.env.EMAIL_USER}>`,
//       to: user.email,
//       subject: 'إعادة تفعيل حسابك في RAN Clinic',
//       html: emailHtml,
//       text: `مرحباً ${user.name}, لتفعيل حسابك في RAN Clinic، يرجى زيارة الرابط التالي: ${activationUrl}`,
//     });

//     console.log(`Resend activation email sent to ${user.email} with URL: ${activationUrl}`);
//     res.json({ message: 'New activation email sent successfully' });
//   } catch (err) {
//     console.error('Resend activation error:', err);
//     res.status(500).json({ message: 'Failed to resend activation email', error: err.message });
//   }
// };
exports.registerUser = async (req, res) => {
  try {
    const {
      name,
      email,
      role,
      branches,
      phone,
      address,
      salary,
      requiredWorkingDays,
      workingDaysNames,
      workingHoursPerDay,
      workStartTime,
      workEndTime,
      absenceDeductionRate,
    } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return res.status(500).json({ message: 'Email service configuration is missing' });
    }

    // إنشاء توكن JWT للتفعيل
    const activationToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1d' });

    const user = await User.create({
      name,
      email,
      role: role || 'staff',
      branches: branches && Array.isArray(branches) ? branches : [],
      phone,
      address,
      salary: salary ? Number(salary) : undefined,
      requiredWorkingDays: requiredWorkingDays ? Number(requiredWorkingDays) : undefined,
      workingDaysNames: workingDaysNames && Array.isArray(workingDaysNames) ? workingDaysNames : undefined,
      workingHoursPerDay: workingHoursPerDay ? Number(workingHoursPerDay) : undefined,
      workStartTime,
      workEndTime,
      absenceDeductionRate: absenceDeductionRate ? Number(absenceDeductionRate) : undefined,
      activationToken, // تخزين التوكن الأصلي (JWT)
      activationTokenExpires: Date.now() + 24 * 60 * 60 * 1000, // 24 ساعة
      isActive: false,
    });

    const baseUrl = process.env.NODE_ENV === 'production'
      ? process.env.FRONTEND_URL
      : (process.env.FRONTEND_URL || 'http://localhost:5173');

    const activationUrl = `${baseUrl}/activate/${activationToken}`;

    console.log('=== DEBUG ACTIVATION LINK ===');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('FRONTEND_URL:', process.env.FRONTEND_URL);
    console.log('Base URL:', baseUrl);
    console.log('Activation Token:', activationToken);
    console.log('Complete Activation URL:', activationUrl);
    console.log('Stored user data:', {
      email: user.email,
      activationToken: user.activationToken,
      activationTokenExpires: user.activationTokenExpires,
    });
    console.log('========================');

    const emailHtml = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>تفعيل الحساب - RAN Clinic</title>
        <style>
          body { font-family: Arial, sans-serif; direction: rtl; background-color: #f4f4f4; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { text-align: center; color: #4A90E2; margin-bottom: 30px; }
          .content { line-height: 1.6; color: #333; }
          .button { display: inline-block; background-color: #4A90E2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
          .warning { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; border-radius: 5px; margin: 20px 0; }
          .debug { background-color: #f8f9fa; border: 1px solid #dee2e6; padding: 10px; border-radius: 5px; margin: 20px 0; font-family: monospace; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>مرحباً بك في RAN Clinic</h1>
          </div>
          <div class="content">
            <p>عزيزي/عزيزتي ${name},</p>
            <p>تم إنشاء حساب جديد لك في نظام RAN Clinic. لإكمال عملية التسجيل وتفعيل حسابك، يرجى النقر على الرابط أدناه لتعيين كلمة المرور الخاصة بك:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${activationUrl}" class="button">تفعيل الحساب وتعيين كلمة المرور</a>
            </div>
            <div class="debug">
              <strong>معلومات التصحيح:</strong><br>
              Base URL: ${baseUrl}<br>
              Token: ${activationToken}<br>
              Complete URL: ${activationUrl}<br>
              Environment: ${process.env.NODE_ENV || 'development'}
            </div>
            <div class="warning">
              <p><strong>تنبيه أمني مهم:</strong></p>
              <ul>
                <li>هذا الرابط صالح لمدة 24 ساعة فقط من وقت إرسال هذا الإيميل</li>
                <li>إذا لم تطلب إنشاء هذا الحساب، يرجى تجاهل هذا الإيميل</li>
                <li>لا تشارك هذا الرابط مع أي شخص آخر</li>
              </ul>
            </div>
            <p>إذا لم تتمكن من النقر على الرابط، يمكنك نسخ الرابط التالي ولصقه في المتصفح:</p>
            <p style="word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 5px;">${activationUrl}</p>
          </div>
          <div class="footer">
            <p>إذا لم تطلب هذا الحساب، يرجى تجاهل هذا الإيميل.</p>
            <p>للمساعدة والدعم، يرجى التواصل مع فريق الدعم.</p>
            <p>شكراً لك،<br>فريق RAN Clinic</p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      await transporter.sendMail({
        from: `"RAN Clinic" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'تفعيل حسابك في RAN Clinic',
        html: emailHtml,
        text: `مرحباً ${name}, لتفعيل حسابك في RAN Clinic، يرجى زيارة الرابط التالي: ${activationUrl}`,
      });

      console.log(`Activation email sent to ${email} with URL: ${activationUrl}`);
      res.json({
        message: 'User registered successfully. Activation email sent.',
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          branches: user.branches,
          activationUrl,
        },
      });
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      await User.findByIdAndDelete(user._id);
      return res.status(500).json({ message: 'Failed to send activation email', error: emailError.message });
    }
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Failed to register', error: err.message });
  }
};

exports.resendActivation = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (user.isActive && user.passwordSet) {
      return res.status(400).json({ message: 'Account already activated' });
    }
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return res.status(500).json({ message: 'Email service configuration is missing' });
    }

    // إنشاء توكن JWT جديد
    const activationToken = jwt.sign({ email: user.email }, process.env.JWT_SECRET, { expiresIn: '1d' });
    user.activationToken = activationToken;
    user.activationTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 ساعة
    await user.save();

    const baseUrl = process.env.NODE_ENV === 'production'
      ? process.env.FRONTEND_URL
      : (process.env.FRONTEND_URL || 'http://localhost:5173');

    const activationUrl = `${baseUrl}/activate/${activationToken}`;

    console.log('=== DEBUG RESEND ACTIVATION LINK ===');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('FRONTEND_URL:', process.env.FRONTEND_URL);
    console.log('Base URL:', baseUrl);
    console.log('Activation Token:', activationToken);
    console.log('Complete Activation URL:', activationUrl);
    console.log('Stored user data:', {
      email: user.email,
      activationToken: user.activationToken,
      activationTokenExpires: user.activationTokenExpires,
    });
    console.log('========================');

    const emailHtml = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>إعادة تفعيل الحساب - RAN Clinic</title>
        <style>
          body { font-family: Arial, sans-serif; direction: rtl; background-color: #f4f4f4; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { text-align: center; color: #4A90E2; margin-bottom: 30px; }
          .content { line-height: 1.6; color: #333; }
          .button { display: inline-block; background-color: #4A90E2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
          .warning { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; border-radius: 5px; margin: 20px 0; }
          .debug { background-color: #f8f9fa; border: 1px solid #dee2e6; padding: 10px; border-radius: 5px; margin: 20px 0; font-family: monospace; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>إعادة تفعيل الحساب</h1>
          </div>
          <div class="content">
            <p>عزيزي/عزيزتي ${user.name},</p>
            <p>تم إرسال رابط تفعيل جديد لحسابك. يرجى النقر على الرابط أدناه لتفعيل حسابك وتعيين كلمة المرور:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${activationUrl}" class="button">تفعيل الحساب</a>
            </div>
           
            <div class="warning">
              <p><strong>تنبيه أمني مهم:</strong></p>
              <ul>
                <li>هذا الرابط صالح لمدة 24 ساعة فقط من وقت إرسال هذا الإيميل</li>
                <li>إذا لم تطلب إعادة تفعيل الحساب، يرجى تجاهل هذا الإيميل</li>
                <li>لا تشارك هذا الرابط مع أي شخص آخر</li>
              </ul>
            </div>
            <p>إذا لم تتمكن من النقر على الرابط، يمكنك نسخ الرابط التالي ولصقه في المتصفح:</p>
            <p style="word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 5px;">${activationUrl}</p>
          </div>
          <div class="footer">
            <p>إذا لم تطلب إعادة تفعيل الحساب، يرجى تجاهل هذا الإيميل.</p>
            <p>للمساعدة والدعم، يرجى التواصل مع فريق الدعم.</p>
            <p>شكراً لك،<br>فريق RAN Clinic</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: `"RAN Clinic" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: 'إعادة تفعيل حسابك في RAN Clinic',
      html: emailHtml,
      text: `مرحباً ${user.name}, لتفعيل حسابك في RAN Clinic، يرجى زيارة الرابط التالي: ${activationUrl}`,
    });

    console.log(`Resend activation email sent to ${user.email} with URL: ${activationUrl}`);
    res.json({ message: 'New activation email sent successfully' });
  } catch (err) {
    console.error('Resend activation error:', err);
    res.status(500).json({ message: 'Failed to resend activation email', error: err.message });
  }
};
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).populate('branches');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      branches: user.branches,
      feedback: user.feedback,
    });
  } catch (err) {
    console.error('Profile error:', err);
    res.status(500).json({ message: 'Failed to fetch profile', error: err.message });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    const user = await User.findOne({ email });
    if (!user) {
      await Log.create({
        userId: null,
        action: 'forgotPassword',
        status: 'failed',
        reason: 'User not found',
        ip: req.ip,
      });
      return res.status(404).json({ message: 'User not found' });
    }
    const resetToken = crypto.randomBytes(20).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save();

    console.log('Stored user data:', {
      email: user.email,
      resetPasswordToken: user.resetPasswordToken,
      resetPasswordExpires: user.resetPasswordExpires,
      isActive: user.isActive,
      passwordSet: user.passwordSet,
    });

    const baseUrl = process.env.NODE_ENV === 'production'
      ? process.env.FRONTEND_URL
      : (process.env.FRONTEND_URL || 'http://localhost:5173');

    const resetUrl = `${baseUrl}/reset-password/${resetToken}`;

    console.log('=== DEBUG EMAIL LINK ===');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('FRONTEND_URL:', process.env.FRONTEND_URL);
    console.log('Base URL:', baseUrl);
    console.log('Reset Token (plain):', resetToken);
    console.log('Hashed Token:', hashedToken);
    console.log('Complete Reset URL:', resetUrl);
    console.log('========================');

    const emailHtml = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>إعادة تعيين كلمة المرور - RAN Clinic</title>
        <style>
          body { font-family: Arial, sans-serif; direction: rtl; background-color: #f4f4f4; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { text-align: center; color: #4A90E2; margin-bottom: 30px; }
          .content { line-height: 1.6; color: #333; }
          .button { display: inline-block; background-color: #4A90E2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
          .warning { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; border-radius: 5px; margin: 20px 0; }
          .debug { background-color: #f8f9fa; border: 1px solid #dee2e6; padding: 10px; border-radius: 5px; margin: 20px 0; font-family: monospace; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>إعادة تعيين كلمة المرور</h1>
          </div>
          <div class="content">
            <p>عزيزي/عزيزتي ${user.name},</p>
            <p>تم طلب إعادة تعيين كلمة المرور لحسابك في نظام RAN Clinic. إذا كنت قد طلبت هذا، يرجى النقر على الرابط أدناه لتعيين كلمة مرور جديدة:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" class="button">إعادة تعيين كلمة المرور</a>
            </div>
            
            <div class="debug">
              <strong>معلومات التصحيح:</strong><br>
              Base URL: ${baseUrl}<br>
              Token: ${resetToken}<br>
              Complete URL: ${resetUrl}<br>
              Environment: ${process.env.NODE_ENV || 'development'}
            </div>
            
            <div class="warning">
              <p><strong>تنبيه أمني مهم:</strong></p>
              <ul>
                <li>هذا الرابط صالح لمدة ساعة واحدة فقط من وقت إرسال هذا الإيميل</li>
                <li>إذا لم تطلب إعادة تعيين كلمة المرور، يرجى تجاهل هذا الإيميل</li>
                <li>لا تشارك هذا الرابط مع أي شخص آخر</li>
              </ul>
            </div>
            
            <p>إذا لم تتمكن من النقر على الرابط، يمكنك نسخ الرابط التالي ولصقه في المتصفح:</p>
            <p style="word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 5px;">${resetUrl}</p>
          </div>
          
          <div class="footer">
            <p>إذا لم تطلب إعادة تعيين كلمة المرور، يرجى تجاهل هذا الإيميل وستبقى كلمة المرور الحالية كما هي.</p>
            <p>للمساعدة والدعم، يرجى التواصل مع فريق الدعم.</p>
            <p>شكراً لك،<br>فريق RAN Clinic</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: `"RAN Clinic" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: 'إعادة تعيين كلمة المرور - RAN Clinic',
      html: emailHtml,
      text: `عزيزي ${user.name}, لإعادة تعيين كلمة المرور الخاصة بك في RAN Clinic، يرجى زيارة الرابط التالي: ${resetUrl}. هذا الرابط صالح لمدة ساعة واحدة فقط.`,
    });

    await Log.create({
      userId: user._id,
      action: 'forgotPassword',
      status: 'success',
      ip: req.ip,
    });

    console.log(`Password reset email sent to ${user.email} with URL: ${resetUrl}`);

    res.json({
      message: 'Password reset email sent',
      debugInfo: {
        resetUrl,
        token: resetToken,
        baseUrl,
      },
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    await Log.create({
      userId: null,
      action: 'forgotPassword',
      status: 'error',
      reason: err.message,
      ip: req.ip,
    });
    res.status(500).json({ message: 'Failed to send reset email', error: err.message });
  }
};

exports.verifyResetToken = async (req, res) => {
  try {
    const { token } = req.params;
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    console.log('Verifying token:', { plainToken: token, hashedToken });

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      console.log('No user found for hashed token:', hashedToken);
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    console.log('Token verified successfully for user:', user.email);
    res.json({
      message: 'Token is valid',
      user: {
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    console.error('Verify reset token error:', err);
    res.status(500).json({ message: 'Failed to verify token', error: err.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ message: 'Token and password are required' });
    }
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    console.log('Resetting password with token:', { plainToken: token, hashedToken });

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });
    if (!user) {
      console.log('No user found for hashed token:', hashedToken);
      await Log.create({
        userId: null,
        action: 'resetPassword',
        status: 'failed',
        reason: 'Invalid or expired token',
        ip: req.ip,
      });
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    user.password = password; // Will be hashed by pre-save hook
    user.isActive = true;
    user.passwordSet = true;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    console.log('Password reset successfully for user:', user.email, {
      isActive: user.isActive,
      passwordSet: user.passwordSet,
      hasPassword: !!user.password,
    });

    await Log.create({
      userId: user._id,
      action: 'resetPassword',
      status: 'success',
      ip: req.ip,
    });

    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    console.error('Reset password error:', err);
    await Log.create({
      userId: null,
      action: 'resetPassword',
      status: 'error',
      reason: err.message,
      ip: req.ip,
    });
    res.status(500).json({ message: 'Failed to reset password', error: err.message });
  }
};