const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getDetailedReports
} = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);
router.use(authorize('admin'));

router.get('/dashboard-stats', getDashboardStats);
router.get('/detailed', getDetailedReports);

module.exports = router;
