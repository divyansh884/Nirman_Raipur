const mongoose = require('mongoose');

const workProgressSchema = new mongoose.Schema({
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
  workProgressStage: {
    type: String,
    required: [true, 'Work progress stage is required'],
    enum: {
      values: ['Pending', 'In Progress', 'Completed'],
      message: 'Work progress stage must be either Pending, In Progress, or Completed'
    },
    default: 'Pending'
  },
  workDetails: {
    type: String,
    trim: true,
    maxlength: [1000, 'Work details cannot exceed 1000 characters'],
    default: null
  },
  entryDate: {
    type: Date,
    default: Date.now
  },
  lastModified: {
    type: Date,
    default: Date.now
  },
  // progressImages: imageSchema

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Update lastModified on save
workProgressSchema.pre('save', function(next) {
  this.lastModified = new Date();
  next();
});

// Index for better query performance
workProgressSchema.index({ area: 1, scheme: 1, workProgressStage: 1 });
workProgressSchema.index({ workAgency: 1 });
workProgressSchema.index({ entryDate: -1 });

module.exports = mongoose.model('WorkProgress', workProgressSchema);
