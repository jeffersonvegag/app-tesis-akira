import React, { useState } from 'react';
import { ClientDashboard } from '@/components/client/ClientDashboard';
import { MaterialsManager } from '@/components/materials/MaterialsManager';
import { UserCourseProgress, ClassSession, StudyMaterial, MaterialUploadForm } from '@/types/advanced';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { BookOpen, Calendar, Download } from 'lucide-react';

export const ClientPage: React.FC = () => {
  // Estado de ejemplo - en implementación real vendría de APIs
  const [userProgress] = useState<UserCourseProgress[]>([
    {
      progress_id: 1,
      user_id: 1,
      course_id: 1,
      status: 'in_progress',
      progress_percentage: 65,
      started_at: '2025-06-10T10:00:00',
      assigned_by: 2,
      course: {
        course_id: 1,
        course_name: 'React Fundamentals - Desarrollo Frontend',
        course_link: 'https://example.com/react-course',
        course_duration: '40:00',
        area: 'Desarrollo',
        level_required: 'Junior',
        client_type: 'General',
        course_created_at: '2025-06-01T00:00:00'
      },
      user: {
        user_id: 1,
        user_username: 'cliente1',
        person_id: 1,
        user_role: 3,
        user_position_id: 1,
        user_status: 'A',
        user_created_at: '2025-06-01T00:00:00',
        person: {
          person_id: 1,
          person_dni: 1234567890,
          person_first_name: 'Juan',
          person_last_name: 'Pérez',
          person_gender: 1,
          person_email: 'juan@example.com',
          person_status: 'A',
          person_created_at: '2025-06-01T00:00:00',
          gender: {
            gender_id: 1,
            gender_name: 'Masculino',
            gender_status: 'A',
            gender_created_at: '2025-06-01T00:00:00'
          }
        },
        role: {
          role_id: 3,
          role_name: 'Cliente',
          role_description: 'Usuario final del sistema',
          role_status: 'A',
          role_created_at: '2025-06-01T00:00:00'
        },
        position: {
          user_position_id: 1,
          position_name: 'Desarrollador Frontend',
          position_status: 'A',
          user_position_created_at: '2025-06-01T00:00:00'
        },
        client_level: 'Junior'
      }
    },
    {
      progress_id: 2,
      user_id: 1,
      course_id: 2,
      status: 'completed',
      progress_percentage: 100,
      started_at: '2025-05-15T10:00:00',
      completed_at: '2025-06-05T16:00:00',
      assigned_by: 2,
      course: {
        course_id: 2,
        course_name: 'TypeScript Básico',
        course_link: 'https://example.com/typescript-course',
        course_duration: '25:00',
        area: 'Desarrollo',
        level_required: 'Junior',
        client_type: 'General',
        course_created_at: '2025-05-01T00:00:00'
      },
      user: {
        user_id: 1,
        user_username: 'cliente1',
        person_id: 1,
        user_role: 3,
        user_position_id: 1,
        user_status: 'A',
        user_created_at: '2025-06-01T00:00:00',
        person: {
          person_id: 1,
          person_dni: 1234567890,
          person_first_name: 'Juan',
          person_last_name: 'Pérez',
          person_gender: 1,
          person_email: 'juan@example.com',
          person_status: 'A',
          person_created_at: '2025-06-01T00:00:00',
          gender: {
            gender_id: 1,
            gender_name: 'Masculino',
            gender_status: 'A',
            gender_created_at: '2025-06-01T00:00:00'
          }
        },
        role: {
          role_id: 3,
          role_name: 'Cliente',
          role_description: 'Usuario final del sistema',
          role_status: 'A',
          role_created_at: '2025-06-01T00:00:00'
        },
        position: {
          user_position_id: 1,
          position_name: 'Desarrollador Frontend',
          position_status: 'A',
          user_position_created_at: '2025-06-01T00:00:00'
        },
        client_level: 'Junior'
      }
    }
  ]);

  const [todaySessions] = useState<ClassSession[]>([
    {
      session_id: 1,
      course_id: 1,
      instructor_id: 4,
      session_date: '2025-06-16',
      session_time: '10:00',
      session_link: 'https://meet.google.com/abc-defg-hij',
      session_description: 'Introducción a React Hooks - useState y useEffect',
      created_at: '2025-06-15T10:00:00',
      course: {
        course_id: 1,
        course_name: 'React Fundamentals',
        course_link: 'https://example.com/react-course',
        course_duration: '40:00',
        course_created_at: '2025-06-01T00:00:00'
      },
      instructor: {
        user_id: 4,
        user_username: 'instructor1',
        person_id: 4,
        user_role: 4,
        user_position_id: 2,
        user_status: 'A',
        user_created_at: '2025-06-01T00:00:00',
        person: {
          person_id: 4,
          person_dni: 1234567893,
          person_first_name: 'María',
          person_last_name: 'García',
          person_gender: 2,
          person_email: 'maria@example.com',
          person_status: 'A',
          person_created_at: '2025-06-01T00:00:00',
          gender: {
            gender_id: 2,
            gender_name: 'Femenino',
            gender_status: 'A',
            gender_created_at: '2025-06-01T00:00:00'
          }
        },
        role: {
          role_id: 4,
          role_name: 'Instructor',
          role_description: 'Docente profesional',
          role_status: 'A',
          role_created_at: '2025-06-01T00:00:00'
        },
        position: {
          user_position_id: 2,
          position_name: 'Instructor Senior',
          position_status: 'A',
          user_position_created_at: '2025-06-01T00:00:00'
        }
      }
    }
  ]);

  const [upcomingSessions] = useState<ClassSession[]>([
    {
      session_id: 2,
      course_id: 1,
      instructor_id: 4,
      session_date: '2025-06-18',
      session_time: '14:00',
      session_link: 'https://meet.google.com/xyz-uvwx-yzz',
      session_description: 'Componentes avanzados y props',
      created_at: '2025-06-15T10:00:00',
      course: {
        course_id: 1,
        course_name: 'React Fundamentals',
        course_link: 'https://example.com/react-course',
        course_duration: '40:00',
        course_created_at: '2025-06-01T00:00:00'
      },
      instructor: {
        user_id: 4,
        user_username: 'instructor1',
        person_id: 4,
        user_role: 4,
        user_position_id: 2,
        user_status: 'A',
        user_created_at: '2025-06-01T00:00:00',
        person: {
          person_id: 4,
          person_dni: 1234567893,
          person_first_name: 'María',
          person_last_name: 'García',
          person_gender: 2,
          person_email: 'maria@example.com',
          person_status: 'A',
          person_created_at: '2025-06-01T00:00:00',
          gender: {
            gender_id: 2,
            gender_name: 'Femenino',
            gender_status: 'A',
            gender_created_at: '2025-06-01T00:00:00'
          }
        },
        role: {
          role_id: 4,
          role_name: 'Instructor',
          role_description: 'Docente profesional',
          role_status: 'A',
          role_created_at: '2025-06-01T00:00:00'
        },
        position: {
          user_position_id: 2,
          position_name: 'Instructor Senior',
          position_status: 'A',
          user_position_created_at: '2025-06-01T00:00:00'
        }
      }
    }
  ]);

  const [materials] = useState<StudyMaterial[]>([
    {
      material_id: 1,
      course_id: 1,
      instructor_id: 4,
      material_name: 'Presentación React Básico',
      material_link: 'https://drive.google.com/file/d/example1',
      material_type: 'drive',
      description: 'Slides introductorios a React con ejemplos',
      created_at: '2025-06-15T10:00:00'
    },
    {
      material_id: 2,
      course_id: 1,
      instructor_id: 4,
      material_name: 'Documentación TypeScript',
      material_link: 'https://onedrive.live.com/example2',
      material_type: 'onedrive',
      description: 'Guía completa de TypeScript para principiantes',
      created_at: '2025-06-14T15:30:00'
    }
  ]);

  const [activeTab, setActiveTab] = useState<'dashboard' | 'materials' | 'calendar'>('dashboard');

  // Calcular estadísticas
  const completionRate = userProgress.length > 0 
    ? Math.round((userProgress.filter(p => p.status === 'completed').length / userProgress.length) * 100)
    : 0;

  const userLevel = 'Junior'; // En implementación real vendría del usuario actual

  // Función dummy para MaterialsManager (los clientes no pueden agregar materiales)
  const handleAddMaterial = (material: MaterialUploadForm) => {
    // Los clientes no pueden agregar materiales
  };

  const handleEditMaterial = (materialId: number, material: MaterialUploadForm) => {
    // Los clientes no pueden editar materiales
  };

  const handleDeleteMaterial = (materialId: number) => {
    // Los clientes no pueden eliminar materiales
  };

  return (
    <div className="space-y-6">
      {/* Navegación por tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'dashboard'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <BookOpen className="w-4 h-4 inline-block mr-2" />
            Mis Cursos
          </button>
          <button
            onClick={() => setActiveTab('materials')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'materials'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Download className="w-4 h-4 inline-block mr-2" />
            Material de Apoyo
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'calendar'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Calendar className="w-4 h-4 inline-block mr-2" />
            Calendario
          </button>
        </nav>
      </div>

      {/* Contenido por tab */}
      {activeTab === 'dashboard' && (
        <ClientDashboard
          userProgress={userProgress}
          todaySessions={todaySessions}
          upcomingSessions={upcomingSessions}
          materials={materials}
          userLevel={userLevel}
          completionRate={completionRate}
        />
      )}

      {activeTab === 'materials' && (
        <MaterialsManager
          materials={materials}
          onAddMaterial={handleAddMaterial}
          onEditMaterial={handleEditMaterial}
          onDeleteMaterial={handleDeleteMaterial}
          userRole="client"
        />
      )}

      {activeTab === 'calendar' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Mi Calendario de Clases
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Próximas Sesiones</h3>
              {upcomingSessions.length > 0 ? (
                <div className="space-y-3">
                  {upcomingSessions.map(session => (
                    <div key={session.session_id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{session.course.course_name}</h4>
                          <p className="text-sm text-gray-600">
                            {new Date(session.session_date + 'T' + session.session_time).toLocaleDateString('es-ES', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })} - {session.session_time}
                          </p>
                          <p className="text-sm text-gray-600">
                            Instructor: {session.instructor.person.person_first_name} {session.instructor.person.person_last_name}
                          </p>
                          {session.session_description && (
                            <p className="text-sm text-gray-500 mt-1">{session.session_description}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No hay sesiones programadas</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};