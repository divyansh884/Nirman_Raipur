# Google Drive API Implementation Guide

## Overview
This implementation provides file upload, storage, and management functionality using Google Drive API. Files are organized into specific folders based on their purpose within the Nirman Jashpur project.

## Setup Instructions

### 1. Google Cloud Console Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Drive API for your project
4. Create a Service Account:
   - Go to IAM & Admin > Service Accounts
   - Click "Create Service Account"
   - Provide a name and description
   - Grant the service account the "Editor" role
   - Create and download the JSON key file

### 2. Google Drive Setup
1. Create a folder in your Google Drive where you want to store project files
2. Share this folder with your service account email (found in the JSON key file)
3. Give the service account "Editor" permissions

### 3. Backend Configuration
1. Copy the downloaded JSON key file to `config/google-service-account.json`
2. Update your `.env` file with the following variables:

```env
# Google Drive Configuration
GOOGLE_SERVICE_ACCOUNT_KEY_FILE=./config/google-service-account.json
GOOGLE_DRIVE_PROJECT_FOLDER=Nirman_Jashpur_Documents

# File Upload Configuration
MAX_FILE_SIZE=10485760  # 10MB in bytes
```

## Folder Structure
The system automatically creates the following folder structure in Google Drive:

```
Nirman_Jashpur_Documents/
├── Work_Proposals/
├── Tenders/
├── Work_Orders/
├── Work_Progress/
├── Reports/
├── Administrative_Approvals/
└── Technical_Approvals/
```

## API Endpoints

### Upload Endpoints

#### 1. Upload to Work Proposals
- **POST** `/api/uploads/work-proposals`
- **Auth Required:** Yes
- **Form Data:** `files` (array of files, max 5)

#### 2. Upload to Tenders
- **POST** `/api/uploads/tenders`
- **Auth Required:** Yes
- **Form Data:** `files` (array of files, max 5)

#### 3. Upload to Work Orders
- **POST** `/api/uploads/work-orders`
- **Auth Required:** Yes
- **Form Data:** `files` (array of files, max 5)

#### 4. Upload to Work Progress
- **POST** `/api/uploads/work-progress`
- **Auth Required:** Yes
- **Form Data:** `files` (array of files, max 5)

#### 5. Upload to Reports
- **POST** `/api/uploads/reports`
- **Auth Required:** Yes
- **Form Data:** `files` (array of files, max 5)

#### 6. Upload to Administrative Approvals
- **POST** `/api/uploads/administrative-approvals`
- **Auth Required:** Yes
- **Form Data:** `files` (array of files, max 5)

#### 7. Upload to Technical Approvals
- **POST** `/api/uploads/technical-approvals`
- **Auth Required:** Yes
- **Form Data:** `files` (array of files, max 5)

#### 8. General Upload
- **POST** `/api/uploads/general`
- **Auth Required:** Yes
- **Form Data:** `files` (array of files, max 5)

### Management Endpoints

#### 1. Delete File
- **DELETE** `/api/uploads/file/:fileId`
- **Auth Required:** Yes
- **Description:** Deletes a file from Google Drive

#### 2. Get File Information
- **GET** `/api/uploads/file/:fileId`
- **Auth Required:** Yes
- **Description:** Retrieves file metadata

#### 3. List Files in Folder
- **GET** `/api/uploads/folder/:folderType`
- **Auth Required:** Yes
- **Query Parameters:**
  - `pageSize` (optional, default: 10)
- **Description:** Lists files in a specific folder

#### 4. Initialize Folders
- **POST** `/api/uploads/initialize-folders`
- **Auth Required:** Yes
- **Description:** Creates the folder structure in Google Drive

## Supported File Types
- PDF documents (`.pdf`)
- Microsoft Word documents (`.doc`, `.docx`)
- Microsoft Excel spreadsheets (`.xls`, `.xlsx`)
- Images (`.jpg`, `.jpeg`, `.png`, `.gif`)
- Text files (`.txt`)
- Compressed files (`.zip`, `.rar`)

## File Size Limits
- Maximum file size: 10MB (configurable via `MAX_FILE_SIZE` environment variable)
- Maximum files per request: 5

## Response Format

### Successful Upload Response
```json
{
  "success": true,
  "message": "Files uploaded successfully to [folder name]",
  "files": [
    {
      "originalName": "document.pdf",
      "filename": "document.pdf",
      "fileId": "1ABC123...",
      "viewLink": "https://drive.google.com/file/d/1ABC123.../view",
      "downloadLink": "https://drive.google.com/uc?id=1ABC123...",
      "mimetype": "application/pdf",
      "size": 1024576,
      "uploadedAt": "2025-08-26T12:00:00.000Z"
    }
  ]
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

## Frontend Integration Example

### JavaScript/React Example
```javascript
const uploadFiles = async (files, category) => {
  const formData = new FormData();
  
  // Add files to form data
  for (let i = 0; i < files.length; i++) {
    formData.append('files', files[i]);
  }
  
  try {
    const response = await fetch(`/api/uploads/${category}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}` // Include auth token
      },
      body: formData
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('Files uploaded successfully:', result.files);
    } else {
      console.error('Upload failed:', result.message);
    }
  } catch (error) {
    console.error('Upload error:', error);
  }
};

// Usage
const fileInput = document.getElementById('fileInput');
uploadFiles(fileInput.files, 'work-proposals');
```

## Security Features
- Authentication required for all endpoints
- File type validation
- File size limits
- Google Drive permissions management
- Error handling and logging

## Troubleshooting

### Common Issues

1. **"Failed to initialize Google Drive API"**
   - Check that the service account JSON file is correctly placed
   - Verify the file path in the environment variable
   - Ensure the Google Drive API is enabled in Google Cloud Console

2. **"Permission denied"**
   - Verify that the service account has been shared with the Google Drive folder
   - Check that the service account has "Editor" permissions

3. **"File type not allowed"**
   - Check the supported file types list
   - Ensure the file has the correct MIME type

4. **"File size too large"**
   - Check the MAX_FILE_SIZE configuration
   - Reduce file size or increase the limit

## Environment Variables Reference

```env
# Required
GOOGLE_SERVICE_ACCOUNT_KEY_FILE=./config/google-service-account.json

# Optional
GOOGLE_DRIVE_PROJECT_FOLDER=Nirman_Jashpur_Documents
MAX_FILE_SIZE=10485760
```

## Dependencies Added
- `googleapis`: Google APIs client library
- `multer`: Middleware for handling file uploads
