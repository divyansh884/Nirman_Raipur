
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
        $group: {
          _id: '$workDepartment',
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
      .populate('submittedBy', 'fullName department')
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
    
    const agencyWiseData = await WorkProposal.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$workAgency',
          totalWorks: { $sum: 1 },
          totalSanctionAmount: { $sum: '$sanctionAmount' },
          pendingTechnical: {
            $sum: { $cond: [{ $eq: ['$currentStatus', 'Pending Technical Approval'] }, 1, 0] }
          },
          pendingAdministrative: {
            $sum: { $cond: [{ $eq: ['$currentStatus', 'Pending Administrative Approval'] }, 1, 0] }
          },
          inProgress: {
            $sum: { $cond: [{ $eq: ['$currentStatus', 'Work In Progress'] }, 1, 0] }
          },
          completed: {
            $sum: { $cond: [{ $eq: ['$currentStatus', 'Work Completed'] }, 1, 0] }
          },
          totalApprovedAmount: { $sum: '$administrativeApproval.approvedAmount' },
          totalReleasedAmount: { $sum: '$workProgress.totalAmountReleasedSoFar' },
          avgProgressPercentage: { $avg: '$workProgress.progressPercentage' },
          schemes: { $addToSet: '$scheme' },
          departments: { $addToSet: '$workDepartment' }
        }
      },
      {
        $project: {
          agency: '$_id',
          totalWorks: 1,
          totalSanctionAmount: 1,
          pendingTechnical: 1,
          pendingAdministrative: 1,
          inProgress: 1,
          completed: 1,
          totalApprovedAmount: { $ifNull: ['$totalApprovedAmount', 0] },
          totalReleasedAmount: { $ifNull: ['$totalReleasedAmount', 0] },
          avgProgressPercentage: { $ifNull: ['$avgProgressPercentage', 0] },
          totalSchemes: { $size: '$schemes' },
          totalDepartments: { $size: '$departments' },
          completionRate: {
            $multiply: [
              { $divide: ['$completed', '$totalWorks'] },
              100
            ]
          }
        }
      },
      { $sort: { totalWorks: -1 } }
    ]);
    
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
    
    const blockWiseData = await WorkProposal.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$city',
          totalWorks: { $sum: 1 },
          totalSanctionAmount: { $sum: '$sanctionAmount' },
          pendingTechnical: {
            $sum: { $cond: [{ $eq: ['$currentStatus', 'Pending Technical Approval'] }, 1, 0] }
          },
          pendingAdministrative: {
            $sum: { $cond: [{ $eq: ['$currentStatus', 'Pending Administrative Approval'] }, 1, 0] }
          },
          inProgress: {
            $sum: { $cond: [{ $eq: ['$currentStatus', 'Work In Progress'] }, 1, 0] }
          },
          completed: {
            $sum: { $cond: [{ $eq: ['$currentStatus', 'Work Completed'] }, 1, 0] }
          },
          totalApprovedAmount: { $sum: '$administrativeApproval.approvedAmount' },
          totalReleasedAmount: { $sum: '$workProgress.totalAmountReleasedSoFar' },
          agencies: { $addToSet: '$workAgency' },
          schemes: { $addToSet: '$scheme' },
          departments: { $addToSet: '$workDepartment' }
        }
      },
      {
        $project: {
          block: '$_id',
          totalWorks: 1,
          totalSanctionAmount: 1,
          pendingTechnical: 1,
          pendingAdministrative: 1,
          inProgress: 1,
          completed: 1,
          totalApprovedAmount: { $ifNull: ['$totalApprovedAmount', 0] },
          totalReleasedAmount: { $ifNull: ['$totalReleasedAmount', 0] },
          totalAgencies: { $size: '$agencies' },
          totalSchemes: { $size: '$schemes' },
          totalDepartments: { $size: '$departments' },
          completionRate: {
            $cond: [
              { $gt: ['$totalWorks', 0] },
              { $multiply: [{ $divide: ['$completed', '$totalWorks'] }, 100] },
              0
            ]
          }
        }
      },
      { $sort: { totalWorks: -1 } }
    ]);
    
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
    
    const schemeWiseData = await WorkProposal.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$scheme',
          totalWorks: { $sum: 1 },
          totalSanctionAmount: { $sum: '$sanctionAmount' },
          pendingTechnical: {
            $sum: { $cond: [{ $eq: ['$currentStatus', 'Pending Technical Approval'] }, 1, 0] }
          },
          pendingAdministrative: {
            $sum: { $cond: [{ $eq: ['$currentStatus', 'Pending Administrative Approval'] }, 1, 0] }
          },
          inProgress: {
            $sum: { $cond: [{ $eq: ['$currentStatus', 'Work In Progress'] }, 1, 0] }
          },
          completed: {
            $sum: { $cond: [{ $eq: ['$currentStatus', 'Work Completed'] }, 1, 0] }
          },
          totalApprovedAmount: { $sum: '$administrativeApproval.approvedAmount' },
          totalReleasedAmount: { $sum: '$workProgress.totalAmountReleasedSoFar' },
          areas: { $addToSet: '$city' },
          agencies: { $addToSet: '$workAgency' },
          departments: { $addToSet: '$workDepartment' }
        }
      },
      {
        $project: {
          scheme: '$_id',
          totalWorks: 1,
          totalSanctionAmount: 1,
          pendingTechnical: 1,
          pendingAdministrative: 1,
          inProgress: 1,
          completed: 1,
          totalApprovedAmount: { $ifNull: ['$totalApprovedAmount', 0] },
          totalReleasedAmount: { $ifNull: ['$totalReleasedAmount', 0] },
          totalAreas: { $size: '$areas' },
          totalAgencies: { $size: '$agencies' },
          totalDepartments: { $size: '$departments' },
          completionRate: {
            $cond: [
              { $gt: ['$totalWorks', 0] },
              { $multiply: [{ $divide: ['$completed', '$totalWorks'] }, 100] },
              0
            ]
          }
        }
      },
      { $sort: { totalWorks: -1 } }
    ]);
    
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
      .select('serialNumber nameOfWork workAgency scheme currentStatus submissionDate sanctionAmount city ward workDepartment appointedEngineer')
      .populate('submittedBy', 'fullName department')
      .sort({ submissionDate: -1 })
      .lean();
    
    const summary = await WorkProposal.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalPendingWorks: { $sum: 1 },
          totalPendingAmount: { $sum: '$sanctionAmount' },
          pendingByStatus: {
            $push: {
              status: '$currentStatus',
              agency: '$workAgency',
              scheme: '$scheme',
              department: '$workDepartment'
            }
          }
        }
      },
      {
        $project: {
          totalPendingWorks: 1,
          totalPendingAmount: 1,
          statusBreakdown: {
            $reduce: {
              input: '$pendingByStatus',
              initialValue: {},
              in: {
                $mergeObjects: [
                  '$$value',
                  {
                    $arrayToObject: [
                      [{
                        k: '$$this.status',
                        v: { $add: [{ $ifNull: [{ $getField: { field: '$$this.status', input: '$$value' } }, 0] }, 1] }
                      }]
                    ]
                  }
                ]
              }
            }
          },
          uniqueAgencies: {
            $size: {
              $setUnion: {
                $map: {
                  input: '$pendingByStatus',
                  as: 'item',
                  in: '$$item.agency'
                }
              }
            }
          },
          uniqueSchemes: {
            $size: {
              $setUnion: {
                $map: {
                  input: '$pendingByStatus',
                  as: 'item',
                  in: '$$item.scheme'
                }
              }
            }
          }
        }
      }
    ]);
    
    const summaryData = summary[0] || {
      totalPendingWorks: 0,
      totalPendingAmount: 0,
      statusBreakdown: {},
      uniqueAgencies: 0,
      uniqueSchemes: 0
    };
    
    res.json(createStandardResponse(pendingWorks, summaryData, year));
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
    
    const engineerWiseData = await WorkProposal.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$appointedEngineer',
          totalAssignedWorks: { $sum: 1 },
          totalSanctionAmount: { $sum: '$sanctionAmount' },
          pendingTechnical: {
            $sum: { $cond: [{ $eq: ['$currentStatus', 'Pending Technical Approval'] }, 1, 0] }
          },
          pendingAdministrative: {
            $sum: { $cond: [{ $eq: ['$currentStatus', 'Pending Administrative Approval'] }, 1, 0] }
          },
          inProgress: {
            $sum: { $cond: [{ $eq: ['$currentStatus', 'Work In Progress'] }, 1, 0] }
          },
          completed: {
            $sum: { $cond: [{ $eq: ['$currentStatus', 'Work Completed'] }, 1, 0] }
          },
          totalApprovedAmount: { $sum: '$administrativeApproval.approvedAmount' },
          totalReleasedAmount: { $sum: '$workProgress.totalAmountReleasedSoFar' },
          departments: { $addToSet: '$workDepartment' },
          areas: { $addToSet: '$city' },
          schemes: { $addToSet: '$scheme' },
          agencies: { $addToSet: '$workAgency' },
          workTypes: {
            $push: {
              typeOfWork: '$typeOfWork',
              nameOfWork: '$nameOfWork',
              currentStatus: '$currentStatus',
              sanctionAmount: '$sanctionAmount',
              scheme: '$scheme'
            }
          }
        }
      },
      {
        $project: {
          engineer: '$_id',
          totalAssignedWorks: 1,
          totalSanctionAmount: 1,
          pendingTechnical: 1,
          pendingAdministrative: 1,
          inProgress: 1,
          completed: 1,
          totalApprovedAmount: { $ifNull: ['$totalApprovedAmount', 0] },
          totalReleasedAmount: { $ifNull: ['$totalReleasedAmount', 0] },
          totalDepartments: { $size: '$departments' },
          totalAreas: { $size: '$areas' },
          totalSchemes: { $size: '$schemes' },
          totalAgencies: { $size: '$agencies' },
          completionRate: {
            $cond: [
              { $gt: ['$totalAssignedWorks', 0] },
              { $multiply: [{ $divide: ['$completed', '$totalAssignedWorks'] }, 100] },
              0
            ]
          },
          workTypes: { $slice: ['$workTypes', 10] } // Limit to 10 recent works for performance
        }
      },
      { $sort: { totalAssignedWorks: -1 } }
    ]);
    
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