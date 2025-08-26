const express = require('express');
const router = express.Router();
const { upload, uploadToGoogleDrive } = require('../middleware/upload');
const { auth } = require('../middleware/auth');
const googleDriveService = require('../services/googleDriveService');

// Upload files for work proposals
router.post('/work-proposals', 
  auth, 
  upload.array('files', 5), 
  uploadToGoogleDrive('workProposals'),
  (req, res) => {
    try {
      res.status(200).json({
        success: true,
        message: 'Files uploaded successfully to Work Proposals folder',
        files: req.uploadedFiles || []
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error processing upload',
        error: error.message
      });
    }
  }
);

// Upload files for tenders
router.post('/tenders', 
  auth, 
  upload.array('files', 5), 
  uploadToGoogleDrive('tenders'),
  (req, res) => {
    try {
      res.status(200).json({
        success: true,
        message: 'Files uploaded successfully to Tenders folder',
        files: req.uploadedFiles || []
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error processing upload',
        error: error.message
      });
    }
  }
);

// Upload files for work orders
router.post('/work-orders', 
  auth, 
  upload.array('files', 5), 
  uploadToGoogleDrive('workOrders'),
  (req, res) => {
    try {
      res.status(200).json({
        success: true,
        message: 'Files uploaded successfully to Work Orders folder',
        files: req.uploadedFiles || []
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error processing upload',
        error: error.message
      });
    }
  }
);

// Upload files for work progress
router.post('/work-progress', 
  auth, 
  upload.array('files', 5), 
  uploadToGoogleDrive('workProgress'),
  (req, res) => {
    try {
      res.status(200).json({
        success: true,
        message: 'Files uploaded successfully to Work Progress folder',
        files: req.uploadedFiles || []
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error processing upload',
        error: error.message
      });
    }
  }
);

// Upload files for reports
router.post('/reports', 
  auth, 
  upload.array('files', 5), 
  uploadToGoogleDrive('reports'),
  (req, res) => {
    try {
      res.status(200).json({
        success: true,
        message: 'Files uploaded successfully to Reports folder',
        files: req.uploadedFiles || []
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error processing upload',
        error: error.message
      });
    }
  }
);

// Upload files for administrative approvals
router.post('/administrative-approvals', 
  auth, 
  upload.array('files', 5), 
  uploadToGoogleDrive('administrativeApprovals'),
  (req, res) => {
    try {
      res.status(200).json({
        success: true,
        message: 'Files uploaded successfully to Administrative Approvals folder',
        files: req.uploadedFiles || []
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error processing upload',
        error: error.message
      });
    }
  }
);

// Upload files for technical approvals
router.post('/technical-approvals', 
  auth, 
  upload.array('files', 5), 
  uploadToGoogleDrive('technicalApprovals'),
  (req, res) => {
    try {
      res.status(200).json({
        success: true,
        message: 'Files uploaded successfully to Technical Approvals folder',
        files: req.uploadedFiles || []
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error processing upload',
        error: error.message
      });
    }
  }
);

// Generic upload route (goes to root project folder)
router.post('/general', 
  auth, 
  upload.array('files', 5), 
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No files provided'
        });
      }

      const folders = await googleDriveService.initializeProjectFolders();
      
      const uploadPromises = req.files.map(async (file) => {
        const result = await googleDriveService.uploadFile(
          file.buffer,
          file.originalname,
          file.mimetype,
          folders.rootFolderId
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

      res.status(200).json({
        success: true,
        message: 'Files uploaded successfully to general folder',
        files: uploadedFiles
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error uploading files',
        error: error.message
      });
    }
  }
);

// Delete file from Google Drive
router.delete('/file/:fileId', auth, async (req, res) => {
  try {
    const { fileId } = req.params;
    
    await googleDriveService.deleteFile(fileId);
    
    res.status(200).json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting file',
      error: error.message
    });
  }
});

// Get file information
router.get('/file/:fileId', auth, async (req, res) => {
  try {
    const { fileId } = req.params;
    
    const fileInfo = await googleDriveService.getFileInfo(fileId);
    
    res.status(200).json({
      success: true,
      data: fileInfo
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error getting file information',
      error: error.message
    });
  }
});

// List files in a folder
router.get('/folder/:folderType', auth, async (req, res) => {
  try {
    const { folderType } = req.params;
    const { pageSize = 10 } = req.query;
    
    const folders = await googleDriveService.initializeProjectFolders();
    const folderId = folders[folderType];
    
    if (!folderId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid folder type'
      });
    }
    
    const files = await googleDriveService.listFiles(folderId, parseInt(pageSize));
    
    res.status(200).json({
      success: true,
      data: files
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error listing files',
      error: error.message
    });
  }
});

// Initialize project folder structure
router.post('/initialize-folders', auth, async (req, res) => {
  try {
    const folders = await googleDriveService.initializeProjectFolders();
    
    res.status(200).json({
      success: true,
      message: 'Project folders initialized successfully',
      folders: folders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error initializing folders',
      error: error.message
    });
  }
});

// Error handling middleware for multer and upload errors
router.use((err, req, res, next) => {
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
  
  if (err.message && err.message.includes('File type')) {
    return res.status(400).json({
      success: false,
      message: 'Invalid file type',
      error: err.message
    });
  }

  // Generic error
  res.status(500).json({
    success: false,
    message: 'Upload error',
    error: err.message
  });
});

module.exports = router;
