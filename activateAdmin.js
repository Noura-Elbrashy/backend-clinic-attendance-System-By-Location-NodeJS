const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User'); // تأكدي من تعديل المسار حسب هيكل المشروع
require('dotenv').config();

async function activateAdmin() {
  try {
    // الاتصال بقاعدة البيانات
    const dbUri = process.env.MONGO_URI || 'mongodb+srv://nouraelbrashy:xXpBI2pxXtiZlFuL@cluster0.nrd5kfu.mongodb.net/clinicApp?retryWrites=true&w=majority&appName=Cluster0';
    await mongoose.connect(dbUri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB:', dbUri);

    // التحقق من وجود الأدمن
    const adminEmail = 'noura.elbrashy@gmail.com';
    const user = await User.findOne({ email: adminEmail });
    if (!user) {
      console.log('Admin not found. Please create an admin account manually.');
      return;
    }

    // تحديث الحساب
    const newPassword = '123456'; // غيّري كلمة المرور لو عايزة
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.isActive = true;
    user.activationToken = null;
    user.password = hashedPassword;
    await user.save();

    console.log('Admin account activated successfully');
    console.log('Email:', adminEmail);
    console.log('Password:', newPassword);
  } catch (err) {
    console.error('Error activating admin:', err);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

activateAdmin();