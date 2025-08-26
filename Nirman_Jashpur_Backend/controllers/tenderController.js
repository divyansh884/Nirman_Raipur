const WorkProposal = require('../models/WorkProposal');
const User = require('../models/User');
const { validationResult } = require('express-validator');

// @desc    Start tender process
// @route   POST /api/work-proposals/:id/tender/start
// @access  Private (Tender Manager)
const startTenderProcess = async (req, res) => {
  try {
    const { tenderTitle, tenderID, department, issuedDates, remark } = req.body;

    const workProposal = await WorkProposal.findById(req.params.id);

    if (!workProposal) {
      return res.status(404).json({
        success: false,
        message: 'Work proposal not found'
      });
    }

    if (workProposal.currentStatus !== 'Pending Tender') {
      return res.status(400).json({
        success: false,
        message: 'Proposal is not pending tender process'
      });
    }

    if (!workProposal.isTenderOrNot) {
      return res.status(400).json({
        success: false,
        message: 'This proposal does not require tender process'
      });
    }

    workProposal.tenderProcess = {
      tenderTitle,
      tenderID,
      department,
      issuedDates: new Date(issuedDates),
      remark,
      tenderStatus: 'Notice Published'
    };

    workProposal.currentStatus = 'Tender In Progress';
    workProposal.workProgressStage = 'Tender In Progress';

    await workProposal.save();

    res.json({
      success: true,
      message: 'Tender process started successfully',
      data: workProposal
    });
  } catch (error) {
    console.error('Error starting tender process:', error);
    res.status(500).json({
      success: false,
      message: 'Error starting tender process',
      error: error.message
    });
  }
};

// @desc    Update tender status
// @route   PUT /api/work-proposals/:id/tender/status
// @access  Private (Tender Manager)
const updateTenderStatus = async (req, res) => {
  try {
    const { tenderStatus, remark } = req.body;

    const validStatuses = ['Notice Published', 'Bid Submission', 'Under Evaluation', 'Awarded', 'Cancelled'];
    
    if (!validStatuses.includes(tenderStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid tender status'
      });
    }

    const workProposal = await WorkProposal.findById(req.params.id);

    if (!workProposal) {
      return res.status(404).json({
        success: false,
        message: 'Work proposal not found'
      });
    }

    if (workProposal.currentStatus !== 'Tender In Progress') {
      return res.status(400).json({
        success: false,
        message: 'Tender process is not in progress'
      });
    }

    workProposal.tenderProcess.tenderStatus = tenderStatus;
    if (remark) {
      workProposal.tenderProcess.remark = remark;
    }

    // If tender is awarded, move to work order stage
    if (tenderStatus === 'Awarded') {
      workProposal.currentStatus = 'Pending Work Order';
      workProposal.workProgressStage = 'Pending Work Order';
    }

    // If tender is cancelled, move back to pending tender
    if (tenderStatus === 'Cancelled') {
      workProposal.currentStatus = 'Pending Tender';
      workProposal.workProgressStage = 'Pending Tender';
      workProposal.tenderProcess.tenderStatus = 'Not Started';
    }

    await workProposal.save();

    res.json({
      success: true,
      message: 'Tender status updated successfully',
      data: workProposal
    });
  } catch (error) {
    console.error('Error updating tender status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating tender status',
      error: error.message
    });
  }
};

// @desc    Award tender to contractor
// @route   POST /api/work-proposals/:id/tender/award
// @access  Private (Tender Manager)
const awardTender = async (req, res) => {
  try {
    const { contractorName, contactInfo, awardedAmount } = req.body;

    if (!contractorName || !awardedAmount) {
      return res.status(400).json({
        success: false,
        message: 'Contractor name and awarded amount are required'
      });
    }

    const workProposal = await WorkProposal.findById(req.params.id);

    if (!workProposal) {
      return res.status(404).json({
        success: false,
        message: 'Work proposal not found'
      });
    }

    if (workProposal.currentStatus !== 'Tender In Progress') {
      return res.status(400).json({
        success: false,
        message: 'Tender process is not in progress'
      });
    }

    workProposal.tenderProcess.selectedContractor = {
      name: contractorName,
      contactInfo,
      awardedAmount
    };

    workProposal.tenderProcess.tenderStatus = 'Awarded';
    workProposal.currentStatus = 'Pending Work Order';
    workProposal.workProgressStage = 'Pending Work Order';

    await workProposal.save();

    res.json({
      success: true,
      message: 'Tender awarded successfully',
      data: workProposal
    });
  } catch (error) {
    console.error('Error awarding tender:', error);
    res.status(500).json({
      success: false,
      message: 'Error awarding tender',
      error: error.message
    });
  }
};

// @desc    Get all tenders with filtering
// @route   GET /api/tenders
// @access  Private (Tender Manager, Admin)
const getAllTenders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let filter = { isTenderOrNot: true };

    // Filter by tender status
    if (req.query.tenderStatus) {
      filter['tenderProcess.tenderStatus'] = req.query.tenderStatus;
    }

    // Filter by department
    if (req.query.department) {
      filter['tenderProcess.department'] = new RegExp(req.query.department, 'i');
    }

    // Filter by date range
    if (req.query.fromDate && req.query.toDate) {
      filter['tenderProcess.issuedDates'] = {
        $gte: new Date(req.query.fromDate),
        $lte: new Date(req.query.toDate)
      };
    }

    const tenders = await WorkProposal.find(filter)
      .populate('submittedBy', 'fullName email department')
      .populate('technicalApproval.approvedBy', 'fullName email')
      .populate('administrativeApproval.approvedBy', 'fullName email')
      .sort({ 'tenderProcess.issuedDates': -1 })
      .skip(skip)
      .limit(limit);

    const total = await WorkProposal.countDocuments(filter);

    res.json({
      success: true,
      data: tenders,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        limit
      }
    });
  } catch (error) {
    console.error('Error fetching tenders:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tenders',
      error: error.message
    });
  }
};

module.exports = {
  startTenderProcess,
  updateTenderStatus,
  awardTender,
  getAllTenders
};
