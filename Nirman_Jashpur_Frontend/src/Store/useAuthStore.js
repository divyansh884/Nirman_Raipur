// stores/useAuthStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
            throw new Error(data.message || 'Login failed');
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
            throw new Error('Invalid login response');
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

      // Helper functions for role checking
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
        return user?.role === 'Admin' || user?.role === 'Super Admin';
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
          
          // Token is invalid, logout user
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
      name: 'auth-storage', // Storage key
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }), // Only persist these fields
    }
  )
);

export default useAuthStore;
