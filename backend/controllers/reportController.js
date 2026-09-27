const Student = require('../models/Student');
const Room = require('../models/Room');
const Fee = require('../models/Fee');
const Complaint = require('../models/Complaint');
const Visitor = require('../models/Visitor');
const Notice = require('../models/Notice');

// @desc    Get comprehensive dashboard statistics
// @route   GET /api/reports/dashboard-stats
// @access  Private (Admin)
const getDashboardStats = async (req, res, next) => {
  try {
    const totalStudents = await Student.countDocuments();
    const activeStudents = await Student.countDocuments({ status: 'Active' });

    const totalRooms = await Room.countDocuments();
    const availableRooms = await Room.countDocuments({ status: 'Available' });
    const partiallyOccupiedRooms = await Room.countDocuments({ status: 'Partially Occupied' });
    const fullRooms = await Room.countDocuments({ status: 'Full' });
    const maintenanceRooms = await Room.countDocuments({ status: 'Maintenance' });

    // Bed statistics
    const rooms = await Room.find();
    const totalBeds = rooms.reduce((sum, r) => sum + r.capacity, 0);
    const occupiedBeds = rooms.reduce((sum, r) => sum + r.occupiedBeds, 0);
    const availableBeds = Math.max(0, totalBeds - occupiedBeds);

    // Fee statistics
    const feeAggregation = await Fee.aggregate([
      {
        $group: {
          _id: null,
          totalInvoiced: { $sum: '$amount' },
          totalPaid: { $sum: '$paidAmount' }
        }
      }
    ]);

    const totalFees = feeAggregation[0] ? feeAggregation[0].totalInvoiced : 0;
    const collectedFees = feeAggregation[0] ? feeAggregation[0].totalPaid : 0;
    const pendingFees = Math.max(0, totalFees - collectedFees);

    const paidFeesCount = await Fee.countDocuments({ status: 'Paid' });
    const pendingFeesCount = await Fee.countDocuments({ status: 'Pending' });
    const partiallyPaidFeesCount = await Fee.countDocuments({ status: 'Partially Paid' });
    const overdueFeesCount = await Fee.countDocuments({ status: 'Overdue' });

    // Complaint statistics
    const totalComplaints = await Complaint.countDocuments();
    const pendingComplaints = await Complaint.countDocuments({ status: 'Pending' });
    const inProgressComplaints = await Complaint.countDocuments({ status: 'In Progress' });
    const resolvedComplaints = await Complaint.countDocuments({ status: 'Resolved' });
    const rejectedComplaints = await Complaint.countDocuments({ status: 'Rejected' });

    // Visitor statistics
    const totalVisitors = await Visitor.countDocuments();
    const pendingVisitors = await Visitor.countDocuments({ status: 'Pending' });
    const approvedVisitors = await Visitor.countDocuments({ status: 'Approved' });

    // Notice statistics
    const activeNotices = await Notice.countDocuments({
      $or: [{ expiryDate: { $gte: new Date() } }, { expiryDate: null }]
    });

    // Recent activities
    const recentComplaints = await Complaint.find()
      .populate('student', 'name studentId')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentVisitors = await Visitor.find()
      .populate('student', 'name studentId')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentStudents = await Student.find()
      .populate('room', 'roomNumber block')
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      data: {
        cards: {
          totalStudents,
          activeStudents,
          totalRooms,
          availableRooms,
          occupiedRooms: partiallyOccupiedRooms + fullRooms,
          totalBeds,
          occupiedBeds,
          availableBeds,
          totalFees,
          collectedFees,
          pendingFees,
          totalComplaints,
          pendingComplaints,
          resolvedComplaints,
          totalVisitors,
          pendingVisitors,
          activeNotices
        },
        charts: {
          roomStatus: {
            Available: availableRooms,
            'Partially Occupied': partiallyOccupiedRooms,
            Full: fullRooms,
            Maintenance: maintenanceRooms
          },
          feeStatus: {
            Paid: paidFeesCount,
            Pending: pendingFeesCount,
            'Partially Paid': partiallyPaidFeesCount,
            Overdue: overdueFeesCount
          },
          complaintStatus: {
            Pending: pendingComplaints,
            'In Progress': inProgressComplaints,
            Resolved: resolvedComplaints,
            Rejected: rejectedComplaints
          }
        },
        recent: {
          complaints: recentComplaints,
          visitors: recentVisitors,
          students: recentStudents
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get detailed occupancy & branch reports
// @route   GET /api/reports/detailed
// @access  Private (Admin)
const getDetailedReports = async (req, res, next) => {
  try {
    // Branch breakdown
    const branchBreakdown = await Student.aggregate([
      { $group: { _id: '$branch', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Year breakdown
    const yearBreakdown = await Student.aggregate([
      { $group: { _id: '$year', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    // Block occupancy breakdown
    const blockBreakdown = await Room.aggregate([
      {
        $group: {
          _id: '$block',
          totalRooms: { $sum: 1 },
          totalCapacity: { $sum: '$capacity' },
          totalOccupied: { $sum: '$occupiedBeds' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Complaint category breakdown
    const complaintCategoryBreakdown = await Complaint.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        branchBreakdown,
        yearBreakdown,
        blockBreakdown,
        complaintCategoryBreakdown
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getDetailedReports
};
