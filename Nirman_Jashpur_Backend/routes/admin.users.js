// routes/admin.users.js
// Drop-in admin user management routes for your existing Express + Mongoose app.
// Assumes you already have: auth + authorizeRole middleware (you shared), and a Mongoose User model.
// Dependencies: express, express-validator, bcryptjs
// Usage: app.use('/api/admin', require('./routes/admin.users'));

// import express from "express";
// import { body, param, query, validationResult } from "express-validator";
// import User from "../models/User.js";
// import { auth, authorizeRole } from "../middleware/auth.js";
// import mongoose from "mongoose";
// import Department from "../models/Department.js";
const express = require("express");
const { body, param, query, validationResult } = require("express-validator");
const User = require("../models/User");
const { auth, authorizeRole } = require("../middleware/auth");
const mongoose = require("mongoose");
const Department = require("../models/Department");

const router = express.Router();

// --- helper: validation glue ---
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

const safeUser = (u) => ({
  id: u._id.toString(),
  username: u.username,
  fullName: u.fullName,
  email: u.email,
  role: u.role,
  department: u.department,
  contactNumber: u.contactNumber,
  designation: u.designation,
  isActive: u.isActive,
  createdAt: u.createdAt,
  updatedAt: u.updatedAt,
});

// --- CREATE ONE USER ---
// POST /api/admin/users
router.post(
  "/",
  auth,
  authorizeRole("Super Admin"),
  validate([
    body("username")
      .trim()
      .isLength({ min: 3 })
      .matches(/^[a-zA-Z0-9_.-]+$/)
      .withMessage("username: alphanumeric and _ . - only"),
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 6 }),
    body("fullName").isLength({ min: 3, max: 100 }),
    body("role")
      .isIn([
        "Department User",
        "Technical Approver",
        "Administrative Approver",
        "Tender Manager",
        "Work Order Manager",
        "Progress Monitor",
        "Engineer",
      ])
      .withMessage("Invalid role"),
    body("department")
      .custom((val) => mongoose.Types.ObjectId.isValid(val))
      .withMessage("Invalid department id"),
    body("designation").isLength({ min: 3, max: 100 }),
    body("contactNumber").matches(/^[0-9]{10}$/),
  ]),
  async (req, res) => {
    const {
      username,
      email,
      role,
      department,
      password,
      fullName,
      contactNumber,
      designation,
    } = req.body;

    // unique checks
    const exists = await User.findOne({
      $or: [{ email }, { username }],
    }).select("_id email username");
    if (exists) {
      return res.status(409).json({
        success: false,
        message:
          exists.email === email
            ? "Email already in use"
            : "Username already in use",
      });
    }

    // validate department existence if provided
    let departmentDoc = null;
    if (department) {
      departmentDoc = await Department.findById(department).select("_id");
      if (!departmentDoc) {
        return res.status(400).json({
          success: false,
          message: "Invalid department reference",
        });
      }
    }

    const user = await User.create({
      username,
      email,
      role,
      fullName,
      contactNumber,
      department: departmentDoc ? departmentDoc._id : undefined,
      designation,
      isActive: true,
      password,
    });

    return res.status(201).json({
      success: true,
      message: "User created",
      data: { ...safeUser(user) },
    });
  },
);

// --- LIST USERS ---
router.get(
  "/",
  auth,
  authorizeRole("Super Admin"),
  validate([
    query("q").optional().isString(),
    query("role").optional().isString(),
    query("status").optional().isIn(["active", "inactive"]),
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
  ]),
  async (req, res) => {
    const { q, role, status } = req.query;
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);

    const filter = {};
    if (q)
      filter.$or = [
        { username: new RegExp(q, "i") },
        { email: new RegExp(q, "i") },
        { fullName: new RegExp(q, "i") },
      ];
    if (role) filter.role = role;
    if (status) filter.isActive = status === "active";

    const [items, total] = await Promise.all([
      User.find(filter)
        .populate("department", "name")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select("-password"),
      User.countDocuments(filter),
    ]);

    res.json({ success: true, data: items, page, limit, total });
  },
);

// --- GET ONE USER ---
router.get(
  "/:id",
  auth,
  authorizeRole("Super Admin"),
  validate([param("id").isMongoId()]),
  async (req, res) => {
    const user = await User.findById(req.params.id)
      .populate("department", "name")
      .select("-password");
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    res.json({ success: true, data: user });
  },
);

// --- UPDATE USER (no password here) ---
router.patch(
  "/:id",
  auth,
  authorizeRole("Super Admin"),
  validate([
    param("id").isMongoId(),
    body("username").optional().trim().isLength({ min: 3 }),
    body("email").optional().isEmail().normalizeEmail(),
    body("role").optional().isString(),
    body("department")
      .optional()
      .custom((val) => mongoose.Types.ObjectId.isValid(val))
      .withMessage("Invalid department id"),
    body("permissions").optional().isArray(),
    body("designation").optional().isLength({ min: 3, max: 100 }),
    body("contactNumber")
      .optional()
      .matches(/^[0-9]{10}$/),
  ]),
  async (req, res) => {
    const updates = { ...req.body };
    delete updates.password;

    if (updates.email) {
      const taken = await User.findOne({
        email: updates.email,
        _id: { $ne: req.params.id },
      });
      if (taken)
        return res
          .status(409)
          .json({ success: false, message: "Email already in use" });
    }
    if (updates.username) {
      const taken = await User.findOne({
        username: updates.username,
        _id: { $ne: req.params.id },
      });
      if (taken)
        return res
          .status(409)
          .json({ success: false, message: "Username already in use" });
    }

    if (updates.department) {
      const dept = await Department.findById(updates.department).select("_id");
      if (!dept) {
        return res.status(400).json({
          success: false,
          message: "Invalid department reference",
        });
      }
    }

    const user = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
      context: "query",
    })
      .populate("department", "name")
      .select("-password");

    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    res.json({ success: true, message: "User updated", data: user });
  },
);

// --- ACTIVATE/DEACTIVATE ---
router.patch(
  "/:id/status",
  auth,
  authorizeRole("Super Admin"),
  validate([param("id").isMongoId(), body("isActive").isBoolean()]),
  async (req, res) => {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: req.body.isActive },
      { new: true },
    )
      .populate("department", "name")
      .select("-password");

    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    res.json({ success: true, message: "Status updated", data: user });
  },
);

// --- RESET PASSWORD (admin-set or generated temp) ---
router.post(
  "/:id/reset-password",
  auth,
  authorizeRole("Super Admin"),
  validate([
    param("id").isMongoId(),
    body("password").optional().isLength({ min: 8 }),
  ]),
  async (req, res) => {
    const pwd = req.body.password || crypto.randomBytes(9).toString("base64");
    const hash = await bcrypt.hash(pwd, 12);

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { password: hash },
      { new: true },
    )
      .populate("department", "name")
      .select("-password");

    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    res.json({
      success: true,
      message: "Password reset",
      data: {
        ...safeUser(user),
        tempPassword: req.body.password ? undefined : pwd,
      },
    });
  },
);

// DELETE /api/admin/user/:id
router.delete("/:id", auth, authorizeRole("Super Admin"), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await user.deleteOne();
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;

/*
--- QUICK WIRING GUIDE ---
1) npm i express express-validator bcryptjs
2) Ensure your User schema has fields: username, email, role, department, permissions (Array), isActive (Boolean), password (String, hashed), timestamps.
3) In app.js/server.js:
   const adminUserRoutes = require('./routes/admin.users');
   app.use('/api/admin', adminUserRoutes);

--- SAMPLE REQUESTS ---
POST /api/admin/users
  { "username":"alice","email":"alice@nitr.ac.in","role":"manager","department":"CSE","permissions":["files:read"], "password":"StrongPass#1" }

POST /api/admin/users/bulk
  [ {"username":"bob","email":"bob@nitr.ac.in","role":"staff"}, {"username":"eve","email":"eve@nitr.ac.in","role":"viewer","password":"MyPassw0rd!"} ]

PATCH /api/admin/users/:id/status
  { "isActive": false }

POST /api/admin/users/:id/reset-password
  { }  // returns tempPassword in response
*/
