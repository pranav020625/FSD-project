const mongoose = require('mongoose');

const visitorSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student is required']
    },
    visitorName: {
      type: String,
      required: [true, 'Visitor name is required'],
      trim: true
    },
    relation: {
      type: String,
      required: [true, 'Relationship to student is required'],
      trim: true
    },
    phone: {
      type: String,
      required: [true, 'Visitor contact phone is required'],
      trim: true
    },
    visitDate: {
      type: Date,
      required: [true, 'Visit date is required']
    },
    inTime: {
      type: String,
      trim: true
    },
    outTime: {
      type: String,
      trim: true
    },
    purpose: {
      type: String,
      required: [true, 'Purpose of visit is required'],
      trim: true
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected', 'Completed'],
      default: 'Pending'
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Visitor', visitorSchema);
