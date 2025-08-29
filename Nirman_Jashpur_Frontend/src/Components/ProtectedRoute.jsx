import React from 'react';
import useAuthStore from "../Store/useAuthStore.js";

const ProtectedRoute = ({ 
  children, 
  requiredRole, 
  requiredRoles, 
  pageName,
  adminOnly = false,
  fallback = null 
}) => {
  const { 
    isAuthenticated, 
    user, 
    hasRole, 
    hasAnyRole, 
    isAdmin, 
    canAccessPage 
  } = useAuthStore();

  // Check if user is authenticated
  if (!isAuthenticated) {
    return (
      <div style={{ 
        padding: '20px', 
        textAlign: 'center', 
        backgroundColor: '#fee', 
        border: '1px solid #fcc',
        borderRadius: '8px',
        margin: '20px' 
      }}>
        <h3>❌ पहुंच अस्वीकृत</h3>
        <p>इस पेज को एक्सेस करने के लिए कृपया लॉगिन करें।</p>
      </div>
    );
  }

  // Check admin-only access
  if (adminOnly && !isAdmin()) {
    return fallback || (
      <div style={{ 
        padding: '20px', 
        textAlign: 'center', 
        backgroundColor: '#fee', 
        border: '1px solid #fcc',
        borderRadius: '8px',
        margin: '20px' 
      }}>
        <h3>❌ एडमिन पहुंच आवश्यक</h3>
        <p>इस पेज के लिए एडमिन अधिकार की आवश्यकता है।</p>
        <p>आपकी वर्तमान भूमिका: <strong>{user?.role}</strong></p>
      </div>
    );
  }

  // Check specific role
  if (requiredRole && !hasRole(requiredRole)) {
    return fallback || (
      <div style={{ 
        padding: '20px', 
        textAlign: 'center', 
        backgroundColor: '#fee', 
        border: '1px solid #fcc',
        borderRadius: '8px',
        margin: '20px' 
      }}>
        <h3>❌ अपर्याप्त अनुमतियां</h3>
        <p>आपकी भूमिका ({user?.role}) इस पेज तक पहुंचने की अनुमति नहीं देती।</p>
        <p>आवश्यक भूमिका: <strong>{requiredRole}</strong></p>
      </div>
    );
  }

  // Check multiple roles
  if (requiredRoles && !hasAnyRole(requiredRoles)) {
    return fallback || (
      <div style={{ 
        padding: '20px', 
        textAlign: 'center', 
        backgroundColor: '#fee', 
        border: '1px solid #fcc',
        borderRadius: '8px',
        margin: '20px' 
      }}>
        <h3>❌ अपर्याप्त अनुमतियां</h3>
        <p>आपकी भूमिका ({user?.role}) इस पेज तक पहुंचने की अनुमति नहीं देती।</p>
        <p>आवश्यक भूमिकाएं: <strong>{requiredRoles.join(', ')}</strong></p>
      </div>
    );
  }

  // Check page-specific access
  if (pageName && !canAccessPage(pageName)) {
    return fallback || (
      <div style={{ 
        padding: '20px', 
        textAlign: 'center', 
        backgroundColor: '#fee', 
        border: '1px solid #fcc',
        borderRadius: '8px',
        margin: '20px' 
      }}>
        <h3>❌ पेज पहुंच प्रतिबंधित</h3>
        <p>आपकी भूमिका ({user?.role}) इस पेज तक पहुंचने की अनुमति नहीं देती।</p>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
