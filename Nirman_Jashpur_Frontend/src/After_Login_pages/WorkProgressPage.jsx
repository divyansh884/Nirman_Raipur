import React, { useState, useEffect, useMemo } from 'react';
import Table from '../Components/Table.jsx';
const WorkProgressPage = () => {
  return (
    <Table 
  addButtonLabel="कार्य प्रगति स्तर"
  onAddNew= "/add-work"
  showAddButton={false}
  onView="/Work-In-Progress-Form"
  workStage="Work In Progress"
/>
  );
};

export default WorkProgressPage;
