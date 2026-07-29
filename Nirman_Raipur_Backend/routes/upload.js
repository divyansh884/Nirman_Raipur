const express = require("express");
const router = express.Router();

const { uploadImageMiddleware, uploadImage, getFileView } = require("../controllers/uploadController");
const { uploadDocMiddleware, uploadDocument } = require("../controllers/uploadDocuments");

// Image upload route (up to 3 images)
router.post("/images", uploadImageMiddleware, uploadImage);

// Document upload route (1 doc only)
router.post("/document", uploadDocMiddleware, uploadDocument);

// File viewing / download route (returns signed S3 URL or streams file)
router.get("/view", getFileView);

module.exports = router;
