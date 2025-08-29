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
      isAuthenticated: false,
      isLoading: false,
      error: null,


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
            set({
              user: data.data.user,
              token: data.data.token,
              isAuthenticated: true,
              isLoading: false,
              error: null
            });
            
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
            token: null
          });
          throw error;
        }
      },


      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
          isLoading: false
        });
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


      // Page access control
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


      // Get user permissions summary
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


      // Verify token with backend
      verifyToken: async () => {
        const { token } = get();
        if (!token) return false;


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
          
          get().logout();
          return false;
        } catch (error) {
          console.error('Token verification failed:', error);
          get().logout();
          return false;
        }
      },


      clearError: () => set({ error: null }),
    }),
    {
      name: 'nirman-auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);


export default useAuthStore;
