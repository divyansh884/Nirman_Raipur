// routes/admin.scheme.js
const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { Scheme } = require('../models/subSchema/scheme');
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
  '/schemes',
  auth,
  authorizeRole('Super Admin'),
  validate([body('name').trim().notEmpty().isLength({ max: 200 })]),
  async (req, res) => {
    const { name } = req.body;

    const exists = await Scheme.findOne({ name });
    if (exists) {
      return res.status(409).json({ success: false, message: 'Scheme already exists' });
    }

    const scheme = await Scheme.create({ name });
    res.status(201).json({ success: true, message: 'Scheme created', data: scheme });
  }
);

// READ ALL
router.get(
  '/schemes',
  auth,
  authorizeRole('Super Admin'),
  async (req, res) => {
    const schemes = await Scheme.find().sort({ createdAt: -1 });
    res.json({ success: true, data: schemes });
  }
);

// READ ONE
router.get(
  '/schemes/:id',
  auth,
  authorizeRole('Super Admin'),
  validate([param('id').isMongoId()]),
  async (req, res) => {
    const scheme = await Scheme.findById(req.params.id);
    if (!scheme) return res.status(404).json({ success: false, message: 'Scheme not found' });
    res.json({ success: true, data: scheme });
  }
);

// UPDATE
router.patch(
  '/schemes/:id',
  auth,
  authorizeRole('Super Admin'),
  validate([
    param('id').isMongoId(),
    body('name').optional().isLength({ max: 200 }),
  ]),
  async (req, res) => {
    if (req.body.name) {
      const exists = await Scheme.findOne({ name: req.body.name, _id: { $ne: req.params.id } });
      if (exists) {
        return res.status(409).json({ success: false, message: 'Scheme name already in use' });
      }
    }

    const scheme = await Scheme.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!scheme) return res.status(404).json({ success: false, message: 'Scheme not found' });
    res.json({ success: true, message: 'Scheme updated', data: scheme });
  }
);

// DELETE
router.delete(
  '/schemes/:id',
  auth,
  authorizeRole('Super Admin'),
  validate([param('id').isMongoId()]),
  async (req, res) => {
    const scheme = await Scheme.findByIdAndDelete(req.params.id);
    if (!scheme) return res.status(404).json({ success: false, message: 'Scheme not found' });
    res.json({ success: true, message: 'Scheme deleted' });
  }
);

module.exports = router;
