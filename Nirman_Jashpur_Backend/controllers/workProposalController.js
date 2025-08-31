const WorkProposal = require('../models/WorkProposal');
const User = require('../models/User');
const { validationResult } = require('express-validator');

// @desc    Create new work proposal
// @route   POST /api/work-proposals
// @access  Private (Department User)
const createWorkProposal = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const workProposal = new WorkProposal({
      ...req.body,
      submittedBy: req.user.id,
      currentStatus: 'Pending Technical Approval',
      workProgressStage: 'Pending Technical Approval'
    });

    await workProposal.save();

    res.status(201).json({
      success: true,
      message: 'Work proposal created successfully',
      data: workProposal
    });
  } catch (error) {
    console.error('Error creating work proposal:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating work proposal',
      error: error.message
    });
  }
};

// @desc    Get all work proposals with filtering and pagination
// @route   GET /api/work-proposals
// @access  Private
const getWorkProposals = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter object
    let filter = {};
    
    // Filter by status
    if (req.query.status) {
      filter.currentStatus = req.query.status;
    }
    
    // Filter by department
    if (req.query.department) {
      filter.workDepartment = new RegExp(req.query.department, 'i');
    }
    
    // Filter by financial year
    if (req.query.financialYear) {
      filter.financialYear = req.query.financialYear;
    }
    
    // Filter by user's submitted proposals (for Department Users)
    // if (req.user.role === 'Department User') {
    //   filter.submittedBy = req.user.id;
    // }
    
    // Filter by approving department (for approvers)
    // if (req.user.role === 'Technical Approver' || req.user.role === 'Administrative Approver') {
    //   filter.approvingDepartment = req.user.department;
    // }

    // Search functionality
    if (req.query.search) {
      filter.$text = { $search: req.query.search };
    }

    const workProposals = await WorkProposal.find(filter)
      .populate('submittedBy', 'fullName email department')
      .populate('technicalApproval.approvedBy', 'fullName email')
      .populate('administrativeApproval.approvedBy', 'fullName email')
      .populate("typeOfWork", "name")
      .populate("workAgency", "name")
      .populate("scheme", "name")
      .populate("workDepartment", "name")
      .populate("approvingDepartment", "name")
      .populate("typeOfLocation", "name")
      .populate("city", "name")
      .populate("ward", "name")
      .populate("appointedEngineer", "name")
      .populate("appointedSDO", "name")
      .sort({ lastStatusUpdate: -1 })
      .skip(skip)
      .limit(limit);

    const total = await WorkProposal.countDocuments(filter);

    res.json({
      success: true,
      data: workProposals,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        limit
      }
    });
  } catch (error) {
    console.error('Error fetching work proposals:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching work proposals',
      error: error.message
    });
  }
};

// @desc    Get single work proposal by ID
// @route   GET /api/work-proposals/:id
// @access  Private
const getWorkProposal = async (req, res) => {
  try {
    const workProposal = await WorkProposal.findById(req.params.id)
      .populate('submittedBy', 'fullName email department designation')
      .populate('technicalApproval.approvedBy', 'fullName email department')
      .populate('administrativeApproval.approvedBy', 'fullName email department')
      .populate('workOrder.issuedBy', 'fullName email department')
      .populate('workProgress.lastUpdatedBy', 'fullName email department');

    if (!workProposal) {
      return res.status(404).json({
        success: false,
        message: 'Work proposal not found'
      });
    }

    // Check access permissions
    if (req.user.role === 'Department User' && workProposal.submittedBy._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: workProposal
    });
  } catch (error) {
    console.error('Error fetching work proposal:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching work proposal',
      error: error.message
    });
  }
};

// @desc    Update work proposal (basic info only)
// @route   PUT /api/work-proposals/:id
// @access  Private (Only submitter and before technical approval)
const updateWorkProposal = async (req, res) => {
  try {
    const workProposal = await WorkProposal.findById(req.params.id);

    if (!workProposal) {
      return res.status(404).json({
        success: false,
        message: 'Work proposal not found'
      });
    }

    // Check if user can update
    if (workProposal.submittedBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only the submitter can update the proposal'
      });
    }

    // Check if proposal can be updated (only before technical approval)
    if (workProposal.currentStatus !== 'Pending Technical Approval') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update proposal after technical approval process has started'
      });
    }

    const allowedUpdates = [
      'typeOfWork', 'nameOfWork', 'workAgency', 'scheme', 'nameOfJPDBT', 
      'nameOfGPWard', 'workDescription', 'financialYear', 'workDepartment',
      'approvingDepartment', 'sanctionAmount', 'plan',
      'assembly', 'longitude', 'latitude', 'typeOfLocation', 'city', 'ward',
      'workType', 'workName', 'appointedEngineer', 'appointedSDO',
      'estimatedCompletionDateOfWork', 'isDPROrNot', 'isTenderOrNot'
    ];

    const updates = {};
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    updates.lastRevision = new Date();

    const updatedProposal = await WorkProposal.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('submittedBy', 'fullName email department');

    res.json({
      success: true,
      message: 'Work proposal updated successfully',
      data: updatedProposal
    });
  } catch (error) {
    console.error('Error updating work proposal:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating work proposal',
      error: error.message
    });
  }
};

// @desc    Delete work proposal
// @route   DELETE /api/work-proposals/:id
// @access  Private (Only submitter and before technical approval)
const deleteWorkProposal = async (req, res) => {
  try {
    const workProposal = await WorkProposal.findById(req.params.id);

    if (!workProposal) {
      return res.status(404).json({
        success: false,
        message: 'Work proposal not found'
      });
    }

    // Check permissions
    if (workProposal.submittedBy.toString() !== req.user.id && req.user.role !== 'Super Admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check if can be deleted
    if (workProposal.currentStatus !== 'Pending Technical Approval' && 
    workProposal.currentStatus !== 'Work Completed' && workProposal.currentStatus !== 'Pending Administrative Approval' &&
    req.user.role !== 'Super Admin') {
  return res.status(400).json({
    success: false,
    message: 'Cannot delete proposal after approval process has started'
  });
}


    await WorkProposal.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Work proposal deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting work proposal:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting work proposal',
      error: error.message
    });
  }
};

// @desc    Technical Approval/Rejection
// @route   POST /api/work-proposals/:id/technical-approval
// @access  Private (Technical Approver)
const technicalApproval = async (req, res) => {
  try {
    const { action, approvalNumber, amountOfTechnicalSanction, remarks, rejectionReason } = req.body;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Action must be either "approve" or "reject"'
      });
    }

    const workProposal = await WorkProposal.findById(req.params.id);

    if (!workProposal) {
      return res.status(404).json({
        success: false,
        message: 'Work proposal not found'
      });
    }

    if (workProposal.currentStatus !== 'Pending Technical Approval') {
      return res.status(400).json({
        success: false,
        message: 'Proposal is not pending technical approval'
      });
    }

    // Check if user has permission to approve for this department
    // if (workProposal.approvingDepartment !== req.user.department && req.user.role !== 'Super Admin') {
    //   return res.status(403).json({
    //     success: false,
    //     message: 'You can only approve proposals for your department'
    //   });
    // }

    if (action === 'approve') {
      if (!approvalNumber || !amountOfTechnicalSanction) {
        return res.status(400).json({
          success: false,
          message: 'Approval number and technical sanction amount are required for approval'
        });
      }

      workProposal.technicalApproval = {
        status: 'Approved',
        approvalNumber,
        approvalDate: new Date(),
        amountOfTechnicalSanction,
        forwardingDate: new Date(),
        remarks,
        approvedBy: req.user.id
      };

      workProposal.currentStatus = 'Pending Administrative Approval';
      workProposal.workProgressStage = 'Pending Administrative Approval';
    } else {
      workProposal.technicalApproval = {
        status: 'Rejected',
        rejectionReason,
        remarks,
        approvedBy: req.user.id
      };

      workProposal.currentStatus = 'Rejected Technical Approval';
      workProposal.workProgressStage = 'Rejected Technical Approval';
    }

    await workProposal.save();

    res.json({
      success: true,
      message: `Technical approval ${action}d successfully`,
      data: workProposal
    });
  } catch (error) {
    console.error('Error in technical approval:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing technical approval',
      error: error.message
    });
  }
};

// @desc    Administrative Approval/Rejection
// @route   POST /api/work-proposals/:id/administrative-approval
// @access  Private (Administrative Approver)
const administrativeApproval = async (req, res) => {
  try {
    const { action, byGovtDistrictAS, approvalNumber, approvedAmount, remarks, rejectionReason } = req.body;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Action must be either "approve" or "reject"'
      });
    }

    const workProposal = await WorkProposal.findById(req.params.id);

    if (!workProposal) {
      return res.status(404).json({
        success: false,
        message: 'Work proposal not found'
      });
    }

    if (workProposal.currentStatus !== 'Pending Administrative Approval') {
      return res.status(400).json({
        success: false,
        message: 'Proposal is not pending administrative approval'
      });
    }

    if (action === 'approve') {
      if (!approvalNumber || !approvedAmount) {
        return res.status(400).json({
          success: false,
          message: 'Approval number and approved amount are required for approval'
        });
      }

      workProposal.administrativeApproval = {
        status: 'Approved',
        byGovtDistrictAS,
        approvalNumber,
        approvalDate: new Date(),
        approvedAmount,
        remarks,
        approvedBy: req.user.id
      };

      // Determine next stage based on tender requirement
      if (workProposal.isTenderOrNot) {
        workProposal.currentStatus = 'Pending Tender';
        workProposal.workProgressStage = 'Pending Tender';
      } else {
        workProposal.currentStatus = 'Pending Work Order';
        workProposal.workProgressStage = 'Pending Work Order';
      }
    } else {
      workProposal.administrativeApproval = {
        status: 'Rejected',
        rejectionReason,
        remarks,
        approvedBy: req.user.id
      };

      workProposal.currentStatus = 'Rejected Administrative Approval';
      workProposal.workProgressStage = 'Rejected Administrative Approval';
    }

    await workProposal.save();

    res.json({
      success: true,
      message: `Administrative approval ${action}d successfully`,
      data: workProposal
    });
  } catch (error) {
    console.error('Error in administrative approval:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing administrative approval',
      error: error.message
    });
  }
};

module.exports = {
  createWorkProposal,
  getWorkProposals,
  getWorkProposal,
  updateWorkProposal,
  deleteWorkProposal,
  technicalApproval,
  administrativeApproval
};
