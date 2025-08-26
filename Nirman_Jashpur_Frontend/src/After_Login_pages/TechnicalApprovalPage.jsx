import React, { useState, useEffect, useMemo } from 'react';
import Table1 from '../Components/Table1.jsx';
const TechnicalApprovalPage = () => {
  return (
    <Table1
  addButtonLabel="तकनीकी स्वीकृति"
  onAddNew= "/add-work"
  showAddButton={false}
  onView="/Technical-Approval-Form"
/>
  );
};

export default TechnicalApprovalPage;
