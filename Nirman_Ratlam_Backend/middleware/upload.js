const multer = require("multer");
const s3 = require("../utils/s3");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

// this lets you upload *both* in one request
const uploadFields = upload.fields([
  { name: "document", maxCount: 1 },
  { name: "images", maxCount: 5 }, // change limit as you like
]);

// upload single doc
const s3UploadDoc = async (req, res, next) => {
  try {
    if (!req.files || !req.files.document) return next();

    const file = req.files.document[0];
    const params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: `documents/${Date.now()}_${file.originalname}`,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: "public-read",
    };

    const data = await s3.upload(params).promise();

    req.s3Uploads = req.s3Uploads || {};
    req.s3Uploads.document = {
      key: data.Key,
      url: data.Location,
      size: file.size,
      eTag: data.ETag,
    };

    next();
  } catch (err) {
    console.error("S3 Doc Upload Error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Error uploading document" });
  }
};

// upload multiple images
const s3UploadImages = async (req, res, next) => {
  try {
    if (!req.files || !req.files.images) return next();

    const uploads = await Promise.all(
      req.files.images.map(async (file) => {
        const params = {
          Bucket: process.env.AWS_S3_BUCKET,
          Key: `images/${Date.now()}_${file.originalname}`,
          Body: file.buffer,
          ContentType: file.mimetype,
          ACL: "public-read",
        };
        const data = await s3.upload(params).promise();
        return {
          key: data.Key,
          url: data.Location,
          size: file.size,
          eTag: data.ETag,
        };
      })
    );

    req.s3Uploads = req.s3Uploads || {};
    req.s3Uploads.images = uploads;

    next();
  } catch (err) {
    console.error("S3 Image Upload Error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Error uploading images" });
  }
};

module.exports = { uploadFields, s3UploadDoc, s3UploadImages };
