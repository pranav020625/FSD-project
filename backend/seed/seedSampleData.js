const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const mongoose = require('mongoose');

const User = require('../models/User');
const Student = require('../models/Student');
const Room = require('../models/Room');
const Fee = require('../models/Fee');
const Complaint = require('../models/Complaint');
const Visitor = require('../models/Visitor');
const Notice = require('../models/Notice');

const seedSampleData = async () => {
  try {
    const connStr = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hostel_management_system';
    console.log(`[Seed] Connecting to MongoDB: ${connStr}`);
    await mongoose.connect(connStr, { serverSelectionTimeoutMS: 5000 });
    console.log('[Seed] Connected to MongoDB successfully!');

    // Clear existing collections
    console.log('[Seed] Clearing existing collections...');
    await User.deleteMany({});
    await Student.deleteMany({});
    await Room.deleteMany({});
    await Fee.deleteMany({});
    await Complaint.deleteMany({});
    await Visitor.deleteMany({});
    await Notice.deleteMany({});

    // 1. Create Admin
    const admin = await User.create({
      name: 'Dr. Rajesh Sharma (Chief Warden)',
      email: 'admin@hostel.com',
      password: 'Admin@123',
      phone: '+91 9876543210',
      role: 'admin',
      gender: 'Male'
    });
    console.log('[Seed] Created Admin (admin@hostel.com / Admin@123)');

    // 2. Create Rooms
    const roomsData = [
      { roomNumber: 'A-101', block: 'A', floor: 1, capacity: 2, roomType: 'Double', gender: 'Boys' },
      { roomNumber: 'A-102', block: 'A', floor: 1, capacity: 2, roomType: 'Double', gender: 'Boys' },
      { roomNumber: 'A-201', block: 'A', floor: 2, capacity: 3, roomType: 'Triple', gender: 'Boys' },
      { roomNumber: 'A-202', block: 'A', floor: 2, capacity: 4, roomType: 'Four-Bed', gender: 'Boys' },
      { roomNumber: 'B-101', block: 'B', floor: 1, capacity: 2, roomType: 'Double', gender: 'Girls' },
      { roomNumber: 'B-102', block: 'B', floor: 1, capacity: 1, roomType: 'Single', gender: 'Girls' },
      { roomNumber: 'B-201', block: 'B', floor: 2, capacity: 3, roomType: 'Triple', gender: 'Girls' },
      { roomNumber: 'C-101', block: 'C', floor: 1, capacity: 2, roomType: 'Double', gender: 'Boys', status: 'Maintenance' }
    ];

    const createdRooms = [];
    for (const r of roomsData) {
      const room = new Room(r);
      room.updateOccupancy();
      await room.save();
      createdRooms.push(room);
    }
    console.log(`[Seed] Created ${createdRooms.length} Rooms`);

    // 3. Create Students & Student User Accounts
    const studentsData = [
      {
        studentId: 'HST-2024-001',
        name: 'Aarav Patel',
        email: 'aarav@hostel.com',
        phone: '+91 9811223344',
        gender: 'Male',
        dateOfBirth: new Date('2003-05-14'),
        course: 'B.Tech',
        branch: 'Computer Science & Engg',
        year: '3rd Year',
        address: '42 MG Road, Ahmedabad, Gujarat',
        parentName: 'Sanjay Patel',
        parentPhone: '+91 9811223300',
        roomIndex: 0 // A-101
      },
      {
        studentId: 'HST-2024-002',
        name: 'Rohan Verma',
        email: 'rohan@hostel.com',
        phone: '+91 9822334455',
        gender: 'Male',
        dateOfBirth: new Date('2003-08-20'),
        course: 'B.Tech',
        branch: 'Information Technology',
        year: '3rd Year',
        address: '15 Civil Lines, Jaipur, Rajasthan',
        parentName: 'Mahesh Verma',
        parentPhone: '+91 9822334400',
        roomIndex: 0 // A-101 (Roommate with Aarav)
      },
      {
        studentId: 'HST-2024-003',
        name: 'Ananya Sharma',
        email: 'ananya@hostel.com',
        phone: '+91 9833445566',
        gender: 'Female',
        dateOfBirth: new Date('2004-02-11'),
        course: 'B.Tech',
        branch: 'Electronics & Comm Engg',
        year: '2nd Year',
        address: '77 Sector 18, Noida, Uttar Pradesh',
        parentName: 'Sunil Sharma',
        parentPhone: '+91 9833445500',
        roomIndex: 4 // B-101
      },
      {
        studentId: 'HST-2024-004',
        name: 'Priya Iyer',
        email: 'priya@hostel.com',
        phone: '+91 9844556677',
        gender: 'Female',
        dateOfBirth: new Date('2002-11-28'),
        course: 'M.Tech',
        branch: 'Data Science',
        year: '1st Year',
        address: '102 Indiranagar, Bengaluru, Karnataka',
        parentName: 'Venkatesh Iyer',
        parentPhone: '+91 9844556600',
        roomIndex: 5 // B-102 (Single)
      },
      {
        studentId: 'HST-2024-005',
        name: 'Kabir Mehta',
        email: 'kabir@hostel.com',
        phone: '+91 9855667788',
        gender: 'Male',
        dateOfBirth: new Date('2005-01-19'),
        course: 'B.Tech',
        branch: 'Mechanical Engg',
        year: '1st Year',
        address: '88 Model Town, Ludhiana, Punjab',
        parentName: 'Harjit Mehta',
        parentPhone: '+91 9855667700',
        roomIndex: 2 // A-201
      }
    ];

    const createdStudents = [];
    for (const s of studentsData) {
      const targetRoom = createdRooms[s.roomIndex];
      const student = await Student.create({
        studentId: s.studentId,
        name: s.name,
        email: s.email,
        phone: s.phone,
        gender: s.gender,
        dateOfBirth: s.dateOfBirth,
        course: s.course,
        branch: s.branch,
        year: s.year,
        address: s.address,
        parentName: s.parentName,
        parentPhone: s.parentPhone,
        room: targetRoom ? targetRoom._id : null,
        status: 'Active'
      });

      if (targetRoom) {
        targetRoom.students.push(student._id);
        targetRoom.updateOccupancy();
        await targetRoom.save();
      }

      // Create User account for student
      await User.create({
        name: s.name,
        email: s.email,
        password: 'Student@123',
        phone: s.phone,
        role: 'student',
        studentId: s.studentId,
        gender: s.gender,
        course: s.course,
        year: s.year
      });

      createdStudents.push(student);
    }
    console.log(`[Seed] Created ${createdStudents.length} Students & Logins (Password: Student@123)`);

    // 4. Create Fee Records
    const feesData = [
      {
        student: createdStudents[0]._id,
        amount: 35000,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        paidAmount: 35000,
        paymentDate: new Date(),
        paymentMethod: 'UPI',
        status: 'Paid',
        transactionId: 'UPI-AXIS-992817263',
        description: 'Semester 5 Hostel Accommodation & Mess Fee'
      },
      {
        student: createdStudents[1]._id,
        amount: 35000,
        dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        paidAmount: 20000,
        paymentDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        paymentMethod: 'Bank Transfer',
        status: 'Partially Paid',
        transactionId: 'NEFT-HDFC-8827162',
        description: 'Semester 5 Hostel Fee (Remaining: ₹15,000)'
      },
      {
        student: createdStudents[2]._id,
        amount: 38000,
        dueDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
        paidAmount: 0,
        status: 'Pending',
        paymentMethod: 'UPI',
        description: 'Semester 3 Girls Hostel Block B Fee'
      },
      {
        student: createdStudents[3]._id,
        amount: 45000,
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        paidAmount: 45000,
        paymentDate: new Date(),
        paymentMethod: 'Credit/Debit Card',
        status: 'Paid',
        transactionId: 'CARD-ICICI-7726152',
        description: 'Single Room Premium Accommodation Fee'
      },
      {
        student: createdStudents[4]._id,
        amount: 32000,
        dueDate: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
        paidAmount: 0,
        status: 'Overdue',
        paymentMethod: 'Cash',
        description: 'Semester 1 Boys Hostel Fee (Overdue)'
      }
    ];

    for (const f of feesData) {
      await Fee.create(f);
    }
    console.log(`[Seed] Created ${feesData.length} Fee records`);

    // 5. Create Complaints
    const complaintsData = [
      {
        student: createdStudents[0]._id,
        title: 'WiFi router not connecting in Room A-101',
        description: 'The high-speed router in Block A 1st floor has been dropping connection frequently since yesterday evening.',
        category: 'Internet',
        priority: 'High',
        status: 'In Progress',
        adminResponse: 'Network team has been notified. Technician visiting at 4 PM.'
      },
      {
        student: createdStudents[1]._id,
        title: 'Ceiling Fan making squeaking noise',
        description: 'The second ceiling fan in room A-101 makes a high pitched sound on speeds 3 and 4.',
        category: 'Electricity',
        priority: 'Medium',
        status: 'Resolved',
        adminResponse: 'Electrician lubricated motor bearing and replaced capacitor.',
        resolvedAt: new Date()
      },
      {
        student: createdStudents[2]._id,
        title: 'Geyser water pressure is low in Block B 1st floor bathroom',
        description: 'Hot water output in the shared shower is very thin during morning hours.',
        category: 'Water',
        priority: 'High',
        status: 'Pending'
      },
      {
        student: createdStudents[3]._id,
        title: 'Mess food quality feedback regarding dinner menu',
        description: 'Requested more fresh salad options and timely roti serving during peak dinner rush.',
        category: 'Food',
        priority: 'Low',
        status: 'Pending'
      }
    ];

    for (const c of complaintsData) {
      await Complaint.create(c);
    }
    console.log(`[Seed] Created ${complaintsData.length} Complaints`);

    // 6. Create Visitors
    const visitorsData = [
      {
        student: createdStudents[0]._id,
        visitorName: 'Sanjay Patel',
        relation: 'Father',
        phone: '+91 9811223300',
        visitDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        inTime: '10:00 AM',
        outTime: '01:00 PM',
        purpose: 'Delivering home essentials and semester textbooks',
        status: 'Approved',
        approvedBy: admin._id
      },
      {
        student: createdStudents[2]._id,
        visitorName: 'Rekha Sharma',
        relation: 'Mother',
        phone: '+91 9833445501',
        visitDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        inTime: '02:00 PM',
        outTime: '05:00 PM',
        purpose: 'Family visit during weekend',
        status: 'Pending'
      },
      {
        student: createdStudents[4]._id,
        visitorName: 'Deepak Sharma',
        relation: 'Cousin',
        phone: '+91 9855667799',
        visitDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        inTime: '11:30 AM',
        outTime: '02:15 PM',
        purpose: 'Delivering project materials',
        status: 'Completed',
        approvedBy: admin._id
      }
    ];

    for (const v of visitorsData) {
      await Visitor.create(v);
    }
    console.log(`[Seed] Created ${visitorsData.length} Visitor passes`);

    // 7. Create Notices
    const noticesData = [
      {
        title: 'Hostel Annual Sports & Cultural Meet 2026',
        description: 'All hostel residents are invited to register for inter-block Cricket, Badminton, Table Tennis, and Chess tournaments starting next Saturday. Register at the warden office before Thursday.',
        category: 'Event',
        priority: 'Medium',
        createdBy: admin._id,
        publishDate: new Date(),
        expiryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
      },
      {
        title: 'Scheduled Water Tank Maintenance & Cleaning',
        description: 'Overhead water tanks in Block A and Block B will undergo scheduled chlorination and cleaning this Sunday from 08:00 AM to 12:00 PM. Please store required water in advance.',
        category: 'Maintenance',
        priority: 'High',
        createdBy: admin._id,
        publishDate: new Date(),
        expiryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
      },
      {
        title: 'Hostel Gate Timing & Night Outpass Rules Reminder',
        description: 'Main campus hostel gates close strictly at 10:00 PM. Any resident requiring late entry for academic lab work or emergency must obtain prior written approval from the Resident Warden.',
        category: 'Rules',
        priority: 'Urgent',
        createdBy: admin._id,
        publishDate: new Date(),
        expiryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
      },
      {
        title: 'Revised Summer Mess Timings Announcement',
        description: 'Breakfast: 07:30 AM - 09:30 AM | Lunch: 12:30 PM - 02:30 PM | Evening Snacks: 05:00 PM - 06:15 PM | Dinner: 07:45 PM - 09:45 PM.',
        category: 'Mess',
        priority: 'Low',
        createdBy: admin._id,
        publishDate: new Date(),
        expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
      }
    ];

    for (const n of noticesData) {
      await Notice.create(n);
    }
    console.log(`[Seed] Created ${noticesData.length} Notices`);

    console.log('\n==========================================');
    console.log(' SEEDING COMPLETE! Sample Accounts:');
    console.log(' Admin: admin@hostel.com / Admin@123');
    console.log(' Student 1: aarav@hostel.com / Student@123 (Room A-101)');
    console.log(' Student 2: rohan@hostel.com / Student@123 (Room A-101)');
    console.log(' Student 3: ananya@hostel.com / Student@123 (Room B-101)');
    console.log('==========================================\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]:', error);
    process.exit(1);
  }
};

seedSampleData();
