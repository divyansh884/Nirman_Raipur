const multer = require("multer");
const s3 = require("../utils/s3");

// memory storage
const upload = multer({ storage: multer.memoryStorage() });

// single file upload (field: "document")
const uploadDocMiddleware = upload.single("document");

const s3UploadMiddleware = async (req, res, next) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No document uploaded" });
    }

    const params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: `documents/${Date.now()}_${req.file.originalname}`,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
      ACL: "public-read",
    };

    const data = await s3.upload(params).promise();

    // attach info to request object (not saving to DB here)
    req.s3File = {
      key: data.Key,
      url: data.Location,
      size: req.file.size,
      eTag: data.ETag,
    };

    next();
  } catch (err) {
    console.error("S3 Upload Error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Error uploading document" });
  }
};

module.exports = { uploadDocMiddleware, s3UploadMiddleware };
