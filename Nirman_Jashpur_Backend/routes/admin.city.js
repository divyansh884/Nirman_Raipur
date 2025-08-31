const express = require("express");
const { body, param, validationResult } = require("express-validator");
const City = require("../models/subSchema/city");
const { auth, authorizeRole } = require("../middleware/auth");

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
// POST /api/admin/city
router.post(
  "/",
  auth,
  authorizeRole("Super Admin"),
  validate([body("name").trim().notEmpty().isLength({ max: 200 })]), // ✅ Changed cityName to name
  async (req, res) => {
    try {
      const { name } = req.body; // ✅ Changed cityName to name

      const exists = await City.findOne({ name }); // ✅ Changed cityName to name
      if (exists) {
        return res
          .status(409)
          .json({ success: false, message: "City already exists" });
      }

      const city = await City.create({ name }); // ✅ Changed cityName to name
      res
        .status(201)
        .json({ success: true, message: "City created", data: city });
    } catch (error) {
      console.error("Error creating city:", error);
      
      // Handle duplicate key error specifically
      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          message: "City already exists",
          error: "Duplicate city name"
        });
      }
      
      res.status(500).json({ 
        success: false, 
        message: "Internal server error",
        error: error.message 
      });
    }
  }
);

// --- READ ALL ---
// GET /api/admin/city
router.get(
  "/",
  // auth,
  // authorizeRole("Super Admin"),
  async (req, res) => {
    try {
      const cities = await City.find().sort({ createdAt: -1 });
      res.json({ success: true, data: cities });
    } catch (error) {
      console.error("Error fetching cities:", error);
      res.status(500).json({ 
        success: false, 
        message: "Internal server error",
        error: error.message 
      });
    }
  }
);

// --- READ ONE ---
// GET /api/admin/city/:id
router.get(
  "/:id",
  // auth,
  // authorizeRole("Super Admin"),
  validate([param("id").isMongoId()]),
  async (req, res) => {
    try {
      const city = await City.findById(req.params.id);
      if (!city) {
        return res
          .status(404)
          .json({ success: false, message: "City not found" });
      }
      res.json({ success: true, data: city });
    } catch (error) {
      console.error("Error fetching city:", error);
      res.status(500).json({ 
        success: false, 
        message: "Internal server error",
        error: error.message 
      });
    }
  }
);

// --- UPDATE ---
// PATCH /api/admin/city/:id
router.patch(
  "/:id",
  auth,
  authorizeRole("Super Admin"),
  validate([
    param("id").isMongoId(),
    body("name").optional().isLength({ max: 200 }), // ✅ Changed cityName to name
  ]),
  async (req, res) => {
    try {
      if (req.body.name) { // ✅ Changed cityName to name
        const exists = await City.findOne({
          name: req.body.name, // ✅ Changed cityName to name
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
        runValidators: true
      });
      
      if (!city) {
        return res
          .status(404)
          .json({ success: false, message: "City not found" });
      }
      
      res.json({ success: true, message: "City updated", data: city });
    } catch (error) {
      console.error("Error updating city:", error);
      
      // Handle duplicate key error
      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          message: "City name already exists",
          error: "Duplicate city name"
        });
      }
      
      res.status(500).json({ 
        success: false, 
        message: "Internal server error",
        error: error.message 
      });
    }
  }
);

// --- DELETE ---
// DELETE /api/admin/city/:id
router.delete(
  "/:id",
  auth,
  authorizeRole("Super Admin"),
  validate([param("id").isMongoId()]),
  async (req, res) => {
    try {
      const city = await City.findByIdAndDelete(req.params.id);
      if (!city) {
        return res
          .status(404)
          .json({ success: false, message: "City not found" });
      }
      res.json({ success: true, message: "City deleted" });
    } catch (error) {
      console.error("Error deleting city:", error);
      res.status(500).json({ 
        success: false, 
        message: "Internal server error",
        error: error.message 
      });
    }
  }
);

module.exports = router;
