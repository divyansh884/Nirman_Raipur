const express = require('express');
const { body, param, validationResult } = require('express-validator');
const WorkDept = require('../models/subSchema/workDepartment');
const { auth, authorizeRole } = require('../middleware/auth');

const router = express.Router();

// Helper for validation
const validate = (rules) => [
  ...rules,
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }
    next();
  },
];

// --- CREATE ---
router.post(
  '/',
  auth,
  authorizeRole('Super Admin'),
  validate([body('name').trim().notEmpty().isLength({ max: 200 })]), // ✅ Fixed: Use 'name'
  async (req, res) => {
    try {
      const { name } = req.body; // ✅ Fixed: Use 'name'

      const exists = await WorkDept.findOne({ name }); // ✅ Fixed: Use 'name'
      if (exists) {
        return res
          .status(409)
          .json({ success: false, message: 'Work Department already exists' });
      }

      const department = await WorkDept.create({ name }); // ✅ Fixed: Use 'name'
      res
        .status(201)
        .json({ success: true, message: 'Work Department created', data: department });
    } catch (error) {
      console.error('Error creating WorkDepartment:', error);
      
      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          message: 'Work Department already exists',
          error: 'Duplicate work department name'
        });
      }
      
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error',
        error: error.message 
      });
    }
  }
);

// --- READ ALL ---
router.get(
  '/',
  // auth,
  // authorizeRole('Super Admin'),
  async (req, res) => {
    try {
      const departments = await WorkDept.find().sort({ createdAt: -1 });
      res.json({ success: true, data: departments });
    } catch (error) {
      console.error('Error fetching WorkDepartments:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error',
        error: error.message 
      });
    }
  }
);

// --- READ ONE ---
router.get(
  '/:id',
  // auth,
  // authorizeRole('Super Admin'),
  validate([param('id').isMongoId()]),
  async (req, res) => {
    try {
      const department = await WorkDept.findById(req.params.id);
      if (!department) {
        return res
          .status(404)
          .json({ success: false, message: 'Work Department not found' });
      }
      res.json({ success: true, data: department });
    } catch (error) {
      console.error('Error fetching WorkDepartment:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error',
        error: error.message 
      });
    }
  }
);

// --- UPDATE ---
router.patch(
  '/:id',
  auth,
  authorizeRole('Super Admin'),
  validate([
    param('id').isMongoId(),
    body('name').optional().isLength({ max: 200 }), // ✅ Fixed: Use 'name'
  ]),
  async (req, res) => {
    try {
      if (req.body.name) { // ✅ Fixed: Use 'name'
        const exists = await WorkDept.findOne({
          name: req.body.name, // ✅ Fixed: Use 'name'
          _id: { $ne: req.params.id },
        });
        if (exists) {
          return res
            .status(409)
            .json({ success: false, message: 'Work Department name already in use' });
        }
      }

      const department = await WorkDept.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
      });
      
      if (!department) {
        return res
          .status(404)
          .json({ success: false, message: 'Work Department not found' });
      }
      
      res.json({ success: true, message: 'Work Department updated', data: department });
    } catch (error) {
      console.error('Error updating WorkDepartment:', error);
      
      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          message: 'Work Department name already exists',
          error: 'Duplicate work department name'
        });
      }
      
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error',
        error: error.message 
      });
    }
  }
);

// --- DELETE ---
router.delete(
  '/:id',
  auth,
  authorizeRole('Super Admin'),
  validate([param('id').isMongoId()]),
  async (req, res) => {
    try {
      const department = await WorkDept.findByIdAndDelete(req.params.id);
      if (!department) {
        return res
          .status(404)
          .json({ success: false, message: 'Work Department not found' });
      }
      res.json({ success: true, message: 'Work Department deleted' });
    } catch (error) {
      console.error('Error deleting WorkDepartment:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error',
        error: error.message 
      });
    }
  }
);

module.exports = router;
