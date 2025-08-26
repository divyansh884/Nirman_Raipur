const googleDriveService = require('../services/googleDriveService');

/**
 * File upload utilities for different entities
 */
class FileUploadUtils {
  
  /**
   * Upload files and return file metadata for database storage
   * @param {Array} files - Array of uploaded files from multer
   * @param {String} category - Category/folder type for organization
   * @returns {Array} Array of file metadata objects
   */
  static async processUploadedFiles(files, category) {
    if (!files || files.length === 0) {
      return [];
    }

    try {
      const folders = await googleDriveService.initializeProjectFolders();
      const folderId = folders[category];
      
      if (!folderId) {
        throw new Error(`Invalid category: ${category}`);
      }

      const uploadPromises = files.map(async (file) => {
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
          category: category,
          uploadedAt: new Date()
        };
      });

      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error('Error processing uploaded files:', error);
      throw error;
    }
  }

  /**
   * Delete multiple files from Google Drive
   * @param {Array} fileIds - Array of Google Drive file IDs
   * @returns {Array} Array of deletion results
   */
  static async deleteFiles(fileIds) {
    if (!fileIds || fileIds.length === 0) {
      return [];
    }

    try {
      const deletePromises = fileIds.map(async (fileId) => {
        try {
          await googleDriveService.deleteFile(fileId);
          return { fileId, success: true };
        } catch (error) {
          console.error(`Error deleting file ${fileId}:`, error);
          return { fileId, success: false, error: error.message };
        }
      });

      return await Promise.all(deletePromises);
    } catch (error) {
      console.error('Error deleting files:', error);
      throw error;
    }
  }

  /**
   * Get file information for multiple files
   * @param {Array} fileIds - Array of Google Drive file IDs
   * @returns {Array} Array of file information objects
   */
  static async getFilesInfo(fileIds) {
    if (!fileIds || fileIds.length === 0) {
      return [];
    }

    try {
      const infoPromises = fileIds.map(async (fileId) => {
        try {
          const info = await googleDriveService.getFileInfo(fileId);
          return { fileId, success: true, info };
        } catch (error) {
          console.error(`Error getting info for file ${fileId}:`, error);
          return { fileId, success: false, error: error.message };
        }
      });

      return await Promise.all(infoPromises);
    } catch (error) {
      console.error('Error getting files info:', error);
      throw error;
    }
  }

  /**
   * Validate file type and size
   * @param {Object} file - File object from multer
   * @returns {Object} Validation result
   */
  static validateFile(file) {
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

    const maxSize = parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024; // 10MB

    const errors = [];

    if (!allowedTypes.includes(file.mimetype)) {
      errors.push(`File type ${file.mimetype} is not allowed`);
    }

    if (file.size > maxSize) {
      errors.push(`File size ${file.size} exceeds maximum allowed size of ${maxSize} bytes`);
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  /**
   * Validate multiple files
   * @param {Array} files - Array of file objects from multer
   * @returns {Object} Validation result for all files
   */
  static validateFiles(files) {
    if (!files || files.length === 0) {
      return { isValid: true, errors: [], validFiles: [] };
    }

    const maxFiles = 5;
    const errors = [];
    const validFiles = [];

    if (files.length > maxFiles) {
      errors.push(`Too many files. Maximum ${maxFiles} files allowed`);
      return { isValid: false, errors, validFiles };
    }

    files.forEach((file, index) => {
      const validation = this.validateFile(file);
      if (validation.isValid) {
        validFiles.push(file);
      } else {
        errors.push(`File ${index + 1} (${file.originalname}): ${validation.errors.join(', ')}`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors: errors,
      validFiles: validFiles
    };
  }

  /**
   * Generate a unique filename with timestamp
   * @param {String} originalName - Original filename
   * @returns {String} Unique filename
   */
  static generateUniqueFilename(originalName) {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);
    const extension = originalName.split('.').pop();
    const nameWithoutExt = originalName.replace(/\.[^/.]+$/, "");
    
    return `${nameWithoutExt}_${timestamp}_${randomStr}.${extension}`;
  }

  /**
   * Get MIME type from file extension
   * @param {String} filename - Filename with extension
   * @returns {String} MIME type
   */
  static getMimeType(filename) {
    const extension = filename.split('.').pop().toLowerCase();
    const mimeTypes = {
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'txt': 'text/plain',
      'zip': 'application/zip',
      'rar': 'application/x-rar-compressed'
    };

    return mimeTypes[extension] || 'application/octet-stream';
  }

  /**
   * Format file size in human readable format
   * @param {Number} bytes - File size in bytes
   * @returns {String} Formatted file size
   */
  static formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

module.exports = FileUploadUtils;
