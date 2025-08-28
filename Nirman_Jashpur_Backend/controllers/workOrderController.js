const WorkProposal = require('../models/WorkProposal');
const User = require('../models/User');
const { validationResult } = require('express-validator');

// @desc    Create work order
// @route   POST /api/work-proposals/:id/work-order
// @access  Private (Work Order Manager)
const createWorkOrder = async (req, res) => {
  try {
    const { workOrderNumber, dateOfWorkOrder, workOrderAmount, contractorOrGramPanchayat, remark } = req.body;

    if (!workOrderNumber || !dateOfWorkOrder || !workOrderAmount || !contractorOrGramPanchayat) {
      return res.status(400).json({
        success: false,
        message: 'All work order fields are required'
      });
    }

    const workProposal = await WorkProposal.findById(req.params.id);

    if (!workProposal) {
      return res.status(404).json({
        success: false,
        message: 'Work proposal not found'
      });
    }

    if (workProposal.currentStatus !== 'Pending Work Order') {
      return res.status(400).json({
        success: false,
        message: 'Proposal is not pending work order creation'
      });
    }

    // Check if work order number already exists
    const existingWorkOrder = await WorkProposal.findOne({
      'workOrder.workOrderNumber': workOrderNumber
    });

    if (existingWorkOrder) {
      return res.status(400).json({
        success: false,
        message: 'Work order number already exists'
      });
    }

    workProposal.workOrder = {
      workOrderNumber,
      dateOfWorkOrder: new Date(dateOfWorkOrder),
      workOrderAmount,
      contractorOrGramPanchayat,
      remark,
      issuedBy: req.user.id
    };

    workProposal.currentStatus = 'Work In Progress';
    workProposal.workProgressStage = 'Work In Progress';

    // Initialize work progress tracking
    workProposal.workProgress = {
      sanctionedAmount: workOrderAmount,
      totalAmountReleasedSoFar: 0,
      remainingBalance: workOrderAmount,
      installments: [],
      progressPercentage: 0
    };

    await workProposal.save();

    res.json({
      success: true,
      message: 'Work order created successfully',
      data: workProposal
    });
  } catch (error) {
    console.error('Error creating work order:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating work order',
      error: error.message
    });
  }
};

// @desc    Update work order
// @route   PUT /api/work-proposals/:id/work-order
// @access  Private (Work Order Manager)
const updateWorkOrder = async (req, res) => {
  try {
    const { workOrderAmount, contractorOrGramPanchayat, remark } = req.body;

    const workProposal = await WorkProposal.findById(req.params.id);

    if (!workProposal) {
      return res.status(404).json({
        success: false,
        message: 'Work proposal not found'
      });
    }

    if (!workProposal.workOrder || !workProposal.workOrder.workOrderNumber) {
      return res.status(400).json({
        success: false,
        message: 'Work order does not exist'
      });
    }

    // Check if work has started (prevent major changes after work starts)
    if (workProposal.currentStatus === 'Work In Progress' || workProposal.currentStatus === 'Work Completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update work order after work has started'
      });
    }

    // Update allowed fields
    if (workOrderAmount) {
      workProposal.workOrder.workOrderAmount = workOrderAmount;
      // Update sanctioned amount in work progress
      if (workProposal.workProgress) {
        workProposal.workProgress.sanctionedAmount = workOrderAmount;
        workProposal.workProgress.remainingBalance = workOrderAmount - (workProposal.workProgress.totalAmountReleasedSoFar || 0);
      }
    }

    if (contractorOrGramPanchayat) {
      workProposal.workOrder.contractorOrGramPanchayat = contractorOrGramPanchayat;
    }

    if (remark) {
      workProposal.workOrder.remark = remark;
    }

    await workProposal.save();

    res.json({
      success: true,
      message: 'Work order updated successfully',
      data: workProposal
    });
  } catch (error) {
    console.error('Error updating work order:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating work order',
      error: error.message
    });
  }
};

// @desc    Start work (change status to Work In Progress)
// @route   POST /api/work-proposals/:id/work-order/start-work
// @access  Private (Work Order Manager, Progress Monitor)
const startWork = async (req, res) => {
  try {
    const workProposal = await WorkProposal.findById(req.params.id);

    if (!workProposal) {
      return res.status(404).json({
        success: false,
        message: 'Work proposal not found'
      });
    }

    if (workProposal.currentStatus !== 'Work Order Created') {
      return res.status(400).json({
        success: false,
        message: 'Work order must be created before starting work'
      });
    }

    workProposal.currentStatus = 'Work In Progress';
    workProposal.workProgressStage = 'Work In Progress';

    await workProposal.save();

    res.json({
      success: true,
      message: 'Work started successfully',
      data: workProposal
    });
  } catch (error) {
    console.error('Error starting work:', error);
    res.status(500).json({
      success: false,
      message: 'Error starting work',
      error: error.message
    });
  }
};

// @desc    Get all work orders with filtering
// @route   GET /api/work-orders
// @access  Private (Work Order Manager, Admin)
const getAllWorkOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let filter = {
      'workOrder.workOrderNumber': { $exists: true }
    };

    // Filter by status
    if (req.query.status) {
      filter.currentStatus = req.query.status;
    }

    // Filter by contractor/gram panchayat
    if (req.query.contractor) {
      filter['workOrder.contractorOrGramPanchayat'] = new RegExp(req.query.contractor, 'i');
    }

    // Filter by work order date range
    if (req.query.fromDate && req.query.toDate) {
      filter['workOrder.dateOfWorkOrder'] = {
        $gte: new Date(req.query.fromDate),
        $lte: new Date(req.query.toDate)
      };
    }

    // Filter by department
    if (req.query.department) {
      filter.workDepartment = new RegExp(req.query.department, 'i');
    }

    const workOrders = await WorkProposal.find(filter)
      .populate('submittedBy', 'fullName email department')
      .populate('workOrder.issuedBy', 'fullName email department')
      .sort({ 'workOrder.dateOfWorkOrder': -1 })
      .skip(skip)
      .limit(limit);

    const total = await WorkProposal.countDocuments(filter);

    res.json({
      success: true,
      data: workOrders,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        limit
      }
    });
  } catch (error) {
    console.error('Error fetching work orders:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching work orders',
      error: error.message
    });
  }
};

// @desc    Get work order by ID
// @route   GET /api/work-proposals/:id/work-order
// @access  Private
const getWorkOrder = async (req, res) => {
  try {
    const workProposal = await WorkProposal.findById(req.params.id)
      .populate('submittedBy', 'fullName email department designation')
      .populate('workOrder.issuedBy', 'fullName email department designation');

    if (!workProposal) {
      return res.status(404).json({
        success: false,
        message: 'Work proposal not found'
      });
    }

    if (!workProposal.workOrder || !workProposal.workOrder.workOrderNumber) {
      return res.status(404).json({
        success: false,
        message: 'Work order not found'
      });
    }

    res.json({
      success: true,
      data: {
        workProposal: {
          _id: workProposal._id,
          serialNumber: workProposal.serialNumber,
          nameOfWork: workProposal.nameOfWork,
          workDescription: workProposal.workDescription,
          workDepartment: workProposal.workDepartment,
          currentStatus: workProposal.currentStatus,
          submittedBy: workProposal.submittedBy
        },
        workOrder: workProposal.workOrder,
        workProgress: workProposal.workProgress
      }
    });
  } catch (error) {
    console.error('Error fetching work order:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching work order',
      error: error.message
    });
  }
};

module.exports = {
  createWorkOrder,
  updateWorkOrder,
  startWork,
  getAllWorkOrders,
  getWorkOrder
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
    filter.orderStatus = queryParams.status;
  }
  
  if (queryParams.workAgency) {
    filter.workAgency = new RegExp(queryParams.workAgency, 'i');
  }
  
  return filter;
};

exports.getAllWorkOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const sortBy = req.query.sortBy || 'entryDate';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    
    const filter = buildFilterQuery(req.query);
    
    const [workOrders, total] = await Promise.all([
      WorkOrder.find(filter)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),
      WorkOrder.countDocuments(filter)
    ]);
    
    res.json({
      data: workOrders,
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

exports.getWorkOrderById = async (req, res) => {
  try {
    const workOrder = await WorkOrder.findById(req.params.id);
    
    if (!workOrder) {
      return res.status(404).json({ message: 'Work order not found' });
    }
    
    res.json({ data: workOrder });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid work order ID' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.createWorkOrder = async (req, res) => {
  try {
    const workOrder = new WorkOrder(req.body);
    await workOrder.save();
    
    res.status(201).json({
      message: 'Work order created successfully',
      data: workOrder
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

exports.updateWorkOrder = async (req, res) => {
  try {
    const workOrder = await WorkOrder.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!workOrder) {
      return res.status(404).json({ message: 'Work order not found' });
    }
    
    res.json({
      message: 'Work order updated successfully',
      data: workOrder
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid work order ID' });
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

exports.deleteWorkOrder = async (req, res) => {
  try {
    const workOrder = await WorkOrder.findByIdAndDelete(req.params.id);
    
    if (!workOrder) {
      return res.status(404).json({ message: 'Work order not found' });
    }
    
    res.json({ message: 'Work order deleted successfully' });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid work order ID' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
