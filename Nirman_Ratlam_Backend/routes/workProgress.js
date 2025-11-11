const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { auth } = require('../middleware/auth');
const {
  updateWorkProgress,
  addInstallment,
  completeWork,
  getProgressHistory,
  getAllWorkProgress
} = require('../controllers/workProgressController');

// Validation middleware
const updateProgressValidation = [
  body('progressPercentage').isFloat({ min: 0, max: 100 }).withMessage('Progress percentage must be between 0 and 100'),
  body('expenditureAmount').optional().isNumeric().withMessage('Expenditure amount must be a number'),
  body('installmentAmount').optional().isNumeric().withMessage('Installment amount must be a number'),
  body('installmentDate').optional().isISO8601().withMessage('Valid installment date is required')
];

const addInstallmentValidation = [
  body('amount').isNumeric().withMessage('Amount is required and must be a number'),
  body('date').isISO8601().withMessage('Valid date is required')
];

const completeWorkValidation = [
  body('finalExpenditureAmount').optional().isNumeric().withMessage('Final expenditure amount must be a number')
];

// @route   POST /api/work-proposals/:id/progress
// @desc    Update work progress
// @access  Private (Progress Monitor)
router.post('/:id/progress', auth, updateProgressValidation, updateWorkProgress);

// @route   POST /api/work-proposals/:id/progress/installment
// @desc    Add installment payment
// @access  Private (Progress Monitor, Admin)
router.post('/:id/progress/installment', auth, addInstallmentValidation, addInstallment);

// @route   POST /api/work-proposals/:id/progress/complete
// @desc    Complete work
// @access  Private (Progress Monitor, Admin)
router.post('/:id/progress/complete', auth, completeWorkValidation, completeWork);

// @route   GET /api/work-proposals/:id/progress/history
// @desc    Get work progress history
// @access  Private
router.get('/:id/progress/history', auth, getProgressHistory);

// @route   GET /api/work-progress
// @desc    Get all work progress (dashboard view)
// @access  Private
router.get('/', auth, getAllWorkProgress);

module.exports = router;