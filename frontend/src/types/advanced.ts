// Tipos actualizados para el sistema maduro
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
  client_level?: string; // Trainee, Junior, Semi-senior, Senior
  assigned_supervisor?: number; // ID del supervisor asignado
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
  level_required?: string; // Trainee, Junior, etc.
  area?: string; // Desarrollo, QA, Infraestructura
  client_type?: string; // General, Banco Guayaquil, etc.
}

// Nuevos tipos para el sistema avanzado
export interface ClassSession {
  session_id: number;
  course_id: number;
  instructor_id: number;
  session_date: string;
  session_time: string;
  session_link: string;
  session_description: string;
  recording_link?: string;
  created_at: string;
  course: Course;
  instructor: User;
}

export interface StudyMaterial {
  material_id: number;
  course_id: number;
  instructor_id: number;
  material_name: string;
  material_link: string;
  material_type: string; // "drive", "onedrive", "pdf", "video", etc.
  description?: string;
  created_at: string;
}

export interface UserCourseProgress {
  progress_id: number;
  user_id: number;
  course_id: number;
  status: 'assigned' | 'in_progress' | 'completed' | 'paused';
  progress_percentage: number;
  started_at?: string;
  completed_at?: string;
  assigned_by: number; // ID del supervisor que asignó
  course: Course;
  user: User;
}

export interface Attendance {
  attendance_id: number;
  session_id: number;
  user_id: number;
  attended: boolean;
  attendance_proof?: string; // Screenshot o evidencia
  marked_by: number; // ID del instructor
  created_at: string;
}

// Catálogos especializados
export interface CourseCategory {
  category_id: number;
  category_name: string; // "Desarrollo", "QA", "Infraestructura"
  description: string;
}

export interface ClientType {
  client_id: number;
  client_name: string; // "General", "Banco Guayaquil", "Banco Machala", etc.
  description: string;
}

export interface UserLevel {
  level_id: number;
  level_name: string; // "Trainee", "Junior", "Semi-senior", "Senior"
  description: string;
  order: number; // Para ordenar los niveles
}

// Tipos de roles actualizados
export enum UserRoles {
  ADMIN = 1,
  SUPERVISOR = 2,
  CLIENT = 3,
  INSTRUCTOR = 4,
}

// Estados de progreso
export enum ProgressStatus {
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  PAUSED = 'paused',
}

// Tipos para el calendario
export interface CalendarEvent {
  event_id: number;
  title: string;
  start: string;
  end: string;
  session_id?: number;
  instructor_id?: number;
  description?: string;
  link?: string;
}

// Asignaciones de supervisor a clientes
export interface SupervisorAssignment {
  assignment_id: number;
  supervisor_id: number;
  client_id: number;
  assigned_at: string;
  supervisor: User;
  client: User;
}

// Tipos para reportes específicos
export interface TeamProgress {
  supervisor_id: number;
  team_members: UserCourseProgress[];
  completion_rate: number;
  pending_courses: number;
  completed_courses: number;
}

export interface PersonalProgress {
  user_id: number;
  assigned_courses: number;
  completed_courses: number;
  in_progress_courses: number;
  completion_rate: number;
  level_progress: {
    current_level: string;
    next_level?: string;
    courses_for_next_level: number;
  };
}

// Formularios específicos
export interface CourseAssignmentForm {
  course_id: number;
  client_ids: number[];
  assigned_by: number;
  due_date?: string;
  priority: 'low' | 'medium' | 'high';
  notes?: string;
}

export interface SessionCreateForm {
  course_id: number;
  session_date: string;
  session_time: string;
  session_link: string;
  session_description: string;
  duration_minutes: number;
}

export interface MaterialUploadForm {
  course_id: number;
  material_name: string;
  material_link: string;
  material_type: string;
  description?: string;
}