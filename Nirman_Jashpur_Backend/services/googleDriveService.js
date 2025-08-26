const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

class GoogleDriveService {
  constructor() {
    this.auth = null;
    this.drive = null;
    this.initializeAuth();
  }

  async initializeAuth() {
    try {
      // Initialize Google Auth with service account
      this.auth = new google.auth.GoogleAuth({
        keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE || path.join(__dirname, '../config/google-service-account.json'),
        scopes: ['https://www.googleapis.com/auth/drive.file']
      });

      // Create Drive API client
      this.drive = google.drive({ version: 'v3', auth: this.auth });
      
      console.log('Google Drive API initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Google Drive API:', error);
      throw error;
    }
  }

  async ensureFolderExists(folderName, parentFolderId = null) {
    try {
      // Search for existing folder
      const query = parentFolderId 
        ? `name='${folderName}' and parents in '${parentFolderId}' and mimeType='application/vnd.google-apps.folder' and trashed=false`
        : `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;

      const response = await this.drive.files.list({
        q: query,
        fields: 'files(id, name)'
      });

      if (response.data.files.length > 0) {
        return response.data.files[0].id;
      }

      // Create folder if it doesn't exist
      const folderMetadata = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder'
      };

      if (parentFolderId) {
        folderMetadata.parents = [parentFolderId];
      }

      const folder = await this.drive.files.create({
        resource: folderMetadata,
        fields: 'id'
      });

      return folder.data.id;
    } catch (error) {
      console.error('Error ensuring folder exists:', error);
      throw error;
    }
  }

  async uploadFile(fileBuffer, fileName, mimeType, folderId = null) {
    try {
      const fileMetadata = {
        name: fileName
      };

      if (folderId) {
        fileMetadata.parents = [folderId];
      }

      const media = {
        mimeType: mimeType,
        body: fileBuffer
      };

      const response = await this.drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id, name, webViewLink, webContentLink'
      });

      // Make file publicly viewable (optional - adjust based on requirements)
      await this.drive.permissions.create({
        fileId: response.data.id,
        resource: {
          role: 'reader',
          type: 'anyone'
        }
      });

      return {
        fileId: response.data.id,
        fileName: response.data.name,
        viewLink: response.data.webViewLink,
        downloadLink: response.data.webContentLink
      };
    } catch (error) {
      console.error('Error uploading file to Google Drive:', error);
      throw error;
    }
  }

  async deleteFile(fileId) {
    try {
      await this.drive.files.delete({
        fileId: fileId
      });
      return true;
    } catch (error) {
      console.error('Error deleting file from Google Drive:', error);
      throw error;
    }
  }

  async getFileInfo(fileId) {
    try {
      const response = await this.drive.files.get({
        fileId: fileId,
        fields: 'id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink'
      });
      return response.data;
    } catch (error) {
      console.error('Error getting file info from Google Drive:', error);
      throw error;
    }
  }

  async listFiles(folderId = null, pageSize = 10) {
    try {
      const query = folderId 
        ? `parents in '${folderId}' and trashed=false`
        : 'trashed=false';

      const response = await this.drive.files.list({
        q: query,
        pageSize: pageSize,
        fields: 'nextPageToken, files(id, name, mimeType, size, createdTime, modifiedTime, webViewLink)'
      });

      return response.data;
    } catch (error) {
      console.error('Error listing files from Google Drive:', error);
      throw error;
    }
  }

  // Initialize project folder structure
  async initializeProjectFolders() {
    try {
      const rootFolderId = await this.ensureFolderExists('Nirman_Jashpur_Documents');
      
      const folders = {
        workProposals: await this.ensureFolderExists('Work_Proposals', rootFolderId),
        tenders: await this.ensureFolderExists('Tenders', rootFolderId),
        workOrders: await this.ensureFolderExists('Work_Orders', rootFolderId),
        workProgress: await this.ensureFolderExists('Work_Progress', rootFolderId),
        reports: await this.ensureFolderExists('Reports', rootFolderId),
        administrativeApprovals: await this.ensureFolderExists('Administrative_Approvals', rootFolderId),
        technicalApprovals: await this.ensureFolderExists('Technical_Approvals', rootFolderId)
      };

      return { rootFolderId, ...folders };
    } catch (error) {
      console.error('Error initializing project folders:', error);
      throw error;
    }
  }
}

module.exports = new GoogleDriveService();
