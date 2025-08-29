const mongoose = require('mongoose');

const tenderSchema = new mongoose.Schema({
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
    required: [true, 'Tender approval is required'],
    trim: true,
    maxlength: [100, 'Tender approval cannot exceed 100 characters']
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
  tenderAmount: {
    type: Number,
    min: [0, 'Tender amount cannot be negative'],
    default: null
  },
  tenderDate: {
    type: Date,
    default: null
  },
  bidSubmissionDate: {
    type: Date,
    default: null
  },
  tenderStatus: {
    type: String,
    enum: {
      values: ['Draft', 'Published', 'Bid Submission', 'Under Evaluation', 'Awarded', 'Cancelled'],
      message: 'Invalid tender status'
    },
    default: 'Draft'
  },
  contractorName: {
    type: String,
    trim: true,
    maxlength: [200, 'Contractor name cannot exceed 200 characters'],
    default: null
  },
  awardedAmount: {
    type: Number,
    min: [0, 'Awarded amount cannot be negative'],
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
tenderSchema.pre('save', function(next) {
  this.lastModified = new Date();
  next();
});

// Virtual for tender duration
tenderSchema.virtual('tenderDuration').get(function() {
  if (this.tenderDate && this.bidSubmissionDate) {
    const diffTime = Math.abs(this.bidSubmissionDate - this.tenderDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }
  return null;
});

// Index for better query performance
tenderSchema.index({ area: 1, workProgressStage: 1, tenderStatus: 1 });
tenderSchema.index({ workAgency: 1 });
tenderSchema.index({ entryDate: -1 });
tenderSchema.index({ tenderDate: -1 });

module.exports = mongoose.model('Tender', tenderSchema);
