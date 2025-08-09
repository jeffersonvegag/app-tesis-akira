// Tipos de usuario y roles
export interface User {
  user_id: number;
  user_username: string;
  person_id: number;
  user_role: number;
  user_status: string;
  user_created_at: string;
  person: Person;
  role: Role;
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

// Tipos para capacitaciones
export interface Training {
  training_id: number;
  training_name: string;
  training_description?: string;
  training_status: string;
  training_created_at: string;
}

export interface TrainingCreateForm {
  training_name: string;
  training_description?: string;
}

export interface TrainingTechnology {
  training_technology_id: number;
  training_id: number;
  technology_id: number;
  training: Training;
  technology: Technology;
}

// Tipos para asignación de capacitaciones a usuarios
export interface UserTrainingAssignment {
  assignment_id: number;
  user_id: number;
  training_id: number;
  instructor_id?: number;
  assignment_status: string; // 'assigned', 'in_progress', 'completed'
  assignment_created_at: string;
  completion_percentage: number;
  instructor_meeting_link?: string;
  user: User;
  training: Training;
  instructor?: User;
}

export interface UserTrainingAssignmentCreateForm {
  user_id: number;
  training_id: number;
  instructor_id?: number;
  instructor_meeting_link?: string;
}

// Tipos para progreso de tecnologías por usuario
export interface UserTechnologyProgress {
  progress_id: number;
  assignment_id: number;
  technology_id: number;
  is_completed: boolean;
  completed_at?: string;
  created_at: string;
  technology: Technology;
}

export interface UserTechnologyProgressUpdateForm {
  is_completed: boolean;
}

// Tipos para estado de capacitaciones por usuario
export interface UserTrainingStatus {
  status_id: number;
  user_id: number;
  total_trainings_assigned: number;
  trainings_completed: number;
  trainings_in_progress: number;
  overall_status: string; // 'no_training', 'assigned', 'in_progress', 'all_completed'
  last_updated: string;
  created_at: string;
  user: User;
}

export interface UserTrainingStatusCreateForm {
  user_id: number;
  total_trainings_assigned?: number;
  trainings_completed?: number;
  trainings_in_progress?: number;
  overall_status?: string;
}

// Tipos para gestión de equipos
export interface Team {
  team_id: number;
  team_name: string;
  team_description?: string;
  supervisor_id: number;
  team_status: string;
  team_created_at: string;
  supervisor: User;
  team_members: TeamMember[];
}

export interface TeamMember {
  team_member_id: number;
  team_id: number;
  user_id: number;
  member_role: 'instructor' | 'client';
  member_status: string;
  joined_at: string;
  user: User;
}

export interface TeamCreateForm {
  team_name: string;
  team_description?: string;
  supervisor_id: number;
}

export interface TeamCreateWithMembersForm {
  team_name: string;
  team_description?: string;
  supervisor_id: number;
  instructors: number[];
  clients: number[];
}

export interface TeamUpdateForm {
  team_name?: string;
  team_description?: string;
  supervisor_id?: number;
}

export interface TeamMemberCreateForm {
  user_id: number;
  member_role: 'instructor' | 'client';
}

// Tipos para materiales de apoyo
export interface TrainingMaterial {
  material_id: number;
  training_id: number;
  instructor_id: number;
  material_title: string;
  material_description?: string;
  material_url: string;
  material_type: 'link' | 'document' | 'video';
  material_status: string;
  material_created_at: string;
  training: Training;
  instructor: User;
}

export interface TrainingMaterialCreateForm {
  training_id: number;
  material_title: string;
  material_description?: string;
  material_url: string;
  material_type: 'link' | 'document' | 'video';
}

export interface TrainingMaterialUpdateForm {
  material_title?: string;
  material_description?: string;
  material_url?: string;
  material_type?: 'link' | 'document' | 'video';
}

// Tipos para progreso de tecnologías
export interface UserTechnologyProgress {
  progress_id: number;
  assignment_id: number;
  technology_id: number;
  is_completed: 'Y' | 'N';
  completed_at?: string;
  created_at: string;
  assignment?: UserTrainingAssignment;
  technology: Technology;
}

export interface UserTechnologyProgressCreateForm {
  assignment_id: number;
  technology_id: number;
  is_completed: 'Y' | 'N';
}

export interface UserTechnologyProgressUpdateForm {
  is_completed: 'Y' | 'N';
}

// Tipos para progreso de materiales
export interface UserMaterialProgress {
  progress_id: number;
  user_id: number;
  material_id: number;
  assignment_id: number;
  is_completed: 'Y' | 'N';
  completed_at?: string;
  created_at: string;
  user: User;
  material: TrainingMaterial;
  assignment?: UserTrainingAssignment;
}

export interface UserMaterialProgressCreateForm {
  user_id: number;
  material_id: number;
  assignment_id: number;
  is_completed: 'Y' | 'N';
}

export interface UserMaterialProgressUpdateForm {
  is_completed: 'Y' | 'N';
}