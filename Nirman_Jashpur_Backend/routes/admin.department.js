// routes/admin.departments.js
// CRUD routes for Department management, admin-only.

const express = require('express');
const { body, param, validationResult } = require('express-validator');
const Department = require('../models/Department');
const { auth, authorizeRole } = require('../middleware/auth');

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
  '/departments',
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
  '/departments',
  auth,
  async (req, res) => {
    const departments = await Department.find().sort({ createdAt: -1 });
    res.json({ success: true, data: departments });
  }
);

// --- READ ONE ---
// GET /api/admin/departments/:id
router.get(
  '/departments/:id',
  auth,
  validate([param('id').isMongoId()]),
  async (req, res) => {
    const department = await Department.findById(req.params.id);
    if (!department) return res.status(404).json({ success: false, message: 'Department not found' });
    res.json({ success: true, data: department });
  }
);

// --- UPDATE ---
// PATCH /api/admin/departments/:id
router.patch(
  '/departments/:id',
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
  '/departments/:id',
  auth,
  authorizeRole('Super Admin'),
  validate([param('id').isMongoId()]),
  async (req, res) => {
    const department = await Department.findByIdAndDelete(req.params.id);
    if (!department) return res.status(404).json({ success: false, message: 'Department not found' });
    res.json({ success: true, message: 'Department deleted' });
  }
);

module.exports = router;

/*
--- USAGE ---
1) Place in routes/admin.departments.js
2) In app.js: const adminDeptRoutes = require('./routes/admin.departments'); app.use('/api/admin', adminDeptRoutes);

--- SAMPLE REQUESTS ---
POST /api/admin/departments { "name": "Civil Engineering", "description": "Handles construction projects" }
PATCH /api/admin/departments/:id { "isActive": false }
*/
