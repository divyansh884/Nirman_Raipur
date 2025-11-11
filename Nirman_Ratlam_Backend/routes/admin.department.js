// routes/admin.departments.js
// CRUD routes for Department management, admin-only.

const express = require('express');
const { body, param, validationResult } = require('express-validator');
const Department = require('../models/Department');
const { auth, authorizeRole } = require('../middleware/auth');
const WorkProposal = require('../models/WorkProposal'); 
const mongoose = require('mongoose');
const router = express.Router();

// helper to handle validation
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
// POST /api/admin/departments
router.post(
  '/',
  auth,
  authorizeRole('Super Admin'),
  validate([
    body('name').trim().notEmpty().isLength({ max: 200 }),
    body('description').optional().isLength({ max: 500 }),
  ]),
  async (req, res) => {
    const { name, description } = req.body;

    const exists = await Department.findOne({ name });
    if (exists) {
      return res.status(409).json({ success: false, message: 'Department already exists' });
    }

    const department = await Department.create({ name, description });
    res.status(201).json({ success: true, message: 'Department created', data: department });
  }
);

// --- READ ALL ---
// GET /api/admin/departments
router.get(
  '/',
  // auth,
  async (req, res) => {
    const departments = await Department.find().sort({ createdAt: -1 });
    res.json({ success: true, data: departments });
  }
);

// --- READ ONE ---
// GET /api/admin/departments/:id
router.get(
  '/:id',
  // auth,
  validate([param('id').isMongoId()]),
  async (req, res) => {
    const department = await Department.findById(req.params.id);
    if (!department) return res.status(404).json({ success: false, message: 'Department not found' });
    res.json({ success: true, data: department });
  }
);

// --- UPDATE ---x
// PATCH /api/admin/departments/:id
router.patch(
  '/:id',
  auth,
  authorizeRole('Super Admin'),
  validate([
    param('id').isMongoId(),
    body('name').optional().isLength({ max: 200 }),
    body('description').optional().isLength({ max: 500 }),
    body('isActive').optional().isBoolean(),
  ]),
  async (req, res) => {
    if (req.body.name) {
      const exists = await Department.findOne({ name: req.body.name, _id: { $ne: req.params.id } });
      if (exists) {
        return res.status(409).json({ success: false, message: 'Department name already in use' });
      }
    }

    const department = await Department.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!department) return res.status(404).json({ success: false, message: 'Department not found' });
    res.json({ success: true, message: 'Department updated', data: department });
  }
);

// --- DELETE ---
// DELETE /api/admin/departments/:id
router.delete(
  '/:id',
  auth,
  authorizeRole('Super Admin'),
  validate([param('id').isMongoId()]),
  async (req, res) => {
    try {
      const departmentId = req.params.id;
      
      // First, check if the department exists
      const department = await Department.findById(departmentId);
      if (!department) {
        return res
          .status(404)
          .json({ success: false, message: 'Department not found' });
      }

      console.log(`🔍 Checking references for department: ${department.name} (ID: ${departmentId})`);

      // ✅ COMPREHENSIVE CHECK: Get ALL work proposals and check manually
      const allWorkProposals = await WorkProposal.find({}, 
        'workDepartment approvingDepartment nameOfWork serialNumber currentStatus'
      );
      
      // Filter work proposals that use this department
      const workProposalsWithDepartment = allWorkProposals.filter(wp => {
        let isUsed = false;
        
        // Check workDepartment field
        if (wp.workDepartment && wp.workDepartment._id) {
          const workDeptId = wp.workDepartment._id.toString();
          if (workDeptId === departmentId) {
            isUsed = true;
          }
        }
        
        // Check approvingDepartment field
        if (wp.approvingDepartment && wp.approvingDepartment._id) {
          const approvingDeptId = wp.approvingDepartment._id.toString();
          if (approvingDeptId === departmentId) {
            isUsed = true;
          }
        }
        
        return isUsed;
      });

      console.log(`🔍 Checked ${allWorkProposals.length} total work proposals`);
      console.log(`📊 Found ${workProposalsWithDepartment.length} work proposals using department "${department.name}" (ID: ${departmentId})`);

      // Log the matching work proposals for debugging
      if (workProposalsWithDepartment.length > 0) {
        console.log(`🚫 Work proposals using this department:`);
        workProposalsWithDepartment.forEach(wp => {
          const usageTypes = [];
          if (wp.workDepartment && wp.workDepartment._id.toString() === departmentId) {
            usageTypes.push(`Work Dept: ${wp.workDepartment.name}`);
          }
          if (wp.approvingDepartment && wp.approvingDepartment._id.toString() === departmentId) {
            usageTypes.push(`Approving Dept: ${wp.approvingDepartment.name}`);
          }
          console.log(`   - ${wp.serialNumber}: ${wp.nameOfWork} (${usageTypes.join(', ')})`);
        });
      }

      // ✅ PREVENT DELETION if department is being used
      if (workProposalsWithDepartment.length > 0) {
        // Get detailed information about usage
        const workProposalDetails = workProposalsWithDepartment.map(wp => {
          const usageTypes = [];
          if (wp.workDepartment && wp.workDepartment._id.toString() === departmentId) {
            usageTypes.push('Work Department');
          }
          if (wp.approvingDepartment && wp.approvingDepartment._id.toString() === departmentId) {
            usageTypes.push('Approving Department');
          }
          
          return {
            id: wp._id,
            serialNumber: wp.serialNumber,
            nameOfWork: wp.nameOfWork,
            currentStatus: wp.currentStatus,
            usedAs: usageTypes
          };
        });

        return res.status(400).json({
          success: false,
          message: `Cannot delete department "${department.name}": It is being used by ${workProposalsWithDepartment.length} work proposal(s)`,
          details: {
            departmentId: departmentId,
            departmentName: department.name,
            totalReferences: workProposalsWithDepartment.length,
            referencedBy: {
              collection: "Work Proposals",
              count: workProposalsWithDepartment.length,
              workProposals: workProposalDetails
            },
            suggestions: [
              "Update the work department and/or approving department field in all referenced work proposals before deleting this department",
              "Consider reassigning work proposals to a different department", 
              "Contact the system administrator if this department needs to be merged with another department"
            ]
          }
        });
      }

      // ✅ NO REFERENCES FOUND - Safe to delete
      console.log(`✅ No references found for department "${department.name}". Safe to delete.`);
      
      await Department.findByIdAndDelete(departmentId);
      
      console.log(`🗑️ Successfully deleted department: ${department.name} (ID: ${departmentId})`);
      
      res.json({ 
        success: true, 
        message: `Department "${department.name}" deleted successfully`,
        data: {
          deletedDepartment: {
            id: department._id,
            name: department.name,
            deletedAt: new Date()
          }
        }
      });

    } catch (error) {
      console.error("❌ Error deleting department:", error);
      res.status(500).json({ 
        success: false, 
        message: "Internal server error",
        error: error.message 
      });
    }
  }
);


module.exports = router;
