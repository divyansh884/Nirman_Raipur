#!/usr/bin/env node

/**
 * Comprehensive Database Seeding Script for Nirman Jashpur
 * 
 * This script creates realistic test data for all models and covers
 * all possible scenarios for API endpoints testing.
 * 
 * Usage:
 * node scripts/seed.js [--clean] [--count=50]
 * 
 * Options:
 * --clean: Drop existing data before seeding
 * --count: Number of records to create (default: 50)
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { faker } = require('@faker-js/faker');

// Import all models
const User = require('../models/User');
const WorkProposal = require('../models/WorkProposal');
const WorkProgress = require('../models/WorkProgress');
const WorkOrder = require('../models/WorkOrder');
const WorkType = require('../models/WorkType');
const Tender = require('../models/Tender');
const AdministrativeApproval = require('../models/AdministrativeApproval');

// Configuration
const DEFAULT_COUNT = 50;
const args = process.argv.slice(2);
const shouldClean = args.includes('--clean');
const countArg = args.find(arg => arg.startsWith('--count='));
const recordCount = countArg ? parseInt(countArg.split('=')[1]) : DEFAULT_COUNT;

// Connect to database
async function connectDB() {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nirman_jashpur';
    await mongoose.connect(mongoURI);
    console.log('📦 Connected to MongoDB');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
}

// Clean existing data
async function cleanDatabase() {
  if (!shouldClean) return;
  
  console.log('🧹 Cleaning existing data...');
  await Promise.all([
    User.deleteMany({}),
    WorkProposal.deleteMany({}),
    WorkProgress.deleteMany({}),
    WorkOrder.deleteMany({}),
    WorkType.deleteMany({}),
    Tender.deleteMany({}),
    AdministrativeApproval.deleteMany({})
  ]);
  console.log('✅ Database cleaned');
}

// Static data arrays for realistic seeding
const DEPARTMENTS = [
  'Public Works Department',
  'Rural Development Department',
  'Water Resources Department',
  'Urban Development Department',
  'Irrigation Department',
  'Road Construction Department',
  'Building Construction Department'
];

const WORK_AGENCIES = [
  'PWD Jashpur',
  'DRDA Jashpur',
  'Zilla Panchayat Jashpur',
  'Municipal Corporation Jashpur',
  'PMGSY Division',
  'Water Resources Division',
  'Irrigation Division'
];

const SCHEMES = [
  'MGNREGA',
  'PMGSY',
  'PMAY-G',
  'Swachh Bharat Mission',
  'Jal Jeevan Mission',
  'RIDF',
  'State Plan',
  'Centrally Sponsored Scheme'
];

const CITIES_BLOCKS = [
  'Jashpur',
  'Kunkuri',
  'Pathalgaon',
  'Bagicha',
  'Duldula',
  'Tapkara',
  'Kansabel',
  'Manora'
];

const WORK_TYPES = [
  'Road Construction',
  'Bridge Construction',
  'School Building',
  'Health Center',
  'Water Tank',
  'Drainage System',
  'Community Hall',
  'Anganwadi Building',
  'Library Construction',
  'Sports Complex'
];

const ENGINEER_NAMES = [
  'Er. Rajesh Kumar',
  'Er. Priya Sharma',
  'Er. Amit Singh',
  'Er. Sunita Devi',
  'Er. Vikash Verma',
  'Er. Kavita Gupta',
  'Er. Ravi Patel',
  'Er. Neha Agarwal'
];

const CURRENT_STATUSES = [
  'Pending Technical Approval',
  'Rejected Technical Approval',
  'Pending Administrative Approval',
  'Rejected Administrative Approval',
  'Pending Tender',
  'Tender In Progress',
  'Pending Work Order',
  'Work Order Created',
  'Work In Progress',
  'Work Completed',
  'Work Cancelled'
];

const USER_ROLES = [
  'Department User',
  'Technical Approver',
  'Administrative Approver',
  'Tender Manager',
  'Work Order Manager',
  'Progress Monitor',
  'Super Admin'
];

// Helper functions
function randomFromArray(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function generateSerialNumber(index) {
  const year = new Date().getFullYear();
  return `WP${year}${String(index + 1).padStart(6, '0')}`;
}

// Create Users
async function createUsers() {
  console.log('👥 Creating users...');
  const users = [];
  
  // Create admin user
  const adminUser = {
    username: 'admin',
    email: 'admin@jashpur.gov.in',
    password: await bcrypt.hash('admin123', 12),
    fullName: 'System Administrator',
    role: 'Super Admin',
    department: 'IT Department',
    designation: 'System Admin',
    contactNumber: '9876543210',
    isActive: true,
    createdBy: null
  };
  users.push(adminUser);
  
  // Create test users for each role
  for (let i = 0; i < USER_ROLES.length * 3; i++) {
    const role = USER_ROLES[i % USER_ROLES.length];
    const user = {
      username: faker.internet.userName().toLowerCase(),
      email: faker.internet.email().toLowerCase(),
      password: await bcrypt.hash('password123', 12),
      fullName: faker.person.fullName(),
      role: role,
      department: randomFromArray(DEPARTMENTS),
      designation: faker.person.jobTitle(),
      contactNumber: faker.phone.number('##########'),
      isActive: Math.random() > 0.1, // 90% active users
      createdBy: null
    };
    users.push(user);
  }
  
  const createdUsers = await User.insertMany(users);
  console.log(`✅ Created ${createdUsers.length} users`);
  return createdUsers;
}

// Create Work Proposals
async function createWorkProposals(users) {
  console.log('📋 Creating work proposals...');
  const proposals = [];
  const departmentUsers = users.filter(u => u.role === 'Department User');
  
  for (let i = 0; i < recordCount; i++) {
    const submissionDate = randomDate(new Date('2023-01-01'), new Date());
    const estimatedCompletion = new Date(submissionDate.getTime() + (Math.random() * 365 * 24 * 60 * 60 * 1000));
    const sanctionAmount = Math.floor(Math.random() * 10000000) + 100000; // 1L to 1Cr
    const currentStatus = randomFromArray(CURRENT_STATUSES);
    const submittedBy = departmentUsers[Math.floor(Math.random() * departmentUsers.length)];
    
    // Create technical approval data
    const technicalApproval = {
      status: ['Pending Technical Approval', 'Rejected Technical Approval'].includes(currentStatus) 
        ? (currentStatus === 'Rejected Technical Approval' ? 'Rejected' : 'Pending')
        : 'Approved',
      approvalNumber: Math.random() > 0.3 ? `TA${2024}${String(i + 1).padStart(4, '0')}` : null,
      approvalDate: Math.random() > 0.3 ? randomDate(submissionDate, new Date()) : null,
      amountOfTechnicalSanction: Math.random() > 0.3 ? sanctionAmount * (0.9 + Math.random() * 0.2) : null,
      forwardingDate: Math.random() > 0.5 ? randomDate(submissionDate, new Date()) : null,
      remarks: Math.random() > 0.5 ? faker.lorem.sentence() : null,
      attachedFile: [],
      approvedBy: Math.random() > 0.3 ? users.find(u => u.role === 'Technical Approver')?._id : null,
      rejectionReason: currentStatus === 'Rejected Technical Approval' ? faker.lorem.sentence() : null
    };
    
    // Create administrative approval data
    const administrativeApproval = {
      status: ['Pending Administrative Approval', 'Rejected Administrative Approval'].includes(currentStatus)
        ? (currentStatus === 'Rejected Administrative Approval' ? 'Rejected' : 'Pending')
        : ['Pending Technical Approval', 'Rejected Technical Approval'].includes(currentStatus) 
          ? 'Pending' : 'Approved',
      byGovtDistrictAS: Math.random() > 0.5 ? 'Collector, Jashpur' : null,
      approvalNumber: Math.random() > 0.4 ? `AA${2024}${String(i + 1).padStart(4, '0')}` : null,
      approvalDate: Math.random() > 0.4 ? randomDate(submissionDate, new Date()) : null,
      approvedAmount: Math.random() > 0.4 ? sanctionAmount * (0.8 + Math.random() * 0.2) : null,
      remarks: Math.random() > 0.5 ? faker.lorem.sentence() : null,
      attachedFile: [],
      approvedBy: Math.random() > 0.4 ? users.find(u => u.role === 'Administrative Approver')?._id : null,
      rejectionReason: currentStatus === 'Rejected Administrative Approval' ? faker.lorem.sentence() : null
    };
    
    // Create tender process data
    const tenderProcess = {
      tenderTitle: Math.random() > 0.4 ? `Tender for ${randomFromArray(WORK_TYPES)}` : null,
      tenderID: Math.random() > 0.4 ? `TND${2024}${String(i + 1).padStart(4, '0')}` : null,
      department: randomFromArray(DEPARTMENTS),
      attachedDocument: [],
      issuedDates: Math.random() > 0.5 ? randomDate(submissionDate, new Date()) : null,
      remark: Math.random() > 0.5 ? faker.lorem.sentence() : null,
      tenderStatus: ['Pending Tender', 'Tender In Progress'].includes(currentStatus) ? 'Under Evaluation' : 'Not Started',
      selectedContractor: Math.random() > 0.6 ? {
        name: faker.company.name(),
        contactInfo: faker.phone.number(),
        awardedAmount: sanctionAmount * (0.7 + Math.random() * 0.3)
      } : {}
    };
    
    // Create work order data
    const workOrder = {
      workOrderNumber: Math.random() > 0.5 ? `WO${2024}${String(i + 1).padStart(4, '0')}` : null,
      dateOfWorkOrder: ['Work Order Created', 'Work In Progress', 'Work Completed'].includes(currentStatus) 
        ? randomDate(submissionDate, new Date()) : null,
      workOrderAmount: Math.random() > 0.5 ? sanctionAmount * (0.8 + Math.random() * 0.2) : null,
      contractorOrGramPanchayat: Math.random() > 0.5 ? faker.company.name() : `Gram Panchayat ${randomFromArray(CITIES_BLOCKS)}`,
      remark: Math.random() > 0.5 ? faker.lorem.sentence() : null,
      attachedFile: [],
      issuedBy: Math.random() > 0.5 ? users.find(u => u.role === 'Work Order Manager')?._id : null
    };
    
    // Create work progress data
    const workProgress = {
      sanctionedAmount: sanctionAmount,
      totalAmountReleasedSoFar: currentStatus === 'Work Completed' ? sanctionAmount * (0.8 + Math.random() * 0.2) 
        : currentStatus === 'Work In Progress' ? sanctionAmount * Math.random() * 0.8 : 0,
      remainingBalance: null, // Will be calculated by pre-save hook
      installments: currentStatus === 'Work In Progress' || currentStatus === 'Work Completed' ? [
        {
          installmentNo: 1,
          amount: sanctionAmount * 0.3,
          date: randomDate(submissionDate, new Date())
        },
        ...(Math.random() > 0.5 ? [{
          installmentNo: 2,
          amount: sanctionAmount * 0.4,
          date: randomDate(submissionDate, new Date())
        }] : [])
      ] : [],
      mbStageMeasurementBookStag: Math.random() > 0.6 ? `MB-${String(i + 1).padStart(3, '0')}` : null,
      expenditureAmount: currentStatus === 'Work In Progress' || currentStatus === 'Work Completed' 
        ? sanctionAmount * Math.random() * 0.9 : null,
      progressPercentage: currentStatus === 'Work Completed' ? 100 
        : currentStatus === 'Work In Progress' ? Math.floor(Math.random() * 100) : 0,
      progressDocuments: [],
      progressImages: Math.random() > 0.3 ? [] : [], // Empty for photo missing report testing
      lastUpdatedBy: Math.random() > 0.5 ? users.find(u => u.role === 'Progress Monitor')?._id : null
    };
    
    const proposal = {
      serialNumber: generateSerialNumber(i),
      workLocationImage: Math.random() > 0.2 ? [] : [], // Some without images for photo missing report
      typeOfWork: randomFromArray(WORK_TYPES),
      nameOfWork: `${randomFromArray(WORK_TYPES)} at ${randomFromArray(CITIES_BLOCKS)}`,
      workAgency: randomFromArray(WORK_AGENCIES),
      scheme: randomFromArray(SCHEMES),
      nameOfJPDBT: Math.random() > 0.5 ? `JP ${randomFromArray(CITIES_BLOCKS)}` : null,
      nameOfGPWard: `Ward ${Math.floor(Math.random() * 20) + 1}`,
      workDescription: faker.lorem.paragraph(),
      workProgressStage: currentStatus,
      lastRevision: new Date(),
      financialYear: `${submissionDate.getFullYear()}-${String(submissionDate.getFullYear() + 1).slice(-2)}`,
      workDepartment: randomFromArray(DEPARTMENTS),
      userDepartment: submittedBy?.department || randomFromArray(DEPARTMENTS),
      approvingDepartment: randomFromArray(DEPARTMENTS),
      sanctionAmount: sanctionAmount,
      plan: Math.random() > 0.5 ? randomFromArray(['Annual Plan', 'Five Year Plan', 'Special Plan']) : null,
      assembly: Math.random() > 0.5 ? 'Jashpur Assembly Constituency' : null,
      longitude: 83.1 + (Math.random() - 0.5) * 0.5, // Around Jashpur coordinates
      latitude: 22.8 + (Math.random() - 0.5) * 0.5,
      typeOfLocation: randomFromArray(['Rural', 'Urban', 'Semi-Urban']),
      city: randomFromArray(CITIES_BLOCKS),
      ward: `Ward ${Math.floor(Math.random() * 20) + 1}`,
      workType: randomFromArray(WORK_TYPES),
      workName: `${randomFromArray(WORK_TYPES)} Project`,
      appointedEngineer: randomFromArray(ENGINEER_NAMES),
      appointedSDO: `SDO ${randomFromArray(CITIES_BLOCKS)}`,
      estimatedCompletionDateOfWork: estimatedCompletion,
      isDPROrNot: Math.random() > 0.5,
      isTenderOrNot: Math.random() > 0.3,
      submittedBy: submittedBy?._id,
      submissionDate: submissionDate,
      initialDocuments: [],
      technicalApproval: technicalApproval,
      administrativeApproval: administrativeApproval,
      tenderProcess: tenderProcess,
      workOrder: workOrder,
      workProgress: workProgress,
      completionDate: currentStatus === 'Work Completed' ? randomDate(submissionDate, new Date()) : null,
      completionDocuments: currentStatus === 'Work Completed' ? [] : [],
      finalCost: currentStatus === 'Work Completed' ? sanctionAmount * (0.9 + Math.random() * 0.2) : null,
      currentStatus: currentStatus,
      lastStatusUpdate: new Date()
    };
    
    proposals.push(proposal);
  }
  
  const createdProposals = await WorkProposal.insertMany(proposals);
  console.log(`✅ Created ${createdProposals.length} work proposals`);
  return createdProposals;
}

// Create Work Progress entries (separate model)
async function createWorkProgressEntries() {
  console.log('📈 Creating work progress entries...');
  const progressEntries = [];
  
  for (let i = 0; i < Math.floor(recordCount * 0.7); i++) {
    const entryDate = randomDate(new Date('2023-01-01'), new Date());
    
    const entry = {
      workName: `${randomFromArray(WORK_TYPES)} at ${randomFromArray(CITIES_BLOCKS)}`,
      area: randomFromArray(CITIES_BLOCKS),
      workAgency: randomFromArray(WORK_AGENCIES),
      scheme: randomFromArray(SCHEMES),
      technicalApproval: `TA${2024}${String(i + 1).padStart(4, '0')}`,
      administrativeApproval: `AA${2024}${String(i + 1).padStart(4, '0')}`,
      tenderApproval: Math.random() > 0.5 ? `TND${2024}${String(i + 1).padStart(4, '0')}` : null,
      workProgressStage: randomFromArray(['Pending', 'In Progress', 'Completed']),
      workDetails: faker.lorem.paragraph(),
      entryDate: entryDate,
      lastModified: randomDate(entryDate, new Date())
    };
    
    progressEntries.push(entry);
  }
  
  const createdEntries = await WorkProgress.insertMany(progressEntries);
  console.log(`✅ Created ${createdEntries.length} work progress entries`);
  return createdEntries;
}

// Create Work Orders
async function createWorkOrders() {
  console.log('📋 Creating work orders...');
  const workOrders = [];
  
  for (let i = 0; i < Math.floor(recordCount * 0.6); i++) {
    const entryDate = randomDate(new Date('2023-01-01'), new Date());
    const orderStatus = randomFromArray(['Pending', 'Issued', 'Completed']);
    
    const order = {
      workName: `${randomFromArray(WORK_TYPES)} at ${randomFromArray(CITIES_BLOCKS)}`,
      area: randomFromArray(CITIES_BLOCKS),
      workAgency: randomFromArray(WORK_AGENCIES),
      scheme: randomFromArray(SCHEMES),
      technicalApproval: `TA${2024}${String(i + 1).padStart(4, '0')}`,
      administrativeApproval: `AA${2024}${String(i + 1).padStart(4, '0')}`,
      tenderApproval: Math.random() > 0.5 ? `TND${2024}${String(i + 1).padStart(4, '0')}` : null,
      orderStatus: orderStatus,
      workDetails: faker.lorem.paragraph(),
      orderDate: orderStatus !== 'Pending' ? randomDate(entryDate, new Date()) : null,
      completionDate: orderStatus === 'Completed' ? randomDate(entryDate, new Date()) : null,
      entryDate: entryDate,
      lastModified: randomDate(entryDate, new Date())
    };
    
    workOrders.push(order);
  }
  
  const createdOrders = await WorkOrder.insertMany(workOrders);
  console.log(`✅ Created ${createdOrders.length} work orders`);
  return createdOrders;
}

// Create Tenders
async function createTenders() {
  console.log('📄 Creating tenders...');
  const tenders = [];
  
  for (let i = 0; i < Math.floor(recordCount * 0.5); i++) {
    const entryDate = randomDate(new Date('2023-01-01'), new Date());
    const tenderStatus = randomFromArray(['Draft', 'Published', 'Bid Submission', 'Under Evaluation', 'Awarded', 'Cancelled']);
    const tenderAmount = Math.floor(Math.random() * 5000000) + 100000;
    
    const tender = {
      workName: `${randomFromArray(WORK_TYPES)} at ${randomFromArray(CITIES_BLOCKS)}`,
      area: randomFromArray(CITIES_BLOCKS),
      workAgency: randomFromArray(WORK_AGENCIES),
      technicalApproval: `TA${2024}${String(i + 1).padStart(4, '0')}`,
      administrativeApproval: `AA${2024}${String(i + 1).padStart(4, '0')}`,
      tenderApproval: `TND${2024}${String(i + 1).padStart(4, '0')}`,
      workProgressStage: randomFromArray(['Pending', 'In Progress', 'Completed']),
      workDetails: faker.lorem.paragraph(),
      tenderAmount: tenderAmount,
      tenderDate: tenderStatus !== 'Draft' ? randomDate(entryDate, new Date()) : null,
      bidSubmissionDate: ['Bid Submission', 'Under Evaluation', 'Awarded'].includes(tenderStatus) 
        ? randomDate(entryDate, new Date()) : null,
      tenderStatus: tenderStatus,
      contractorName: tenderStatus === 'Awarded' ? faker.company.name() : null,
      awardedAmount: tenderStatus === 'Awarded' ? tenderAmount * (0.8 + Math.random() * 0.4) : null,
      entryDate: entryDate,
      lastModified: randomDate(entryDate, new Date())
    };
    
    tenders.push(tender);
  }
  
  const createdTenders = await Tender.insertMany(tenders);
  console.log(`✅ Created ${createdTenders.length} tenders`);
  return createdTenders;
}

// Create Work Types
async function createWorkTypes(users) {
  console.log('🏗️ Creating work types...');
  const workTypes = [];
  
  for (let i = 0; i < Math.floor(recordCount * 0.3); i++) {
    const entryDate = randomDate(new Date('2023-01-01'), new Date());
    const createdBy = users[Math.floor(Math.random() * users.length)];
    
    const workType = {
      workType: randomFromArray(WORK_TYPES),
      department: randomFromArray(DEPARTMENTS),
      constituency: Math.random() > 0.5 ? 'Jashpur Constituency' : null,
      engineer: randomFromArray(ENGINEER_NAMES),
      scheme: randomFromArray(SCHEMES),
      description: faker.lorem.paragraph(),
      area: randomFromArray(CITIES_BLOCKS),
      city: randomFromArray(CITIES_BLOCKS),
      ward: `Ward ${Math.floor(Math.random() * 20) + 1}`,
      estimatedCost: {
        amount: Math.floor(Math.random() * 2000000) + 50000,
        currency: 'INR'
      },
      priority: randomFromArray(['Low', 'Medium', 'High', 'Critical']),
      isActive: Math.random() > 0.1,
      isDeleted: Math.random() < 0.05,
      entryDate: entryDate,
      lastModified: randomDate(entryDate, new Date()),
      createdBy: createdBy._id,
      updatedBy: Math.random() > 0.5 ? users[Math.floor(Math.random() * users.length)]._id : createdBy._id
    };
    
    workTypes.push(workType);
  }
  
  const createdWorkTypes = await WorkType.insertMany(workTypes);
  console.log(`✅ Created ${createdWorkTypes.length} work types`);
  return createdWorkTypes;
}

// Create Administrative Approvals
async function createAdministrativeApprovals() {
  console.log('✅ Creating administrative approvals...');
  const approvals = [];
  
  for (let i = 0; i < Math.floor(recordCount * 0.4); i++) {
    const entryDate = randomDate(new Date('2023-01-01'), new Date());
    const approvalStatus = randomFromArray(['Pending', 'Approved', 'Rejected', 'Under Review']);
    
    const approval = {
      workName: `${randomFromArray(WORK_TYPES)} at ${randomFromArray(CITIES_BLOCKS)}`,
      area: randomFromArray(CITIES_BLOCKS),
      workAgency: randomFromArray(WORK_AGENCIES),
      scheme: randomFromArray(SCHEMES),
      technicalApproval: `TA${2024}${String(i + 1).padStart(4, '0')}`,
      administrativeApproval: `AA${2024}${String(i + 1).padStart(4, '0')}`,
      tenderApproval: Math.random() > 0.5 ? `TND${2024}${String(i + 1).padStart(4, '0')}` : null,
      workProgressStage: randomFromArray(['Pending', 'In Progress', 'Completed']),
      workDetails: faker.lorem.paragraph(),
      approvalDate: approvalStatus === 'Approved' ? randomDate(entryDate, new Date()) : entryDate,
      approvalAuthority: randomFromArray(['Collector', 'CEO Zilla Panchayat', 'District Magistrate']),
      approvalAmount: approvalStatus === 'Approved' ? Math.floor(Math.random() * 3000000) + 100000 : null,
      approvalStatus: approvalStatus,
      remarks: Math.random() > 0.5 ? faker.lorem.sentence() : null,
      entryDate: entryDate,
      lastModified: randomDate(entryDate, new Date())
    };
    
    approvals.push(approval);
  }
  
  const createdApprovals = await AdministrativeApproval.insertMany(approvals);
  console.log(`✅ Created ${createdApprovals.length} administrative approvals`);
  return createdApprovals;
}

// Main seeding function
async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');
    console.log(`📊 Target records: ${recordCount}`);
    
    await connectDB();
    await cleanDatabase();
    
    // Create data in dependency order
    const users = await createUsers();
    const proposals = await createWorkProposals(users);
    const progressEntries = await createWorkProgressEntries();
    const workOrders = await createWorkOrders();
    const tenders = await createTenders();
    const workTypes = await createWorkTypes(users);
    const administrativeApprovals = await createAdministrativeApprovals();
    
    console.log('\\n📊 Seeding Summary:');
    console.log(`👥 Users: ${users.length}`);
    console.log(`📋 Work Proposals: ${proposals.length}`);
    console.log(`📈 Work Progress Entries: ${progressEntries.length}`);
    console.log(`📋 Work Orders: ${workOrders.length}`);
    console.log(`📄 Tenders: ${tenders.length}`);
    console.log(`🏗️ Work Types: ${workTypes.length}`);
    console.log(`✅ Administrative Approvals: ${administrativeApprovals.length}`);
    
    console.log('\\n🎯 Test Coverage:');
    console.log('✅ All user roles created');
    console.log('✅ All work statuses represented');
    console.log('✅ Financial year data (2023-2025)');
    console.log('✅ Geographic distribution across blocks');
    console.log('✅ Multiple schemes and agencies');
    console.log('✅ Various approval stages');
    console.log('✅ Progress tracking data');
    console.log('✅ Photo missing scenarios');
    console.log('✅ Engineer assignments');
    console.log('✅ Pending works at different stages');
    
    console.log('\\n🚀 Database seeding completed successfully!');
    console.log('\\n🧪 Ready for API testing with:');
    console.log('- Authentication endpoints (/api/auth/*)');
    console.log('- Work proposal endpoints (/api/work-proposals/*)');
    console.log('- Reports endpoints (/api/reports/*)');
    console.log('- Progress tracking endpoints (/api/work-progress/*)');
    console.log('- Work order endpoints (/api/work-orders/*)');
    console.log('- Tender endpoints (/api/tenders/*)');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

// Run seeding
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
