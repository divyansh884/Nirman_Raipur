// routes/admin.city.js
const express = require("express");
const { body, param, validationResult } = require("express-validator");
const City = require("../models/subSchema/city");
const { auth, authorizeRole } = require("../middleware/auth");

const router = express.Router();

// helper for validation
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
// POST /api/admin/cities
router.post(
  "/cities",
  auth,
  authorizeRole("Super Admin"),
  validate([body("cityName").trim().notEmpty().isLength({ max: 200 })]),
  async (req, res) => {
    const { cityName } = req.body;

    const exists = await City.findOne({ cityName });
    if (exists) {
      return res
        .status(409)
        .json({ success: false, message: "City already exists" });
    }

    const city = await City.create({ cityName });
    res
      .status(201)
      .json({ success: true, message: "City created", data: city });
  }
);

// --- READ ALL ---
// GET /api/admin/cities
router.get(
  "/cities",
  auth,
  authorizeRole("Super Admin"),
  async (req, res) => {
    const cities = await City.find().sort({ createdAt: -1 });
    res.json({ success: true, data: cities });
  }
);

// --- READ ONE ---
// GET /api/admin/cities/:id
router.get(
  "/cities/:id",
  auth,
  authorizeRole("Super Admin"),
  validate([param("id").isMongoId()]),
  async (req, res) => {
    const city = await City.findById(req.params.id);
    if (!city)
      return res
        .status(404)
        .json({ success: false, message: "City not found" });
    res.json({ success: true, data: city });
  }
);

// --- UPDATE ---
// PATCH /api/admin/cities/:id
router.patch(
  "/cities/:id",
  auth,
  authorizeRole("Super Admin"),
  validate([
    param("id").isMongoId(),
    body("cityName").optional().isLength({ max: 200 }),
  ]),
  async (req, res) => {
    if (req.body.cityName) {
      const exists = await City.findOne({
        cityName: req.body.cityName,
        _id: { $ne: req.params.id },
      });
      if (exists) {
        return res
          .status(409)
          .json({ success: false, message: "City name already in use" });
      }
    }

    const city = await City.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!city)
      return res
        .status(404)
        .json({ success: false, message: "City not found" });
    res.json({ success: true, message: "City updated", data: city });
  }
);

// --- DELETE ---
// DELETE /api/admin/cities/:id
router.delete(
  "/cities/:id",
  auth,
  authorizeRole("Super Admin"),
  validate([param("id").isMongoId()]),
  async (req, res) => {
    const city = await City.findByIdAndDelete(req.params.id);
    if (!city)
      return res
        .status(404)
        .json({ success: false, message: "City not found" });
    res.json({ success: true, message: "City deleted" });
  }
);

module.exports = router;
