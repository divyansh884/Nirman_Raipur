const express = require('express');
const { body, param, validationResult } = require('express-validator');
const Scheme = require('../models/subSchema/scheme'); // ✅ Fixed: Remove destructuring
const { auth, authorizeRole } = require('../middleware/auth');
const WorkProposal = require('../models/WorkProposal'); 
const mongoose = require('mongoose');
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
  '/:id',
  auth,
  authorizeRole('Super Admin'),
  validate([param('id').isMongoId()]),
  async (req, res) => {
    try {
      const schemeId = req.params.id;
      
      // First, check if the scheme exists
      const scheme = await Scheme.findById(schemeId);
      if (!scheme) {
        return res
          .status(404)
          .json({ success: false, message: 'Scheme not found' });
      }

      console.log(`🔍 Checking references for scheme: ${scheme.name} (ID: ${schemeId})`);

      // ✅ COMPREHENSIVE CHECK: Get ALL work proposals and check manually
      const allWorkProposals = await WorkProposal.find({}, 
        'scheme nameOfWork serialNumber currentStatus'
      );
      
      // Filter work proposals that use this scheme
      const workProposalsWithScheme = allWorkProposals.filter(wp => {
        if (wp.scheme && wp.scheme._id) {
          const workProposalSchemeId = wp.scheme._id.toString();
          return workProposalSchemeId === schemeId;
        }
        return false;
      });

      console.log(`🔍 Checked ${allWorkProposals.length} total work proposals`);
      console.log(`📊 Found ${workProposalsWithScheme.length} work proposals using scheme "${scheme.name}" (ID: ${schemeId})`);

      // Log the matching work proposals for debugging
      if (workProposalsWithScheme.length > 0) {
        console.log(`🚫 Work proposals using this scheme:`);
        workProposalsWithScheme.forEach(wp => {
          console.log(`   - ${wp.serialNumber}: ${wp.nameOfWork} (Scheme: ${wp.scheme.name})`);
        });
      }

      // ✅ PREVENT DELETION if scheme is being used
      if (workProposalsWithScheme.length > 0) {
        const workProposalDetails = workProposalsWithScheme.map(wp => ({
          id: wp._id,
          serialNumber: wp.serialNumber,
          nameOfWork: wp.nameOfWork,
          currentStatus: wp.currentStatus,
          schemeName: wp.scheme?.name
        }));

        return res.status(400).json({
          success: false,
          message: `Cannot delete scheme "${scheme.name}": It is being used by ${workProposalsWithScheme.length} work proposal(s)`,
          details: {
            schemeId: schemeId,
            schemeName: scheme.name,
            totalReferences: workProposalsWithScheme.length,
            referencedBy: {
              collection: "Work Proposals",
              count: workProposalsWithScheme.length,
              workProposals: workProposalDetails
            },
            suggestions: [
              "Update the scheme field in all referenced work proposals before deleting this scheme",
              "Consider reassigning work proposals to a different scheme",
              "Contact the system administrator if this scheme needs to be merged with another scheme"
            ]
          }
        });
      }

      // ✅ NO REFERENCES FOUND - Safe to delete
      console.log(`✅ No references found for scheme "${scheme.name}". Safe to delete.`);
      
      await Scheme.findByIdAndDelete(schemeId);
      
      console.log(`🗑️ Successfully deleted scheme: ${scheme.name} (ID: ${schemeId})`);
      
      res.json({ 
        success: true, 
        message: `Scheme "${scheme.name}" deleted successfully`,
        data: {
          deletedScheme: {
            id: scheme._id,
            name: scheme.name,
            deletedAt: new Date()
          }
        }
      });

    } catch (error) {
      console.error("❌ Error deleting scheme:", error);
      res.status(500).json({ 
        success: false, 
        message: "Internal server error",
        error: error.message 
      });
    }
  }
);


module.exports = router;
