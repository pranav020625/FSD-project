const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

const seedAdmin = async () => {
  try {
    const connStr = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hostel_management_system';
    console.log(`[Seed] Connecting to MongoDB: ${connStr}`);
    await mongoose.connect(connStr, { serverSelectionTimeoutMS: 5000 });
    console.log('[Seed] Connected to MongoDB');

    const adminEmail = 'admin@hostel.com';
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log(`[Seed] Admin user '${adminEmail}' already exists.`);
    } else {
      await User.create({
        name: 'Chief Hostel Warden',
        email: adminEmail,
        password: 'Admin@123',
        phone: '+91 98765 43210',
        role: 'admin',
        gender: 'Male'
      });
      console.log(`[Seed] Admin user '${adminEmail}' created successfully! (Password: Admin@123)`);
      console.log('NOTE: This password is for local development/demo only and should be changed in production.');
    }

    await mongoose.disconnect();
    console.log('[Seed] Database disconnected');
    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]:', error);
    process.exit(1);
  }
};

seedAdmin();
