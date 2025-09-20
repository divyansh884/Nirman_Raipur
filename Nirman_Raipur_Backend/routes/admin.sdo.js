const express = require('express');
const { body, param, validationResult } = require('express-validator');
const SDO = require('../models/subSchema/sdo');
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
  // auth,
  // authorizeRole('Super Admin'),
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
  // auth,
  // authorizeRole('Super Admin'),
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
      const sdoId = req.params.id;
      
      // First, check if the SDO exists
      const sdo = await SDO.findById(sdoId);
      if (!sdo) {
        return res
          .status(404)
          .json({ success: false, message: 'SDO not found' });
      }

      console.log(`🔍 Checking references for SDO: ${sdo.name} (ID: ${sdoId})`);

      // ✅ COMPREHENSIVE CHECK: Get ALL work proposals and check manually
      const allWorkProposals = await WorkProposal.find({}, 
        'appointedSDO nameOfWork serialNumber currentStatus'
      );
      
      // Filter work proposals that use this SDO
      const workProposalsWithSDO = allWorkProposals.filter(wp => {
        if (wp.appointedSDO && wp.appointedSDO._id) {
          const workProposalSDOId = wp.appointedSDO._id.toString();
          return workProposalSDOId === sdoId;
        }
        return false;
      });

      console.log(`🔍 Checked ${allWorkProposals.length} total work proposals`);
      console.log(`📊 Found ${workProposalsWithSDO.length} work proposals using SDO "${sdo.name}" (ID: ${sdoId})`);

      // Log the matching work proposals for debugging
      if (workProposalsWithSDO.length > 0) {
        console.log(`🚫 Work proposals using this SDO:`);
        workProposalsWithSDO.forEach(wp => {
          console.log(`   - ${wp.serialNumber}: ${wp.nameOfWork} (SDO: ${wp.appointedSDO.name})`);
        });
      }

      // ✅ PREVENT DELETION if SDO is being used
      if (workProposalsWithSDO.length > 0) {
        const workProposalDetails = workProposalsWithSDO.map(wp => ({
          id: wp._id,
          serialNumber: wp.serialNumber,
          nameOfWork: wp.nameOfWork,
          currentStatus: wp.currentStatus,
          appointedSDO: wp.appointedSDO?.name
        }));

        return res.status(400).json({
          success: false,
          message: `Cannot delete SDO "${sdo.name}": It is being used by ${workProposalsWithSDO.length} work proposal(s)`,
          details: {
            sdoId: sdoId,
            sdoName: sdo.name,
            totalReferences: workProposalsWithSDO.length,
            referencedBy: {
              collection: "Work Proposals",
              count: workProposalsWithSDO.length,
              workProposals: workProposalDetails
            },
            suggestions: [
              "Update the appointed SDO field in all referenced work proposals before deleting this SDO",
              "Consider reassigning work proposals to a different SDO",
              "Contact the system administrator if this SDO needs to be replaced with another SDO"
            ]
          }
        });
      }

      // ✅ NO REFERENCES FOUND - Safe to delete
      console.log(`✅ No references found for SDO "${sdo.name}". Safe to delete.`);
      
      await SDO.findByIdAndDelete(sdoId);
      
      console.log(`🗑️ Successfully deleted SDO: ${sdo.name} (ID: ${sdoId})`);
      
      res.json({ 
        success: true, 
        message: `SDO "${sdo.name}" deleted successfully`,
        data: {
          deletedSDO: {
            id: sdo._id,
            name: sdo.name,
            deletedAt: new Date()
          }
        }
      });

    } catch (error) {
      console.error("❌ Error deleting SDO:", error);
      res.status(500).json({ 
        success: false, 
        message: "Internal server error",
        error: error.message 
      });
    }
  }
);


module.exports = router;
