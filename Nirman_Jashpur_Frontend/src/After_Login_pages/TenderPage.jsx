import React from 'react';
import useAuthStore from '../Store/useAuthStore.js';
import Table1 from '../Components/Table1.jsx';

const TenderPage = () => {
  const { user, isTenderManager, isAdmin } = useAuthStore();

  // You can also customize other props based on role
  const getTableProps = () => {
    const baseProps = {
      addButtonLabel: "निविदा",
      onAddNew: "/add-work",
      showAddButton: false,
      workStage: "Pending Tender"
    };

    // Tender Handlers and Admins get full access
    if (isAdmin() || isTenderManager()) {
      return {
        ...baseProps,
        onView: '/Tender-Form'
      };
    }

    // Other users get limited access
    return {
      ...baseProps,
      onView: '/work',
      // You might want to show different button label for non-tender handlers
    };
  };

  const tableProps = getTableProps();

  return <Table1 {...tableProps} />;
};

export default TenderPage;
