const WorkProposal = require('../models/WorkProposal');
const User = require('../models/User');
const { validationResult } = require('express-validator');

// @desc    Update work progress
// @route   POST /api/work-proposals/:id/progress
// @access  Private (Progress Monitor)
const updateWorkProgress = async (req, res) => {
  try {
    const { 
      progressPercentage, 
      mbStageMeasurementBookStag, 
      expenditureAmount,
      installmentAmount,
      installmentDate,
    } = req.body;

    if (progressPercentage < 0 || progressPercentage > 100) {
      return res.status(400).json({
        success: false,
        message: 'Progress percentage must be between 0 and 100'
      });
    }

    const workProposal = await WorkProposal.findById(req.params.id);

    if (!workProposal) {
      return res.status(404).json({
        success: false,
        message: 'Work proposal not found'
      });
    }

    if (workProposal.currentStatus !== 'Work In Progress' && workProposal.currentStatus !== 'Work Order Created') {
      return res.status(400).json({
        success: false,
        message: 'Work must be in progress to update progress'
      });
    }

    // Update work progress
    workProposal.workProgress.progressPercentage = progressPercentage;
    
    if (mbStageMeasurementBookStag) {
      workProposal.workProgress.mbStageMeasurementBookStag = mbStageMeasurementBookStag;
    }
    
    if (expenditureAmount) {
      workProposal.workProgress.expenditureAmount = expenditureAmount;
    }

    // Add installment if provided
    if (installmentAmount && installmentDate) {
      const installmentNo = workProposal.workProgress.installments.length + 1;
      
      workProposal.workProgress.installments.push({
        installmentNo,
        amount: installmentAmount,
        date: new Date(installmentDate)
      });

      // Update total amount released
      workProposal.workProgress.totalAmountReleasedSoFar = 
        (workProposal.workProgress.totalAmountReleasedSoFar || 0) + installmentAmount;

      // Update remaining balance
      workProposal.workProgress.remainingBalance = 
        workProposal.workProgress.sanctionedAmount - workProposal.workProgress.totalAmountReleasedSoFar;
    }

    workProposal.workProgress.lastUpdatedBy = req.user.id;

    // Change status to Work In Progress if it was Work Order Created
    if (workProposal.currentStatus === 'Work Order Created') {
      workProposal.currentStatus = 'Work In Progress';
      workProposal.workProgressStage = 'Work In Progress';
    }

    // Check if work is completed (100% progress)
    if (progressPercentage === 100) {
      workProposal.currentStatus = 'Work Completed';
      workProposal.workProgressStage = 'Work Completed';
      workProposal.completionDate = new Date();
      
      // Set final cost from work order amount or expenditure
      workProposal.finalCost = workProposal.workProgress.expenditureAmount || workProposal.workOrder.workOrderAmount;
    }

    await workProposal.save();

    res.json({
      success: true,
      message: 'Work progress updated successfully',
      data: workProposal
    });
  } catch (error) {
    console.error('Error updating work progress:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating work progress',
      error: error.message
    });
  }
};

// @desc    Add installment payment
// @route   POST /api/work-proposals/:id/progress/installment
// @access  Private (Progress Monitor, Admin)
const addInstallment = async (req, res) => {
  try {
    const { amount, date, description } = req.body;

    if (!amount || !date) {
      return res.status(400).json({
        success: false,
        message: 'Amount and date are required for installment'
      });
    }

    const workProposal = await WorkProposal.findById(req.params.id);

    if (!workProposal) {
      return res.status(404).json({
        success: false,
        message: 'Work proposal not found'
      });
    }

    if (!workProposal.workProgress) {
      return res.status(400).json({
        success: false,
        message: 'Work progress not initialized'
      });
    }

    // Check if adding this amount exceeds sanctioned amount
    const newTotalReleased = (workProposal.workProgress.totalAmountReleasedSoFar || 0) + amount;
    
    if (newTotalReleased > workProposal.workProgress.sanctionedAmount) {
      return res.status(400).json({
        success: false,
        message: 'Installment amount exceeds remaining sanctioned amount'
      });
    }

    const installmentNo = workProposal.workProgress.installments.length + 1;
    
    workProposal.workProgress.installments.push({
      installmentNo,
      amount,
      date: new Date(date),
      description
    });

    // Update totals
    workProposal.workProgress.totalAmountReleasedSoFar = newTotalReleased;
    workProposal.workProgress.remainingBalance = 
      workProposal.workProgress.sanctionedAmount - newTotalReleased;

    workProposal.workProgress.lastUpdatedBy = req.user.id;

    await workProposal.save();

    res.json({
      success: true,
      message: 'Installment added successfully',
      data: {
        installment: workProposal.workProgress.installments[workProposal.workProgress.installments.length - 1],
        totalReleased: workProposal.workProgress.totalAmountReleasedSoFar,
        remainingBalance: workProposal.workProgress.remainingBalance
      }
    });
  } catch (error) {
    console.error('Error adding installment:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding installment',
      error: error.message
    });
  }
};

// @desc    Complete work
// @route   POST /api/work-proposals/:id/progress/complete
// @access  Private (Progress Monitor, Admin)
const completeWork = async (req, res) => {
  try {
    const { finalExpenditureAmount, completionDocuments } = req.body;

    const workProposal = await WorkProposal.findById(req.params.id);

    if (!workProposal) {
      return res.status(404).json({
        success: false,
        message: 'Work proposal not found'
      });
    }

    if (workProposal.currentStatus !== 'Work In Progress') {
      return res.status(400).json({
        success: false,
        message: 'Work must be in progress to complete'
      });
    }

    // Set progress to 100%
    workProposal.workProgress.progressPercentage = 100;
    
    if (finalExpenditureAmount) {
      workProposal.workProgress.expenditureAmount = finalExpenditureAmount;
      workProposal.finalCost = finalExpenditureAmount;
    } else {
      workProposal.finalCost = workProposal.workOrder.workOrderAmount;
    }

    workProposal.currentStatus = 'Work Completed';
    workProposal.workProgressStage = 'Work Completed';
    workProposal.completionDate = new Date();
    workProposal.workProgress.lastUpdatedBy = req.user.id;

    if (completionDocuments && Array.isArray(completionDocuments)) {
      workProposal.completionDocuments = completionDocuments;
    }

    await workProposal.save();

    res.json({
      success: true,
      message: 'Work completed successfully',
      data: workProposal
    });
  } catch (error) {
    console.error('Error completing work:', error);
    res.status(500).json({
      success: false,
      message: 'Error completing work',
      error: error.message
    });
  }
};

// @desc    Get work progress history
// @route   GET /api/work-proposals/:id/progress/history
// @access  Private
const getProgressHistory = async (req, res) => {
  try {
    const workProposal = await WorkProposal.findById(req.params.id)
      .populate('workProgress.lastUpdatedBy', 'fullName email department')
      .select('workProgress serialNumber nameOfWork currentStatus');

    if (!workProposal) {
      return res.status(404).json({
        success: false,
        message: 'Work proposal not found'
      });
    }

    res.json({
      success: true,
      data: {
        workInfo: {
          serialNumber: workProposal.serialNumber,
          nameOfWork: workProposal.nameOfWork,
          currentStatus: workProposal.currentStatus
        },
        progress: workProposal.workProgress
      }
    });
  } catch (error) {
    console.error('Error fetching progress history:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching progress history',
      error: error.message
    });
  }
};

// @desc    Get all work progress (dashboard view)
// @route   GET /api/work-progress
// @access  Private
const getAllWorkProgress = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let filter = {
      currentStatus: { $in: ['Work Order Created', 'Work In Progress', 'Work Completed'] }
    };

    // Filter by status
    if (req.query.status) {
      filter.currentStatus = req.query.status;
    }

    // Filter by department
    if (req.query.department) {
      filter.workDepartment = new RegExp(req.query.department, 'i');
    }

    // Filter by progress range
    if (req.query.minProgress && req.query.maxProgress) {
      filter['workProgress.progressPercentage'] = {
        $gte: parseInt(req.query.minProgress),
        $lte: parseInt(req.query.maxProgress)
      };
    }

    const workProgress = await WorkProposal.find(filter)
      .populate('submittedBy', 'fullName email department')
      .populate('workProgress.lastUpdatedBy', 'fullName email')
      .select('serialNumber nameOfWork workDepartment currentStatus workProgress workOrder.dateOfWorkOrder completionDate')
      .sort({ 'workProgress.updatedAt': -1 })
      .skip(skip)
      .limit(limit);

    const total = await WorkProposal.countDocuments(filter);

    res.json({
      success: true,
      data: workProgress,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        limit
      }
    });
  } catch (error) {
    console.error('Error fetching work progress:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching work progress',
      error: error.message
    });
  }
};

module.exports = {
  updateWorkProgress,
  addInstallment,
  completeWork,
  getProgressHistory,
  getAllWorkProgress
};

// Helper function to build filter query
const buildFilterQuery = (queryParams) => {
  const filter = {};
  
  if (queryParams.area) {
    filter.area = new RegExp(queryParams.area, 'i');
  }
  
  if (queryParams.scheme) {
    filter.scheme = new RegExp(queryParams.scheme, 'i');
  }
  
  if (queryParams.status) {
    filter.workProgressStage = queryParams.status;
  }
  
  if (queryParams.workAgency) {
    filter.workAgency = new RegExp(queryParams.workAgency, 'i');
  }
  
  return filter;
};

exports.getAllWorkProgress = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const sortBy = req.query.sortBy || 'entryDate';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    
    const filter = buildFilterQuery(req.query);
    
    const [workProgressRecords, total] = await Promise.all([
      WorkProgress.find(filter)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),
      WorkProgress.countDocuments(filter)
    ]);
    
    res.json({
      data: workProgressRecords,
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

exports.getWorkProgressById = async (req, res) => {
  try {
    const workProgress = await WorkProgress.findById(req.params.id);
    
    if (!workProgress) {
      return res.status(404).json({ message: 'Work progress record not found' });
    }
    
    res.json({ data: workProgress });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid work progress ID' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.createWorkProgress = async (req, res) => {
  try {
    const workProgress = new WorkProgress(req.body);
    await workProgress.save();
    
    res.status(201).json({
      message: 'Work progress record created successfully',
      data: workProgress
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

exports.updateWorkProgress = async (req, res) => {
  try {
    const workProgress = await WorkProgress.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!workProgress) {
      return res.status(404).json({ message: 'Work progress record not found' });
    }
    
    res.json({
      message: 'Work progress record updated successfully',
      data: workProgress
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid work progress ID' });
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
exports.deleteWorkProgress = async (req, res) => {
  try {
    const workProgress = await WorkProgress.findByIdAndDelete(req.params.id);
    
    if (!workProgress) {
      return res.status(404).json({ message: 'Work progress record not found' });
    }
    res.json({ message: 'Work progress record deleted successfully' });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid work progress ID' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
