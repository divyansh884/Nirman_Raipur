const express = require('express');
const { body, param, validationResult } = require('express-validator');
const Scheme = require('../models/subSchema/scheme'); // ✅ Fixed: Remove destructuring
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
// POST /api/admin/scheme
router.post(
  '/', // ✅ Changed from '/schemes' to '/'
  auth,
  authorizeRole('Super Admin'),
  validate([body('name').trim().notEmpty().isLength({ max: 200 })]),
  async (req, res) => {
    try { // ✅ Added try-catch
      const { name } = req.body;

      const exists = await Scheme.findOne({ name });
      if (exists) {
        return res
          .status(409)
          .json({ success: false, message: 'Scheme already exists' });
      }

      const scheme = await Scheme.create({ name });
      res
        .status(201)
        .json({ success: true, message: 'Scheme created', data: scheme });
    } catch (error) {
      console.error('Error creating scheme:', error);
      
      // Handle duplicate key error specifically
      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          message: 'Scheme already exists',
          error: 'Duplicate scheme name'
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
// GET /api/admin/scheme
router.get(
  '/', // ✅ Changed from '/schemes' to '/'
  // auth,
  // authorizeRole('Super Admin'),
  async (req, res) => {
    try { // ✅ Added try-catch
      const schemes = await Scheme.find().sort({ createdAt: -1 });
      res.json({ success: true, data: schemes });
    } catch (error) {
      console.error('Error fetching schemes:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error',
        error: error.message 
      });
    }
  }
);

// --- READ ONE ---
// GET /api/admin/scheme/:id
router.get(
  '/:id', // ✅ Changed from '/schemes/:id' to '/:id'
  // auth,
  // authorizeRole('Super Admin'),
  validate([param('id').isMongoId()]),
  async (req, res) => {
    try { // ✅ Added try-catch
      const scheme = await Scheme.findById(req.params.id);
      if (!scheme) {
        return res
          .status(404)
          .json({ success: false, message: 'Scheme not found' });
      }
      res.json({ success: true, data: scheme });
    } catch (error) {
      console.error('Error fetching scheme:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error',
        error: error.message 
      });
    }
  }
);

// --- UPDATE ---
// PATCH /api/admin/scheme/:id
router.patch(
  '/:id', // ✅ Changed from '/schemes/:id' to '/:id'
  auth,
  authorizeRole('Super Admin'),
  validate([
    param('id').isMongoId(),
    body('name').optional().isLength({ max: 200 }),
  ]),
  async (req, res) => {
    try { // ✅ Added try-catch
      if (req.body.name) {
        const exists = await Scheme.findOne({
          name: req.body.name,
          _id: { $ne: req.params.id },
        });
        if (exists) {
          return res
            .status(409)
            .json({ success: false, message: 'Scheme name already in use' });
        }
      }

      const scheme = await Scheme.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true // ✅ Added validation on update
      });
      
      if (!scheme) {
        return res
          .status(404)
          .json({ success: false, message: 'Scheme not found' });
      }
      
      res.json({ success: true, message: 'Scheme updated', data: scheme });
    } catch (error) {
      console.error('Error updating scheme:', error);
      
      // Handle duplicate key error
      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          message: 'Scheme name already exists',
          error: 'Duplicate scheme name'
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
// DELETE /api/admin/scheme/:id
router.delete(
  '/:id', // ✅ Changed from '/schemes/:id' to '/:id'
  auth,
  authorizeRole('Super Admin'),
  validate([param('id').isMongoId()]),
  async (req, res) => {
    try { // ✅ Added try-catch
      const scheme = await Scheme.findByIdAndDelete(req.params.id);
      if (!scheme) {
        return res
          .status(404)
          .json({ success: false, message: 'Scheme not found' });
      }
      res.json({ success: true, message: 'Scheme deleted' });
    } catch (error) {
      console.error('Error deleting scheme:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error',
        error: error.message 
      });
    }
  }
);

module.exports = router;
