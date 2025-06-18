import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthState, User, LoginRequest } from '@/types';
import { authService, userService } from '@/services/api';

interface AuthStore extends AuthState {
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  loadUserData: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (credentials: LoginRequest) => {
        try {
          const response = await authService.login(credentials);
          const token = 'fake-token'; // El backend no devuelve token, usamos uno fake por ahora
          
          // Obtener datos completos del usuario
          const userData = await userService.getUserById(response.user_id);
          
          localStorage.setItem('auth_token', token);
          localStorage.setItem('user_data', JSON.stringify(userData));
          
          set({
            user: userData,
            token,
            isAuthenticated: true,
          });
        } catch (error) {
          console.error('Error en login:', error);
          throw error;
        }
      },

      logout: () => {
        authService.logout();
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },

      loadUserData: async () => {
        const token = localStorage.getItem('auth_token');
        const userDataStr = localStorage.getItem('user_data');
        
        if (token && userDataStr) {
          try {
            const userData = JSON.parse(userDataStr);
            set({
              user: userData,
              token,
              isAuthenticated: true,
            });
          } catch (error) {
            console.error('Error cargando datos del usuario:', error);
            get().logout();
          }
        }
      },

      updateUser: (userData: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) {
          const updatedUser = { ...currentUser, ...userData };
          localStorage.setItem('user_data', JSON.stringify(updatedUser));
          set({ user: updatedUser });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);