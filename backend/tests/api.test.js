const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const http = require('http');
const mongoose = require('mongoose');

// Start test suite using native Node.js and the Express app
const app = require('../server');

let server;
let port;
let adminToken = '';
let studentToken = '';
let createdStudentDbId = '';
let createdRoomDbId = '';
let createdFeeDbId = '';
let createdComplaintDbId = '';
let createdVisitorDbId = '';
let createdNoticeDbId = '';

const request = (method, path, body = null, token = null) => {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : '';
    const options = {
      hostname: '127.0.0.1',
      port: port,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    };

    const req = http.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => {
        responseBody += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseBody);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: responseBody });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data) {
      req.write(data);
    }
    req.end();
  });
};

const runTests = async () => {
  console.log('\n=============================================');
  console.log(' RUNNING COMPREHENSIVE BACKEND API TESTS');
  console.log('=============================================\n');

  // Let server start
  await new Promise((r) => setTimeout(r, 1000));
  port = process.env.PORT || 5000;

  let passed = 0;
  let failed = 0;

  const test = async (name, fn) => {
    try {
      await fn();
      console.log(`  [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  [FAIL] ${name}`);
      console.error(`         -> ${err.message}`);
      failed++;
    }
  };

  try {
    // 1. Health check
    await test('GET /api/health returns 200', async () => {
      const res = await request('GET', '/api/health');
      if (res.status !== 200 || !res.body.success) {
        throw new Error(`Expected 200, got ${res.status}`);
      }
    });

    // 2. Admin Login
    await test('POST /api/auth/login as Admin', async () => {
      const res = await request('POST', '/api/auth/login', {
        email: 'admin@hostel.com',
        password: 'Admin@123'
      });
      if (res.status !== 200 || !res.body.data.token) {
        throw new Error(`Login failed: ${JSON.stringify(res.body)}`);
      }
      adminToken = res.body.data.token;
    });

    // 3. Student Login
    await test('POST /api/auth/login as Student (Aarav Patel)', async () => {
      const res = await request('POST', '/api/auth/login', {
        email: 'aarav@hostel.com',
        password: 'Student@123'
      });
      if (res.status !== 200 || !res.body.data.token) {
        throw new Error(`Student login failed: ${JSON.stringify(res.body)}`);
      }
      studentToken = res.body.data.token;
    });

    // 4. GET /api/auth/me for Student
    await test('GET /api/auth/me returns authenticated student profile', async () => {
      const res = await request('GET', '/api/auth/me', null, studentToken);
      if (res.status !== 200 || res.body.data.user.role !== 'student') {
        throw new Error(`Unexpected user profile: ${JSON.stringify(res.body)}`);
      }
    });

    // 5. GET /api/students (Admin only)
    await test('GET /api/students returns student list for Admin', async () => {
      const res = await request('GET', '/api/students?page=1&limit=10', null, adminToken);
      if (res.status !== 200 || !Array.isArray(res.body.data) || res.body.data.length === 0) {
        throw new Error(`Failed to list students: ${JSON.stringify(res.body)}`);
      }
    });

    // 6. Access Control: Student should NOT access /api/students list
    await test('GET /api/students blocked for Student (403 Forbidden)', async () => {
      const res = await request('GET', '/api/students', null, studentToken);
      if (res.status !== 403) {
        throw new Error(`Expected 403 Forbidden, got ${res.status}`);
      }
    });

    // 7. Create Room
    await test('POST /api/rooms creates a new room', async () => {
      const res = await request(
        'POST',
        '/api/rooms',
        {
          roomNumber: 'T-999',
          block: 'T',
          floor: 9,
          capacity: 2,
          roomType: 'Double',
          gender: 'Boys'
        },
        adminToken
      );
      if (res.status !== 201 || !res.body.data._id) {
        throw new Error(`Failed to create room: ${JSON.stringify(res.body)}`);
      }
      createdRoomDbId = res.body.data._id;
    });

    // 8. Create Student
    await test('POST /api/students registers a new student with room allocation', async () => {
      const res = await request(
        'POST',
        '/api/students',
        {
          studentId: 'TST-2026-999',
          name: 'Vikramaditya Test',
          email: 'vikram.test@hostel.com',
          phone: '+91 9999988888',
          gender: 'Male',
          course: 'B.Tech',
          branch: 'CSE',
          year: '1st Year',
          room: createdRoomDbId
        },
        adminToken
      );
      if (res.status !== 201 || !res.body.data._id) {
        throw new Error(`Failed to create student: ${JSON.stringify(res.body)}`);
      }
      createdStudentDbId = res.body.data._id;
    });

    // 9. Verify Room Occupancy updated
    await test('GET /api/rooms/:id reflects updated occupancy', async () => {
      const res = await request('GET', `/api/rooms/${createdRoomDbId}`, null, adminToken);
      if (res.status !== 200 || res.body.data.occupiedBeds !== 1) {
        throw new Error(`Occupancy did not update properly: ${JSON.stringify(res.body)}`);
      }
    });

    // 10. Create Fee Record
    await test('POST /api/fees creates fee invoice with auto status', async () => {
      const res = await request(
        'POST',
        '/api/fees',
        {
          studentId: createdStudentDbId,
          amount: 25000,
          dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
          paidAmount: 10000,
          paymentMethod: 'UPI',
          transactionId: 'UPI-TEST-123'
        },
        adminToken
      );
      if (res.status !== 201 || res.body.data.status !== 'Partially Paid') {
        throw new Error(`Fee creation failed: ${JSON.stringify(res.body)}`);
      }
      createdFeeDbId = res.body.data._id;
    });

    // 11. Create Complaint as Student
    await test('POST /api/complaints submits grievance', async () => {
      const res = await request(
        'POST',
        '/api/complaints',
        {
          title: 'Air conditioning water leak',
          description: 'Water dripping from AC duct in study room',
          category: 'Room',
          priority: 'High'
        },
        studentToken
      );
      if (res.status !== 201 || res.body.data.status !== 'Pending') {
        throw new Error(`Complaint submission failed: ${JSON.stringify(res.body)}`);
      }
      createdComplaintDbId = res.body.data._id;
    });

    // 12. Admin Resolves Complaint
    await test('PUT /api/complaints/:id allows Admin to add response and resolve', async () => {
      const res = await request(
        'PUT',
        `/api/complaints/${createdComplaintDbId}`,
        {
          status: 'Resolved',
          adminResponse: 'Duct pipe sealed by HVAC technician'
        },
        adminToken
      );
      if (res.status !== 200 || res.body.data.status !== 'Resolved') {
        throw new Error(`Complaint update failed: ${JSON.stringify(res.body)}`);
      }
    });

    // 13. Create Visitor Request
    await test('POST /api/visitors creates visitor pass request', async () => {
      const res = await request(
        'POST',
        '/api/visitors',
        {
          visitorName: 'Rajesh Test',
          relation: 'Brother',
          phone: '+91 9123456789',
          visitDate: new Date().toISOString(),
          inTime: '10:00 AM',
          outTime: '12:00 PM',
          purpose: 'Study materials exchange'
        },
        studentToken
      );
      if (res.status !== 201 || !res.body.data._id) {
        throw new Error(`Visitor request failed: ${JSON.stringify(res.body)}`);
      }
      createdVisitorDbId = res.body.data._id;
    });

    // 14. Admin Approves Visitor Pass
    await test('PUT /api/visitors/:id allows Admin to approve request', async () => {
      const res = await request(
        'PUT',
        `/api/visitors/${createdVisitorDbId}`,
        {
          status: 'Approved'
        },
        adminToken
      );
      if (res.status !== 200 || res.body.data.status !== 'Approved') {
        throw new Error(`Visitor approval failed: ${JSON.stringify(res.body)}`);
      }
    });

    // 15. Create Notice
    await test('POST /api/notices broadcasts new announcement', async () => {
      const res = await request(
        'POST',
        '/api/notices',
        {
          title: 'Special Campus Guest Lecture',
          description: 'AI & Robotics workshop this Friday at Main Auditorium',
          category: 'Event',
          priority: 'Medium',
          expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        },
        adminToken
      );
      if (res.status !== 201 || !res.body.data._id) {
        throw new Error(`Notice broadcast failed: ${JSON.stringify(res.body)}`);
      }
      createdNoticeDbId = res.body.data._id;
    });

    // 16. Dashboard Aggregation Statistics
    await test('GET /api/reports/dashboard-stats returns live MongoDB metrics', async () => {
      const res = await request('GET', '/api/reports/dashboard-stats', null, adminToken);
      if (
        res.status !== 200 ||
        res.body.data.cards.totalStudents === undefined ||
        res.body.data.cards.totalRooms === undefined
      ) {
        throw new Error(`Dashboard stats invalid: ${JSON.stringify(res.body)}`);
      }
    });

    // 17. Cleanup Test Records
    await test('DELETE test records clean up', async () => {
      await request('DELETE', `/api/students/${createdStudentDbId}`, null, adminToken);
      await request('DELETE', `/api/rooms/${createdRoomDbId}`, null, adminToken);
      await request('DELETE', `/api/fees/${createdFeeDbId}`, null, adminToken);
      await request('DELETE', `/api/complaints/${createdComplaintDbId}`, null, adminToken);
      await request('DELETE', `/api/visitors/${createdVisitorDbId}`, null, adminToken);
      await request('DELETE', `/api/notices/${createdNoticeDbId}`, null, adminToken);
    });

    console.log('\n=============================================');
    console.log(` ALL API TESTS FINISHED: ${passed} PASSED, ${failed} FAILED`);
    console.log('=============================================\n');

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Fatal Test Suite Error:', err);
    process.exit(1);
  }
};

runTests();
