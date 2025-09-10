const WorkType = require('../models/WorkType');
const { validationResult } = require('express-validator');

// Helper function to build filter query
const buildFilterQuery = (queryParams) => {
  const filter = {};
  
  if (queryParams.workType) {
    filter.workType = new RegExp(queryParams.workType, 'i');
  }
  
  if (queryParams.department) {
    filter.department = new RegExp(queryParams.department, 'i');
  }
  
  if (queryParams.area) {
    filter.area = new RegExp(queryParams.area, 'i');
  }
  
  if (queryParams.city) {
    filter.city = new RegExp(queryParams.city, 'i');
  }
  
  if (queryParams.engineer) {
    filter.engineer = new RegExp(queryParams.engineer, 'i');
  }
  
  if (queryParams.scheme) {
    filter.scheme = new RegExp(queryParams.scheme, 'i');
  }
  
  if (queryParams.priority) {
    filter.priority = queryParams.priority;
  }
  
  if (queryParams.isActive !== undefined) {
    filter.isActive = queryParams.isActive === 'true';
  }
  
  return filter;
};

exports.getAllWorkTypes = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const sortBy = req.query.sortBy || 'entryDate';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    
    let filter = buildFilterQuery(req.query);
    
    // Add text search if search query is provided
    if (req.query.search) {
      filter.$text = { $search: req.query.search };
    }
    
    const [workTypes, total] = await Promise.all([
      WorkType.find(filter)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),
      WorkType.countDocuments(filter)
    ]);
    
    res.json({
      data: workTypes,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalRecords: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getWorkTypeById = async (req, res) => {
  try {
    const workType = await WorkType.findById(req.params.id);
    
    if (!workType) {
      return res.status(404).json({ message: 'Work type not found' });
    }
    
    res.json({ data: workType });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid work type ID' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.createWorkType = async (req, res) => {
  try {
    const workType = new WorkType(req.body);
    await workType.save();
    
    res.status(201).json({
      message: 'Work type created successfully',
      data: workType
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Validation failed',
        errors: Object.values(error.errors).map(err => ({ field: err.path, message: err.message }))
      });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.updateWorkType = async (req, res) => {
  try {
    const workType = await WorkType.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!workType) {
      return res.status(404).json({ message: 'Work type not found' });
    }
    
    res.json({
      message: 'Work type updated successfully',
      data: workType
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid work type ID' });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Validation failed',
        errors: Object.values(error.errors).map(err => ({ field: err.path, message: err.message }))
      });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.deleteWorkType = async (req, res) => {
  try {
    const workType = await WorkType.findByIdAndDelete(req.params.id);
    
    if (!workType) {
      return res.status(404).json({ message: 'Work type not found' });
    }
    
    res.json({ message: 'Work type deleted successfully' });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid work type ID' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getWorkTypesByDepartment = async (req, res) => {
  try {
    const workTypes = await WorkType.find({ 
      department: new RegExp(req.params.department, 'i'),
      isActive: true 
    }).sort({ workType: 1 });
    
    res.json({ data: workTypes });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
