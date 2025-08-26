# Google Drive Integration - Upload Functionality

## Overview
The Nirman Jashpur backend now includes comprehensive Google Drive integration for file storage and management. This implementation provides secure, organized file uploads with automatic folder structure creation and file management capabilities.

## ✨ Features

- **Automatic Folder Organization**: Files are automatically organized into specific folders based on their purpose
- **Multiple File Upload**: Support for uploading up to 5 files simultaneously
- **File Type Validation**: Supports common document, image, and archive formats
- **Size Limits**: Configurable file size limits (default: 10MB)
- **Authentication**: All upload endpoints require valid JWT authentication
- **File Management**: Complete CRUD operations for files (upload, view, delete, list)
- **Error Handling**: Comprehensive error handling and validation

## 📁 Folder Structure

The system automatically creates and manages the following folder structure in Google Drive:

```
Nirman_Jashpur_Documents/
├── Work_Proposals/          # Project proposals and related documents
├── Tenders/                 # Tender documents and submissions
├── Work_Orders/             # Work order documents and approvals
├── Work_Progress/           # Progress reports and updates
├── Reports/                 # Generated reports and analytics
├── Administrative_Approvals/# Administrative approval documents
└── Technical_Approvals/     # Technical approval documents
```

## 🔧 Setup Instructions

### 1. Google Cloud Console Setup

1. **Create Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Note down your Project ID

2. **Enable Google Drive API**
   - Navigate to APIs & Services > Library
   - Search for "Google Drive API"
   - Click "Enable"

3. **Create Service Account**
   - Go to IAM & Admin > Service Accounts
   - Click "Create Service Account"
   - Provide name: `nirman-jashpur-drive-service`
   - Description: `Service account for Nirman Jashpur file uploads`
   - Click "Create and Continue"
   - Select Role: "Editor" or create custom role with Drive permissions
   - Click "Done"

4. **Generate Key File**
   - Click on the created service account
   - Go to "Keys" tab
   - Click "Add Key" > "Create new key"
   - Select "JSON" format
   - Download the key file

### 2. Google Drive Setup

1. **Create Project Folder**
   - Create a folder in your Google Drive named `Nirman_Jashpur_Documents`
   - Or use any name you prefer (configurable via environment variable)

2. **Share with Service Account**
   - Right-click on the folder
   - Click "Share"
   - Add the service account email (found in the JSON key file)
   - Give "Editor" permissions
   - Click "Send"

### 3. Backend Configuration

1. **Place Key File**
   ```bash
   cp /path/to/downloaded/service-account-key.json ./config/google-service-account.json
   ```

2. **Update Environment Variables**
   ```bash
   # Copy example env file
   cp .env.example .env
   
   # Edit .env file with your values
   GOOGLE_SERVICE_ACCOUNT_KEY_FILE=./config/google-service-account.json
   GOOGLE_DRIVE_PROJECT_FOLDER=Nirman_Jashpur_Documents
   MAX_FILE_SIZE=10485760  # 10MB
   ```

3. **Install Dependencies**
   ```bash
   npm install
   ```

4. **Initialize Folder Structure**
   ```bash
   # Start the server
   npm run dev
   
   # Make API call to initialize folders (requires authentication)
   curl -X POST http://localhost:3000/api/uploads/initialize-folders \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

## 🚀 API Endpoints

### Upload Endpoints

All upload endpoints require authentication and accept `multipart/form-data` with field name `files`.

| Endpoint | Description | Folder |
|----------|-------------|---------|
| `POST /api/uploads/work-proposals` | Upload work proposal documents | Work_Proposals |
| `POST /api/uploads/tenders` | Upload tender documents | Tenders |
| `POST /api/uploads/work-orders` | Upload work order documents | Work_Orders |
| `POST /api/uploads/work-progress` | Upload progress reports | Work_Progress |
| `POST /api/uploads/reports` | Upload generated reports | Reports |
| `POST /api/uploads/administrative-approvals` | Upload admin approvals | Administrative_Approvals |
| `POST /api/uploads/technical-approvals` | Upload technical approvals | Technical_Approvals |
| `POST /api/uploads/general` | Upload to root project folder | Root folder |

### Management Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/uploads/file/:fileId` | DELETE | Delete a specific file |
| `/api/uploads/file/:fileId` | GET | Get file information |
| `/api/uploads/folder/:folderType` | GET | List files in folder |
| `/api/uploads/initialize-folders` | POST | Create folder structure |

### Example Usage

```javascript
// Upload files to work proposals
const formData = new FormData();
formData.append('files', file1);
formData.append('files', file2);

const response = await fetch('/api/uploads/work-proposals', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const result = await response.json();
console.log('Uploaded files:', result.files);
```

## 📄 Supported File Types

- **Documents**: PDF, DOC, DOCX, XLS, XLSX, TXT
- **Images**: JPG, JPEG, PNG, GIF
- **Archives**: ZIP, RAR

## 🔒 Security Features

- **Authentication Required**: All endpoints require valid JWT tokens
- **File Type Validation**: Only allowed file types can be uploaded
- **Size Limits**: Configurable maximum file size
- **Permission Management**: Google Drive permissions automatically set
- **Error Handling**: Comprehensive error messages and logging

## 🧪 Testing

Run the upload tests:

```bash
# Run all tests
npm test

# Run upload tests specifically
npm test -- tests/uploads.test.js

# Run with coverage
npm run test:coverage
```

## 🔧 Configuration Options

### Environment Variables

```bash
# Google Drive Configuration
GOOGLE_SERVICE_ACCOUNT_KEY_FILE=./config/google-service-account.json
GOOGLE_DRIVE_PROJECT_FOLDER=Nirman_Jashpur_Documents

# File Upload Limits
MAX_FILE_SIZE=10485760  # 10MB in bytes (adjustable)

# Security
JWT_SECRET=your_jwt_secret_here
```

### File Size Limits

Default: 10MB per file, maximum 5 files per request

To change:
```bash
# Set to 20MB
MAX_FILE_SIZE=20971520
```

## 🐛 Troubleshooting

### Common Issues

1. **"Failed to initialize Google Drive API"**
   - Check service account JSON file path
   - Verify Google Drive API is enabled
   - Ensure correct permissions in Google Cloud Console

2. **"Permission denied"**
   - Verify service account is shared with Google Drive folder
   - Check service account has "Editor" permissions
   - Confirm folder exists and is accessible

3. **"File type not allowed"**
   - Check supported file types list
   - Verify file MIME type is correct

4. **"File size too large"**
   - Check MAX_FILE_SIZE environment variable
   - Reduce file size or increase limit

### Debug Mode

Enable detailed logging:
```bash
LOG_LEVEL=debug
NODE_ENV=development
```

## 📊 Response Formats

### Success Response
```json
{
  "success": true,
  "message": "Files uploaded successfully to Work Proposals folder",
  "files": [
    {
      "originalName": "proposal.pdf",
      "filename": "proposal.pdf",
      "fileId": "1ABC123XYZ789",
      "viewLink": "https://drive.google.com/file/d/1ABC123XYZ789/view",
      "downloadLink": "https://drive.google.com/uc?id=1ABC123XYZ789",
      "mimetype": "application/pdf",
      "size": 1048576,
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

## 🔄 Integration with Existing Models

Files uploaded through this system can be linked to existing database models by storing the file metadata:

```javascript
// Example: Link files to WorkProposal model
const workProposal = await WorkProposal.findById(proposalId);
workProposal.attachments = req.uploadedFiles; // Array of file metadata
await workProposal.save();
```

## 📈 Performance Considerations

- **Parallel Uploads**: Multiple files uploaded simultaneously
- **Streaming**: Large files handled via streaming to minimize memory usage
- **Caching**: File metadata cached for faster retrieval
- **Error Recovery**: Automatic retry mechanisms for failed uploads

## 🔮 Future Enhancements

- **File Versioning**: Track file versions and changes
- **Bulk Operations**: Mass file operations
- **Advanced Search**: Search within uploaded documents
- **Thumbnail Generation**: Automatic thumbnail creation for images
- **File Sharing**: Advanced sharing and collaboration features

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review error logs in the console
3. Verify Google Cloud Console configuration
4. Ensure all environment variables are set correctly
