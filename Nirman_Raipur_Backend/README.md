# Nirman Jashpur Backend

A comprehensive backend API for managing construction work progress, orders, tenders, and administrative approvals in Jashpur district.

## Features

- **Work Progress Management**: Track the progress of construction works
- **Work Orders**: Manage work order lifecycle 
- **Tender Management**: Handle tender processes and approvals
- **Administrative Approvals**: Manage approval workflows
- **Work Types**: Define and categorize different types of work
- **Comprehensive Reports**: Generate various reports (agency-wise, block-wise, scheme-wise, etc.)
- **Data Validation**: Robust input validation and error handling
- **Pagination**: Efficient data retrieval with pagination
- **Search & Filtering**: Advanced search and filtering capabilities

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Validation**: express-validator
- **Security**: Helmet, CORS, Rate limiting
- **Authentication**: JWT (ready for implementation)
- **Development**: Nodemon, Jest for testing

## Project Structure

```
├── config/              # Configuration files
├── documentation/       # API documentation
├── middleware/          # Custom middleware functions
├── models/             # Mongoose schemas/models
├── routes/             # API route handlers
├── utils/              # Utility functions and helpers
├── server.js           # Main application entry point
├── package.json        # Dependencies and scripts
└── .env.example        # Environment variables template
```

## Setup Instructions

1. **Clone the repository**
   ```powershell
   git clone <your-repo-url>
   cd Nirman_Jashpur/Nirman_Jashpur_Backend
   ```

2. **Install dependencies**
   ```powershell
   npm install
   ```

3. **Environment Setup**
   ```powershell
   copy .env.example .env
   ```
   
   Edit the `.env` file with your configuration:
   ```env
   NODE_ENV=development
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/nirman_jashpur
   FRONTEND_URL=http://localhost:5173
   JWT_SECRET=your_very_long_and_secure_secret_key
   ```

4. **Start MongoDB**
   Ensure MongoDB is running on your system.

5. **Run the application**
   ```powershell
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## API Endpoints

Base URL: `http://localhost:3000/api/v1`

### Work Progress
- `GET /work-progress` - Get all work progress records
- `GET /work-progress/:id` - Get single work progress record
- `POST /work-progress` - Create new work progress record
- `PUT /work-progress/:id` - Update work progress record
- `DELETE /work-progress/:id` - Delete work progress record

### Work Orders
- `GET /work-orders` - Get all work orders
- `GET /work-orders/:id` - Get single work order
- `POST /work-orders` - Create new work order
- `PUT /work-orders/:id` - Update work order
- `DELETE /work-orders/:id` - Delete work order

### Tenders
- `GET /tenders` - Get all tenders
- `GET /tenders/:id` - Get single tender
- `POST /tenders` - Create new tender
- `PUT /tenders/:id` - Update tender
- `DELETE /tenders/:id` - Delete tender

### Administrative Approvals
- `GET /administrative-approvals` - Get all approvals
- `GET /administrative-approvals/:id` - Get single approval
- `POST /administrative-approvals` - Create new approval
- `PUT /administrative-approvals/:id` - Update approval
- `DELETE /administrative-approvals/:id` - Delete approval

### Work Types
- `GET /work-types` - Get all work types
- `GET /work-types/:id` - Get single work type
- `POST /work-types` - Create new work type
- `PUT /work-types/:id` - Update work type
- `DELETE /work-types/:id` - Delete work type

### Reports
- `GET /reports/agency-wise` - Agency-wise reports
- `GET /reports/block-wise` - Block-wise reports
- `GET /reports/scheme-wise` - Scheme-wise reports
- `GET /reports/pending` - Pending works report
- `GET /reports/final-status` - Final status of all works
- `GET /reports/engineer-wise` - Engineer-wise reports
- `GET /reports/photo-missing` - Works without photos

## Query Parameters

### Pagination
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10, max: 100)

### Sorting
- `sortBy` - Field to sort by
- `sortOrder` - Sort order: 'asc' or 'desc' (default: 'desc')

### Filtering
- `area` - Filter by area/block
- `scheme` - Filter by scheme
- `status` - Filter by status
- `workAgency` - Filter by work agency

## Development

### Scripts
- `npm run dev` - Start development server with hot reload
- `npm start` - Start production server
- `npm test` - Run tests

### Environment Variables
See `.env.example` for all available environment variables.

## Security Features

- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing configuration
- **Rate Limiting**: Prevent abuse
- **Input Validation**: Comprehensive validation using express-validator
- **Error Handling**: Secure error responses

## Database Models

All models include automatic timestamps and validation. See `models/` directory for complete schema definitions.

## Support

For support and questions, please contact the development team.
