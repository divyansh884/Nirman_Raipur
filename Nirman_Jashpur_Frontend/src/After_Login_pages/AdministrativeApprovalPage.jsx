import React, { useState, useEffect, useMemo } from 'react';
import Table1 from '../Components/Table1.jsx';
const AdministrativeApprovalPage = () => {
  return (
    <Table1
  addButtonLabel="प्रशासकीय स्वीकृति"
  onAddNew= "/add-work"
  showAddButton={false}
  onView="/Administrative-Approval-Form"
  workStage="Pending Administrative Approval"
/>
  );
};

export default AdministrativeApprovalPage;
