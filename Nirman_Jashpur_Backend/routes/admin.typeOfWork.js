const express = require('express');
const { body, param, validationResult } = require('express-validator');
const TypeOfWork = require('../models/subSchema/typeOfWork'); // ✅ Fixed: Remove destructuring
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
// POST /api/admin/type-of-work
router.post(
  '/',
  auth,
  authorizeRole('Super Admin'),
  validate([body('name').trim().notEmpty().isLength({ max: 200 })]),
  async (req, res) => {
    try { // ✅ Added try-catch
      const { name } = req.body;

      const exists = await TypeOfWork.findOne({ name });
      if (exists) {
        return res
          .status(409)
          .json({ success: false, message: 'Type of Work already exists' });
      }

      const type = await TypeOfWork.create({ name });
      res
        .status(201)
        .json({ success: true, message: 'Type of Work created', data: type });
    } catch (error) {
      console.error('Error creating TypeOfWork:', error);
      
      // Handle duplicate key error specifically
      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          message: 'Type of Work already exists',
          error: 'Duplicate type of work name'
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
// GET /api/admin/type-of-work
router.get(
  '/',
  auth,
  authorizeRole('Super Admin'),
  async (req, res) => {
    try { // ✅ Added try-catch
      const types = await TypeOfWork.find().sort({ createdAt: -1 });
      res.json({ success: true, data: types });
    } catch (error) {
      console.error('Error fetching TypeOfWorks:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error',
        error: error.message 
      });
    }
  }
);

// --- READ ONE ---
// GET /api/admin/type-of-work/:id
router.get(
  '/:id',
  auth,
  authorizeRole('Super Admin'),
  validate([param('id').isMongoId()]),
  async (req, res) => {
    try { // ✅ Added try-catch
      const type = await TypeOfWork.findById(req.params.id);
      if (!type) {
        return res
          .status(404)
          .json({ success: false, message: 'Type of Work not found' });
      }
      res.json({ success: true, data: type });
    } catch (error) {
      console.error('Error fetching TypeOfWork:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error',
        error: error.message 
      });
    }
  }
);

// --- UPDATE ---
// PATCH /api/admin/type-of-work/:id
router.patch(
  '/:id',
  auth,
  authorizeRole('Super Admin'),
  validate([
    param('id').isMongoId(),
    body('name').optional().isLength({ max: 200 }),
  ]),
  async (req, res) => {
    try { // ✅ Added try-catch
      if (req.body.name) {
        const exists = await TypeOfWork.findOne({
          name: req.body.name,
          _id: { $ne: req.params.id },
        });
        if (exists) {
          return res
            .status(409)
            .json({ success: false, message: 'Type of Work name already in use' });
        }
      }

      const type = await TypeOfWork.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true // ✅ Added validation on update
      });
      
      if (!type) {
        return res
          .status(404)
          .json({ success: false, message: 'Type of Work not found' });
      }
      
      res.json({ success: true, message: 'Type of Work updated', data: type });
    } catch (error) {
      console.error('Error updating TypeOfWork:', error);
      
      // Handle duplicate key error
      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          message: 'Type of Work name already exists',
          error: 'Duplicate type of work name'
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
// DELETE /api/admin/type-of-work/:id
router.delete(
  '/:id',
  auth,
  authorizeRole('Super Admin'),
  validate([param('id').isMongoId()]),
  async (req, res) => {
    try { // ✅ Added try-catch
      const type = await TypeOfWork.findByIdAndDelete(req.params.id);
      if (!type) {
        return res
          .status(404)
          .json({ success: false, message: 'Type of Work not found' });
      }
      res.json({ success: true, message: 'Type of Work deleted' });
    } catch (error) {
      console.error('Error deleting TypeOfWork:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error',
        error: error.message 
      });
    }
  }
);

module.exports = router;
