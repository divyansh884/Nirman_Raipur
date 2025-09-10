// Pagination helper
const getPagination = (page, size) => {
  const limit = size ? +size : 10;
  const offset = page ? (page - 1) * limit : 0;

  return { limit, offset };
};

// Pagination data for response
const getPaginationData = (data, page, limit, totalItems) => {
  const currentPage = page ? +page : 1;
  const totalPages = Math.ceil(totalItems / limit);

  return {
    data,
    pagination: {
      currentPage,
      totalPages,
      totalItems,
      itemsPerPage: limit,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1,
      nextPage: currentPage < totalPages ? currentPage + 1 : null,
      prevPage: currentPage > 1 ? currentPage - 1 : null
    }
  };
};

// Build search filter
const buildSearchFilter = (searchQuery, fields) => {
  if (!searchQuery || !fields || fields.length === 0) {
    return {};
  }

  const searchRegex = new RegExp(searchQuery, 'i');
  return {
    $or: fields.map(field => ({
      [field]: searchRegex
    }))
  };
};

// Build date range filter
const buildDateRangeFilter = (startDate, endDate, field = 'createdAt') => {
  const filter = {};
  
  if (startDate || endDate) {
    filter[field] = {};
    
    if (startDate) {
      filter[field].$gte = new Date(startDate);
    }
    
    if (endDate) {
      filter[field].$lte = new Date(endDate);
    }
  }
  
  return filter;
};

// Sort helper
const buildSortObject = (sortBy, sortOrder = 'desc') => {
  if (!sortBy) {
    return { createdAt: -1 };
  }
  
  const order = sortOrder.toLowerCase() === 'asc' ? 1 : -1;
  return { [sortBy]: order };
};

// Generate unique filename
const generateUniqueFilename = (originalName) => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2);
  const extension = originalName.split('.').pop();
  
  return `${timestamp}_${random}.${extension}`;
};

// Validate ObjectId
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

// Clean object (remove null/undefined values)
const cleanObject = (obj) => {
  return Object.keys(obj).reduce((acc, key) => {
    if (obj[key] !== null && obj[key] !== undefined && obj[key] !== '') {
      acc[key] = obj[key];
    }
    return acc;
  }, {});
};

// Format response
const formatResponse = (success = true, message = '', data = null, error = null) => {
  const response = {
    success,
    message,
    timestamp: new Date().toISOString()
  };

  if (data !== null) {
    response.data = data;
  }

  if (error !== null && process.env.NODE_ENV === 'development') {
    response.error = error;
  }

  return response;
};

// Calculate percentage
const calculatePercentage = (part, total) => {
  if (total === 0) return 0;
  return Math.round((part / total) * 100 * 100) / 100; // Round to 2 decimal places
};

// Group array by key
const groupBy = (array, key) => {
  return array.reduce((result, currentValue) => {
    const groupKey = currentValue[key];
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(currentValue);
    return result;
  }, {});
};

module.exports = {
  getPagination,
  getPaginationData,
  buildSearchFilter,
  buildDateRangeFilter,
  buildSortObject,
  generateUniqueFilename,
  isValidObjectId,
  cleanObject,
  formatResponse,
  calculatePercentage,
  groupBy
};
