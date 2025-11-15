const mongoose = require('mongoose');

const workOrderSchema = new mongoose.Schema({
  workName: {
    type: String,
    required: [true, 'Work name is required'],
    trim: true,
    maxlength: [500, 'Work name cannot exceed 500 characters']
  },
  area: {
    type: String,
    required: [true, 'Area is required'],
    trim: true,
    maxlength: [100, 'Area name cannot exceed 100 characters']
  },
  workAgency: {
    type: String,
    required: [true, 'Work agency is required'],
    trim: true,
    maxlength: [200, 'Work agency name cannot exceed 200 characters']
  },
  scheme: {
    type: String,
    required: [true, 'Scheme is required'],
    trim: true,
    maxlength: [200, 'Scheme name cannot exceed 200 characters']
  },
  technicalApproval: {
    type: String,
    required: [true, 'Technical approval is required'],
    trim: true,
    maxlength: [100, 'Technical approval cannot exceed 100 characters']
  },
  administrativeApproval: {
    type: String,
    required: [true, 'Administrative approval is required'],
    trim: true,
    maxlength: [100, 'Administrative approval cannot exceed 100 characters']
  },
  tenderApproval: {
    type: String,
    trim: true,
    maxlength: [100, 'Tender approval cannot exceed 100 characters'],
    default: null
  },
  orderStatus: {
    type: String,
    required: [true, 'Order status is required'],
    enum: {
      values: ['Pending', 'Issued', 'Completed'],
      message: 'Order status must be either Pending, Issued, or Completed'
    },
    default: 'Pending'
  },
  workDetails: {
    type: String,
    trim: true,
    maxlength: [1000, 'Work details cannot exceed 1000 characters'],
    default: null
  },
  orderDate: {
    type: Date,
    default: null
  },
  completionDate: {
    type: Date,
    default: null
  },
  entryDate: {
    type: Date,
    default: Date.now
  },
  lastModified: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Update lastModified on save
workOrderSchema.pre('save', function(next) {
  this.lastModified = new Date();
  
  // Set orderDate when status changes to 'Issued'
  if (this.isModified('orderStatus') && this.orderStatus === 'Issued' && !this.orderDate) {
    this.orderDate = new Date();
  }
  
  // Set completionDate when status changes to 'Completed'
  if (this.isModified('orderStatus') && this.orderStatus === 'Completed' && !this.completionDate) {
    this.completionDate = new Date();
  }
  
  next();
});

// Index for better query performance
workOrderSchema.index({ area: 1, scheme: 1, orderStatus: 1 });
workOrderSchema.index({ workAgency: 1 });
workOrderSchema.index({ entryDate: -1 });
workOrderSchema.index({ orderDate: -1 });

module.exports = mongoose.model('WorkOrder', workOrderSchema);
