const express = require('express');
const router = express.Router();
const { query, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');

const reportsController = require('../controllers/reportsController');
const {
  getDashboardStats,
  getDepartmentWiseReport,
  getStatusWiseReport,
  getFinancialReport,
  getProgressReport,
  getAgencyWiseReport,
  getBlockWiseReport,
  getSchemeWiseReport,
  getPendingWorksReport,
  getFinalStatusReport,
  getEngineerWiseReport,
  getPhotoMissingReport
} = reportsController;

// Helper function to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Validation middleware
const yearValidation = [
  query('year').optional().isInt({ min: 2000, max: 2100 }).withMessage('Year must be a valid year between 2000 and 2100')
];

const financialYearValidation = [
  query('financialYear').optional().matches(/^\d{4}-\d{2}$/).withMessage('Financial year must be in format YYYY-YY')
];

// Legacy routes (for backward compatibility)
// @route   GET /api/reports/dashboard
// @desc    Get dashboard statistics
// @access  Private
router.get('/dashboard', getDashboardStats);

// @route   GET /api/reports/department-wise
// @desc    Get department-wise report
// @access  Private
router.get('/department-wise', ...yearValidation, handleValidationErrors, getDepartmentWiseReport);

// @route   GET /api/reports/status-wise
// @desc    Get status-wise report
// @access  Private
router.get('/status-wise', ...financialYearValidation, handleValidationErrors, getStatusWiseReport);

// @route   GET /api/reports/financial
// @desc    Get financial report
// @access  Private
router.get('/financial', ...financialYearValidation, handleValidationErrors, getFinancialReport);

// @route   GET /api/reports/progress
// @desc    Get progress report
// @access  Private
router.get('/progress', getProgressReport);

// New Required Reports APIs
// @route   GET /api/reports/agency-wise
// @desc    Get agency-wise comprehensive statistics
// @access  Private
router.get('/agency-wise',
  query('year').optional().isInt({ min: 2000, max: 2100 }).withMessage('Year must be a valid year between 2000 and 2100'),
  query('agency').optional().isString().trim().withMessage('Agency must be a string'),
  handleValidationErrors,
  getAgencyWiseReport
);

// @route   GET /api/reports/block-wise
// @desc    Get block-wise work distribution and completion rates
// @access  Private
router.get('/block-wise',
  query('year').optional().isInt({ min: 2000, max: 2100 }).withMessage('Year must be a valid year between 2000 and 2100'),
  query('block').optional().isString().trim().withMessage('Block must be a string'),
  handleValidationErrors,
  getBlockWiseReport
);

// @route   GET /api/reports/scheme-wise
// @desc    Get scheme-wise work statistics
// @access  Private
router.get('/scheme-wise',
  query('year').optional().isInt({ min: 2000, max: 2100 }).withMessage('Year must be a valid year between 2000 and 2100'),
  query('scheme').optional().isString().trim().withMessage('Scheme must be a string'),
  handleValidationErrors,
  getSchemeWiseReport
);

// @route   GET /api/reports/pending
// @desc    Get all pending works with summary statistics
// @access  Private
router.get('/pending',
  query('year').optional().isInt({ min: 2000, max: 2100 }).withMessage('Year must be a valid year between 2000 and 2100'),
  handleValidationErrors,
  getPendingWorksReport
);

// @route   GET /api/reports/final-status
// @desc    Get work distribution by final status with percentages
// @access  Private
router.get('/final-status', 
  query('year').optional().isInt({ min: 2000, max: 2100 }).withMessage('Year must be a valid year between 2000 and 2100'),
  handleValidationErrors,
  getFinalStatusReport
);

// @route   GET /api/reports/engineer-wise
// @desc    Get statistics on works assigned to different engineers
// @access  Private
router.get('/engineer-wise',
  query('year').optional().isInt({ min: 2000, max: 2100 }).withMessage('Year must be a valid year between 2000 and 2100'),
  query('engineer').optional().isString().trim().withMessage('Engineer must be a string'),
  handleValidationErrors,
  getEngineerWiseReport
);

// @route   GET /api/reports/photo-missing
// @desc    Get works that don't have associated photos
// @access  Private
router.get('/photo-missing',
  query('year').optional().isInt({ min: 2000, max: 2100 }).withMessage('Year must be a valid year between 2000 and 2100'),
  handleValidationErrors,
  getPhotoMissingReport
);

module.exports = router;
