const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema(
  {
    roomNumber: {
      type: String,
      required: [true, 'Room number is required'],
      unique: true,
      trim: true,
      uppercase: true
    },
    block: {
      type: String,
      required: [true, 'Block is required'],
      trim: true,
      uppercase: true
    },
    floor: {
      type: Number,
      required: [true, 'Floor number is required'],
      min: [0, 'Floor cannot be negative']
    },
    capacity: {
      type: Number,
      required: [true, 'Capacity is required'],
      min: [1, 'Capacity must be at least 1']
    },
    occupiedBeds: {
      type: Number,
      default: 0,
      min: [0, 'Occupied beds cannot be negative']
    },
    roomType: {
      type: String,
      enum: ['Single', 'Double', 'Triple', 'Four-Bed'],
      default: 'Double',
      required: [true, 'Room type is required']
    },
    gender: {
      type: String,
      enum: ['Boys', 'Girls', 'Any'],
      default: 'Any'
    },
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student'
      }
    ],
    status: {
      type: String,
      enum: ['Available', 'Partially Occupied', 'Full', 'Maintenance'],
      default: 'Available'
    }
  },
  {
    timestamps: true
  }
);

// Method to automatically update occupiedBeds and status based on students length
roomSchema.methods.updateOccupancy = function () {
  this.occupiedBeds = this.students.length;
  if (this.status === 'Maintenance') {
    return;
  }
  if (this.occupiedBeds === 0) {
    this.status = 'Available';
  } else if (this.occupiedBeds < this.capacity) {
    this.status = 'Partially Occupied';
  } else {
    this.status = 'Full';
  }
};

module.exports = mongoose.model('Room', roomSchema);
