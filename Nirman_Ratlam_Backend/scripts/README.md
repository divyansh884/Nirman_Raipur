# Database Seeding Guide

This directory contains comprehensive database seeding scripts for the Nirman Jashpur project.

## Prerequisites

```bash
npm install @faker-js/faker
```

## Available Scripts

### 1. Basic Seeding
```bash
# Install faker if not already installed
npm install

# Seed with default settings (50 records)
npm run seed

# Clean existing data and seed
npm run seed:clean

# Seed with custom count
npm run seed:small    # 20 records
npm run seed:large    # 100 records

# Custom count
node scripts/seed.js --clean --count=75
```

### 2. Coverage Check
```bash
# Check what data is available for testing
npm run check:coverage
```

## What Gets Seeded

### Users (All Roles)
- **Super Admin**: admin@jashpur.gov.in / admin123
- **Department Users**: Can submit proposals
- **Technical Approvers**: Can approve/reject technical proposals
- **Administrative Approvers**: Can approve/reject administrative proposals
- **Tender Managers**: Can manage tenders
- **Work Order Managers**: Can create work orders
- **Progress Monitors**: Can update work progress

### Work Proposals (Main Data)
- Complete workflow from submission to completion
- All status stages represented:
  - Pending Technical Approval
  - Pending Administrative Approval
  - Pending Tender
  - Work In Progress
  - Work Completed
  - etc.
- Financial data with realistic amounts
- Geographic distribution across Jashpur blocks
- Multiple schemes (MGNREGA, PMGSY, etc.)
- Various work types (roads, buildings, etc.)

### Supporting Data
- **Work Progress**: Standalone progress tracking entries
- **Work Orders**: Order management data
- **Tenders**: Tender process data
- **Work Types**: Categorized work definitions
- **Administrative Approvals**: Approval workflow data

## Test Coverage

The seeding script ensures coverage for all API endpoints:

### Authentication APIs
- User registration/login
- Role-based access testing
- Profile management

### Work Proposal APIs
- CRUD operations
- Approval workflows
- Status transitions
- File attachments (structure)

### Reports APIs
- **Agency-wise**: Multiple agencies with varied work counts
- **Block-wise**: All major blocks in Jashpur
- **Scheme-wise**: Government schemes with realistic distribution
- **Pending Works**: Works at various pending stages
- **Final Status**: Complete status distribution with percentages
- **Engineer-wise**: Engineer assignments and performance
- **Photo Missing**: Works with missing documentation

### Filtering & Search
- Year-based filtering (2023-2025 data)
- Geographic filtering by blocks/cities
- Status-based filtering
- Agency and scheme filtering
- Engineer-based filtering

## Data Characteristics

### Realistic Data
- Uses Indian government project naming conventions
- Jashpur-specific geographic data
- Realistic financial amounts (1L to 1Cr)
- Proper workflow progression
- Authentic scheme names and departments

### Edge Cases Covered
- Rejected proposals at various stages
- Works without photos (for photo missing reports)
- Incomplete approval chains
- Varied completion percentages
- Different tender statuses
- Multiple years of data

### Financial Data
- Sanction amounts from ₹1 lakh to ₹1 crore
- Technical and administrative approved amounts
- Released amounts and pending balances
- Installment tracking
- Expenditure monitoring

## Sample Login Credentials

```
Admin User:
Email: admin@jashpur.gov.in
Password: admin123

Test Users:
Email: <check seeding output for specific emails>
Password: password123 (for all test users)
```

## API Testing Examples

After seeding, you can test APIs like:

```bash
# Get all work proposals
GET /api/work-proposals

# Get agency-wise report for 2024
GET /api/reports/agency-wise?year=2024

# Get pending works
GET /api/reports/pending

# Get photo missing report
GET /api/reports/photo-missing

# Filter by specific agency
GET /api/reports/agency-wise?agency=PWD%20Jashpur
```

## Troubleshooting

### Common Issues

1. **Module not found: @faker-js/faker**
   ```bash
   npm install @faker-js/faker
   ```

2. **Database connection error**
   - Check MongoDB is running
   - Verify MONGODB_URI in .env file

3. **Permission errors**
   - Ensure MongoDB has write permissions
   - Check database user permissions

### Clean Start
```bash
# Complete clean and reseed
npm run seed:clean

# Check what was created
npm run check:coverage
```

## Data Volume

| Model | Default Count | Description |
|-------|---------------|-------------|
| Users | ~25 | All roles represented |
| Work Proposals | 50 | Main project data |
| Work Progress | ~35 | Progress tracking |
| Work Orders | ~30 | Order management |
| Tenders | ~25 | Tender processes |
| Work Types | ~15 | Work categorization |
| Admin Approvals | ~20 | Approval tracking |

## Verification

After seeding, verify data with:

```bash
# Check coverage and sample data
npm run check:coverage

# Start server and test APIs
npm run dev

# Test authentication
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@jashpur.gov.in","password":"admin123"}'
```

The seeding script creates a comprehensive test environment that covers all possible scenarios for the Nirman Jashpur APIs.
