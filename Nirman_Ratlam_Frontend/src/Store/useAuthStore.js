import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { BASE_SERVER_URL } from '../constants.jsx';

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
    'profile',
    'map'
  ],
  'Administrative Approver': [
    'dashboard',
    'administrative-approval',
    'reports',
    'profile',
    'map'
  ],
  'Technical Approver': [
    'dashboard',
    'technical-approval',
    'reports',
    'profile',
    'map'
  ],
  'User': [
    'dashboard',
    'work',
    'reports',
    'profile',
    'map'
  ],
  'Engineer': [
    'dashboard',
    'work-progress',
    'reports',
    'profile',
    'map'
  ],
  'Tender Manager': [
    'dashboard',
    'tender',
    'reports',
    'profile',
    'map'
  ],
  'Work Order Manager': [
    'dashboard',
    'work-order',
    'reports',
    'profile',
    'map'
  ]
};

const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      token: null,
      tokenExpiry: null,
      isAuthenticated: false,
      isAuthLoading: true,
      isLoading: false,
      error: null,
      tokenCheckInterval: null,

      // Helper function to completely clear auth state and storage
      clearAuthState: () => {
        const { tokenCheckInterval } = get();
        
        if (tokenCheckInterval) {
          clearInterval(tokenCheckInterval);
        }
        
        // Clear sessionStorage first
        try {
          sessionStorage.removeItem('nirman-auth-storage');
        } catch (error) {
          console.warn('Error clearing sessionStorage:', error);
        }
        
        // Reset state
        set({
          user: null,
          token: null,
          tokenExpiry: null,
          isAuthenticated: false,
          isAuthLoading: false,
          error: null,
          isLoading: false,
          tokenCheckInterval: null
        });
      },

      // Actions
      login: async (credentials) => {
        set({ isLoading: true, error: null });
        
        try {
          // ✅ IMPORTANT: Clear any existing auth data first
          get().clearAuthState();
          
          const response = await fetch(`${BASE_SERVER_URL}/auth/login`, {
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
            const tokenExpiry = data.data.expiresAt 
              ? new Date(data.data.expiresAt).getTime()
              : Date.now() + (24 * 60 * 60 * 1000);

            set({
              user: data.data.user,
              token: data.data.token,
              tokenExpiry: tokenExpiry,
              isAuthenticated: true,
              isAuthLoading: false,
              isLoading: false,
              error: null
            });
            
            get().startTokenExpiryCheck();
            
            return { success: true, data: data.data };
          } else {
            throw new Error('❌ अमान्य लॉगिन प्रतिक्रिया');
          }
        } catch (error) {
          // Clear state on login error
          get().clearAuthState();
          set({
            error: error.message,
            isLoading: false,
            isAuthLoading: false,
          });
          throw error;
        }
      },

      // ✅ Enhanced logout
      logout: () => {
        get().clearAuthState();
        console.log('🚪 User logged out - session storage cleared');
      },

      // ✅ Enhanced forceLogout
      forceLogout: (reason = 'Token expired') => {
        get().clearAuthState();
        
        alert(`आपका सत्र समाप्त हो गया है। कृपया पुनः लॉगिन करें। (${reason})`);
        console.log(`🚪 Force logout: ${reason} - session storage cleared`);
        
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      },

      // Token expiry check
      isTokenExpired: () => {
        const { tokenExpiry } = get();
        if (!tokenExpiry) return true;
        return Date.now() > tokenExpiry;
      },

      startTokenExpiryCheck: () => {
        const { tokenCheckInterval } = get();
        
        if (tokenCheckInterval) {
          clearInterval(tokenCheckInterval);
        }
        
        const intervalId = setInterval(() => {
          const { isAuthenticated, token, isTokenExpired, forceLogout } = get();
          
          if (isAuthenticated && token) {
            if (isTokenExpired()) {
              forceLogout('Token expired');
            }
          }
        }, 60000); // Check every minute
        
        set({ tokenCheckInterval: intervalId });
      },

      // ✅ Improved token verification
      verifyToken: async () => {
        const { token, isTokenExpired, clearAuthState } = get();
        
        if (!token) {
          clearAuthState();
          return false;
        }

        if (isTokenExpired()) {
          clearAuthState();
          return false;
        }

        try {
          const response = await fetch(`${BASE_SERVER_URL}/auth/me`, {
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
          
          // Any non-200 response means token is invalid
          console.warn(`Token verification failed with status: ${response.status}`);
          clearAuthState();
          return false;
          
        } catch (error) {
          console.error('Token verification network error:', error);
          clearAuthState();
          return false;
        }
      },

      // ✅ Improved initialization
      initializeAuth: async () => {
        set({ isAuthLoading: true });
        
        const { token, user, isTokenExpired, startTokenExpiryCheck, clearAuthState } = get();
        
        // If no token or user data, clear everything
        if (!token || !user) {
          clearAuthState();
          set({ isAuthLoading: false });
          return false;
        }
        
        // If token is expired locally, clear everything
        if (isTokenExpired()) {
          clearAuthState();
          set({ isAuthLoading: false });
          return false;
        }
        
        try {
          const isValid = await get().verifyToken();
          if (isValid) {
            set({ 
              isAuthLoading: false, 
              isAuthenticated: true 
            });
            startTokenExpiryCheck();
            return true;
          } else {
            clearAuthState();
            set({ isAuthLoading: false });
            return false;
          }
        } catch (error) {
          console.error('Auth initialization failed:', error);
          clearAuthState();
          set({ isAuthLoading: false });
          return false;
        }
      },

      // ✅ Improved API call method
      apiCall: async (url, options = {}) => {
        const { token, isTokenExpired, forceLogout, isAuthenticated } = get();
        
        if (!isAuthenticated || !token) {
          throw new Error('Not authenticated');
        }
        
        if (isTokenExpired()) {
          forceLogout('Token expired during API call');
          throw new Error('Token expired');
        }
        
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
          
          // Handle authentication errors
          if (response.status === 401 || response.status === 403) {
            forceLogout('Unauthorized - token invalid');
            throw new Error('Unauthorized');
          }
          
          return response;
          
        } catch (error) {
          if (error.message.includes('Unauthorized') || 
              error.message.includes('401') || 
              error.message.includes('403')) {
            forceLogout('API call unauthorized');
          }
          throw error;
        }
      },

      // Role checking functions
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
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        tokenExpiry: state.tokenExpiry,
        isAuthenticated: state.isAuthenticated,
      }),
      // ✅ Add onRehydrateStorage to handle initialization
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Validate the rehydrated state
          const now = Date.now();
          if (!state.token || !state.user || (state.tokenExpiry && now > state.tokenExpiry)) {
            // Clear invalid state
            try {
              sessionStorage.removeItem('nirman-auth-storage');
            } catch (error) {
              console.warn('Error clearing sessionStorage on rehydrate:', error);
            }
            return {
              user: null,
              token: null,
              tokenExpiry: null,
              isAuthenticated: false,
              isAuthLoading: false,
              error: null,
              isLoading: false,
              tokenCheckInterval: null
            };
          }
        }
      },
    }
  )
);

export default useAuthStore;
