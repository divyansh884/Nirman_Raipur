const mongoose = require('mongoose');
const workTypeSchema = new mongoose.Schema({
  workType: { 
    type: String, 
    required: true, 
    trim: true,
     maxlength: 200 },
  department: { 
    type: String, 
    required: true, 
    trim: true, 
    maxlength: 200 
  },
  constituency: { type: String, trim: true, maxlength: 100 },
  engineer: { type: String, trim: true, maxlength: 200 },
  scheme: { type: String, trim: true, maxlength: 200 },
  description: { type: String, trim: true, maxlength: 1000 },
  area: { type: String, trim: true, maxlength: 100 },
  city: { type: String, trim: true, maxlength: 100 },
  ward: { type: String, trim: true, maxlength: 50 },

  estimatedCost: {
    amount: { type: Number, min: 0, default: null },
    currency: { type: String, default: 'INR' }
  },

  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  isActive: { type: Boolean, default: true },
  isDeleted: { type: Boolean, default: false },

  entryDate: { type: Date, default: Date.now },
  lastModified: { type: Date, default: Date.now },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Hooks
workTypeSchema.pre('save', function(next) {
  this.lastModified = new Date();
  next();
});
workTypeSchema.pre('findOneAndUpdate', function(next) {
  this.set({ lastModified: new Date() });
  next();
});

// Virtual
workTypeSchema.virtual('fullLocation').get(function() {
  const locations = [this.area, this.city, this.ward].filter(Boolean);
  return locations.length > 0 ? locations.join(', ') : null;
});

// Indexes
workTypeSchema.index({ workType: 1, department: 1 });
workTypeSchema.index({ area: 1, city: 1 });
workTypeSchema.index({ isActive: 1, priority: 1 });
workTypeSchema.index({ entryDate: -1 });
workTypeSchema.index({ workType: 'text', description: 'text' });

module.exports = mongoose.model('WorkType', workTypeSchema);
