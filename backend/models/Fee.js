const mongoose = require('mongoose');

const feeSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student is required']
    },
    amount: {
      type: Number,
      required: [true, 'Fee amount is required'],
      min: [0, 'Amount cannot be negative']
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required']
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: [0, 'Paid amount cannot be negative']
    },
    paymentDate: {
      type: Date
    },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'Bank Transfer', 'UPI', 'Cheque', 'Credit/Debit Card', 'Online'],
      default: 'UPI'
    },
    status: {
      type: String,
      enum: ['Paid', 'Pending', 'Partially Paid', 'Overdue'],
      default: 'Pending'
    },
    transactionId: {
      type: String,
      trim: true
    },
    description: {
      type: String,
      trim: true,
      default: 'Hostel Accommodation & Maintenance Fee'
    }
  },
  {
    timestamps: true
  }
);

// Method to automatically set fee status
feeSchema.methods.computeStatus = function () {
  const remaining = this.amount - this.paidAmount;
  if (remaining <= 0) {
    this.status = 'Paid';
    if (!this.paymentDate) this.paymentDate = new Date();
  } else if (this.paidAmount > 0) {
    this.status = 'Partially Paid';
  } else {
    const isPastDue = new Date(this.dueDate) < new Date();
    this.status = isPastDue ? 'Overdue' : 'Pending';
  }
};

module.exports = mongoose.model('Fee', feeSchema);
