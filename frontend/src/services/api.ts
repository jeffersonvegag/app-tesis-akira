import axios from 'axios';
import {
  User,
  Person,
  Course,
  CareerPlan,
  UserCareerPlan,
  LoginRequest,
  LoginResponse,
  UserCreateForm,
  PersonCreateForm,
  CourseCreateForm,
  Role,
  Technology,
  CourseModality,
  // UserPosition, // Comentar hasta que lo definas
  Gender,
  CourseAssignment,
  CourseAssignmentCreateForm,
  Training,
  Team,
  TeamMember,
  TeamCreateWithMembersForm,
  TeamUpdateForm,
  TeamMemberCreateForm,
  TrainingMaterial,
  TrainingMaterialCreateForm,
  TrainingMaterialUpdateForm,
  TrainingCreateForm,
  // TrainingTechnology, // Comentar si no lo usas
  UserTrainingAssignment,
  UserTrainingAssignmentCreateForm,
  UserTechnologyProgress,
  UserTechnologyProgressCreateForm,
  UserTechnologyProgressUpdateForm,
  UserMaterialProgress,
  UserMaterialProgressCreateForm,
  UserMaterialProgressUpdateForm,
  UserTrainingStatus,
  // UserTrainingStatusCreateForm, // Comentar si no lo usas
} from '@/types';

console.log('🔍 DEBUG API Configuration:');
console.log('- import.meta:', import.meta);
console.log('- import.meta.env:', (import.meta as any).env);
console.log('- VITE_API_URL:', (import.meta as any).env?.VITE_API_URL);

const API_BASE_URL = 'https://app-tesis-akira.onrender.com'; // Hardcoded temporal

console.log('- API_BASE_URL final:', API_BASE_URL);

console.log('🔗 Frontend conectando a backend:', API_BASE_URL); // Para debug
console.log('🔍 Variables de entorno:');
console.log('- import.meta.env:', import.meta);
console.log('- VITE_API_URL:', (import.meta as any).env?.VITE_API_URL);
console.log('- API_BASE_URL final:', API_BASE_URL);
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token de autenticación
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log('📤 Request:', config.method?.toUpperCase(), config.url); // Debug
  return config;
});

// Interceptor para manejar errores de autenticación
api.interceptors.response.use(
  (response) => {
    console.log('📥 Response:', response.status, response.config.url); // Debug
    return response;
  },
  (error) => {
    console.error('❌ Error:', error.response?.status, error.config?.url); // Debug
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Servicios de autenticación - ✅ AGREGAR /api/v1 A LAS RUTAS
export const authService = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post('/api/v1/auth/login', credentials);
    return response.data;
  },
  
  logout: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
  },
};

// ✅ ACTUALIZAR TODAS LAS RUTAS PARA INCLUIR /api/v1
export const userService = {
  getUsers: async (skip = 0, limit = 100): Promise<User[]> => {
    const response = await api.get(`/api/v1/users?skip=${skip}&limit=${limit}`);
    return response.data;
  },
  
  getUserById: async (id: number): Promise<User> => {
    const response = await api.get(`/api/v1/users/${id}`);
    return response.data;
  },
  
  createUser: async (userData: UserCreateForm): Promise<User> => {
    const response = await api.post('/api/v1/users', userData);
    return response.data;
  },
  
  updateUser: async (id: number, userData: UserCreateForm): Promise<User> => {
    const response = await api.put(`/api/v1/users/${id}`, userData);
    return response.data;
  },
  
  deleteUser: async (id: number): Promise<void> => {
    await api.delete(`/api/v1/users/${id}`);
  },
};

// ✅ Y así con TODOS los servicios... (continúa igual pero agregando /api/v1)
