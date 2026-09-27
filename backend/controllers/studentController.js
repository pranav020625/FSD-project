const Student = require('../models/Student');
const Room = require('../models/Room');
const User = require('../models/User');
const Fee = require('../models/Fee');
const Complaint = require('../models/Complaint');
const Visitor = require('../models/Visitor');

// @desc    Get all students with search, filter, pagination
// @route   GET /api/students
// @access  Private (Admin)
const getStudents = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    const query = {};

    // Search by name, studentId, email, phone
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [
        { name: searchRegex },
        { studentId: searchRegex },
        { email: searchRegex },
        { phone: searchRegex }
      ];
    }

    // Filter by year
    if (req.query.year && req.query.year !== 'All') {
      query.year = req.query.year;
    }

    // Filter by branch
    if (req.query.branch && req.query.branch !== 'All') {
      query.branch = req.query.branch;
    }

    // Filter by status
    if (req.query.status && req.query.status !== 'All') {
      query.status = req.query.status;
    }

    // Filter by gender
    if (req.query.gender && req.query.gender !== 'All') {
      query.gender = req.query.gender;
    }

    // Filter by room
    if (req.query.room) {
      query.room = req.query.room;
    }

    const total = await Student.countDocuments(query);
    const students = await Student.find(query)
      .populate('room', 'roomNumber block floor capacity occupiedBeds status')
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: students.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: students
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single student by ID
// @route   GET /api/students/:id
// @access  Private
const getStudentById = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id).populate('room');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: `Student not found with ID ${req.params.id}`
      });
    }

    // Fetch related fees, complaints, visitor passes
    const fees = await Fee.find({ student: student._id }).sort({ dueDate: -1 });
    const complaints = await Complaint.find({ student: student._id }).sort({ createdAt: -1 });
    const visitors = await Visitor.find({ student: student._id }).sort({ visitDate: -1 });

    res.status(200).json({
      success: true,
      data: {
        ...student.toObject(),
        fees,
        complaints,
        visitors
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new student
// @route   POST /api/students
// @access  Private (Admin)
const createStudent = async (req, res, next) => {
  try {
    const {
      studentId,
      name,
      email,
      phone,
      gender,
      dateOfBirth,
      course,
      branch,
      year,
      address,
      parentName,
      parentPhone,
      room,
      status,
      password
    } = req.body;

    // Check if studentId or email already exists
    const existingId = await Student.findOne({ studentId: studentId.toUpperCase() });
    if (existingId) {
      return res.status(409).json({
        success: false,
        message: `Student with ID '${studentId.toUpperCase()}' already exists`
      });
    }

    const existingEmail = await Student.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: `Student with email '${email.toLowerCase()}' already exists`
      });
    }

    // If room is assigned, verify room capacity
    let assignedRoom = null;
    if (room) {
      assignedRoom = await Room.findById(room);
      if (!assignedRoom) {
        return res.status(404).json({
          success: false,
          message: 'Selected room does not exist'
        });
      }
      if (assignedRoom.occupiedBeds >= assignedRoom.capacity) {
        return res.status(400).json({
          success: false,
          message: `Room ${assignedRoom.roomNumber} is full. Capacity is ${assignedRoom.capacity}.`
        });
      }
    }

    // Create Student record
    const student = await Student.create({
      studentId: studentId.toUpperCase(),
      name,
      email: email.toLowerCase(),
      phone,
      gender,
      dateOfBirth,
      course,
      branch,
      year,
      address,
      parentName,
      parentPhone,
      room: room || null,
      status: status || 'Active'
    });

    // Update Room if assigned
    if (assignedRoom) {
      if (!assignedRoom.students.includes(student._id)) {
        assignedRoom.students.push(student._id);
        assignedRoom.updateOccupancy();
        await assignedRoom.save();
      }
    }

    // Create User login credentials for student
    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (!userExists) {
      await User.create({
        name,
        email: email.toLowerCase(),
        password: password || 'Student@123',
        phone,
        role: 'student',
        studentId: studentId.toUpperCase(),
        gender,
        course,
        year
      });
    }

    const populatedStudent = await Student.findById(student._id).populate('room');

    res.status(201).json({
      success: true,
      message: 'Student registered successfully',
      data: populatedStudent
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update student
// @route   PUT /api/students/:id
// @access  Private (Admin)
const updateStudent = async (req, res, next) => {
  try {
    let student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    const oldRoomId = student.room ? student.room.toString() : null;
    const newRoomId = req.body.room !== undefined ? req.body.room : oldRoomId;

    // Check if new room is different and has capacity
    if (newRoomId && newRoomId !== oldRoomId) {
      const newRoom = await Room.findById(newRoomId);
      if (!newRoom) {
        return res.status(404).json({ success: false, message: 'Target room not found' });
      }
      if (newRoom.occupiedBeds >= newRoom.capacity && !newRoom.students.includes(student._id)) {
        return res.status(400).json({
          success: false,
          message: `Room ${newRoom.roomNumber} is full. Capacity is ${newRoom.capacity}.`
        });
      }

      // Remove from old room
      if (oldRoomId) {
        const oldRoom = await Room.findById(oldRoomId);
        if (oldRoom) {
          oldRoom.students = oldRoom.students.filter(
            (sId) => sId.toString() !== student._id.toString()
          );
          oldRoom.updateOccupancy();
          await oldRoom.save();
        }
      }

      // Add to new room
      if (!newRoom.students.includes(student._id)) {
        newRoom.students.push(student._id);
        newRoom.updateOccupancy();
        await newRoom.save();
      }
    } else if (newRoomId === null && oldRoomId) {
      // Removed from room
      const oldRoom = await Room.findById(oldRoomId);
      if (oldRoom) {
        oldRoom.students = oldRoom.students.filter(
          (sId) => sId.toString() !== student._id.toString()
        );
        oldRoom.updateOccupancy();
        await oldRoom.save();
      }
    }

    // Update student fields
    const updatedStudent = await Student.findByIdAndUpdate(
      req.params.id,
      { ...req.body, room: newRoomId || null },
      { new: true, runValidators: true }
    ).populate('room');

    // Sync corresponding user account if name or email changed
    if (req.body.name || req.body.email || req.body.phone) {
      await User.findOneAndUpdate(
        { $or: [{ email: student.email }, { studentId: student.studentId }] },
        {
          name: updatedStudent.name,
          email: updatedStudent.email,
          phone: updatedStudent.phone,
          course: updatedStudent.course,
          year: updatedStudent.year
        }
      );
    }

    res.status(200).json({
      success: true,
      message: 'Student updated successfully',
      data: updatedStudent
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete student
// @route   DELETE /api/students/:id
// @access  Private (Admin)
const deleteStudent = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Remove from assigned room
    if (student.room) {
      const room = await Room.findById(student.room);
      if (room) {
        room.students = room.students.filter(
          (sId) => sId.toString() !== student._id.toString()
        );
        room.updateOccupancy();
        await room.save();
      }
    }

    // Delete associated User account
    await User.findOneAndDelete({
      $or: [{ email: student.email }, { studentId: student.studentId }]
    });

    // Delete student records
    await Student.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Student and associated room allocations removed successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent
};
