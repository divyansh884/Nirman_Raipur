// routes/admin.workAgency.js
const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { WorkAgency } = require('../models/subSchema/workAgency');
const { auth, authorizeRole } = require('../middleware/auth');

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

// CREATE
router.post(
  '/work-agency',
  auth,
  authorizeRole('Super Admin'),
  validate([body('name').trim().notEmpty().isLength({ max: 200 })]),
  async (req, res) => {
    const { name } = req.body;

    const exists = await WorkAgency.findOne({ name });
    if (exists) {
      return res.status(409).json({ success: false, message: 'Work Agency already exists' });
    }

    const agency = await WorkAgency.create({ name });
    res.status(201).json({ success: true, message: 'Work Agency created', data: agency });
  }
);

// READ ALL
router.get(
  '/work-agency',
  auth,
  authorizeRole('Super Admin'),
  async (req, res) => {
    const agencies = await WorkAgency.find().sort({ createdAt: -1 });
    res.json({ success: true, data: agencies });
  }
);

// READ ONE
router.get(
  '/work-agency/:id',
  auth,
  authorizeRole('Super Admin'),
  validate([param('id').isMongoId()]),
  async (req, res) => {
    const agency = await WorkAgency.findById(req.params.id);
    if (!agency) return res.status(404).json({ success: false, message: 'Work Agency not found' });
    res.json({ success: true, data: agency });
  }
);

// UPDATE
router.patch(
  '/work-agency/:id',
  auth,
  authorizeRole('Super Admin'),
  validate([
    param('id').isMongoId(),
    body('name').optional().isLength({ max: 200 }),
  ]),
  async (req, res) => {
    if (req.body.name) {
      const exists = await WorkAgency.findOne({ name: req.body.name, _id: { $ne: req.params.id } });
      if (exists) {
        return res.status(409).json({ success: false, message: 'Work Agency name already in use' });
      }
    }

    const agency = await WorkAgency.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!agency) return res.status(404).json({ success: false, message: 'Work Agency not found' });
    res.json({ success: true, message: 'Work Agency updated', data: agency });
  }
);

// DELETE
router.delete(
  '/work-agency/:id',
  auth,
  authorizeRole('Super Admin'),
  validate([param('id').isMongoId()]),
  async (req, res) => {
    const agency = await WorkAgency.findByIdAndDelete(req.params.id);
    if (!agency) return res.status(404).json({ success: false, message: 'Work Agency not found' });
    res.json({ success: true, message: 'Work Agency deleted' });
  }
);

module.exports = router;
