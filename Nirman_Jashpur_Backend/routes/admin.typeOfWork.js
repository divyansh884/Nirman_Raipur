// routes/admin.typeOfWork.js
const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { TypeOfWork } = require('../models/subSchema/typeOfWork');
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
router.post(
  '/type-of-work',
  auth,
  authorizeRole('Super Admin'),
  validate([body('name').trim().notEmpty().isLength({ max: 200 })]),
  async (req, res) => {
    const { name } = req.body;

    const exists = await TypeOfWork.findOne({ name });
    if (exists) {
      return res.status(409).json({ success: false, message: 'Type of Work already exists' });
    }

    const type = await TypeOfWork.create({ name });
    res.status(201).json({ success: true, message: 'Type of Work created', data: type });
  }
);

// --- READ ALL ---
router.get(
  '/type-of-work',
  auth,
  authorizeRole('Super Admin'),
  async (req, res) => {
    const types = await TypeOfWork.find().sort({ createdAt: -1 });
    res.json({ success: true, data: types });
  }
);

// --- READ ONE ---
router.get(
  '/type-of-work/:id',
  auth,
  authorizeRole('Super Admin'),
  validate([param('id').isMongoId()]),
  async (req, res) => {
    const type = await TypeOfWork.findById(req.params.id);
    if (!type) return res.status(404).json({ success: false, message: 'Type of Work not found' });
    res.json({ success: true, data: type });
  }
);

// --- UPDATE ---
router.patch(
  '/type-of-work/:id',
  auth,
  authorizeRole('Super Admin'),
  validate([
    param('id').isMongoId(),
    body('name').optional().isLength({ max: 200 }),
  ]),
  async (req, res) => {
    if (req.body.name) {
      const exists = await TypeOfWork.findOne({ name: req.body.name, _id: { $ne: req.params.id } });
      if (exists) {
        return res.status(409).json({ success: false, message: 'Type of Work name already in use' });
      }
    }

    const type = await TypeOfWork.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!type) return res.status(404).json({ success: false, message: 'Type of Work not found' });
    res.json({ success: true, message: 'Type of Work updated', data: type });
  }
);

// --- DELETE ---
router.delete(
  '/type-of-work/:id',
  auth,
  authorizeRole('Super Admin'),
  validate([param('id').isMongoId()]),
  async (req, res) => {
    const type = await TypeOfWork.findByIdAndDelete(req.params.id);
    if (!type) return res.status(404).json({ success: false, message: 'Type of Work not found' });
    res.json({ success: true, message: 'Type of Work deleted' });
  }
);

module.exports = router;
