# Nirman Jashpur - Complete API Documentation

## Overview
This API manages the complete government work proposal workflow from submission to completion, including technical approval, administrative approval, tender process, work orders, and progress tracking.

## Authentication
All endpoints (except auth) require a Bearer token in the Authorization header:
```
Authorization: Bearer <your_token_here>
```

## API Endpoints

### Authentication Routes
**Base URL:** `/api/auth`

#### POST /register
Create a new user account
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "password123",
  "fullName": "John Doe",
  "role": "Department User",
  "department": "Public Works",
  "designation": "Engineer",
  "phoneNumber": "9876543210",
  "address": "123 Main St"
}
```

#### POST /login
Login user
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

#### GET /me
Get current user profile (requires authentication)

#### PUT /profile
Update user profile (requires authentication)

#### PUT /change-password
Change user password (requires authentication)

#### POST /logout
Logout user (requires authentication)

---

### Work Proposals Routes
**Base URL:** `/api/work-proposals`

#### POST /
Create new work proposal
```json
{
  "typeOfWork": "Road Construction",
  "nameOfWork": "Village Road Construction Project",
  "workAgency": "PWD",
  "scheme": "PMGSY",
  "nameOfJPDBT": "Jashpur DBT Office",
  "nameOfGPWard": "Ward 5",
  "workDescription": "Construction of 2km village road",
  "financialYear": "2024-25",
  "workDepartment": "Public Works",
  "userDepartment": "Rural Development",
  "approvingDepartment": "Public Works",
  "sanctionAmount": 500000,
  "plan": "State Plan",
  "assembly": "Jashpur",
  "longitude": 83.1234,
  "latitude": 22.5678,
  "appointedEngineer": "Mr. Ram Kumar",
  "appointedSDO": "Mr. Shyam Singh",
  "estimatedCompletionDateOfWork": "2025-03-31",
  "isDPROrNot": true,
  "isTenderOrNot": true
}
```

#### GET /
Get all work proposals with filtering
Query parameters:
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `status` - Filter by status
- `department` - Filter by department
- `financialYear` - Filter by financial year
- `search` - Text search

#### GET /:id
Get single work proposal by ID

#### PUT /:id
Update work proposal (only before technical approval)

#### DELETE /:id
Delete work proposal (only before technical approval)

#### POST /:id/technical-approval
Technical approval/rejection
```json
{
  "action": "approve", // or "reject"
  "approvalNumber": "TA/2024/001",
  "amountOfTechnicalSanction": 480000,
  "remarks": "Approved with minor modifications"
}
```

#### POST /:id/administrative-approval
Administrative approval/rejection
```json
{
  "action": "approve", // or "reject"
  "byGovtDistrictAS": "District Collector",
  "approvalNumber": "AA/2024/001",
  "approvedAmount": 480000,
  "remarks": "Final approval granted"
}
```

---

### Tender Management Routes
**Base URL:** `/api/work-proposals/:id/tender`

#### POST /start
Start tender process
```json
{
  "tenderTitle": "Road Construction Tender",
  "tenderID": "T2024001",
  "department": "Public Works",
  "issuedDates": "2024-12-01",
  "remark": "Standard tender process"
}
```

#### PUT /status
Update tender status
```json
{
  "tenderStatus": "Awarded", // Notice Published, Bid Submission, Under Evaluation, Awarded, Cancelled
  "remark": "Tender awarded to lowest bidder"
}
```

#### POST /award
Award tender to contractor
```json
{
  "contractorName": "ABC Construction",
  "contactInfo": "9876543210",
  "awardedAmount": 475000
}
```

**Base URL:** `/api/tenders`

#### GET /
Get all tenders with filtering

---

### Work Order Management Routes
**Base URL:** `/api/work-proposals/:id/work-order`

#### POST /
Create work order
```json
{
  "workOrderNumber": "WO/2024/001",
  "dateOfWorkOrder": "2024-12-15",
  "workOrderAmount": 475000,
  "contractorOrGramPanchayat": "ABC Construction",
  "remark": "Work order issued"
}
```

#### PUT /
Update work order

#### POST /start-work
Start work (change status to Work In Progress)

#### GET /
Get work order details

**Base URL:** `/api/work-orders`

#### GET /
Get all work orders with filtering

---

### Work Progress Routes
**Base URL:** `/api/work-proposals/:id/progress`

#### POST /
Update work progress
```json
{
  "progressPercentage": 25,
  "mbStageMeasurementBookStag": "Foundation Complete",
  "expenditureAmount": 120000,
  "installmentAmount": 100000,
  "installmentDate": "2024-12-20",
  "description": "Foundation work completed"
}
```

#### POST /installment
Add installment payment
```json
{
  "amount": 100000,
  "date": "2024-12-20",
  "description": "First installment"
}
```

#### POST /complete
Complete work
```json
{
  "finalExpenditureAmount": 470000,
  "completionDocuments": []
}
```

#### GET /history
Get work progress history

**Base URL:** `/api/work-progress`

#### GET /
Get all work progress (dashboard view)

---

## User Roles and Permissions

### Department User
- Create work proposals
- Update own proposals (before approval)
- View own proposals

### Technical Approver
- View proposals pending technical approval
- Approve/reject technical proposals
- View proposals from their department

### Administrative Approver
- View proposals pending administrative approval
- Approve/reject administrative proposals
- View all proposals

### Tender Manager
- Manage tender process
- Start tenders, update status, award contracts
- View all tenders

### Work Order Manager
- Create and manage work orders
- Start work processes
- View all work orders

### Progress Monitor
- Update work progress
- Add installments
- Complete works
- View all progress data

### Super Admin
- All permissions
- User management
- System administration

---

## Work Proposal Status Flow

1. **Pending Technical Approval** - Initial state after submission
2. **Rejected Technical Approval** - If technical approval is rejected
3. **Pending Administrative Approval** - After technical approval
4. **Rejected Administrative Approval** - If administrative approval is rejected
5. **Pending Tender** - After administrative approval (if tender required)
6. **Tender In Progress** - During tender process
7. **Pending Work Order** - After tender completion or if no tender required
8. **Work Order Created** - After work order is issued
9. **Work In Progress** - During work execution
10. **Work Completed** - Final state

---

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
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

### Pagination Response
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "current": 1,
    "pages": 5,
    "total": 50,
    "limit": 10
  }
}
```

---

## Environment Variables Required

```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/nirman_jashpur
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
MAX_FILE_SIZE=10mb
```

---

## Getting Started

1. Install dependencies: `npm install`
2. Set up environment variables in `.env` file
3. Start MongoDB
4. Run the server: `npm run dev`
5. API will be available at `http://localhost:3000`

The complete workflow is now implemented and ready for testing!
