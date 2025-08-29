import React from 'react';
import useAuthStore from '../Store/useAuthStore.js';
import Table1 from '../Components/Table1.jsx';

const WorkOrderPage = () => {
  const { user, isWorkOrderManager, isAdmin } = useAuthStore();

  // You can also customize other props based on role
  const getTableProps = () => {
    const baseProps = {
      addButtonLabel: "कार्य आदेश",
      onAddNew: "/add-work",
      showAddButton: false,
      workStage: "Pending Work Order"
    };

    // Work Order Managers and Admins get full access
    if (isAdmin() || isWorkOrderManager()) {
      return {
        ...baseProps,
        onView: '/Work-Order-Form'
      };
    }

    // Other users get limited access
    return {
      ...baseProps,
      onView: '/work',
      // You might want to show different button label for non-work order managers
    };
  };

  const tableProps = getTableProps();

  return <Table1 {...tableProps} />;
};

export default WorkOrderPage;
