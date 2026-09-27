const Fee = require('../models/Fee');
const Student = require('../models/Student');

// @desc    Get all fees with search and filter (Admin) or my fees (Student)
// @route   GET /api/fees
// @access  Private
const getFees = async (req, res, next) => {
  try {
    const query = {};

    // If student, filter by student's ID only
    if (req.user.role === 'student') {
      const student = await Student.findOne({
        $or: [{ email: req.user.email }, { studentId: req.user.studentId }]
      });
      if (!student) {
        return res.status(200).json({
          success: true,
          count: 0,
          summary: { totalAmount: 0, totalPaid: 0, remaining: 0 },
          data: []
        });
      }
      query.student = student._id;
    } else {
      // Admin filters
      if (req.query.student) {
        query.student = req.query.student;
      }

      if (req.query.status && req.query.status !== 'All') {
        query.status = req.query.status;
      }
    }

    let fees = await Fee.find(query)
      .populate('student', 'studentId name email phone course branch year room')
      .sort({ dueDate: -1 });

    // Client/search filter by student name or roll number if admin
    if (req.query.search && req.user.role === 'admin') {
      const search = req.query.search.toLowerCase();
      fees = fees.filter(
        (f) =>
          f.student &&
          (f.student.name.toLowerCase().includes(search) ||
            f.student.studentId.toLowerCase().includes(search) ||
            (f.transactionId && f.transactionId.toLowerCase().includes(search)))
      );
    }

    // Update dynamic overdue status for unpaid fees past due date
    const now = new Date();
    for (let fee of fees) {
      if (fee.status === 'Pending' && new Date(fee.dueDate) < now) {
        fee.status = 'Overdue';
        await fee.save();
      }
    }

    // Calculate summary statistics
    const totalAmount = fees.reduce((sum, f) => sum + (f.amount || 0), 0);
    const totalPaid = fees.reduce((sum, f) => sum + (f.paidAmount || 0), 0);
    const remaining = totalAmount - totalPaid;

    res.status(200).json({
      success: true,
      count: fees.length,
      summary: {
        totalAmount,
        totalPaid,
        remaining
      },
      data: fees
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single fee record
// @route   GET /api/fees/:id
// @access  Private
const getFeeById = async (req, res, next) => {
  try {
    const fee = await Fee.findById(req.params.id).populate('student');

    if (!fee) {
      return res.status(404).json({
        success: false,
        message: 'Fee record not found'
      });
    }

    // Check authorization if student
    if (req.user.role === 'student') {
      const student = await Student.findOne({
        $or: [{ email: req.user.email }, { studentId: req.user.studentId }]
      });
      if (!student || fee.student._id.toString() !== student._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to view this fee record'
        });
      }
    }

    res.status(200).json({
      success: true,
      data: fee
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create fee invoice for student
// @route   POST /api/fees
// @access  Private (Admin)
const createFee = async (req, res, next) => {
  try {
    const { studentId, amount, dueDate, paidAmount, paymentMethod, transactionId, description } = req.body;

    if (!studentId || !amount || !dueDate) {
      return res.status(400).json({
        success: false,
        message: 'Student, amount, and due date are required'
      });
    }

    const student = await Student.findOne({
      $or: [{ _id: studentId.match(/^[0-9a-fA-F]{24}$/) ? studentId : null }, { studentId: studentId.toUpperCase() }]
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    const fee = new Fee({
      student: student._id,
      amount: Number(amount),
      dueDate: new Date(dueDate),
      paidAmount: Number(paidAmount || 0),
      paymentMethod: paymentMethod || 'UPI',
      transactionId: transactionId || '',
      description: description || 'Hostel Accommodation & Maintenance Fee'
    });

    fee.computeStatus();
    await fee.save();

    const populatedFee = await Fee.findById(fee._id).populate('student');

    res.status(201).json({
      success: true,
      message: 'Fee invoice created successfully',
      data: populatedFee
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update fee record / Record payment
// @route   PUT /api/fees/:id
// @access  Private (Admin)
const updateFee = async (req, res, next) => {
  try {
    const fee = await Fee.findById(req.params.id);

    if (!fee) {
      return res.status(404).json({
        success: false,
        message: 'Fee record not found'
      });
    }

    if (req.body.amount !== undefined) fee.amount = Number(req.body.amount);
    if (req.body.dueDate) fee.dueDate = new Date(req.body.dueDate);
    if (req.body.paidAmount !== undefined) fee.paidAmount = Number(req.body.paidAmount);
    if (req.body.paymentMethod) fee.paymentMethod = req.body.paymentMethod;
    if (req.body.transactionId !== undefined) fee.transactionId = req.body.transactionId;
    if (req.body.description !== undefined) fee.description = req.body.description;
    if (req.body.paymentDate) fee.paymentDate = new Date(req.body.paymentDate);

    if (req.body.status) {
      fee.status = req.body.status;
    } else {
      fee.computeStatus();
    }

    await fee.save();

    const populatedFee = await Fee.findById(fee._id).populate('student');

    res.status(200).json({
      success: true,
      message: 'Fee updated successfully',
      data: populatedFee
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete fee record
// @route   DELETE /api/fees/:id
// @access  Private (Admin)
const deleteFee = async (req, res, next) => {
  try {
    const fee = await Fee.findById(req.params.id);

    if (!fee) {
      return res.status(404).json({
        success: false,
        message: 'Fee record not found'
      });
    }

    await Fee.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Fee record deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFees,
  getFeeById,
  createFee,
  updateFee,
  deleteFee
};
