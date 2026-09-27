const User = require('../models/User');
const Student = require('../models/Student');
const generateToken = require('../utils/generateToken');

// @desc    Register a new user (Student or Admin)
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, phone, role, studentId, gender, course, branch, year } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists'
      });
    }

    const assignedRole = role === 'admin' ? 'admin' : 'student';

    // If student, check if studentId already exists
    if (assignedRole === 'student' && studentId) {
      const existingStudentId = await User.findOne({ studentId: studentId.toUpperCase() });
      if (existingStudentId) {
        return res.status(409).json({
          success: false,
          message: 'A student with this Student ID / Roll number already exists'
        });
      }
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      phone: phone || '',
      role: assignedRole,
      studentId: studentId ? studentId.toUpperCase() : undefined,
      gender: gender || 'Male',
      course: course || '',
      year: year || ''
    });

    // If student, ensure a Student profile record exists
    if (assignedRole === 'student') {
      const studentProfileExists = await Student.findOne({ email: email.toLowerCase() });
      if (!studentProfileExists && studentId) {
        await Student.create({
          studentId: studentId.toUpperCase(),
          name,
          email: email.toLowerCase(),
          phone: phone || 'N/A',
          gender: gender || 'Male',
          course: course || 'B.Tech',
          branch: branch || 'CSE',
          year: year || '1st Year',
          status: 'Active'
        });
      }
    }

    const token = generateToken(user._id, user.role);

    res.status(201).json({
      success: true,
      message: 'Account registered successfully',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          studentId: user.studentId,
          gender: user.gender,
          course: user.course,
          year: user.year
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password'
      });
    }

    // Check user in DB
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Match password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const token = generateToken(user._id, user.role);

    // If student, also get linked student profile if any
    let studentProfile = null;
    if (user.role === 'student') {
      studentProfile = await Student.findOne({
        $or: [{ email: user.email }, { studentId: user.studentId }]
      }).populate('room');
    }

    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          studentId: user.studentId,
          gender: user.gender,
          course: user.course,
          year: user.year,
          studentProfile: studentProfile || null
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get currently logged in user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found'
      });
    }

    let studentProfile = null;
    if (user.role === 'student') {
      studentProfile = await Student.findOne({
        $or: [{ email: user.email }, { studentId: user.studentId }]
      }).populate('room');
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          studentId: user.studentId,
          gender: user.gender,
          course: user.course,
          year: user.year,
          createdAt: user.createdAt,
          studentProfile: studentProfile || null
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/updateprofile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, gender, course, year, branch, address, parentName, parentPhone } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (gender) user.gender = gender;
    if (course) user.course = course;
    if (year) user.year = year;

    await user.save();

    // If student, also update the Student model
    if (user.role === 'student') {
      const student = await Student.findOne({
        $or: [{ email: user.email }, { studentId: user.studentId }]
      });
      if (student) {
        if (name) student.name = name;
        if (phone) student.phone = phone;
        if (gender) student.gender = gender;
        if (course) student.course = course;
        if (year) student.year = year;
        if (branch) student.branch = branch;
        if (address) student.address = address;
        if (parentName) student.parentName = parentName;
        if (parentPhone) student.parentPhone = parentPhone;
        await student.save();
      }
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private/Public
const logoutUser = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  updateProfile,
  logoutUser
};
