// stores/useAuthStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Define page access permissions for each role
const ROLE_PERMISSIONS = {
  'Super Admin': [
    'dashboard',
    'technical-approval',
    'administrative-approval', 
    'work-progress',
    'tender',
    'work-order',
    'work',
    'users',
    'reports',
    
  ],
  'Administrative Approver': [
    'dashboard',
    'administrative-approval'
  ],
  'Technical Approver': [
    'dashboard',
    'technical-approval'
  ],
  'User': [
    'dashboard',
    'work'
  ],
  'Engineer': [
    'dashboard',
    'work-progress'
  ],
  'Tender Manager': [
    'dashboard',
    'tender'
  ],
  'Work Order Manager': [
    'dashboard',
    'work-order'
  ]
};

const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      token: null,
      tokenExpiry: null, // ✅ Store token expiration time
      isAuthenticated: false,
      isLoading: false,
      error: null,
      tokenCheckInterval: null, // ✅ Store interval ID for cleanup

      // Actions
      login: async (credentials) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch("http://localhost:3000/api/auth/login", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(credentials),
          });

          const data = await response.json();

          if (!response.ok) {
            if (response.status === 401) {
              throw new Error("❌ गलत ईमेल या पासवर्ड");
            } else if (response.status === 400) {
              throw new Error("❌ " + (data.message || "गलत डेटा प्रदान किया गया"));
            } else if (response.status === 500) {
              throw new Error("❌ सर्वर त्रुटि। कृपया बाद में पुनः प्रयास करें");
            } else {
              throw new Error("❌ " + (data.message || "लॉगिन में त्रुटि हुई"));
            }
          }

          if (data.success && data.data?.token && data.data?.user) {
            // ✅ Calculate token expiry (assuming JWT or server provides expiry)
            const tokenExpiry = data.data.expiresAt 
              ? new Date(data.data.expiresAt).getTime()
              : Date.now() + (24 * 60 * 60 * 1000); // Default 24 hours if no expiry provided

            set({
              user: data.data.user,
              token: data.data.token,
              tokenExpiry: tokenExpiry,
              isAuthenticated: true,
              isLoading: false,
              error: null
            });
            
            // ✅ Start token expiry monitoring
            get().startTokenExpiryCheck();
            
            return { success: true, data: data.data };
          } else {
            throw new Error('❌ अमान्य लॉगिन प्रतिक्रिया');
          }
        } catch (error) {
          set({
            error: error.message,
            isLoading: false,
            isAuthenticated: false,
            user: null,
            token: null,
            tokenExpiry: null
          });
          throw error;
        }
      },

      // ✅ Enhanced logout with cleanup
      logout: () => {
        const { tokenCheckInterval } = get();
        
        // Clear token check interval
        if (tokenCheckInterval) {
          clearInterval(tokenCheckInterval);
        }
        
        set({
          user: null,
          token: null,
          tokenExpiry: null,
          isAuthenticated: false,
          error: null,
          isLoading: false,
          tokenCheckInterval: null
        });

        // ✅ Optional: Show logout message
        console.log('🚪 User logged out - token cleared');
      },

      // ✅ Force logout due to token expiry
      forceLogout: (reason = 'Token expired') => {
        const { tokenCheckInterval } = get();
        
        // Clear token check interval
        if (tokenCheckInterval) {
          clearInterval(tokenCheckInterval);
        }
        
        set({
          user: null,
          token: null,
          tokenExpiry: null,
          isAuthenticated: false,
          error: null,
          isLoading: false,
          tokenCheckInterval: null
        });

        // ✅ Show user-friendly message
        alert(`आपका सत्र समाप्त हो गया है। कृपया पुनः लॉगिन करें। (${reason})`);
        console.log(`🚪 Force logout: ${reason}`);
        
        // ✅ Redirect to login page
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      },

      // ✅ Check if token is expired
      isTokenExpired: () => {
        const { tokenExpiry } = get();
        if (!tokenExpiry) return true;
        return Date.now() > tokenExpiry;
      },

      // ✅ Start periodic token expiry checking
      startTokenExpiryCheck: () => {
        const { tokenCheckInterval } = get();
        
        // Clear existing interval
        if (tokenCheckInterval) {
          clearInterval(tokenCheckInterval);
        }
        
        // Check token every 60 seconds
        const intervalId = setInterval(() => {
          const { isAuthenticated, token, isTokenExpired, forceLogout } = get();
          
          if (isAuthenticated && token) {
            if (isTokenExpired()) {
              forceLogout('Token expired');
            }
          }
        }, 60000); // Check every 60 seconds
        
        set({ tokenCheckInterval: intervalId });
      },

      // ✅ Verify token with backend (enhanced)
      verifyToken: async () => {
        const { token, isTokenExpired, forceLogout } = get();
        
        if (!token) {
          return false;
        }

        // ✅ Check local expiry first
        if (isTokenExpired()) {
          forceLogout('Token expired locally');
          return false;
        }

        try {
          const response = await fetch("http://localhost:3000/api/auth/me", {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              return true;
            }
          }
          
          // ✅ Token invalid on server
          if (response.status === 401) {
            forceLogout('Invalid token');
          } else {
            forceLogout('Token verification failed');
          }
          return false;
          
        } catch (error) {
          console.error('Token verification failed:', error);
          forceLogout('Network error during token verification');
          return false;
        }
      },

      // ✅ Initialize auth state (call on app load)
      initializeAuth: async () => {
        const { token, isAuthenticated, isTokenExpired, forceLogout, startTokenExpiryCheck } = get();
        
        if (isAuthenticated && token) {
          if (isTokenExpired()) {
            forceLogout('Token expired on app load');
            return false;
          }
          
          // ✅ Verify token with server
          const isValid = await get().verifyToken();
          if (isValid) {
            // ✅ Start monitoring if token is valid
            startTokenExpiryCheck();
            return true;
          }
          return false;
        }
        
        return false;
      },

      // ✅ API call helper with automatic token handling
      apiCall: async (url, options = {}) => {
        const { token, isTokenExpired, forceLogout, isAuthenticated } = get();
        
        if (!isAuthenticated || !token) {
          throw new Error('Not authenticated');
        }
        
        if (isTokenExpired()) {
          forceLogout('Token expired during API call');
          throw new Error('Token expired');
        }
        
        // ✅ Add auth header
        const headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...options.headers
        };
        
        try {
          const response = await fetch(url, {
            ...options,
            headers
          });
          
          // ✅ Handle 401 responses automatically
          if (response.status === 401) {
            forceLogout('Unauthorized - token invalid');
            throw new Error('Unauthorized');
          }
          
          return response;
          
        } catch (error) {
          if (error.message.includes('Unauthorized') || error.message.includes('401')) {
            forceLogout('API call unauthorized');
          }
          throw error;
        }
      },

      // Role checking functions (unchanged)
      hasRole: (requiredRole) => {
        const { user } = get();
        return user?.role === requiredRole;
      },

      hasAnyRole: (roles) => {
        const { user } = get();
        return roles.includes(user?.role);
      },

      isAdmin: () => {
        const { user } = get();
        return user?.role === 'Super Admin';
      },

      isAdministrativeApprover: () => {
        const { user } = get();
        return user?.role === 'Administrative Approver';
      },

      isTechnicalApprover: () => {
        const { user } = get();
        return user?.role === 'Technical Approver';
      },

      isEngineer: () => {
        const { user } = get();
        return user?.role === 'Engineer';
      },

      isTenderManager: () => {
        const { user } = get();
        return user?.role === 'Tender Manager';
      },

      isWorkOrderManager: () => {
        const { user } = get();
        return user?.role === 'Work Order Manager';
      },

      isUser: () => {
        const { user } = get();
        return user?.role === 'User';
      },

      // Page access control (unchanged)
      canAccessPage: (pageName) => {
        const { user } = get();
        if (!user || !user.role) return false;
        
        const allowedPages = ROLE_PERMISSIONS[user.role] || [];
        return allowedPages.includes(pageName);
      },

      getAllowedPages: () => {
        const { user } = get();
        if (!user || !user.role) return [];
        
        return ROLE_PERMISSIONS[user.role] || [];
      },

      getUserPermissions: () => {
        const { user } = get();
        if (!user) return null;

        return {
          role: user.role,
          allowedPages: ROLE_PERMISSIONS[user.role] || [],
          canAccessTechnicalApproval: ROLE_PERMISSIONS[user.role]?.includes('technical-approval'),
          canAccessAdministrativeApproval: ROLE_PERMISSIONS[user.role]?.includes('administrative-approval'),
          canAccessWorkProgress: ROLE_PERMISSIONS[user.role]?.includes('work-progress'),
          canAccessTender: ROLE_PERMISSIONS[user.role]?.includes('tender'),
          canAccessWorkOrder: ROLE_PERMISSIONS[user.role]?.includes('work-order'),
          canAccessWork: ROLE_PERMISSIONS[user.role]?.includes('work'),
          isFullAdmin: user.role === 'Super Admin'
        };
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'nirman-auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        tokenExpiry: state.tokenExpiry, // ✅ Persist token expiry
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;
