import React, { useState, useEffect, useMemo } from 'react';
import Table1 from '../Components/Table1.jsx';
const TenderPage = () => {
  return (
    <Table1
  addButtonLabel="निविदा"
  onAddNew= "/add-work"
  showAddButton={false}
  onView="/Tender-Form"
/>
  );
};

export default TenderPage;
