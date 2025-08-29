import React from 'react';
import useAuthStore from '../Store/useAuthStore.js';
import Table1 from '../Components/Table1.jsx';

const AdministrativeApprovalPage = () => {
  const { user, isAdministrativeApprover, isAdmin } = useAuthStore();

  // You can also customize other props based on role
  const getTableProps = () => {
    const baseProps = {
      addButtonLabel: "प्रशासकीय स्वीकृति",
      onAddNew: "/add-work",
      showAddButton: false,
      workStage: "Pending Administrative Approval"
    };

    // Administrative Approvers and Admins get full access
    if (isAdmin() || isAdministrativeApprover()) {
      return {
        ...baseProps,
        onView: '/Administrative-Approval-Form'
      };
    }

    // Other users get limited access
    return {
      ...baseProps,
      onView: '/work',
      // You might want to show different button label for non-administrative approvers
    };
  };

  const tableProps = getTableProps();

  return <Table1 {...tableProps} />;
};

export default AdministrativeApprovalPage;
