const express = require('express');
const router = express.Router();
const {
  getVisitors,
  getVisitorById,
  createVisitor,
  updateVisitor,
  deleteVisitor
} = require('../controllers/visitorController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router
  .route('/')
  .get(getVisitors)
  .post(createVisitor);

router
  .route('/:id')
  .get(getVisitorById)
  .put(updateVisitor)
  .delete(deleteVisitor);

module.exports = router;
