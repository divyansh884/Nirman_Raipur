const express = require('express');
const { body, param, validationResult } = require('express-validator');
const WorkAgency = require('../models/subSchema/workAgency'); // ✅ Fixed: Remove destructuring
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
// POST /api/admin/work-agency
router.post(
  '/', // ✅ Changed from '/work-agency' to '/'
  auth,
  authorizeRole('Super Admin'),
  validate([body('name').trim().notEmpty().isLength({ max: 200 })]),
  async (req, res) => {
    try { // ✅ Added try-catch
      const { name } = req.body;

      const exists = await WorkAgency.findOne({ name });
      if (exists) {
        return res
          .status(409)
          .json({ success: false, message: 'Work Agency already exists' });
      }

      const agency = await WorkAgency.create({ name });
      res
        .status(201)
        .json({ success: true, message: 'Work Agency created', data: agency });
    } catch (error) {
      console.error('Error creating WorkAgency:', error);
      
      // Handle duplicate key error specifically
      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          message: 'Work Agency already exists',
          error: 'Duplicate work agency name'
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
// GET /api/admin/work-agency
router.get(
  '/', // ✅ Changed from '/work-agency' to '/'
  // auth,
  // authorizeRole('Super Admin'),
  async (req, res) => {
    try { // ✅ Added try-catch
      const agencies = await WorkAgency.find().sort({ createdAt: -1 });
      res.json({ success: true, data: agencies });
    } catch (error) {
      console.error('Error fetching WorkAgencies:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error',
        error: error.message 
      });
    }
  }
);

// --- READ ONE ---
// GET /api/admin/work-agency/:id
router.get(
  '/:id', // ✅ Changed from '/work-agency/:id' to '/:id'
  // auth,
  // authorizeRole('Super Admin'),
  validate([param('id').isMongoId()]),
  async (req, res) => {
    try { // ✅ Added try-catch
      const agency = await WorkAgency.findById(req.params.id);
      if (!agency) {
        return res
          .status(404)
          .json({ success: false, message: 'Work Agency not found' });
      }
      res.json({ success: true, data: agency });
    } catch (error) {
      console.error('Error fetching WorkAgency:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error',
        error: error.message 
      });
    }
  }
);

// --- UPDATE ---
// PATCH /api/admin/work-agency/:id
router.patch(
  '/:id', // ✅ Changed from '/work-agency/:id' to '/:id'
  auth,
  authorizeRole('Super Admin'),
  validate([
    param('id').isMongoId(),
    body('name').optional().isLength({ max: 200 }),
  ]),
  async (req, res) => {
    try { // ✅ Added try-catch
      if (req.body.name) {
        const exists = await WorkAgency.findOne({
          name: req.body.name,
          _id: { $ne: req.params.id },
        });
        if (exists) {
          return res
            .status(409)
            .json({ success: false, message: 'Work Agency name already in use' });
        }
      }

      const agency = await WorkAgency.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true // ✅ Added validation on update
      });
      
      if (!agency) {
        return res
          .status(404)
          .json({ success: false, message: 'Work Agency not found' });
      }
      
      res.json({ success: true, message: 'Work Agency updated', data: agency });
    } catch (error) {
      console.error('Error updating WorkAgency:', error);
      
      // Handle duplicate key error
      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          message: 'Work Agency name already exists',
          error: 'Duplicate work agency name'
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
// DELETE /api/admin/work-agency/:id
router.delete(
  '/:id',
  auth,
  authorizeRole('Super Admin'),
  validate([param('id').isMongoId()]),
  async (req, res) => {
    try {
      const workAgencyId = req.params.id;
      
      // First, check if the WorkAgency exists
      const workAgency = await WorkAgency.findById(workAgencyId);
      if (!workAgency) {
        return res
          .status(404)
          .json({ success: false, message: 'Work Agency not found' });
      }

      console.log(`🔍 Checking references for Work Agency: ${workAgency.name} (ID: ${workAgencyId})`);

      // ✅ COMPREHENSIVE CHECK: Get ALL work proposals and check manually
      const allWorkProposals = await WorkProposal.find({}, 
        'workAgency nameOfWork serialNumber currentStatus'
      );
      
      // Filter work proposals that use this work agency
      const workProposalsWithAgency = allWorkProposals.filter(wp => {
        if (wp.workAgency && wp.workAgency._id) {
          const workProposalAgencyId = wp.workAgency._id.toString();
          return workProposalAgencyId === workAgencyId;
        }
        return false;
      });

      console.log(`🔍 Checked ${allWorkProposals.length} total work proposals`);
      console.log(`📊 Found ${workProposalsWithAgency.length} work proposals using Work Agency "${workAgency.name}" (ID: ${workAgencyId})`);

      // Log the matching work proposals for debugging
      if (workProposalsWithAgency.length > 0) {
        console.log(`🚫 Work proposals using this Work Agency:`);
        workProposalsWithAgency.forEach(wp => {
          console.log(`   - ${wp.serialNumber}: ${wp.nameOfWork} (Agency: ${wp.workAgency.name})`);
        });
      }

      // ✅ PREVENT DELETION if Work Agency is being used
      if (workProposalsWithAgency.length > 0) {
        const workProposalDetails = workProposalsWithAgency.map(wp => ({
          id: wp._id,
          serialNumber: wp.serialNumber,
          nameOfWork: wp.nameOfWork,
          currentStatus: wp.currentStatus,
          workAgencyName: wp.workAgency?.name
        }));

        return res.status(400).json({
          success: false,
          message: `Cannot delete Work Agency "${workAgency.name}": It is being used by ${workProposalsWithAgency.length} work proposal(s)`,
          details: {
            workAgencyId: workAgencyId,
            workAgencyName: workAgency.name,
            totalReferences: workProposalsWithAgency.length,
            referencedBy: {
              collection: "Work Proposals",
              count: workProposalsWithAgency.length,
              workProposals: workProposalDetails
            },
            suggestions: [
              "Update the work agency field in all referenced work proposals before deleting this work agency",
              "Consider reassigning work proposals to a different work agency",
              "Contact the system administrator if this work agency needs to be merged with another agency"
            ]
          }
        });
      }

      // ✅ NO REFERENCES FOUND - Safe to delete
      console.log(`✅ No references found for Work Agency "${workAgency.name}". Safe to delete.`);
      
      await WorkAgency.findByIdAndDelete(workAgencyId);
      
      console.log(`🗑️ Successfully deleted Work Agency: ${workAgency.name} (ID: ${workAgencyId})`);
      
      res.json({ 
        success: true, 
        message: `Work Agency "${workAgency.name}" deleted successfully`,
        data: {
          deletedWorkAgency: {
            id: workAgency._id,
            name: workAgency.name,
            deletedAt: new Date()
          }
        }
      });

    } catch (error) {
      console.error("❌ Error deleting Work Agency:", error);
      res.status(500).json({ 
        success: false, 
        message: "Internal server error",
        error: error.message 
      });
    }
  }
);


module.exports = router;
