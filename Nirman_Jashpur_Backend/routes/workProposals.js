const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { auth } = require('../middleware/auth');
const { upload, uploadToGoogleDrive } = require('../middleware/upload');
const {
  createWorkProposal,
  getWorkProposals,
  getWorkProposal,
  updateWorkProposal,
  deleteWorkProposal,
  technicalApproval,
  administrativeApproval
} = require('../controllers/workProposalController');

// Validation middleware
const workProposalValidation = [
  body('typeOfWork').notEmpty().withMessage('Type of work is required'),
  body('nameOfWork').notEmpty().withMessage('Name of work is required'),
  body('workAgency').notEmpty().withMessage('Work agency is required'),
  body('scheme').notEmpty().withMessage('Scheme is required'),
  body('workDescription').notEmpty().withMessage('Work description is required'),
  body('financialYear').notEmpty().withMessage('Financial year is required'),
  body('workDepartment').notEmpty().withMessage('Work department is required'),
  body('userDepartment').notEmpty().withMessage('User department is required'),
  body('approvingDepartment').notEmpty().withMessage('Approving department is required'),
  body('sanctionAmount').isNumeric().withMessage('Sanction amount must be a number'),
  body('estimatedCompletionDateOfWork').isISO8601().withMessage('Valid completion date is required')
];

const technicalApprovalValidation = [
  body('action').isIn(['approve', 'reject']).withMessage('Action must be approve or reject'),
  body('approvalNumber').if(body('action').equals('approve')).notEmpty().withMessage('Approval number is required for approval'),
  body('amountOfTechnicalSanction').if(body('action').equals('approve')).isNumeric().withMessage('Technical sanction amount is required for approval'),
  body('rejectionReason').if(body('action').equals('reject')).notEmpty().withMessage('Rejection reason is required for rejection')
];

const administrativeApprovalValidation = [
  body('action').isIn(['approve', 'reject']).withMessage('Action must be approve or reject'),
  body('approvalNumber').if(body('action').equals('approve')).notEmpty().withMessage('Approval number is required for approval'),
  body('approvedAmount').if(body('action').equals('approve')).isNumeric().withMessage('Approved amount is required for approval'),
  body('rejectionReason').if(body('action').equals('reject')).notEmpty().withMessage('Rejection reason is required for rejection')
];

// @route   POST /api/work-proposals
// @desc    Create new work proposal
// @access  Private (Department User)
router.post('/', 
  auth, 
  upload.array('files', 5),
  uploadToGoogleDrive('workProposals'),
  workProposalValidation, 
  createWorkProposal
);

// @route   GET /api/work-proposals
// @desc    Get all work proposals with filtering and pagination
// @access  Private
router.get('/', auth, getWorkProposals);

// @route   GET /api/work-proposals/:id
// @desc    Get single work proposal by ID
// @access  Private
router.get('/:id', auth, getWorkProposal);

// @route   PUT /api/work-proposals/:id
// @desc    Update work proposal (basic info only, before technical approval)
// @access  Private (Only submitter)
router.put('/:id', 
  auth, 
  upload.array('files', 5),
  uploadToGoogleDrive('workProposals'),
  updateWorkProposal
);

// @route   DELETE /api/work-proposals/:id
// @desc    Delete work proposal (before technical approval)
// @access  Private (Only submitter or Super Admin)
router.delete('/:id', auth, deleteWorkProposal);

// @route   POST /api/work-proposals/:id/technical-approval
// @desc    Technical approval/rejection
// @access  Private (Technical Approver)
router.post('/:id/technical-approval', 
  auth, 
  upload.array('files', 5),
  uploadToGoogleDrive('technicalApprovals'),
  technicalApprovalValidation, 
  technicalApproval
);

// @route   POST /api/work-proposals/:id/administrative-approval
// @desc    Administrative approval/rejection
// @access  Private (Administrative Approver)
router.post('/:id/administrative-approval', 
  auth, 
  upload.array('files', 5),
  uploadToGoogleDrive('administrativeApprovals'),
  administrativeApprovalValidation, 
  administrativeApproval
);

module.exports = router;