import React, { useState, useEffect, useMemo } from 'react';
import Table1 from '../Components/Table1.jsx';
const WorkOrderPage = () => {
  return (
    <Table1
  addButtonLabel="कार्य आदेश"
  onAddNew= "/add-work"
  showAddButton={false}
  onView="/Work-Order-Form"
  workStage="Pending Work Order"
/>
  );
};

export default WorkOrderPage;
