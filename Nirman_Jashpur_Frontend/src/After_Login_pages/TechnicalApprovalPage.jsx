import React from 'react';
import useAuthStore from '../Store/useAuthStore.js';
import Table1 from '../Components/Table1.jsx';
const TechnicalApprovalPage = () => {
  const { user, isTechnicalApprover, isAdmin } = useAuthStore();
  // Determine the onView path based on the user role with more detailed logic
  const getOnViewPath = () => {
    // Admin and Technical Approver can access the Technical Approval Form
    if (isAdmin() || isTechnicalApprover()) {
      return '/Technical-Approval-Form';
    }
    
    // All other roles redirect to work page
    return '/work';
  };
  // You can also customize other props based on role
  const getTableProps = () => {
    const baseProps = {
      addButtonLabel: "तकनीकी स्वीकृति",
      onAddNew: "/add-work",
      showAddButton: false,
      workStage: "Pending Technical Approval"
    };
    // Technical Approvers and Admins get full access
    if (isAdmin() || isTechnicalApprover()) {
      return {
        ...baseProps,
        onView: '/Technical-Approval-Form'
      };
    }
    // Other users get limited access
    return {
      ...baseProps,
      onView: '/work',
      // You might want to show different button label for non-technical approvers
      addButtonLabel: "कार्य देखें"
    };
  };
  const tableProps = getTableProps();
  return <Table1 {...tableProps} />;
};
export default TechnicalApprovalPage;


