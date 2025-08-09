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
  UserPosition,
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
  TrainingTechnology,
  UserTrainingAssignment,
  UserTrainingAssignmentCreateForm,
  UserTechnologyProgress,
  UserTechnologyProgressCreateForm,
  UserTechnologyProgressUpdateForm,
  UserMaterialProgress,
  UserMaterialProgressCreateForm,
  UserMaterialProgressUpdateForm,
  UserTrainingStatus,
  UserTrainingStatusCreateForm,
} from '@/types';

console.log('🔍 DEBUG API Configuration:');
console.log('- import.meta:', import.meta);
console.log('- import.meta.env:', (import.meta as any).env);
console.log('- VITE_API_URL:', (import.meta as any).env?.VITE_API_URL);

const API_BASE_URL = 'https://app-tesis-akira.onrender.com'; // Hardcoded temporal

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
  return config;
});

// Interceptor para manejar errores de autenticación
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Servicios de autenticación
export const authService = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },
  
  logout: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
  },
};

// Servicios de usuarios
export const userService = {
  getUsers: async (skip = 0, limit = 100): Promise<User[]> => {
    const response = await api.get(`/users?skip=${skip}&limit=${limit}`);
    return response.data;
  },
  
  getUserById: async (id: number): Promise<User> => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },
  
  createUser: async (userData: UserCreateForm): Promise<User> => {
    const response = await api.post('/users', userData);
    return response.data;
  },
  
  updateUser: async (id: number, userData: UserCreateForm): Promise<User> => {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  },
  
  deleteUser: async (id: number): Promise<void> => {
    await api.delete(`/users/${id}`);
  },
};

// Servicios de personas
export const personService = {
  getPersons: async (skip = 0, limit = 100): Promise<Person[]> => {
    const response = await api.get(`/persons?skip=${skip}&limit=${limit}`);
    return response.data;
  },
  
  createPerson: async (personData: PersonCreateForm): Promise<Person> => {
    const response = await api.post('/persons', personData);
    return response.data;
  },
};

// Servicios de cursos
export const courseService = {
  getCourses: async (skip = 0, limit = 100): Promise<Course[]> => {
    const response = await api.get(`/courses?skip=${skip}&limit=${limit}`);
    return response.data;
  },
  
  getCourseById: async (id: number): Promise<Course> => {
    const response = await api.get(`/courses/${id}`);
    return response.data;
  },
  
  createCourse: async (courseData: CourseCreateForm): Promise<Course> => {
    const response = await api.post('/courses', courseData);
    return response.data;
  },
  
  updateCourse: async (id: number, courseData: CourseCreateForm): Promise<Course> => {
    const response = await api.put(`/courses/${id}`, courseData);
    return response.data;
  },
  
  deleteCourse: async (id: number): Promise<void> => {
    await api.delete(`/courses/${id}`);
  },
};

// Servicios de planes de carrera
export const careerPlanService = {
  getCareerPlans: async (skip = 0, limit = 100): Promise<CareerPlan[]> => {
    const response = await api.get(`/career-plans?skip=${skip}&limit=${limit}`);
    return response.data;
  },
  
  getCareerPlanById: async (id: number): Promise<CareerPlan> => {
    const response = await api.get(`/career-plans/${id}`);
    return response.data;
  },
  
  createCareerPlan: async (planData: { course_id: number }): Promise<CareerPlan> => {
    const response = await api.post('/career-plans', planData);
    return response.data;
  },
};

// Servicios de asignaciones de planes de carrera
export const userCareerPlanService = {
  getUserCareerPlans: async (skip = 0, limit = 100): Promise<UserCareerPlan[]> => {
    const response = await api.get(`/user-career-plans?skip=${skip}&limit=${limit}`);
    return response.data;
  },
  
  getUserCareerPlansByUserId: async (userId: number): Promise<UserCareerPlan[]> => {
    const response = await api.get(`/user-career-plans/user/${userId}`);
    return response.data;
  },
  
  createUserCareerPlan: async (assignmentData: {
    user_id: number;
    career_plan_id: number;
  }): Promise<UserCareerPlan> => {
    const response = await api.post('/user-career-plans', assignmentData);
    return response.data;
  },
};

// Servicios de catálogos
export const catalogService = {
  getRoles: async (): Promise<Role[]> => {
    const response = await api.get('/roles');
    return response.data;
  },
  
  getTechnologies: async (): Promise<Technology[]> => {
    const response = await api.get('/technologies');
    return response.data;
  },
  
  getModalities: async (): Promise<CourseModality[]> => {
    const response = await api.get('/modalities');
    return response.data;
  },
  
  getPositions: async (): Promise<any[]> => {
    const response = await api.get('/positions');
    return response.data;
  },
  
  getGenders: async (): Promise<Gender[]> => {
    const response = await api.get('/genders');
    return response.data;
  },
  
  createRole: async (roleData: { role_name: string; role_description: string }): Promise<Role> => {
    const response = await api.post('/roles', roleData);
    return response.data;
  },
  
  createTechnology: async (techData: { technology_name: string }): Promise<Technology> => {
    const response = await api.post('/technologies', techData);
    return response.data;
  },
  
  createModality: async (modalityData: { course_modality_name: string }): Promise<CourseModality> => {
    const response = await api.post('/modalities', modalityData);
    return response.data;
  },
  
  createPosition: async (positionData: { position_name: string }): Promise<any> => {
    const response = await api.post('/positions', positionData);
    return response.data;
  },
  
  createGender: async (genderData: { gender_name: string }): Promise<Gender> => {
    const response = await api.post('/genders', genderData);
    return response.data;
  },
};
// Servicios de asignaciones de cursos
export const courseAssignmentService = {
  // Obtener todas las asignaciones
  getCourseAssignments: async (skip = 0, limit = 100): Promise<CourseAssignment[]> => {
    const response = await api.get(`/course-assignments?skip=${skip}&limit=${limit}`);
    return response.data;
  },

  // Obtener asignación por ID
  getCourseAssignmentById: async (id: number): Promise<CourseAssignment> => {
    const response = await api.get(`/course-assignments/${id}`);
    return response.data;
  },

  // Crear nueva asignación
  createCourseAssignment: async (assignmentData: CourseAssignmentCreateForm): Promise<CourseAssignment> => {
    const response = await api.post('/course-assignments', assignmentData);
    return response.data;
  },

  // Actualizar asignación
  updateCourseAssignment: async (id: number, assignmentData: CourseAssignmentCreateForm): Promise<CourseAssignment> => {
    const response = await api.put(`/course-assignments/${id}`, assignmentData);
    return response.data;
  },

  // Eliminar asignación
  deleteCourseAssignment: async (id: number): Promise<void> => {
    await api.delete(`/course-assignments/${id}`);
  },

  // Obtener asignaciones por usuario (cliente)
  getCourseAssignmentsByUser: async (userId: number): Promise<CourseAssignment[]> => {
    const response = await api.get(`/course-assignments/user/${userId}`);
    return response.data;
  },

  // Obtener asignaciones por instructor
  getCourseAssignmentsByInstructor: async (instructorId: number): Promise<CourseAssignment[]> => {
    const response = await api.get(`/course-assignments/instructor/${instructorId}`);
    return response.data;
  },
};

// Servicios de capacitaciones
export const trainingService = {
  // Obtener todas las capacitaciones
  getTrainings: async (skip = 0, limit = 100): Promise<Training[]> => {
    const response = await api.get(`/trainings?skip=${skip}&limit=${limit}`);
    return response.data;
  },

  // Obtener capacitación por ID
  getTrainingById: async (id: number): Promise<Training> => {
    const response = await api.get(`/trainings/${id}`);
    return response.data;
  },

  // Crear nueva capacitación
  createTraining: async (trainingData: TrainingCreateForm): Promise<Training> => {
    const response = await api.post('/trainings', trainingData);
    return response.data;
  },

  // Obtener tecnologías de una capacitación
  getTrainingTechnologies: async (trainingId: number): Promise<Technology[]> => {
    const response = await api.get(`/trainings/${trainingId}/technologies`);
    return response.data;
  },
};

// Servicios de asignaciones de capacitaciones
export const userTrainingAssignmentService = {
  // Obtener todas las asignaciones
  getAssignments: async (skip = 0, limit = 100): Promise<UserTrainingAssignment[]> => {
    const response = await api.get(`/user-training-assignments?skip=${skip}&limit=${limit}`);
    return response.data;
  },

  // Obtener asignaciones por usuario
  getAssignmentsByUser: async (userId: number): Promise<UserTrainingAssignment[]> => {
    const response = await api.get(`/user-training-assignments/user/${userId}`);
    return response.data;
  },

  // Crear nueva asignación
  createAssignment: async (assignmentData: UserTrainingAssignmentCreateForm): Promise<UserTrainingAssignment> => {
    const response = await api.post('/user-training-assignments', assignmentData);
    return response.data;
  },

  // Actualizar enlace de reunión del instructor
  updateMeetingLink: async (assignmentId: number, meetingLink: string): Promise<UserTrainingAssignment> => {
    const response = await api.put(`/user-training-assignments/${assignmentId}/meeting-link`, {
      instructor_meeting_link: meetingLink
    });
    return response.data;
  },

  // Actualizar instructor de capacitación
  updateTrainingInstructor: async (trainingId: number, instructorId?: number): Promise<any> => {
    const response = await api.put(`/user-training-assignments/training/${trainingId}/instructor`, {
      instructor_id: instructorId
    });
    return response.data;
  },
};

// Servicios de progreso de tecnologías
export const userTechnologyProgressService = {
  // Obtener progreso por asignación
  getProgressByAssignment: async (assignmentId: number): Promise<UserTechnologyProgress[]> => {
    const response = await api.get(`/user-technology-progress/assignment/${assignmentId}`);
    return response.data;
  },

  // Actualizar progreso de una tecnología
  updateProgress: async (progressId: number, progressData: UserTechnologyProgressUpdateForm): Promise<UserTechnologyProgress> => {
    const response = await api.put(`/user-technology-progress/${progressId}`, progressData);
    return response.data;
  },
};

// Servicios de estado de capacitaciones por usuario
export const userTrainingStatusService = {
  // Obtener todos los estados
  getStatuses: async (skip = 0, limit = 100): Promise<UserTrainingStatus[]> => {
    const response = await api.get(`/user-training-status?skip=${skip}&limit=${limit}`);
    return response.data;
  },

  // Obtener estado por usuario
  getStatusByUser: async (userId: number): Promise<UserTrainingStatus> => {
    const response = await api.get(`/user-training-status/user/${userId}`);
    return response.data;
  },

  // Actualizar estado del usuario
  refreshStatus: async (userId: number): Promise<UserTrainingStatus> => {
    const response = await api.put(`/user-training-status/refresh/${userId}`);
    return response.data;
  },
};

// Servicios de gestión de equipos
export const teamService = {
  // Obtener todos los equipos
  getTeams: async (): Promise<Team[]> => {
    const response = await api.get('/teams');
    return response.data;
  },

  // Obtener equipo por ID
  getTeam: async (teamId: number): Promise<Team> => {
    const response = await api.get(`/teams/${teamId}`);
    return response.data;
  },

  // Obtener equipos por supervisor
  getTeamsBySupervisor: async (supervisorId: number): Promise<Team[]> => {
    const response = await api.get(`/teams/supervisor/${supervisorId}`);
    return response.data;
  },

  // Crear nuevo equipo con miembros
  createTeam: async (teamData: TeamCreateWithMembersForm): Promise<Team> => {
    const response = await api.post('/teams', teamData);
    return response.data;
  },

  // Actualizar equipo
  updateTeam: async (teamId: number, teamData: TeamUpdateForm): Promise<Team> => {
    const response = await api.put(`/teams/${teamId}`, teamData);
    return response.data;
  },

  // Eliminar equipo
  deleteTeam: async (teamId: number): Promise<void> => {
    await api.delete(`/teams/${teamId}`);
  },

  // Agregar miembro al equipo
  addTeamMember: async (teamId: number, memberData: TeamMemberCreateForm): Promise<TeamMember> => {
    const response = await api.post(`/teams/${teamId}/members`, memberData);
    return response.data;
  },

  // Remover miembro del equipo
  removeTeamMember: async (teamId: number, memberId: number): Promise<void> => {
    await api.delete(`/teams/${teamId}/members/${memberId}`);
  },

  // Asignar capacitación a todo el equipo
  assignTrainingToTeam: async (teamId: number, trainingId: number, instructorId?: number): Promise<any> => {
    const response = await api.post(`/teams/${teamId}/assign-training`, {
      training_id: trainingId,
      instructor_id: instructorId,
    });
    return response.data;
  },

  // Asignar capacitación a clientes específicos del equipo
  assignTrainingToSpecificClients: async (teamId: number, trainingId: number, clientIds: number[], instructorId?: number): Promise<any> => {
    const response = await api.post(`/teams/${teamId}/assign-training-to-clients`, {
      training_id: trainingId,
      client_ids: clientIds,
      instructor_id: instructorId,
    });
    return response.data;
  },
};

// Servicios de materiales de apoyo
export const trainingMaterialService = {
  // Obtener materiales con filtros
  getMaterials: async (instructorId?: number, trainingId?: number): Promise<TrainingMaterial[]> => {
    const params = new URLSearchParams();
    if (instructorId) params.append('instructor_id', instructorId.toString());
    if (trainingId) params.append('training_id', trainingId.toString());
    
    const response = await api.get(`/training-materials?${params.toString()}`);
    return response.data;
  },

  // Obtener material por ID
  getMaterial: async (materialId: number): Promise<TrainingMaterial> => {
    const response = await api.get(`/training-materials/${materialId}`);
    return response.data;
  },

  // Crear nuevo material
  createMaterial: async (materialData: TrainingMaterialCreateForm, instructorId: number): Promise<TrainingMaterial> => {
    const response = await api.post(`/training-materials?instructor_id=${instructorId}`, materialData);
    return response.data;
  },

  // Actualizar material
  updateMaterial: async (materialId: number, materialData: TrainingMaterialUpdateForm, instructorId: number): Promise<TrainingMaterial> => {
    const response = await api.put(`/training-materials/${materialId}?instructor_id=${instructorId}`, materialData);
    return response.data;
  },

  // Eliminar material
  deleteMaterial: async (materialId: number, instructorId: number): Promise<void> => {
    await api.delete(`/training-materials/${materialId}?instructor_id=${instructorId}`);
  },

  // Obtener capacitaciones asignadas a un instructor
  getInstructorAssignedTrainings: async (instructorId: number): Promise<Training[]> => {
    const response = await api.get(`/instructors/${instructorId}/assigned-trainings`);
    return response.data;
  },
};

// Servicios de progreso de tecnologías
export const technologyProgressService = {
  // Obtener progreso por asignación
  getProgressByAssignment: async (assignmentId: number): Promise<UserTechnologyProgress[]> => {
    const response = await api.get(`/user-technology-progress/assignment/${assignmentId}`);
    return response.data;
  },

  // Crear o actualizar progreso
  createProgress: async (progressData: UserTechnologyProgressCreateForm): Promise<UserTechnologyProgress> => {
    const response = await api.post('/user-technology-progress', progressData);
    return response.data;
  },

  // Actualizar progreso por ID
  updateProgress: async (progressId: number, progressData: UserTechnologyProgressUpdateForm): Promise<UserTechnologyProgress> => {
    const response = await api.put(`/user-technology-progress/${progressId}`, progressData);
    return response.data;
  },
};

// Servicios de progreso de materiales
export const materialProgressService = {
  // Obtener progreso por asignación
  getProgressByAssignment: async (assignmentId: number): Promise<UserMaterialProgress[]> => {
    const response = await api.get(`/user-material-progress/assignment/${assignmentId}`);
    return response.data;
  },

  // Crear o actualizar progreso
  createProgress: async (progressData: UserMaterialProgressCreateForm): Promise<UserMaterialProgress> => {
    const response = await api.post('/user-material-progress', progressData);
    return response.data;
  },

  // Actualizar progreso por ID
  updateProgress: async (progressId: number, progressData: UserMaterialProgressUpdateForm): Promise<UserMaterialProgress> => {
    const response = await api.put(`/user-material-progress/${progressId}`, progressData);
    return response.data;
  },
};

export default api;
