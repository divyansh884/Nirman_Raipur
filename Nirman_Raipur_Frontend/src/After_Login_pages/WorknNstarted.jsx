import React from 'react';
import useAuthStore from '../Store/useAuthStore.js';
import Table from '../Components/Table.jsx';

const WorkNstarted = () => {
  const { user, isEngineer, isAdmin } = useAuthStore();

  // You can also customize other props based on role
  const getTableProps = () => {
    const baseProps = {
      addButtonLabel: "कार्य अप्रारंभ",
      onAddNew: "/add-work",
      showAddButton: false,
      workStage: "Work Not Started"
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

export default WorkNstarted;
