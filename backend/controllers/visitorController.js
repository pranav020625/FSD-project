const Visitor = require('../models/Visitor');
const Student = require('../models/Student');

// @desc    Get all visitors (filtered for students)
// @route   GET /api/visitors
// @access  Private
const getVisitors = async (req, res, next) => {
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
      if (req.query.status && req.query.status !== 'All') {
        query.status = req.query.status;
      }
    }

    let visitors = await Visitor.find(query)
      .populate('student', 'studentId name email phone room')
      .populate('approvedBy', 'name email')
      .sort({ visitDate: -1, createdAt: -1 });

    if (req.query.search) {
      const search = req.query.search.toLowerCase();
      visitors = visitors.filter(
        (v) =>
          v.visitorName.toLowerCase().includes(search) ||
          v.purpose.toLowerCase().includes(search) ||
          v.phone.includes(search) ||
          (v.student && v.student.name.toLowerCase().includes(search)) ||
          (v.student && v.student.studentId.toLowerCase().includes(search))
      );
    }

    res.status(200).json({
      success: true,
      count: visitors.length,
      data: visitors
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single visitor request
// @route   GET /api/visitors/:id
// @access  Private
const getVisitorById = async (req, res, next) => {
  try {
    const visitor = await Visitor.findById(req.params.id)
      .populate('student')
      .populate('approvedBy', 'name email');

    if (!visitor) {
      return res.status(404).json({
        success: false,
        message: 'Visitor pass not found'
      });
    }

    if (req.user.role === 'student') {
      const student = await Student.findOne({
        $or: [{ email: req.user.email }, { studentId: req.user.studentId }]
      });
      if (!student || visitor.student._id.toString() !== student._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to view this visitor pass'
        });
      }
    }

    res.status(200).json({
      success: true,
      data: visitor
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create visitor pass request
// @route   POST /api/visitors
// @access  Private
const createVisitor = async (req, res, next) => {
  try {
    const { visitorName, relation, phone, visitDate, inTime, outTime, purpose, studentId } = req.body;

    if (!visitorName || !relation || !phone || !visitDate || !purpose) {
      return res.status(400).json({
        success: false,
        message: 'Please provide visitor name, relation, phone, visit date, and purpose'
      });
    }

    let targetStudentId;
    if (req.user.role === 'student') {
      const student = await Student.findOne({
        $or: [{ email: req.user.email }, { studentId: req.user.studentId }]
      });
      if (!student) {
        return res.status(404).json({ success: false, message: 'Student profile not found' });
      }
      targetStudentId = student._id;
    } else {
      if (!studentId) {
        return res.status(400).json({ success: false, message: 'Student ID is required' });
      }
      const student = await Student.findOne({
        $or: [{ _id: studentId.match(/^[0-9a-fA-F]{24}$/) ? studentId : null }, { studentId: studentId.toUpperCase() }]
      });
      if (!student) {
        return res.status(404).json({ success: false, message: 'Student not found' });
      }
      targetStudentId = student._id;
    }

    const visitor = await Visitor.create({
      student: targetStudentId,
      visitorName,
      relation,
      phone,
      visitDate: new Date(visitDate),
      inTime: inTime || '',
      outTime: outTime || '',
      purpose,
      status: req.user.role === 'admin' ? 'Approved' : 'Pending',
      approvedBy: req.user.role === 'admin' ? req.user._id : undefined
    });

    const populated = await Visitor.findById(visitor._id)
      .populate('student')
      .populate('approvedBy', 'name');

    res.status(201).json({
      success: true,
      message: 'Visitor pass request submitted successfully',
      data: populated
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update visitor pass (Admin status change or in/out times)
// @route   PUT /api/visitors/:id
// @access  Private
const updateVisitor = async (req, res, next) => {
  try {
    let visitor = await Visitor.findById(req.params.id);

    if (!visitor) {
      return res.status(404).json({
        success: false,
        message: 'Visitor pass not found'
      });
    }

    if (req.user.role === 'admin') {
      if (req.body.status) {
        visitor.status = req.body.status;
        if (req.body.status === 'Approved' || req.body.status === 'Rejected') {
          visitor.approvedBy = req.user._id;
        }
      }
      if (req.body.inTime !== undefined) visitor.inTime = req.body.inTime;
      if (req.body.outTime !== undefined) visitor.outTime = req.body.outTime;
      if (req.body.visitorName) visitor.visitorName = req.body.visitorName;
      if (req.body.relation) visitor.relation = req.body.relation;
      if (req.body.phone) visitor.phone = req.body.phone;
      if (req.body.visitDate) visitor.visitDate = new Date(req.body.visitDate);
      if (req.body.purpose) visitor.purpose = req.body.purpose;
    } else {
      if (visitor.status !== 'Pending') {
        return res.status(400).json({
          success: false,
          message: 'Cannot edit visitor pass once processed'
        });
      }
      if (req.body.visitorName) visitor.visitorName = req.body.visitorName;
      if (req.body.relation) visitor.relation = req.body.relation;
      if (req.body.phone) visitor.phone = req.body.phone;
      if (req.body.visitDate) visitor.visitDate = new Date(req.body.visitDate);
      if (req.body.purpose) visitor.purpose = req.body.purpose;
    }

    await visitor.save();

    const populated = await Visitor.findById(visitor._id)
      .populate('student')
      .populate('approvedBy', 'name email');

    res.status(200).json({
      success: true,
      message: 'Visitor pass updated successfully',
      data: populated
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete visitor pass
// @route   DELETE /api/visitors/:id
// @access  Private (Admin or Owning Student)
const deleteVisitor = async (req, res, next) => {
  try {
    const visitor = await Visitor.findById(req.params.id);

    if (!visitor) {
      return res.status(404).json({
        success: false,
        message: 'Visitor pass not found'
      });
    }

    if (req.user.role !== 'admin') {
      const student = await Student.findOne({
        $or: [{ email: req.user.email }, { studentId: req.user.studentId }]
      });
      if (!student || visitor.student.toString() !== student._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to delete this visitor pass'
        });
      }
    }

    await Visitor.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Visitor pass deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getVisitors,
  getVisitorById,
  createVisitor,
  updateVisitor,
  deleteVisitor
};
