const Notice = require('../models/Notice');

// @desc    Get all notices (active filter for students, all for admin)
// @route   GET /api/notices
// @access  Public / Private
const getNotices = async (req, res, next) => {
  try {
    const query = {};

    // If student or unauthenticated, only return active (non-expired) notices
    if (!req.user || req.user.role === 'student') {
      const now = new Date();
      query.$or = [{ expiryDate: { $gte: now } }, { expiryDate: null }, { expiryDate: { $exists: false } }];
    }

    if (req.query.category && req.query.category !== 'All') {
      query.category = req.query.category;
    }

    if (req.query.priority && req.query.priority !== 'All') {
      query.priority = req.query.priority;
    }

    let notices = await Notice.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    if (req.query.search) {
      const search = req.query.search.toLowerCase();
      notices = notices.filter(
        (n) =>
          n.title.toLowerCase().includes(search) ||
          n.description.toLowerCase().includes(search) ||
          n.category.toLowerCase().includes(search)
      );
    }

    res.status(200).json({
      success: true,
      count: notices.length,
      data: notices
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single notice
// @route   GET /api/notices/:id
// @access  Public / Private
const getNoticeById = async (req, res, next) => {
  try {
    const notice = await Notice.findById(req.params.id).populate('createdBy', 'name email');

    if (!notice) {
      return res.status(404).json({
        success: false,
        message: 'Notice not found'
      });
    }

    res.status(200).json({
      success: true,
      data: notice
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create notice
// @route   POST /api/notices
// @access  Private (Admin)
const createNotice = async (req, res, next) => {
  try {
    const { title, description, category, priority, publishDate, expiryDate } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Title and description are required'
      });
    }

    const notice = await Notice.create({
      title,
      description,
      category: category || 'General',
      priority: priority || 'Medium',
      createdBy: req.user._id,
      publishDate: publishDate ? new Date(publishDate) : new Date(),
      expiryDate: expiryDate ? new Date(expiryDate) : null
    });

    const populated = await Notice.findById(notice._id).populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Notice broadcasted successfully',
      data: populated
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update notice
// @route   PUT /api/notices/:id
// @access  Private (Admin)
const updateNotice = async (req, res, next) => {
  try {
    let notice = await Notice.findById(req.params.id);

    if (!notice) {
      return res.status(404).json({
        success: false,
        message: 'Notice not found'
      });
    }

    if (req.body.title) notice.title = req.body.title;
    if (req.body.description) notice.description = req.body.description;
    if (req.body.category) notice.category = req.body.category;
    if (req.body.priority) notice.priority = req.body.priority;
    if (req.body.publishDate) notice.publishDate = new Date(req.body.publishDate);
    if (req.body.expiryDate !== undefined) {
      notice.expiryDate = req.body.expiryDate ? new Date(req.body.expiryDate) : null;
    }

    await notice.save();

    const populated = await Notice.findById(notice._id).populate('createdBy', 'name email');

    res.status(200).json({
      success: true,
      message: 'Notice updated successfully',
      data: populated
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete notice
// @route   DELETE /api/notices/:id
// @access  Private (Admin)
const deleteNotice = async (req, res, next) => {
  try {
    const notice = await Notice.findById(req.params.id);

    if (!notice) {
      return res.status(404).json({
        success: false,
        message: 'Notice not found'
      });
    }

    await Notice.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Notice deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotices,
  getNoticeById,
  createNotice,
  updateNotice,
  deleteNotice
};
