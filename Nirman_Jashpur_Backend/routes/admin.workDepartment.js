const express = require('express');
const { body } = require('express-validator');

const workDept = require('../models/subSchema/workDepartment');

const router = express.Router();

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

router.post(
  '/workDepartments',
  auth,
  authorizeRole('Super Admin'),
  validate([
    body('name').trim().notEmpty().isLength({ max: 200 })
  ]),
  async (req, res) => {
    const { name } = req.body;

    const exists = await workDept.findOne({ name });
    if (exists) {
      return res.status(404).json({ success: false, message: 'Work Department already exists' });
    }

    const department = await workDept.create({ name });
    res.status(201).json({ success: true, message: 'Work Department created', data: department });
  }
);

// --- READ ALL ---
// GET /api/admin/departments
router.get(
  '/getworkdepartments',
  auth,
  authorizeRole('Super Admin'),
  async (req, res) => {
    const departments = await workDept.find().sort({ createdAt: -1 });
    res.json({ success: true, data: departments });
  }
);

// --- READ ONE ---
// GET /api/admin/departments/:id
router.get(
  '/workdepartments/:id',
  auth,
  authorizeRole('Super Admin'),
  validate([param('id').isMongoId()]),
  async (req, res) => {
    const department = await workDept.findById(req.params.id);
    if (!department) return res.status(404).json({ success: false, message: 'Work Department not found' });
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
  ]),
  async (req, res) => {
    if (req.body.name) {
      const exists = await workDept.findOne({ name: req.body.name, _id: { $ne: req.params.id } });
      if (exists) {
        return res.status(409).json({ success: false, message: 'Work Department name already in use' });
      }
    }

    const department = await workDept.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!department) return res.status(404).json({ success: false, message: 'Work Department not found' });
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
    const department = await workDept.findByIdAndDelete(req.params.id);
    if (!department) return res.status(404).json({ success: false, message: 'Department not found' });
    res.json({ success: true, message: 'Department deleted' });
  }
);

module.exports = router;