import React from 'react';
import useAuthStore from '../Store/useAuthStore.js';
import Table from '../Components/Table.jsx';

const WorkProgressPage = () => {
  const { user, isEngineer, isAdmin } = useAuthStore();

  // You can also customize other props based on role
  const getTableProps = () => {
    const baseProps = {
      addButtonLabel: "कार्य प्रगति स्तर",
      onAddNew: "/add-work",
      showAddButton: false,
      workStage: "Work In Progress"
    };

    // Engineers and Admins get full access
    if (isAdmin() || isEngineer()) {
      return {
        ...baseProps,
        onView: '/Work-In-Progress-Form'
      };
    }

    // Other users get limited access
    return {
      ...baseProps,
      onView: '/work',
      // You might want to show different button label for non-engineers
      addButtonLabel: "कार्य देखें"
    };
  };

  const tableProps = getTableProps();

  return <Table {...tableProps} />;
};

export default WorkProgressPage;
