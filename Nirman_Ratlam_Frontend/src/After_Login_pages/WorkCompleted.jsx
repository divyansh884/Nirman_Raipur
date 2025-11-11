import React from 'react';
import useAuthStore from '../Store/useAuthStore.js';
import Table from '../Components/Table.jsx';

const WorkCompleted = () => {
  const { user, isEngineer, isAdmin } = useAuthStore();

  // You can also customize other props based on role
  const getTableProps = () => {
    const baseProps = {
      addButtonLabel: "कार्य पूर्ण",
      onAddNew: "/add-work",
      showAddButton: false,
      workStage: "Work Completed"
    };

    // Engineers and Admins get full access
    if (isAdmin() || isEngineer()) {
      return {
        ...baseProps,
        onView: '/Update-Work-Status'
      };
    }

    // Other users get limited access
    return {
      ...baseProps,
      onView: '/Update-Work-Status',
      // You might want to show different button label for non-engineers
    };
  };

  const tableProps = getTableProps();

  return <Table {...tableProps} />;
};

export default WorkCompleted;
