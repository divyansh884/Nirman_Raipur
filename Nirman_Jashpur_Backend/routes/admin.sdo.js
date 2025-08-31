const express = require('express');
const { body, param, validationResult } = require('express-validator');
const SDO = require('../models/subSchema/sdo');
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
// POST /api/admin/sdo
router.post(
  '/',
  auth,
  authorizeRole('Super Admin'),
  validate([body('name').trim().notEmpty().isLength({ max: 200 })]),
  async (req, res) => {
    try {
      const { name } = req.body;

      // Check if SDO already exists
      const exists = await SDO.findOne({ name });
      if (exists) {
        return res
          .status(409)
          .json({ success: false, message: 'SDO already exists' });
      }

      const sdo = await SDO.create({ name });
      res
        .status(201)
        .json({ success: true, message: 'SDO created', data: sdo });
    } catch (error) {
      console.error('Error creating SDO:', error);
      
      // Handle duplicate key error specifically
      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          message: 'SDO already exists',
          error: 'Duplicate SDO name'
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
// GET /api/admin/sdo
router.get(
  '/',
  auth,
  authorizeRole('Super Admin'),
  async (req, res) => {
    try {
      const sdos = await SDO.find().sort({ createdAt: -1 });
      res.json({ success: true, data: sdos });
    } catch (error) {
      console.error('Error fetching SDOs:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error',
        error: error.message 
      });
    }
  }
);

// --- READ ONE ---
// GET /api/admin/sdo/:id
router.get(
  '/:id',
  auth,
  authorizeRole('Super Admin'),
  validate([param('id').isMongoId()]),
  async (req, res) => {
    try {
      const sdo = await SDO.findById(req.params.id);
      if (!sdo) {
        return res
          .status(404)
          .json({ success: false, message: 'SDO not found' });
      }
      res.json({ success: true, data: sdo });
    } catch (error) {
      console.error('Error fetching SDO:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error',
        error: error.message 
      });
    }
  }
);

// --- UPDATE ---
// PATCH /api/admin/sdo/:id (Changed from PUT to PATCH)
router.patch(
  '/:id',
  auth,
  authorizeRole('Super Admin'),
  validate([
    param('id').isMongoId(),
    body('name').optional().isLength({ max: 200 }),
  ]),
  async (req, res) => {
    try {
      // Check for duplicate name if name is being updated
      if (req.body.name) {
        const exists = await SDO.findOne({
          name: req.body.name,
          _id: { $ne: req.params.id },
        });
        if (exists) {
          return res
            .status(409)
            .json({ success: false, message: 'SDO name already in use' });
        }
      }

      const sdo = await SDO.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
      });
      
      if (!sdo) {
        return res
          .status(404)
          .json({ success: false, message: 'SDO not found' });
      }
      
      res.json({ success: true, message: 'SDO updated', data: sdo });
    } catch (error) {
      console.error('Error updating SDO:', error);
      
      // Handle duplicate key error
      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          message: 'SDO name already exists',
          error: 'Duplicate SDO name'
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
// DELETE /api/admin/sdo/:id
router.delete(
  '/:id',
  auth,
  authorizeRole('Super Admin'),
  validate([param('id').isMongoId()]),
  async (req, res) => {
    try {
      const sdo = await SDO.findByIdAndDelete(req.params.id);
      if (!sdo) {
        return res
          .status(404)
          .json({ success: false, message: 'SDO not found' });
      }
      res.json({ success: true, message: 'SDO deleted' });
    } catch (error) {
      console.error('Error deleting SDO:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error',
        error: error.message 
      });
    }
  }
);

module.exports = router;
