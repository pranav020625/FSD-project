const express = require('express');
const router = express.Router();
const {
  getFees,
  getFeeById,
  createFee,
  updateFee,
  deleteFee
} = require('../controllers/feeController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router
  .route('/')
  .get(getFees)
  .post(authorize('admin'), createFee);

router
  .route('/:id')
  .get(getFeeById)
  .put(authorize('admin'), updateFee)
  .delete(authorize('admin'), deleteFee);

module.exports = router;
