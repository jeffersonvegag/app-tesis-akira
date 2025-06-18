import React, { useState } from 'react';
import { SupervisorDashboard } from '@/components/supervisor/SupervisorDashboard';
import { User, Course, UserCourseProgress, CourseAssignmentForm } from '@/types/advanced';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { Users, BarChart3, Target } from 'lucide-react';
import { PowerBIDemo } from '@/components/powerbi';
import { toast } from 'react-hot-toast';

export const SupervisorPage: React.FC = () => {
  // Estado de ejemplo - en implementación real vendría de APIs
  const [teamMembers] = useState<User[]>([
    {
      user_id: 5,
      user_username: 'dev1',
      person_id: 5,
      user_role: 3,
      user_position_id: 1,
      user_status: 'A',
      user_created_at: '2025-06-01T00:00:00',
      client_level: 'Junior',
      assigned_supervisor: 2,
      person: {
        person_id: 5,
        person_dni: 1234567894,
        person_first_name: 'Carlos',
        person_last_name: 'Rodríguez',
        person_gender: 1,
        person_email: 'carlos@example.com',
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
      }
    },
    {
      user_id: 6,
      user_username: 'dev2',
      person_id: 6,
      user_role: 3,
      user_position_id: 1,
      user_status: 'A',
      user_created_at: '2025-06-01T00:00:00',
      client_level: 'Trainee',
      assigned_supervisor: 2,
      person: {
        person_id: 6,
        person_dni: 1234567895,
        person_first_name: 'Ana',
        person_last_name: 'López',
        person_gender: 2,
        person_email: 'ana@example.com',
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
      }
    }
  ]);

  const [availableCourses] = useState<Course[]>([
    {
      course_id: 1,
      course_name: 'React Fundamentals - Desarrollo Frontend',
      course_link: 'https://example.com/react-course',
      course_duration: '40:00',
      area: 'Desarrollo',
      level_required: 'Junior',
      client_type: 'General',
      course_created_at: '2025-06-01T00:00:00'
    },
    {
      course_id: 2,
      course_name: 'TypeScript Básico',
      course_link: 'https://example.com/typescript-course',
      course_duration: '25:00',
      area: 'Desarrollo',
      level_required: 'Trainee',
      client_type: 'General',
      course_created_at: '2025-05-01T00:00:00'
    },
    {
      course_id: 3,
      course_name: 'Angular Fundamentals - Banco Guayaquil',
      course_link: 'https://example.com/angular-course',
      course_duration: '35:00',
      area: 'Desarrollo',
      level_required: 'Junior',
      client_type: 'Banco Guayaquil',
      course_created_at: '2025-05-15T00:00:00'
    },
    {
      course_id: 4,
      course_name: 'SQL Server - Banco Machala',
      course_link: 'https://example.com/sql-course',
      course_duration: '30:00',
      area: 'Desarrollo',
      level_required: 'Junior',
      client_type: 'Banco Machala',
      course_created_at: '2025-05-20T00:00:00'
    },
    {
      course_id: 5,
      course_name: 'Docker nivel básico - Infraestructura',
      course_link: 'https://example.com/docker-course',
      course_duration: '20:00',
      area: 'Infraestructura',
      level_required: 'Trainee',
      client_type: 'General',
      course_created_at: '2025-06-01T00:00:00'
    },
    {
      course_id: 6,
      course_name: 'Testing con Selenium - QA',
      course_link: 'https://example.com/selenium-course',
      course_duration: '28:00',
      area: 'QA',
      level_required: 'Junior',
      client_type: 'General',
      course_created_at: '2025-05-25T00:00:00'
    }
  ]);

  const [teamProgress] = useState<UserCourseProgress[]>([
    {
      progress_id: 1,
      user_id: 5,
      course_id: 1,
      status: 'in_progress',
      progress_percentage: 75,
      started_at: '2025-06-10T10:00:00',
      assigned_by: 2,
      course: availableCourses[0],
      user: teamMembers[0]
    },
    {
      progress_id: 2,
      user_id: 5,
      course_id: 2,
      status: 'completed',
      progress_percentage: 100,
      started_at: '2025-05-15T10:00:00',
      completed_at: '2025-06-05T16:00:00',
      assigned_by: 2,
      course: availableCourses[1],
      user: teamMembers[0]
    },
    {
      progress_id: 3,
      user_id: 6,
      course_id: 2,
      status: 'assigned',
      progress_percentage: 0,
      assigned_by: 2,
      course: availableCourses[1],
      user: teamMembers[1]
    }
  ]);

  const [activeTab, setActiveTab] = useState<'dashboard' | 'reports'>('dashboard');

  const handleAssignCourse = (assignment: CourseAssignmentForm) => {
    // En implementación real, esto haría una llamada a la API
    console.log('Asignando curso:', assignment);
    toast.success(`Curso asignado a ${assignment.client_ids.length} cliente(s)`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Panel de Supervisor</h1>
        <p className="text-gray-600 mt-2">
          Gestiona y supervisa el progreso de tu equipo
        </p>
      </div>

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
            <Users className="w-4 h-4 inline-block mr-2" />
            Mi Equipo
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'reports'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <BarChart3 className="w-4 h-4 inline-block mr-2" />
            Reportes del Equipo
          </button>
        </nav>
      </div>

      {/* Contenido por tab */}
      {activeTab === 'dashboard' && (
        <SupervisorDashboard
          teamMembers={teamMembers}
          availableCourses={availableCourses}
          teamProgress={teamProgress}
          onAssignCourse={handleAssignCourse}
        />
      )}

      {activeTab === 'reports' && (
        <div className="space-y-6">
          {/* Métricas del equipo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Progreso Promedio</p>
                    <p className="text-3xl font-bold text-green-600">78%</p>
                    <p className="text-xs text-green-600 mt-1">+12% este mes</p>
                  </div>
                  <Target className="w-10 h-10 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Cursos Pendientes</p>
                    <p className="text-3xl font-bold text-orange-600">5</p>
                    <p className="text-xs text-orange-600 mt-1">Requiere seguimiento</p>
                  </div>
                  <Target className="w-10 h-10 text-orange-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Meta Mensual</p>
                    <p className="text-3xl font-bold text-blue-600">85%</p>
                    <p className="text-xs text-blue-600 mt-1">Objetivo cumplido</p>
                  </div>
                  <Target className="w-10 h-10 text-blue-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Reportes de Power BI específicos para supervisores */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PowerBIDemo
              title="Progreso de Mi Equipo"
              description="Estado detallado de las capacitaciones de tu equipo por nivel y área"
              height={400}
            />
            <PowerBIDemo
              title="Comparativa de Rendimiento"
              description="Comparación del rendimiento de tu equipo vs otros equipos"
              height={400}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PowerBIDemo
              title="Cursos Más Efectivos"
              description="Análisis de qué cursos generan mejores resultados en tu equipo"
              height={350}
            />
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Objetivos del Equipo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Cursos completados este mes</span>
                      <span className="font-medium">8/10</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '80%' }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Asistencia a sesiones en vivo</span>
                      <span className="font-medium">92%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: '92%' }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Certificaciones obtenidas</span>
                      <span className="font-medium">6/8</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-purple-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Información sobre accesos limitados */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <BarChart3 className="w-8 h-8 text-blue-600 mt-1" />
                <div>
                  <h3 className="font-semibold text-blue-900 mb-2">
                    Reportes Limitados a Tu Equipo
                  </h3>
                  <p className="text-blue-800 text-sm mb-3">
                    Como supervisor, tienes acceso únicamente a los reportes y métricas 
                    de los miembros de tu equipo asignado. No puedes ver información 
                    de otros equipos o datos globales de la organización.
                  </p>
                  <div className="grid md:grid-cols-2 gap-4 text-xs text-blue-700">
                    <div>
                      <p className="font-medium mb-1">Puedes ver:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Progreso individual de tu equipo</li>
                        <li>Estadísticas agregadas del equipo</li>
                        <li>Comparativas internas del equipo</li>
                        <li>Asistencia a sesiones</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-medium mb-1">No puedes ver:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Datos de otros equipos</li>
                        <li>Métricas globales de la empresa</li>
                        <li>Información de otros supervisores</li>
                        <li>Reportes ejecutivos</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};