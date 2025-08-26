const multer = require('multer');
const googleDriveService = require('../services/googleDriveService');

// Configure multer for memory storage
const storage = multer.memoryStorage();

// File filter function
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'text/plain',
    'application/zip',
    'application/x-rar-compressed'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed`), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB default
    files: 5 // Maximum 5 files per request
  }
});

// Middleware to handle Google Drive upload
const uploadToGoogleDrive = (folderType) => {
  return async (req, res, next) => {
    try {
      if (!req.files || req.files.length === 0) {
        return next();
      }

      // Initialize project folders if not already done
      const folders = await googleDriveService.initializeProjectFolders();
      
      // Get the appropriate folder ID based on the folder type
      const folderId = folders[folderType];
      
      if (!folderId) {
        throw new Error(`Invalid folder type: ${folderType}`);
      }

      // Upload files to Google Drive
      const uploadPromises = req.files.map(async (file) => {
        const result = await googleDriveService.uploadFile(
          file.buffer,
          file.originalname,
          file.mimetype,
          folderId
        );

        return {
          originalName: file.originalname,
          filename: result.fileName,
          fileId: result.fileId,
          viewLink: result.viewLink,
          downloadLink: result.downloadLink,
          mimetype: file.mimetype,
          size: file.size,
          uploadedAt: new Date()
        };
      });

      const uploadedFiles = await Promise.all(uploadPromises);
      
      // Add uploaded files info to request object
      req.uploadedFiles = uploadedFiles;
      
      next();
    } catch (error) {
      console.error('Error uploading to Google Drive:', error);
      res.status(500).json({
        success: false,
        message: 'Error uploading files to Google Drive',
        error: error.message
      });
    }
  };
};

// Error handler for multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size too large',
        error: `Maximum file size is ${process.env.MAX_FILE_SIZE || '10MB'}`
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files',
        error: 'Maximum 5 files allowed per request'
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected field name',
        error: 'Please use the correct field name for file upload'
      });
    }
  }
  
  if (err.message.includes('File type')) {
    return res.status(400).json({
      success: false,
      message: 'Invalid file type',
      error: err.message
    });
  }

  next(err);
};

module.exports = {
  upload,
  uploadToGoogleDrive,
  handleMulterError
};
