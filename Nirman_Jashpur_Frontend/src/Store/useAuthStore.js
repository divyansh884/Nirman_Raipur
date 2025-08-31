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
    'profile'
  ],
  'Administrative Approver': [
    'dashboard',
    'administrative-approval',
    'reports',
    'profile'
  ],
  'Technical Approver': [
    'dashboard',
    'technical-approval',
    'reports',
    'profile'
  ],
  'User': [
    'dashboard',
    'work',
    'reports',
    'profile'
  ],
  'Engineer': [
    'dashboard',
    'work-progress',
    'reports',
     'profile'
  ],
  'Tender Manager': [
    'dashboard',
    'tender',
    'reports',
     'profile'
  ],
  'Work Order Manager': [
    'dashboard',
    'work-order',
    'reports',
     'profile'
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

      // Actions
      login: async (credentials) => {
        set({ isLoading: true, error: null });
        
        try {
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
          set({
            error: error.message,
            isLoading: false,
            isAuthLoading: false,
            isAuthenticated: false,
            user: null,
            token: null,
            tokenExpiry: null
          });
          throw error;
        }
      },

      // ✅ Enhanced logout with sessionStorage clearing
      logout: () => {
        const { tokenCheckInterval } = get();
        
        if (tokenCheckInterval) {
          clearInterval(tokenCheckInterval);
        }
        
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

        // ✅ Clear sessionStorage instead of localStorage
        sessionStorage.removeItem('nirman-auth-storage');
        
        console.log('🚪 User logged out - session storage cleared');
      },

      // ✅ Enhanced forceLogout with sessionStorage clearing
      forceLogout: (reason = 'Token expired') => {
        const { tokenCheckInterval } = get();
        
        if (tokenCheckInterval) {
          clearInterval(tokenCheckInterval);
        }
        
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

        // ✅ Clear sessionStorage instead of localStorage
        sessionStorage.removeItem('nirman-auth-storage');

        alert(`आपका सत्र समाप्त हो गया है। कृपया पुनः लॉगिन करें। (${reason})`);
        console.log(`🚪 Force logout: ${reason} - session storage cleared`);
        
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      },

      // Rest of your methods (isTokenExpired, startTokenExpiryCheck, verifyToken, etc.)
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
        }, 60000);
        
        set({ tokenCheckInterval: intervalId });
      },

      verifyToken: async () => {
        const { token, isTokenExpired, forceLogout } = get();
        
        if (!token) {
          return false;
        }

        if (isTokenExpired()) {
          forceLogout('Token expired locally');
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

      initializeAuth: async () => {
        set({ isAuthLoading: true });
        
        const { token, isTokenExpired, startTokenExpiryCheck } = get();
        
        if (!token) {
          set({ 
            isAuthLoading: false, 
            isAuthenticated: false 
          });
          return false;
        }
        
        if (isTokenExpired()) {
          sessionStorage.removeItem('nirman-auth-storage');
          set({ 
            isAuthLoading: false, 
            isAuthenticated: false,
            user: null,
            token: null,
            tokenExpiry: null
          });
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
            sessionStorage.removeItem('nirman-auth-storage');
            set({ 
              isAuthLoading: false, 
              isAuthenticated: false,
              user: null,
              token: null,
              tokenExpiry: null
            });
            return false;
          }
        } catch (error) {
          console.error('Auth initialization failed:', error);
          sessionStorage.removeItem('nirman-auth-storage');
          set({ 
            isAuthLoading: false, 
            isAuthenticated: false,
            user: null,
            token: null,
            tokenExpiry: null
          });
          return false;
        }
      },

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
      // ✅ KEY CHANGE: Use sessionStorage instead of localStorage
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        tokenExpiry: state.tokenExpiry,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;
