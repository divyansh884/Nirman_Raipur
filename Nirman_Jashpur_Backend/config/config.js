module.exports = {
  // Server configuration
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database configuration
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/nirman_jashpur',
  },
  
  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback_secret_key',
    expiresIn: process.env.JWT_EXPIRE || '7d'
  },
  
  // CORS configuration
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
  },
  
  // Rate limiting configuration
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
  },
  
  // File upload configuration
  upload: {
    maxFileSize: process.env.MAX_FILE_SIZE || '10mb',
    uploadPath: process.env.UPLOAD_PATH || './uploads'
  },
  
  // Google Drive configuration
  googleDrive: {
    serviceAccountKeyFile: process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE || './config/google-service-account.json',
    projectFolderName: process.env.GOOGLE_DRIVE_PROJECT_FOLDER || 'Nirman_Jashpur_Documents'
  },
  
  // API configuration
  api: {
    version: process.env.API_VERSION || 'v1',
    prefix: `/api/${process.env.API_VERSION || 'v1'}`
  },
  
  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info'
  }
};
