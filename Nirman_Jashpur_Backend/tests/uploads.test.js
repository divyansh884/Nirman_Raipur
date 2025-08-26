const request = require('supertest');
const app = require('../server');
const path = require('path');
const fs = require('fs');

describe('Google Drive Upload API', () => {
  let authToken;

  beforeAll(async () => {
    // Mock authentication - you'll need to implement proper test authentication
    // For now, this assumes you have a test user setup
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'testpassword'
      });
    
    if (loginResponse.body.token) {
      authToken = loginResponse.body.token;
    }
  });

  describe('POST /api/uploads/initialize-folders', () => {
    it('should initialize project folders', async () => {
      const response = await request(app)
        .post('/api/uploads/initialize-folders')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.folders).toBeDefined();
      expect(response.body.folders.workProposals).toBeDefined();
      expect(response.body.folders.tenders).toBeDefined();
      expect(response.body.folders.workOrders).toBeDefined();
    });
  });

  describe('POST /api/uploads/work-proposals', () => {
    it('should upload files to work proposals folder', async () => {
      // Create a test file
      const testFilePath = path.join(__dirname, 'test-file.txt');
      fs.writeFileSync(testFilePath, 'This is a test file for upload');

      const response = await request(app)
        .post('/api/uploads/work-proposals')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('files', testFilePath)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.files).toBeDefined();
      expect(response.body.files.length).toBe(1);
      expect(response.body.files[0].originalName).toBe('test-file.txt');
      expect(response.body.files[0].fileId).toBeDefined();

      // Clean up
      fs.unlinkSync(testFilePath);
    });

    it('should reject unauthorized requests', async () => {
      const response = await request(app)
        .post('/api/uploads/work-proposals')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should handle missing files', async () => {
      const response = await request(app)
        .post('/api/uploads/work-proposals')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.files).toEqual([]);
    });
  });

  describe('POST /api/uploads/tenders', () => {
    it('should upload files to tenders folder', async () => {
      const testFilePath = path.join(__dirname, 'test-tender.pdf');
      
      // Create a mock PDF file (just for testing)
      fs.writeFileSync(testFilePath, 'Mock PDF content');

      const response = await request(app)
        .post('/api/uploads/tenders')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('files', testFilePath)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Tenders folder');

      // Clean up
      fs.unlinkSync(testFilePath);
    });
  });

  describe('GET /api/uploads/folder/:folderType', () => {
    it('should list files in work proposals folder', async () => {
      const response = await request(app)
        .get('/api/uploads/folder/workProposals')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.files).toBeDefined();
    });

    it('should handle invalid folder type', async () => {
      const response = await request(app)
        .get('/api/uploads/folder/invalidFolder')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid folder type');
    });
  });

  describe('File validation', () => {
    it('should reject unsupported file types', async () => {
      const testFilePath = path.join(__dirname, 'test-file.exe');
      fs.writeFileSync(testFilePath, 'Mock executable content');

      const response = await request(app)
        .post('/api/uploads/work-proposals')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('files', testFilePath)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid file type');

      // Clean up
      fs.unlinkSync(testFilePath);
    });

    it('should handle multiple files upload', async () => {
      const testFiles = [];
      
      // Create multiple test files
      for (let i = 1; i <= 3; i++) {
        const filePath = path.join(__dirname, `test-file-${i}.txt`);
        fs.writeFileSync(filePath, `Test file content ${i}`);
        testFiles.push(filePath);
      }

      let request_builder = request(app)
        .post('/api/uploads/work-proposals')
        .set('Authorization', `Bearer ${authToken}`);

      // Attach all test files
      testFiles.forEach(filePath => {
        request_builder = request_builder.attach('files', filePath);
      });

      const response = await request_builder.expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.files.length).toBe(3);

      // Clean up
      testFiles.forEach(filePath => {
        fs.unlinkSync(filePath);
      });
    });
  });
});

// Helper function to create test files with specific content
function createTestFile(filename, content, mimeType = 'text/plain') {
  const filePath = path.join(__dirname, filename);
  fs.writeFileSync(filePath, content);
  return filePath;
}

// Mock Google Drive service for testing
jest.mock('../services/googleDriveService', () => ({
  initializeProjectFolders: jest.fn().mockResolvedValue({
    rootFolderId: 'mock-root-id',
    workProposals: 'mock-work-proposals-id',
    tenders: 'mock-tenders-id',
    workOrders: 'mock-work-orders-id',
    workProgress: 'mock-work-progress-id',
    reports: 'mock-reports-id',
    administrativeApprovals: 'mock-admin-approvals-id',
    technicalApprovals: 'mock-tech-approvals-id'
  }),
  
  uploadFile: jest.fn().mockResolvedValue({
    fileId: 'mock-file-id-' + Date.now(),
    fileName: 'test-file.txt',
    viewLink: 'https://drive.google.com/file/d/mock-file-id/view',
    downloadLink: 'https://drive.google.com/uc?id=mock-file-id'
  }),
  
  deleteFile: jest.fn().mockResolvedValue(true),
  
  getFileInfo: jest.fn().mockResolvedValue({
    id: 'mock-file-id',
    name: 'test-file.txt',
    mimeType: 'text/plain',
    size: '1024',
    createdTime: new Date().toISOString(),
    modifiedTime: new Date().toISOString(),
    webViewLink: 'https://drive.google.com/file/d/mock-file-id/view',
    webContentLink: 'https://drive.google.com/uc?id=mock-file-id'
  }),
  
  listFiles: jest.fn().mockResolvedValue({
    files: [
      {
        id: 'mock-file-1',
        name: 'test-file-1.txt',
        mimeType: 'text/plain',
        size: '1024',
        createdTime: new Date().toISOString(),
        webViewLink: 'https://drive.google.com/file/d/mock-file-1/view'
      }
    ],
    nextPageToken: null
  })
}));
