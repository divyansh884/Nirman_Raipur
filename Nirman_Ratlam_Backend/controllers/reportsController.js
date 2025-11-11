
const WorkProposal = require('../models/WorkProposal');
const WorkProgress = require('../models/WorkProgress');
const WorkOrder = require('../models/WorkOrder');
const WorkType = require('../models/WorkType');
const Tender = require('../models/Tender');
const User = require('../models/User');
const { validationResult } = require('express-validator');

// Helper function to get year filter for WorkProposal based on submissionDate
const getYearFilter = (year) => {
  if (!year) return {};
  
  const startDate = new Date(`${year}-01-01`);
  const endDate = new Date(`${year}-12-31T23:59:59.999Z`);
  
  return {
    submissionDate: {
      $gte: startDate,
      $lte: endDate
    }
  };
};

// Helper function to create standardized response
const createStandardResponse = (data, summary = {}, year = null) => {
  return {
    success: true,
    data,
    summary: {
      ...summary,
      reportYear: year,
      generatedAt: new Date().toISOString()
    }
  };
};

// @desc    Get dashboard statistics
// @route   GET /api/reports/dashboard
// @access  Private
const getDashboardStats = async (req, res) => {
  try {
    const totalProposals = await WorkProposal.countDocuments();
    const pendingTechnical = await WorkProposal.countDocuments({ currentStatus: 'Pending Technical Approval' });
    const pendingAdministrative = await WorkProposal.countDocuments({ currentStatus: 'Pending Administrative Approval' });
    const inProgress = await WorkProposal.countDocuments({ currentStatus: 'Work In Progress' });
    const completed = await WorkProposal.countDocuments({ currentStatus: 'Work Completed' });
    
    // Financial statistics
    const financialStats = await WorkProposal.aggregate([
      {
        $group: {
          _id: null,
          totalSanctionAmount: { $sum: '$sanctionAmount' },
          totalApprovedAmount: { $sum: '$administrativeApproval.approvedAmount' },
          totalReleasedAmount: { $sum: '$workProgress.totalAmountReleasedSoFar' }
        }
      }
    ]);

    const stats = {
      proposals: {
        total: totalProposals,
        pendingTechnical,
        pendingAdministrative,
        inProgress,
        completed
      },
      financial: financialStats[0] || {
        totalSanctionAmount: 0,
        totalApprovedAmount: 0,
        totalReleasedAmount: 0
      }
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard statistics',
      error: error.message
    });
  }
};

// @desc    Get department-wise report
// @route   GET /api/reports/department-wise
// @access  Private
const getDepartmentWiseReport = async (req, res) => {
  try {
    const { year, department } = req.query;
    
    let matchStage = {};
    
    if (year) {
      matchStage.financialYear = year;
    }
    
    if (department) {
      matchStage.workDepartment = new RegExp(department, 'i');
    }

    const report = await WorkProposal.aggregate([
      { $match: matchStage },
      {
    $lookup: {
      from: "departments", // collection name (usually plural)
      localField: "workDepartment",
      foreignField: "_id",
      as: "departmentInfo"
    }
  },
      {
        $group: {
          _id: '$workDepartment',
           departmentName: { $first: { $arrayElemAt: ["$departmentInfo.name", 0] } },
          totalProposals: { $sum: 1 },
          totalSanctionAmount: { $sum: '$sanctionAmount' },
          completed: {
            $sum: { $cond: [{ $eq: ['$currentStatus', 'Work Completed'] }, 1, 0] }
          },
          inProgress: {
            $sum: { $cond: [{ $eq: ['$currentStatus', 'Work In Progress'] }, 1, 0] }
          },
          pending: {
            $sum: { 
              $cond: [
                { 
                  $in: ['$currentStatus', ['Pending Technical Approval', 'Pending Administrative Approval']] 
                }, 
                1, 
                0
              ] 
            }
          }
        }
      },
      { $sort: { totalSanctionAmount: -1 } }
    ]);

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Error fetching department report:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching department-wise report',
      error: error.message
    });
  }
};

// @desc    Get status-wise report
// @route   GET /api/reports/status-wise
// @access  Private
const getStatusWiseReport = async (req, res) => {
  try {
    const { year, financialYear } = req.query;
    
    let matchStage = {};
    
    if (financialYear) {
      matchStage.financialYear = financialYear;
    }

    const report = await WorkProposal.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$currentStatus',
          count: { $sum: 1 },
          totalAmount: { $sum: '$sanctionAmount' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Error fetching status report:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching status-wise report',
      error: error.message
    });
  }
};

// @desc    Get financial report
// @route   GET /api/reports/financial
// @access  Private
const getFinancialReport = async (req, res) => {
  try {
    const { financialYear, department } = req.query;
    
    let matchStage = {};
    
    if (financialYear) {
      matchStage.financialYear = financialYear;
    }
    
    if (department) {
      matchStage.workDepartment = new RegExp(department, 'i');
    }

    const report = await WorkProposal.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$financialYear',
          totalProposals: { $sum: 1 },
          totalSanctionAmount: { $sum: '$sanctionAmount' },
          totalApprovedAmount: { $sum: '$administrativeApproval.approvedAmount' },
          totalReleasedAmount: { $sum: '$workProgress.totalAmountReleasedSoFar' },
          completedWorks: {
            $sum: { $cond: [{ $eq: ['$currentStatus', 'Work Completed'] }, 1, 0] }
          }
        }
      }
    ]);
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get progress report
// @route   GET /api/reports/progress
// @access  Private
const getProgressReport = async (req, res) => {
  try {
    const { status, department } = req.query;
    
    let matchStage = {
      currentStatus: { $in: ['Work Order Created', 'Work In Progress', 'Work Completed'] }
    };
    
    if (status) {
      matchStage.currentStatus = status;
    }
    
    if (department) {
      matchStage.workDepartment = new RegExp(department, 'i');
    }

    const report = await WorkProposal.find(matchStage)
      .populate("workDepartment", "name")
      .populate('workProgress.lastUpdatedBy', 'fullName')
      .select('serialNumber nameOfWork workDepartment currentStatus workProgress workOrder.dateOfWorkOrder completionDate')
      .sort({ 'workProgress.updatedAt': -1 });

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Error fetching progress report:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching progress report',
      error: error.message
    });
  }
};


// ...existing code...

// ...existing code...


// ...existing code...


exports.getAgencyWiseReport = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { year, agency } = req.query;
    let filter = getYearFilter(year);
    
    if (agency) {
      filter.workAgency = new RegExp(agency, 'i');
    }
    
    // Use regular find with populate
    const proposals = await WorkProposal.find(filter)
      .populate('workAgency', 'name')
      .populate('workDepartment', 'name')
      .populate('scheme', 'name');
    
    // Process data in JavaScript
    const agencyMap = {};
    
    proposals.forEach(proposal => {
      const agencyId = proposal.workAgency?._id?.toString();
      const agencyName = proposal.workAgency?.name;
      
      if (!agencyId) return;
      
      if (!agencyMap[agencyId]) {
        agencyMap[agencyId] = {
          _id: agencyId,
          agency: agencyId,
          agencyName: agencyName,
          totalWorks: 0,
          totalSanctionAmount: 0,
          pendingTechnical: 0,
          pendingAdministrative: 0,
          inProgress: 0,
          completed: 0,
          totalApprovedAmount: 0,
          totalReleasedAmount: 0,
          schemes: new Set(),
          departments: new Set()
        };
      }
      
      const agency = agencyMap[agencyId];
      agency.totalWorks += 1;
      agency.totalSanctionAmount += proposal.sanctionAmount || 0;
      agency.totalApprovedAmount += proposal.administrativeApproval?.approvedAmount || 0;
      
      // Count status
      if (proposal.currentStatus === 'Pending Technical Approval') agency.pendingTechnical += 1;
      if (proposal.currentStatus === 'Pending Administrative Approval') agency.pendingAdministrative += 1;
      if (proposal.currentStatus === 'Work In Progress') agency.inProgress += 1;
      if (proposal.currentStatus === 'Work Completed') agency.completed += 1;
      
      // Add to sets
      if (proposal.scheme?.name) agency.schemes.add(proposal.scheme.name);
      if (proposal.workDepartment?.name) agency.departments.add(proposal.workDepartment.name);
    });
    
    // Convert to final format
    const agencyWiseData = Object.values(agencyMap).map(agency => ({
      ...agency,
      totalSchemes: agency.schemes.size,
      totalDepartments: agency.departments.size,
      completionRate: agency.totalWorks > 0 ? (agency.completed / agency.totalWorks) * 100 : 0,
      avgProgressPercentage: 0 // Calculate if needed
    })).sort((a, b) => b.totalWorks - a.totalWorks);
    
    const summary = {
      totalAgencies: agencyWiseData.length,
      totalWorks: agencyWiseData.reduce((sum, item) => sum + item.totalWorks, 0),
      totalSanctionAmount: agencyWiseData.reduce((sum, item) => sum + item.totalSanctionAmount, 0)
    };
    
    res.json(createStandardResponse(agencyWiseData, summary, year));
  } catch (error) {
    console.error('Error in getAgencyWiseReport:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while generating agency-wise report', 
      error: error.message 
    });
  }
};


exports.getBlockWiseReport = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { year, block } = req.query;
    let filter = getYearFilter(year);
    
    if (block) {
      filter.city = new RegExp(block, 'i');
    }
    
    // Use regular find with populate
    const proposals = await WorkProposal.find(filter)
      .populate('city', 'name')
      .populate('workAgency', 'name')
      .populate('scheme', 'name')
      .populate('workDepartment', 'name');
    
    // Process data in JavaScript
    const blockMap = {};
    
    proposals.forEach(proposal => {
      const cityId = proposal.city?._id?.toString();
      const cityName = proposal.city?.name || 'Unknown Block';
      
      if (!cityId) return;
      
      if (!blockMap[cityId]) {
        blockMap[cityId] = {
          _id: cityId,
          block: cityId,
          blockName: cityName,
          totalWorks: 0,
          totalSanctionAmount: 0,
          pendingTechnical: 0,
          pendingAdministrative: 0,
          inProgress: 0,
          completed: 0,
          totalApprovedAmount: 0,
          totalReleasedAmount: 0,
          agencies: new Set(),
          schemes: new Set(),
          departments: new Set()
        };
      }
      
      const block = blockMap[cityId];
      block.totalWorks += 1;
      block.totalSanctionAmount += proposal.sanctionAmount || 0;
      block.totalApprovedAmount += proposal.administrativeApproval?.approvedAmount || 0;
      block.totalReleasedAmount += proposal.workProgress?.reduce((sum, progress) => sum + (progress.totalAmountReleasedSoFar || 0), 0) || 0;
      
      // Count status
      if (proposal.currentStatus === 'Pending Technical Approval') block.pendingTechnical += 1;
      if (proposal.currentStatus === 'Pending Administrative Approval') block.pendingAdministrative += 1;
      if (proposal.currentStatus === 'Work In Progress') block.inProgress += 1;
      if (proposal.currentStatus === 'Work Completed') block.completed += 1;
      
      // Add to sets
      if (proposal.workAgency?._id) block.agencies.add(proposal.workAgency._id.toString());
      if (proposal.scheme?._id) block.schemes.add(proposal.scheme._id.toString());
      if (proposal.workDepartment?._id) block.departments.add(proposal.workDepartment._id.toString());
    });
    
    // Convert to final format
    const blockWiseData = Object.values(blockMap).map(block => ({
      _id: block._id,
      block: block.block,
      blockName: block.blockName,
      totalWorks: block.totalWorks,
      totalSanctionAmount: block.totalSanctionAmount,
      pendingTechnical: block.pendingTechnical,
      pendingAdministrative: block.pendingAdministrative,
      inProgress: block.inProgress,
      completed: block.completed,
      totalApprovedAmount: block.totalApprovedAmount,
      totalReleasedAmount: block.totalReleasedAmount,
      totalAgencies: block.agencies.size,
      totalSchemes: block.schemes.size,
      totalDepartments: block.departments.size,
      completionRate: block.totalWorks > 0 ? (block.completed / block.totalWorks) * 100 : 0
    })).sort((a, b) => b.totalWorks - a.totalWorks);
    
    const summary = {
      totalBlocks: blockWiseData.length,
      totalWorks: blockWiseData.reduce((sum, item) => sum + item.totalWorks, 0),
      totalSanctionAmount: blockWiseData.reduce((sum, item) => sum + item.totalSanctionAmount, 0),
      avgCompletionRate: blockWiseData.length > 0 ? 
        (blockWiseData.reduce((sum, item) => sum + item.completionRate, 0) / blockWiseData.length) : 0
    };
    
    res.json(createStandardResponse(blockWiseData, summary, year));
  } catch (error) {
    console.error('Error in getBlockWiseReport:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while generating block-wise report', 
      error: error.message 
    });
  }
};


exports.getSchemeWiseReport = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { year, scheme } = req.query;
    let filter = getYearFilter(year);
    
    if (scheme) {
      filter.scheme = new RegExp(scheme, 'i');
    }
    
    // Use regular find with populate
    const proposals = await WorkProposal.find(filter)
      .populate('scheme', 'name')
      .populate('city', 'name')
      .populate('workAgency', 'name')
      .populate('workDepartment', 'name');
    
    // Process data in JavaScript
    const schemeMap = {};
    
    proposals.forEach(proposal => {
      const schemeId = proposal.scheme?._id?.toString();
      const schemeName = proposal.scheme?.name || 'Unknown Scheme';
      
      if (!schemeId) return;
      
      if (!schemeMap[schemeId]) {
        schemeMap[schemeId] = {
          _id: schemeId,
          scheme: schemeId,
          schemeName: schemeName,
          totalWorks: 0,
          totalSanctionAmount: 0,
          pendingTechnical: 0,
          pendingAdministrative: 0,
          inProgress: 0,
          completed: 0,
          totalApprovedAmount: 0,
          totalReleasedAmount: 0,
          areas: new Set(),
          agencies: new Set(),
          departments: new Set()
        };
      }
      
      const scheme = schemeMap[schemeId];
      scheme.totalWorks += 1;
      scheme.totalSanctionAmount += proposal.sanctionAmount || 0;
      scheme.totalApprovedAmount += proposal.administrativeApproval?.approvedAmount || 0;
      scheme.totalReleasedAmount += proposal.workProgress?.reduce((sum, progress) => sum + (progress.totalAmountReleasedSoFar || 0), 0) || 0;
      
      // Count status
      if (proposal.currentStatus === 'Pending Technical Approval') scheme.pendingTechnical += 1;
      if (proposal.currentStatus === 'Pending Administrative Approval') scheme.pendingAdministrative += 1;
      if (proposal.currentStatus === 'Work In Progress') scheme.inProgress += 1;
      if (proposal.currentStatus === 'Work Completed') scheme.completed += 1;
      
      // Add to sets
      if (proposal.city?._id) scheme.areas.add(proposal.city._id.toString());
      if (proposal.workAgency?._id) scheme.agencies.add(proposal.workAgency._id.toString());
      if (proposal.workDepartment?._id) scheme.departments.add(proposal.workDepartment._id.toString());
    });
    
    // Convert to final format
    const schemeWiseData = Object.values(schemeMap).map(scheme => ({
      _id: scheme._id,
      scheme: scheme.scheme,
      schemeName: scheme.schemeName,
      totalWorks: scheme.totalWorks,
      totalSanctionAmount: scheme.totalSanctionAmount,
      pendingTechnical: scheme.pendingTechnical,
      pendingAdministrative: scheme.pendingAdministrative,
      inProgress: scheme.inProgress,
      completed: scheme.completed,
      totalApprovedAmount: scheme.totalApprovedAmount,
      totalReleasedAmount: scheme.totalReleasedAmount,
      totalAreas: scheme.areas.size,
      totalAgencies: scheme.agencies.size,
      totalDepartments: scheme.departments.size,
      completionRate: scheme.totalWorks > 0 ? (scheme.completed / scheme.totalWorks) * 100 : 0
    })).sort((a, b) => b.totalWorks - a.totalWorks);
    
    const summary = {
      totalSchemes: schemeWiseData.length,
      totalWorks: schemeWiseData.reduce((sum, item) => sum + item.totalWorks, 0),
      totalSanctionAmount: schemeWiseData.reduce((sum, item) => sum + item.totalSanctionAmount, 0),
      avgCompletionRate: schemeWiseData.length > 0 ? 
        (schemeWiseData.reduce((sum, item) => sum + item.completionRate, 0) / schemeWiseData.length) : 0
    };
    
    res.json(createStandardResponse(schemeWiseData, summary, year));
  } catch (error) {
    console.error('Error in getSchemeWiseReport:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while generating scheme-wise report', 
      error: error.message 
    });
  }
};


exports.getPendingWorksReport = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { year } = req.query;
    let filter = getYearFilter(year);
    
    // Add filter for pending statuses
    filter.currentStatus = { 
      $in: [
        'Pending Technical Approval', 
        'Pending Administrative Approval',
        'Pending Tender',
        'Pending Work Order'
      ] 
    };
    
    const pendingWorks = await WorkProposal.find(filter)
      .select('serialNumber nameOfWork workAgency scheme currentStatus submissionDate sanctionAmount city ward workDepartment appointedEngineer submittedBy')
      .populate('workAgency', 'name')
      .populate('scheme', 'name')
      .populate('city', 'name')
      .populate('ward', 'name')
      .populate('workDepartment', 'name')
      .populate('appointedEngineer', 'displayName fullName')
      .populate('submittedBy', 'fullName department')
      .sort({ submissionDate: -1 })
      .lean();
    
    // Process the data to include names and calculate summary
    const processedWorks = pendingWorks.map(work => ({
      ...work,
      workAgencyName: work.workAgency?.name || 'Unknown Agency',
      schemeName: work.scheme?.name || 'Unknown Scheme',
      cityName: work.city?.name || 'Unknown City',
      wardName: work.ward?.name || 'Unknown Ward',
      workDepartmentName: work.workDepartment?.name || 'Unknown Department',
      appointedEngineerName: work.appointedEngineer?.displayName || work.appointedEngineer?.fullName || 'Not Assigned',
      submittedByName: work.submittedBy?.fullName || 'Unknown'
    }));
    
    // Calculate summary data
    const statusBreakdown = {};
    const uniqueAgencies = new Set();
    const uniqueSchemes = new Set();
    const uniqueDepartments = new Set();
    let totalPendingAmount = 0;
    
    processedWorks.forEach(work => {
      // Status breakdown
      statusBreakdown[work.currentStatus] = (statusBreakdown[work.currentStatus] || 0) + 1;
      
      // Unique counts
      if (work.workAgency?._id) uniqueAgencies.add(work.workAgency._id.toString());
      if (work.scheme?._id) uniqueSchemes.add(work.scheme._id.toString());
      if (work.workDepartment?._id) uniqueDepartments.add(work.workDepartment._id.toString());
      
      // Total amount
      totalPendingAmount += work.sanctionAmount || 0;
    });
    
    const summaryData = {
      totalPendingWorks: processedWorks.length,
      totalPendingAmount: totalPendingAmount,
      statusBreakdown: statusBreakdown,
      uniqueAgencies: uniqueAgencies.size,
      uniqueSchemes: uniqueSchemes.size,
      uniqueDepartments: uniqueDepartments.size
    };
    
    res.json(createStandardResponse(processedWorks, summaryData, year));
  } catch (error) {
    console.error('Error in getPendingWorksReport:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while generating pending works report', 
      error: error.message 
    });
  }
};


exports.getFinalStatusReport = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { year } = req.query;
    const filter = getYearFilter(year);
    
    const finalStatus = await WorkProposal.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$currentStatus',
          count: { $sum: 1 },
          totalAmount: { $sum: '$sanctionAmount' },
          works: {
            $push: {
              serialNumber: '$serialNumber',
              nameOfWork: '$nameOfWork',
              workAgency: '$workAgency',
              scheme: '$scheme',
              submissionDate: '$submissionDate',
              sanctionAmount: '$sanctionAmount'
            }
          }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    const totalWorks = finalStatus.reduce((sum, item) => sum + item.count, 0);
    const totalAmount = finalStatus.reduce((sum, item) => sum + item.totalAmount, 0);
    
    // Calculate correct percentages and categorize by progress stage
    const statusWithPercentages = finalStatus.map(item => ({
      status: item._id,
      count: item.count,
      totalAmount: item.totalAmount,
      percentage: totalWorks > 0 ? parseFloat(((item.count / totalWorks) * 100).toFixed(2)) : 0,
      works: item.works,
      // Categorize into broader categories
      category: categorizeStatus(item._id)
    }));
    
    // Group by categories for final status overview
    const categoryStats = statusWithPercentages.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = { count: 0, totalAmount: 0, percentage: 0 };
      }
      acc[item.category].count += item.count;
      acc[item.category].totalAmount += item.totalAmount;
      acc[item.category].percentage += item.percentage;
      return acc;
    }, {});
    
    const summary = {
      totalWorks,
      totalAmount,
      categoryBreakdown: categoryStats,
      detailedBreakdown: statusWithPercentages
    };
    
    res.json(createStandardResponse(statusWithPercentages, summary, year));
  } catch (error) {
    console.error('Error in getFinalStatusReport:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while generating final status report', 
      error: error.message 
    });
  }
};

// Helper function to categorize statuses
function categorizeStatus(status) {
  if (status.includes('Pending') || status.includes('Rejected')) {
    return 'Pending';
  } else if (status === 'Work Completed') {
    return 'Completed';
  } else {
    return 'In Progress';
  }
}

exports.getEngineerWiseReport = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { year, engineer } = req.query;
    let filter = getYearFilter(year);
    
    if (engineer) {
      filter.appointedEngineer = new RegExp(engineer, 'i');
    }
    
    // Use regular find with populate
    const proposals = await WorkProposal.find(filter)
      .populate('appointedEngineer', 'displayName fullName')
      .populate('workDepartment', 'name')
      .populate('city', 'name')
      .populate('scheme', 'name')
      .populate('workAgency', 'name')
      .populate('typeOfWork', 'name')
      .sort({ submissionDate: -1 });
    
    // Process data in JavaScript
    const engineerMap = {};
    
    proposals.forEach(proposal => {
      const engineerId = proposal.appointedEngineer?._id?.toString();
      const engineerName = proposal.appointedEngineer?.displayName || 
                          proposal.appointedEngineer?.fullName || 
                          'Unassigned Engineer';
      
      if (!engineerId) return;
      
      if (!engineerMap[engineerId]) {
        engineerMap[engineerId] = {
          _id: engineerId,
          engineer: engineerId,
          engineerName: engineerName,
          totalAssignedWorks: 0,
          totalSanctionAmount: 0,
          pendingTechnical: 0,
          pendingAdministrative: 0,
          inProgress: 0,
          completed: 0,
          totalApprovedAmount: 0,
          totalReleasedAmount: 0,
          departments: new Set(),
          areas: new Set(),
          schemes: new Set(),
          agencies: new Set(),
          workTypes: []
        };
      }
      
      const engineer = engineerMap[engineerId];
      engineer.totalAssignedWorks += 1;
      engineer.totalSanctionAmount += proposal.sanctionAmount || 0;
      engineer.totalApprovedAmount += proposal.administrativeApproval?.approvedAmount || 0;
      engineer.totalReleasedAmount += proposal.workProgress?.reduce((sum, progress) => sum + (progress.totalAmountReleasedSoFar || 0), 0) || 0;
      
      // Count status
      if (proposal.currentStatus === 'Pending Technical Approval') engineer.pendingTechnical += 1;
      if (proposal.currentStatus === 'Pending Administrative Approval') engineer.pendingAdministrative += 1;
      if (proposal.currentStatus === 'Work In Progress') engineer.inProgress += 1;
      if (proposal.currentStatus === 'Work Completed') engineer.completed += 1;
      
      // Add to sets
      if (proposal.workDepartment?._id) engineer.departments.add(proposal.workDepartment._id.toString());
      if (proposal.city?._id) engineer.areas.add(proposal.city._id.toString());
      if (proposal.scheme?._id) engineer.schemes.add(proposal.scheme._id.toString());
      if (proposal.workAgency?._id) engineer.agencies.add(proposal.workAgency._id.toString());
      
      // Add work details (limit to 10 recent works)
      if (engineer.workTypes.length < 10) {
        engineer.workTypes.push({
          typeOfWork: proposal.typeOfWork?.name || 'Unknown Type',
          typeOfWorkName: proposal.typeOfWork?.name || 'Unknown Type',
          nameOfWork: proposal.nameOfWork || 'Unknown Work',
          currentStatus: proposal.currentStatus || 'Unknown Status',
          sanctionAmount: proposal.sanctionAmount || 0,
          scheme: proposal.scheme?.name || 'Unknown Scheme',
          schemeName: proposal.scheme?.name || 'Unknown Scheme'
        });
      }
    });
    
    // Convert to final format
    const engineerWiseData = Object.values(engineerMap).map(engineer => ({
      _id: engineer._id,
      engineer: engineer.engineer,
      engineerName: engineer.engineerName,
      totalAssignedWorks: engineer.totalAssignedWorks,
      totalSanctionAmount: engineer.totalSanctionAmount,
      pendingTechnical: engineer.pendingTechnical,
      pendingAdministrative: engineer.pendingAdministrative,
      inProgress: engineer.inProgress,
      completed: engineer.completed,
      totalApprovedAmount: engineer.totalApprovedAmount,
      totalReleasedAmount: engineer.totalReleasedAmount,
      totalDepartments: engineer.departments.size,
      totalAreas: engineer.areas.size,
      totalSchemes: engineer.schemes.size,
      totalAgencies: engineer.agencies.size,
      completionRate: engineer.totalAssignedWorks > 0 ? (engineer.completed / engineer.totalAssignedWorks) * 100 : 0,
      workTypes: engineer.workTypes
    })).sort((a, b) => b.totalAssignedWorks - a.totalAssignedWorks);
    
    const summary = {
      totalEngineers: engineerWiseData.length,
      totalWorks: engineerWiseData.reduce((sum, item) => sum + item.totalAssignedWorks, 0),
      totalSanctionAmount: engineerWiseData.reduce((sum, item) => sum + item.totalSanctionAmount, 0),
      avgWorksPerEngineer: engineerWiseData.length > 0 ? 
        (engineerWiseData.reduce((sum, item) => sum + item.totalAssignedWorks, 0) / engineerWiseData.length) : 0,
      avgCompletionRate: engineerWiseData.length > 0 ? 
        (engineerWiseData.reduce((sum, item) => sum + item.completionRate, 0) / engineerWiseData.length) : 0
    };
    
    res.json(createStandardResponse(engineerWiseData, summary, year));
  } catch (error) {
    console.error('Error in getEngineerWiseReport:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while generating engineer-wise report', 
      error: error.message 
    });
  }
};


exports.getPhotoMissingReport = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { year } = req.query;
    const filter = getYearFilter(year);
    
    // Find works that don't have associated photos
    const worksWithoutPhotos = await WorkProposal.find({
      ...filter,
      $or: [
        { workLocationImage: { $exists: false } },
        { workLocationImage: { $size: 0 } },
        { workLocationImage: null },
        { 'workProgress.progressImages': { $exists: false } },
        { 'workProgress.progressImages': { $size: 0 } },
        { 'workProgress.progressImages': null }
      ]
    })
    .select('serialNumber nameOfWork workAgency scheme currentStatus submissionDate sanctionAmount city ward workDepartment appointedEngineer')
    .populate('submittedBy', 'fullName department')
    .sort({ submissionDate: -1 })
    .lean();
    
    // Get summary statistics
    const summaryData = await WorkProposal.aggregate([
      { $match: filter },
      {
        $facet: {
          totalWorks: [{ $count: 'count' }],
          worksWithoutLocationPhotos: [
            {
              $match: {
                $or: [
                  { workLocationImage: { $exists: false } },
                  { workLocationImage: { $size: 0 } },
                  { workLocationImage: null }
                ]
              }
            },
            { $count: 'count' }
          ],
          worksWithoutProgressPhotos: [
            {
              $match: {
                $or: [
                  { 'workProgress.progressImages': { $exists: false } },
                  { 'workProgress.progressImages': { $size: 0 } },
                  { 'workProgress.progressImages': null }
                ]
              }
            },
            { $count: 'count' }
          ],
          statusBreakdown: [
            {
              $match: {
                $or: [
                  { workLocationImage: { $exists: false } },
                  { workLocationImage: { $size: 0 } },
                  { workLocationImage: null },
                  { 'workProgress.progressImages': { $exists: false } },
                  { 'workProgress.progressImages': { $size: 0 } },
                  { 'workProgress.progressImages': null }
                ]
              }
            },
            {
              $group: {
                _id: '$currentStatus',
                count: { $sum: 1 }
              }
            }
          ],
          agencyBreakdown: [
            {
              $match: {
                $or: [
                  { workLocationImage: { $exists: false } },
                  { workLocationImage: { $size: 0 } },
                  { workLocationImage: null },
                  { 'workProgress.progressImages': { $exists: false } },
                  { 'workProgress.progressImages': { $size: 0 } },
                  { 'workProgress.progressImages': null }
                ]
              }
            },
            {
              $group: {
                _id: '$workAgency',
                count: { $sum: 1 }
              }
            },
            { $sort: { count: -1 } }
          ]
        }
      }
    ]);
    
    const summary = {
      totalWorksWithoutPhotos: worksWithoutPhotos.length,
      totalWorks: summaryData[0].totalWorks[0]?.count || 0,
      worksWithoutLocationPhotos: summaryData[0].worksWithoutLocationPhotos[0]?.count || 0,
      worksWithoutProgressPhotos: summaryData[0].worksWithoutProgressPhotos[0]?.count || 0,
      statusBreakdown: summaryData[0].statusBreakdown || [],
      agencyBreakdown: summaryData[0].agencyBreakdown || [],
      percentageWithoutPhotos: summaryData[0].totalWorks[0]?.count > 0 ? 
        ((worksWithoutPhotos.length / summaryData[0].totalWorks[0].count) * 100).toFixed(2) : 0
    };
    
    res.json(createStandardResponse(worksWithoutPhotos, summary, year));
  } catch (error) {
    console.error('Error in getPhotoMissingReport:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while generating photo missing report', 
      error: error.message 
    });
  }
};

// Export the const functions
exports.getDashboardStats = getDashboardStats;
exports.getDepartmentWiseReport = getDepartmentWiseReport;
exports.getStatusWiseReport = getStatusWiseReport;
exports.getFinancialReport = getFinancialReport;
exports.getProgressReport = getProgressReport;