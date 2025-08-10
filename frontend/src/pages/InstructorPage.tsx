import React, { useState, useEffect } from 'react';
import { InstructorCalendar } from '@/components/calendar/InstructorCalendar';
import { MaterialsManager } from '@/components/materials/MaterialsManager';
import { CalendarEvent, SessionCreateForm, StudyMaterial, MaterialUploadForm } from '@/types/advanced';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/ui';
import { Calendar, FolderOpen, Users, BarChart3 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { trainingMaterialService } from '@/services/api';
import { Training } from '@/types';

export const InstructorPage: React.FC = () => {
  const { user } = useAuthStore();
  const [assignedTrainings, setAssignedTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estado de ejemplo - en implementación real vendría de APIs
  const [sessions, setSessions] = useState<CalendarEvent[]>([
    {
      event_id: 1,
      title: 'Introducción a React',
      start: '2025-06-16T10:00:00',
      end: '2025-06-16T12:00:00',
      session_id: 1,
      instructor_id: 1,
      description: 'Conceptos básicos de React y JSX',
      link: 'https://meet.google.com/abc-defg-hij'
    },
    {
      event_id: 2,
      title: 'TypeScript Avanzado',
      start: '2025-06-18T14:00:00',
      end: '2025-06-18T16:00:00',
      session_id: 2,
      instructor_id: 1,
      description: 'Tipos avanzados y generics',
      link: 'https://meet.google.com/xyz-uvwx-yzz'
    }
  ]);

  const [materials, setMaterials] = useState<StudyMaterial[]>([
    {
      material_id: 1,
      course_id: 1,
      instructor_id: 1,
      material_name: 'Presentación React Basics',
      material_link: 'https://drive.google.com/file/d/example1',
      material_type: 'drive',
      description: 'Slides de introducción a React con ejemplos prácticos',
      created_at: '2025-06-15T10:00:00'
    },
    {
      material_id: 2,
      course_id: 1,
      instructor_id: 1,
      material_name: 'Video Tutorial React Hooks',
      material_link: 'https://youtube.com/watch?v=example',
      material_type: 'youtube',
      description: 'Tutorial completo sobre useState y useEffect',
      created_at: '2025-06-14T15:30:00'
    }
  ]);

  const [activeTab, setActiveTab] = useState<'calendar' | 'materials' | 'attendance'>('calendar');

  // Cargar capacitaciones asignadas al instructor
  useEffect(() => {
    const loadAssignedTrainings = async () => {
      if (!user?.user_id) return;

      try {
        setLoading(true);
        const trainings = await trainingMaterialService.getInstructorAssignedTrainings(user.user_id);
        setAssignedTrainings(trainings);
      } catch (error) {
        console.error('Error cargando capacitaciones asignadas:', error);
        toast.error('Error al cargar capacitaciones asignadas');
      } finally {
        setLoading(false);
      }
    };

    loadAssignedTrainings();
  }, [user?.user_id]);

  const handleCreateSession = (sessionData: SessionCreateForm) => {
    const newSession: CalendarEvent = {
      event_id: Date.now(),
      title: `Sesión de Clase`, // En implementación real se obtendría del curso
      start: `${sessionData.session_date}T${sessionData.session_time}:00`,
      end: `${sessionData.session_date}T${sessionData.session_time}:00`, // Se calcularía basado en duración
      session_id: Date.now(),
      instructor_id: 1, // ID del instructor actual
      description: sessionData.session_description,
      link: sessionData.session_link
    };

    setSessions(prev => [...prev, newSession]);
    toast.success('Sesión creada exitosamente');
  };

  const handleEditSession = (sessionId: number, sessionData: SessionCreateForm) => {
    setSessions(prev => prev.map(session => 
      session.event_id === sessionId 
        ? {
            ...session,
            start: `${sessionData.session_date}T${sessionData.session_time}:00`,
            description: sessionData.session_description,
            link: sessionData.session_link
          }
        : session
    ));
    toast.success('Sesión actualizada exitosamente');
  };

  const handleDeleteSession = (sessionId: number) => {
    setSessions(prev => prev.filter(session => session.event_id !== sessionId));
    toast.success('Sesión eliminada exitosamente');
  };

  const handleAddMaterial = (materialData: MaterialUploadForm) => {
    const newMaterial: StudyMaterial = {
      material_id: Date.now(),
      course_id: materialData.course_id,
      instructor_id: 1, // ID del instructor actual
      material_name: materialData.material_name,
      material_link: materialData.material_link,
      material_type: materialData.material_type,
      description: materialData.description,
      created_at: new Date().toISOString()
    };

    setMaterials(prev => [...prev, newMaterial]);
    toast.success('Material agregado exitosamente');
  };

  const handleEditMaterial = (materialId: number, materialData: MaterialUploadForm) => {
    setMaterials(prev => prev.map(material =>
      material.material_id === materialId
        ? {
            ...material,
            material_name: materialData.material_name,
            material_link: materialData.material_link,
            material_type: materialData.material_type,
            description: materialData.description
          }
        : material
    ));
    toast.success('Material actualizado exitosamente');
  };

  const handleDeleteMaterial = (materialId: number) => {
    setMaterials(prev => prev.filter(material => material.material_id !== materialId));
    toast.success('Material eliminado exitosamente');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Panel de Instructor</h1>
        <p className="text-gray-600 mt-2">
          Gestiona tus clases, materiales y estudiantes
        </p>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Sesiones este mes</p>
                <p className="text-2xl font-bold text-gray-900">{sessions.length}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Materiales subidos</p>
                <p className="text-2xl font-bold text-gray-900">{materials.length}</p>
              </div>
              <FolderOpen className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Estudiantes activos</p>
                <p className="text-2xl font-bold text-gray-900">24</p>
              </div>
              <Users className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Promedio asistencia</p>
                <p className="text-2xl font-bold text-gray-900">87%</p>
              </div>
              <BarChart3 className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Capacitaciones Asignadas */}
      <Card>
        <CardHeader>
          <CardTitle>Mis Capacitaciones Asignadas</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
              <p className="text-gray-600 mt-2">Cargando capacitaciones...</p>
            </div>
          ) : assignedTrainings.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No tienes capacitaciones asignadas
              </h3>
              <p className="text-gray-600">
                Un administrador debe asignarte capacitaciones para que puedas gestionarlas
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {assignedTrainings.map(training => (
                <div key={training.training_id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <h3 className="font-semibold text-gray-900 mb-2">{training.training_name}</h3>
                  {training.training_description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                      {training.training_description}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>Estado: Activo</span>
                    <span className="text-primary-600 font-medium">Asignado</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navegación por tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
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
          <button
            onClick={() => setActiveTab('materials')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'materials'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FolderOpen className="w-4 h-4 inline-block mr-2" />
            Materiales
          </button>
          <button
            onClick={() => setActiveTab('attendance')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'attendance'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Users className="w-4 h-4 inline-block mr-2" />
            Asistencia
          </button>
        </nav>
      </div>

      {/* Contenido por tab */}
      {activeTab === 'calendar' && (
        <InstructorCalendar
          sessions={sessions}
          onCreateSession={handleCreateSession}
          onEditSession={handleEditSession}
          onDeleteSession={handleDeleteSession}
        />
      )}

      {activeTab === 'materials' && (
        <MaterialsManager
          materials={materials}
          onAddMaterial={handleAddMaterial}
          onEditMaterial={handleEditMaterial}
          onDeleteMaterial={handleDeleteMaterial}
          userRole="instructor"
        />
      )}

      {activeTab === 'attendance' && (
        <Card>
          <CardHeader>
            <CardTitle>Gestión de Asistencias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Gestión de Asistencias
              </h3>
              <p className="text-gray-600 mb-4">
                Aquí podrás marcar asistencia manual para las sesiones en vivo
              </p>
              <p className="text-sm text-gray-500">
                Funcionalidad en desarrollo - Permitirá subir screenshots como evidencia de asistencia
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};