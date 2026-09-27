const Room = require('../models/Room');
const Student = require('../models/Student');

// @desc    Get all rooms with search & filter
// @route   GET /api/rooms
// @access  Public / Private
const getRooms = async (req, res, next) => {
  try {
    const query = {};

    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [{ roomNumber: searchRegex }, { block: searchRegex }];
    }

    if (req.query.block && req.query.block !== 'All') {
      query.block = req.query.block.toUpperCase();
    }

    if (req.query.floor !== undefined && req.query.floor !== '' && req.query.floor !== 'All') {
      query.floor = Number(req.query.floor);
    }

    if (req.query.roomType && req.query.roomType !== 'All') {
      query.roomType = req.query.roomType;
    }

    if (req.query.status && req.query.status !== 'All') {
      query.status = req.query.status;
    }

    if (req.query.gender && req.query.gender !== 'All') {
      query.gender = req.query.gender;
    }

    const rooms = await Room.find(query)
      .populate('students', 'studentId name email phone course branch year gender')
      .sort({ block: 1, roomNumber: 1 });

    res.status(200).json({
      success: true,
      count: rooms.length,
      data: rooms
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single room by ID
// @route   GET /api/rooms/:id
// @access  Private
const getRoomById = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id).populate(
      'students',
      'studentId name email phone course branch year gender status'
    );

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    res.status(200).json({
      success: true,
      data: room
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new room
// @route   POST /api/rooms
// @access  Private (Admin)
const createRoom = async (req, res, next) => {
  try {
    const { roomNumber, block, floor, capacity, roomType, gender, status } = req.body;

    const existingRoom = await Room.findOne({ roomNumber: roomNumber.toUpperCase() });
    if (existingRoom) {
      return res.status(409).json({
        success: false,
        message: `Room number ${roomNumber.toUpperCase()} already exists`
      });
    }

    const room = new Room({
      roomNumber: roomNumber.toUpperCase(),
      block: block.toUpperCase(),
      floor: Number(floor),
      capacity: Number(capacity),
      roomType: roomType || 'Double',
      gender: gender || 'Any',
      status: status || 'Available'
    });

    room.updateOccupancy();
    await room.save();

    res.status(201).json({
      success: true,
      message: 'Room created successfully',
      data: room
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update room details
// @route   PUT /api/rooms/:id
// @access  Private (Admin)
const updateRoom = async (req, res, next) => {
  try {
    let room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    if (req.body.capacity !== undefined) {
      const newCap = Number(req.body.capacity);
      if (newCap < room.students.length) {
        return res.status(400).json({
          success: false,
          message: `Cannot set capacity to ${newCap} as ${room.students.length} students are currently assigned.`
        });
      }
      room.capacity = newCap;
    }

    if (req.body.roomNumber) room.roomNumber = req.body.roomNumber.toUpperCase();
    if (req.body.block) room.block = req.body.block.toUpperCase();
    if (req.body.floor !== undefined) room.floor = Number(req.body.floor);
    if (req.body.roomType) room.roomType = req.body.roomType;
    if (req.body.gender) room.gender = req.body.gender;
    if (req.body.status) room.status = req.body.status;

    room.updateOccupancy();
    await room.save();

    const updatedRoom = await Room.findById(room._id).populate(
      'students',
      'studentId name email phone course branch year'
    );

    res.status(200).json({
      success: true,
      message: 'Room updated successfully',
      data: updatedRoom
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete room
// @route   DELETE /api/rooms/:id
// @access  Private (Admin)
const deleteRoom = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // Unassign all students in this room
    if (room.students && room.students.length > 0) {
      await Student.updateMany(
        { _id: { $in: room.students } },
        { $set: { room: null } }
      );
    }

    await Room.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Room and its student assignments removed successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Assign student to room
// @route   POST /api/rooms/:id/assign
// @access  Private (Admin)
const assignStudent = async (req, res, next) => {
  try {
    const { studentId } = req.body; // Can be MongoDB _id or roll number

    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: 'Student ID is required'
      });
    }

    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // Find student by _id or studentId
    const student = await Student.findOne({
      $or: [{ _id: studentId.match(/^[0-9a-fA-F]{24}$/) ? studentId : null }, { studentId: studentId.toUpperCase() }]
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Check if room is already full
    if (room.occupiedBeds >= room.capacity && !room.students.includes(student._id)) {
      return res.status(400).json({
        success: false,
        message: `Room ${room.roomNumber} is already full (${room.occupiedBeds}/${room.capacity} beds occupied)`
      });
    }

    // If already in this room
    if (room.students.some(sId => sId.toString() === student._id.toString())) {
      return res.status(400).json({
        success: false,
        message: `Student ${student.name} is already assigned to this room`
      });
    }

    // If student was in another room, remove from old room
    if (student.room && student.room.toString() !== room._id.toString()) {
      const oldRoom = await Room.findById(student.room);
      if (oldRoom) {
        oldRoom.students = oldRoom.students.filter(
          (sId) => sId.toString() !== student._id.toString()
        );
        oldRoom.updateOccupancy();
        await oldRoom.save();
      }
    }

    // Add student to current room
    room.students.push(student._id);
    room.updateOccupancy();
    await room.save();

    // Update student's room reference
    student.room = room._id;
    await student.save();

    const populatedRoom = await Room.findById(room._id).populate(
      'students',
      'studentId name email phone course branch year gender'
    );

    res.status(200).json({
      success: true,
      message: `Student ${student.name} assigned to Room ${room.roomNumber} successfully`,
      data: populatedRoom
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove student from room
// @route   POST /api/rooms/:id/remove
// @access  Private (Admin)
const removeStudent = async (req, res, next) => {
  try {
    const { studentId } = req.body;

    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
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

    // Remove student from room
    room.students = room.students.filter(
      (sId) => sId.toString() !== student._id.toString()
    );
    room.updateOccupancy();
    await room.save();

    // Clear room field on student
    student.room = null;
    await student.save();

    const populatedRoom = await Room.findById(room._id).populate(
      'students',
      'studentId name email phone course branch year'
    );

    res.status(200).json({
      success: true,
      message: `Student ${student.name} removed from Room ${room.roomNumber}`,
      data: populatedRoom
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
  assignStudent,
  removeStudent
};
