const Complaint = require('../models/Complaint');
const Student = require('../models/Student');

// @desc    Get all complaints (filtered by student if role is student)
// @route   GET /api/complaints
// @access  Private
const getComplaints = async (req, res, next) => {
  try {
    const query = {};

    if (req.user.role === 'student') {
      const student = await Student.findOne({
        $or: [{ email: req.user.email }, { studentId: req.user.studentId }]
      });
      if (!student) {
        return res.status(200).json({ success: true, count: 0, data: [] });
      }
      query.student = student._id;
    } else {
      // Admin filter options
      if (req.query.status && req.query.status !== 'All') {
        query.status = req.query.status;
      }
      if (req.query.category && req.query.category !== 'All') {
        query.category = req.query.category;
      }
      if (req.query.priority && req.query.priority !== 'All') {
        query.priority = req.query.priority;
      }
    }

    let complaints = await Complaint.find(query)
      .populate('student', 'studentId name email phone room')
      .sort({ createdAt: -1 });

    if (req.query.search) {
      const search = req.query.search.toLowerCase();
      complaints = complaints.filter(
        (c) =>
          c.title.toLowerCase().includes(search) ||
          c.description.toLowerCase().includes(search) ||
          (c.student && c.student.name.toLowerCase().includes(search)) ||
          (c.student && c.student.studentId.toLowerCase().includes(search))
      );
    }

    res.status(200).json({
      success: true,
      count: complaints.length,
      data: complaints
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single complaint
// @route   GET /api/complaints/:id
// @access  Private
const getComplaintById = async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id).populate('student');

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    // Role security check
    if (req.user.role === 'student') {
      const student = await Student.findOne({
        $or: [{ email: req.user.email }, { studentId: req.user.studentId }]
      });
      if (!student || complaint.student._id.toString() !== student._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to view this complaint'
        });
      }
    }

    res.status(200).json({
      success: true,
      data: complaint
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create complaint
// @route   POST /api/complaints
// @access  Private
const createComplaint = async (req, res, next) => {
  try {
    const { title, description, category, priority, studentId } = req.body;

    if (!title || !description || !category) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, description, and category'
      });
    }

    let targetStudentId;
    if (req.user.role === 'student') {
      const student = await Student.findOne({
        $or: [{ email: req.user.email }, { studentId: req.user.studentId }]
      });
      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Student record not found for this account'
        });
      }
      targetStudentId = student._id;
    } else {
      if (!studentId) {
        return res.status(400).json({
          success: false,
          message: 'Student ID is required to file a complaint on their behalf'
        });
      }
      const student = await Student.findOne({
        $or: [{ _id: studentId.match(/^[0-9a-fA-F]{24}$/) ? studentId : null }, { studentId: studentId.toUpperCase() }]
      });
      if (!student) {
        return res.status(404).json({ success: false, message: 'Student not found' });
      }
      targetStudentId = student._id;
    }

    const complaint = await Complaint.create({
      student: targetStudentId,
      title,
      description,
      category,
      priority: priority || 'Medium',
      status: 'Pending'
    });

    const populatedComplaint = await Complaint.findById(complaint._id).populate('student');

    res.status(201).json({
      success: true,
      message: 'Complaint submitted successfully',
      data: populatedComplaint
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update complaint (Admin response / status change or Student edit)
// @route   PUT /api/complaints/:id
// @access  Private
const updateComplaint = async (req, res, next) => {
  try {
    let complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    if (req.user.role === 'admin') {
      if (req.body.status) complaint.status = req.body.status;
      if (req.body.adminResponse !== undefined) complaint.adminResponse = req.body.adminResponse;
      if (req.body.priority) complaint.priority = req.body.priority;

      if (req.body.status === 'Resolved' && !complaint.resolvedAt) {
        complaint.resolvedAt = new Date();
      } else if (req.body.status !== 'Resolved') {
        complaint.resolvedAt = null;
      }
    } else {
      // Student can update title/desc only if still Pending
      if (complaint.status !== 'Pending') {
        return res.status(400).json({
          success: false,
          message: 'Cannot edit complaint after it has been processed by admin'
        });
      }
      if (req.body.title) complaint.title = req.body.title;
      if (req.body.description) complaint.description = req.body.description;
      if (req.body.category) complaint.category = req.body.category;
      if (req.body.priority) complaint.priority = req.body.priority;
    }

    await complaint.save();

    const populated = await Complaint.findById(complaint._id).populate('student');

    res.status(200).json({
      success: true,
      message: 'Complaint updated successfully',
      data: populated
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete complaint
// @route   DELETE /api/complaints/:id
// @access  Private (Admin or Owning Student)
const deleteComplaint = async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    if (req.user.role !== 'admin') {
      const student = await Student.findOne({
        $or: [{ email: req.user.email }, { studentId: req.user.studentId }]
      });
      if (!student || complaint.student.toString() !== student._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to delete this complaint'
        });
      }
    }

    await Complaint.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Complaint deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getComplaints,
  getComplaintById,
  createComplaint,
  updateComplaint,
  deleteComplaint
};
