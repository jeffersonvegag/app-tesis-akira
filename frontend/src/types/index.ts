// Tipos de usuario y roles
export interface User {
  user_id: number;
  user_username: string;
  person_id: number;
  user_role: number;
  user_position_id: number;
  user_status: string;
  user_created_at: string;
  person: Person;
  role: Role;
  position: UserPosition;
}

export interface Person {
  person_id: number;
  person_dni: number;
  person_first_name: string;
  person_last_name: string;
  person_gender: number;
  person_email: string;
  person_status: string;
  person_created_at: string;
  gender: Gender;
}

export interface Role {
  role_id: number;
  role_name: string;
  role_description: string;
  role_status: string;
  role_created_at: string;
}

export interface UserPosition {
  user_position_id: number;
  position_name: string;
  position_status: string;
  user_position_created_at: string;
}

export interface Gender {
  gender_id: number;
  gender_name: string;
  gender_status: string;
  gender_created_at: string;
}

// Tipos de cursos y capacitaciones
export interface Course {
  course_id: number;
  course_name: string;
  course_link: string;
  course_duration: string;
  technology_id?: number;
  course_modality_id?: number;
  course_credentials?: string;
  course_created_at: string;
  technology?: Technology;
  modality?: CourseModality;
}

export interface Technology {
  technology_id: number;
  technology_name: string;
  technology_created_at: string;
}

export interface CourseModality {
  course_modality_id: number;
  course_modality_name: string;
  course_modality_created_at: string;
}

export interface CareerPlan {
  career_plan_id: number;
  course_id: number;
  course: Course;
}

export interface UserCareerPlan {
  user_career_plan_id: number;
  user_id: number;
  career_plan_id: number;
  career_plan_status: string;
  user_career_plan_created_at: string;
  user: User;
  career_plan: CareerPlan;
}

// Tipos de autenticación
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  user_id: number;
  role_id: number;
  username: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

// Tipos de formularios
export interface UserCreateForm {
  user_username: string;
  user_password: string;
  person_id: number;
  user_role: number;
  user_position_id: number;
}

export interface PersonCreateForm {
  person_dni: number;
  person_first_name: string;
  person_last_name: string;
  person_gender: number;
  person_email: string;
}

export interface CourseCreateForm {
  course_name: string;
  course_link: string;
  course_duration: string;
  technology_id?: number;
  course_modality_id?: number;
  course_credentials?: string;
  instructor_ids?: number[];  // ← Agregar
  client_ids?: number[];      // ← Agregar
}

// Tipos de roles del sistema (según el documento)
export enum UserRoles {
  ADMIN = 1,
  SUPERVISOR = 2,
  CLIENT = 3,
  INSTRUCTOR = 4,
}

// Estados de cursos
export enum CourseStatus {
  PENDING = 'P',
  IN_PROGRESS = 'E',
  COMPLETED = 'C',
  CANCELLED = 'X',
}

// Tipos para Power BI
export interface PowerBIReport {
  reportId: string;
  reportName: string;
  embedUrl: string;
  accessToken: string;
}

export interface DashboardMetrics {
  totalEmployees: number;
  completedCoursesPercentage: number;
  popularCourses: Course[];
  employeeProgress: UserProgress[];
}

export interface UserProgress {
  user: User;
  totalCourses: number;
  completedCourses: number;
  inProgressCourses: number;
  progressPercentage: number;
}

export interface CourseAssignment {
  course_assignment_id: number;
  course_id: number;
  client_id: number;
  instructor_id?: number;
  assignment_status: string;
  assignment_created_at: string;
  assignment_start_date?: string;
  assignment_end_date?: string;
  course: Course;
  client: User;
  instructor?: User;
}

export interface CourseAssignmentCreateForm {
  course_id: number;
  client_id: number;
  instructor_id?: number;
  assignment_status?: string;
  assignment_start_date?: string;
  assignment_end_date?: string;
}