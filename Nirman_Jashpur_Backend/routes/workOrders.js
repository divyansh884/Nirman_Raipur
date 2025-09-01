const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { auth } = require('../middleware/auth');
const {
  createWorkOrder,
  updateWorkOrder,
  startWork,
  getAllWorkOrders,
  getWorkOrder
} = require('../controllers/workOrderController');
const { uploadFields, s3UploadDoc } = require('../middleware/upload');

// Validation middleware
const createWorkOrderValidation = [
  body('workOrderNumber').notEmpty().withMessage('Work order number is required'),
  body('dateOfWorkOrder').isISO8601().withMessage('Valid work order date is required'),
  // body('workOrderAmount').isNumeric().withMessage('Work order amount must be a number'),
  body('contractorOrGramPanchayat').notEmpty().withMessage('Contractor or Gram Panchayat is required')
];

const updateWorkOrderValidation = [
  // body('workOrderAmount').optional().isNumeric().withMessage('Work order amount must be a number'),
  body('contractorOrGramPanchayat').optional().notEmpty().withMessage('Contractor or Gram Panchayat cannot be empty')
];

// @route   POST /api/work-proposals/:id/work-order
// @desc    Create work order
// @access  Private (Work Order Manager)
router.post('/:id/work-order', auth, uploadFields, s3UploadDoc, createWorkOrderValidation, createWorkOrder);

// @route   PUT /api/work-proposals/:id/work-order
// @desc    Update work order
// @access  Private (Work Order Manager)
router.put('/:id/work-order', auth, updateWorkOrderValidation, updateWorkOrder);

// @route   POST /api/work-proposals/:id/work-order/start-work
// @desc    Start work (change status to Work In Progress)
// @access  Private (Work Order Manager, Progress Monitor)
router.post('/:id/work-order/start-work', auth, startWork);

// @route   GET /api/work-proposals/:id/work-order
// @desc    Get work order by ID
// @access  Private
router.get('/:id/work-order', auth, getWorkOrder);

// @route   GET /api/work-orders
// @desc    Get all work orders with filtering
// @access  Private (Work Order Manager, Admin)
router.get('/', auth, getAllWorkOrders);

module.exports = router;
