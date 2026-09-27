const express = require('express');
const router = express.Router();
const {
  getRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
  assignStudent,
  removeStudent
} = require('../controllers/roomController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router
  .route('/')
  .get(getRooms)
  .post(authorize('admin'), createRoom);

router
  .route('/:id')
  .get(getRoomById)
  .put(authorize('admin'), updateRoom)
  .delete(authorize('admin'), deleteRoom);

router.post('/:id/assign', authorize('admin'), assignStudent);
router.post('/:id/remove', authorize('admin'), removeStudent);

module.exports = router;
