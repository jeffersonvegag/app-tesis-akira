import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useAuthStore } from '@/store/authStore';
import { ClientDashboard } from '@/components/client/ClientDashboard';
import { 
  userTrainingAssignmentService, 
  trainingService, 
  userTechnologyProgressService 
} from '@/services/api';
import { 
  UserTrainingAssignment, 
  Technology, 
  UserTechnologyProgress 
} from '@/types';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/ui';
import { 
  BookOpen, 
  Calendar, 
  ExternalLink, 
  Users, 
  CheckCircle2, 
  Circle,
  FileText,
  Video,
  Loader2
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// Componente para mostrar una capacitación asignada con sus tecnologías
const AssignedTrainingCard: React.FC<{
  assignment: UserTrainingAssignment;
}> = ({ assignment }) => {
  const [technologies, setTechnologies] = useState<Technology[]>([]);
  const [progress, setProgress] = useState<UserTechnologyProgress[]>([]);
  const [loadingTechnologies, setLoadingTechnologies] = useState(false);
  const queryClient = useQueryClient();

  const { user } = useAuthStore();

  // Mutación para actualizar progreso de tecnología
  const updateProgressMutation = useMutation(
    ({ progressId, isCompleted }: { progressId: number; isCompleted: boolean }) =>
      userTechnologyProgressService.updateProgress(progressId, { is_completed: isCompleted }),
    {
      onSuccess: () => {
        toast.success('Progreso actualizado');
        queryClient.invalidateQueries(['user-training-assignments', user?.user_id]);
        loadProgress();
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.detail || 'Error al actualizar progreso');
      },
    }
  );

  const loadTechnologies = async () => {
    if (technologies.length === 0) {
      setLoadingTechnologies(true);
      try {
        const techs = await trainingService.getTrainingTechnologies(assignment.training_id);
        setTechnologies(techs);
      } catch (error) {
        console.error('Error loading technologies:', error);
      } finally {
        setLoadingTechnologies(false);
      }
    }
  };

  const loadProgress = async () => {
    try {
      const progressData = await userTechnologyProgressService.getProgressByAssignment(assignment.assignment_id);
      setProgress(progressData);
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  };

  React.useEffect(() => {
    loadTechnologies();
    loadProgress();
  }, [assignment.assignment_id]);

  const handleTechnologyToggle = (progressId: number, currentStatus: boolean) => {
    updateProgressMutation.mutate({
      progressId,
      isCompleted: !currentStatus
    });
  };

  const completedTechs = progress.filter(p => p.is_completed === true || p.is_completed === 'Y').length;
  const totalTechs = technologies.length;
  const completionPercentage = totalTechs > 0 ? Math.round((completedTechs / totalTechs) * 100) : 0;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg line-clamp-2">
              {assignment.training.training_name}
            </CardTitle>
            {assignment.training.training_description && (
              <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                {assignment.training.training_description}
              </p>
            )}
            <div className="flex items-center gap-2 mt-3">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                assignment.assignment_status === 'completed' ? 'bg-green-100 text-green-800' :
                assignment.assignment_status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {assignment.assignment_status === 'completed' ? 'Completada' :
                 assignment.assignment_status === 'in_progress' ? 'En Progreso' : 'Asignada'}
              </span>
              <span className="text-xs text-gray-500">
                {completionPercentage}% completado
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          {/* Barra de progreso */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>

          {/* Tecnologías */}
          <div>
            <h4 className="font-medium text-sm text-gray-900 mb-2">
              Tecnologías ({completedTechs}/{totalTechs})
            </h4>
            {loadingTechnologies ? (
              <div className="flex items-center text-sm text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Cargando tecnologías...
              </div>
            ) : (
              <div className="space-y-2">
                {technologies.map(tech => {
                  const techProgress = progress.find(p => p.technology_id === tech.technology_id);
                  const isCompleted = techProgress?.is_completed === true || techProgress?.is_completed === 'Y';
                  
                  return (
                    <div 
                      key={tech.technology_id}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
                    >
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => techProgress && handleTechnologyToggle(techProgress.progress_id, isCompleted)}
                          className="text-primary-600 hover:text-primary-700"
                          disabled={!techProgress || updateProgressMutation.isLoading}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                          ) : (
                            <Circle className="w-4 h-4" />
                          )}
                        </button>
                        <span className={`text-sm ${isCompleted ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                          {tech.technology_name}
                        </span>
                      </div>
                      {techProgress?.completed_at && (
                        <span className="text-xs text-gray-500">
                          {new Date(techProgress.completed_at).toLocaleDateString('es-ES')}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Botones de acción */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 flex items-center gap-2"
              onClick={() => {
                // TODO: Implementar navegación a materiales
                toast.info('Material de apoyo próximamente');
              }}
            >
              <FileText size={14} />
              Material de Apoyo
            </Button>
            <Button
              size="sm"
              className="flex-1 flex items-center gap-2"
              onClick={() => {
                if (assignment.instructor_meeting_link) {
                  window.open(assignment.instructor_meeting_link, '_blank');
                } else {
                  toast.info('El instructor aún no ha configurado el enlace de la clase');
                }
              }}
              disabled={!assignment.instructor_meeting_link}
            >
              <Video size={14} />
              Ir a Clase
            </Button>
          </div>

          <div className="text-xs text-gray-500 pt-2">
            Asignada: {new Date(assignment.assignment_created_at).toLocaleDateString('es-ES')}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const ClientPage: React.FC = () => {
  const userLevel = 'Junior'; // En implementación real vendría del usuario autenticado
  const { user } = useAuthStore();
  
  // Leer parámetros de URL para determinar pestaña inicial
  const urlParams = new URLSearchParams(window.location.search);
  const initialTab = urlParams.get('tab') as 'dashboard' | 'assignments' | 'calendar' || 'dashboard';
  const [activeTab, setActiveTab] = useState<'dashboard' | 'assignments' | 'calendar'>(initialTab);

  // Obtener asignaciones de capacitaciones del usuario
  const { data: userAssignments, isLoading: loadingAssignments } = useQuery(
    ['user-training-assignments', user?.user_id],
    () => user ? userTrainingAssignmentService.getAssignmentsByUser(user.user_id) : [],
    { enabled: !!user }
  );

  if (loadingAssignments) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Cargando mis capacitaciones...</div>
      </div>
    );
  }

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
            Vista General
          </button>
          <button
            onClick={() => setActiveTab('assignments')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'assignments'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Users className="w-4 h-4 inline-block mr-2" />
            Mis Capacitaciones ({userAssignments?.length || 0})
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
        <ClientDashboard userLevel={userLevel} />
      )}

      {activeTab === 'assignments' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Mis Capacitaciones Asignadas</h2>
              <p className="text-gray-600 mt-1">
                Gestiona tu progreso en las capacitaciones asignadas
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">
                <div>Total asignadas: {userAssignments?.length || 0}</div>
                <div>Completadas: {userAssignments?.filter(a => a.assignment_status === 'completed').length || 0}</div>
              </div>
            </div>
          </div>

          {/* Lista de capacitaciones asignadas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {userAssignments?.map((assignment) => (
              <AssignedTrainingCard
                key={assignment.assignment_id}
                assignment={assignment}
              />
            ))}
          </div>

          {(!userAssignments || userAssignments.length === 0) && (
            <div className="text-center py-12">
              <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No tienes capacitaciones asignadas</h3>
              <p className="mt-1 text-sm text-gray-500">
                Ve a la sección "Capacitaciones" para seleccionar las que te interesan
              </p>
              <div className="mt-6">
                <Button
                  onClick={() => window.location.href = '/capacitaciones'}
                  className="flex items-center gap-2"
                >
                  <ExternalLink size={16} />
                  Ver Capacitaciones Disponibles
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'calendar' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Mi Calendario de Capacitaciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Calendario de Capacitaciones
                </h3>
                <p className="text-gray-600">
                  Aquí aparecerán las sesiones programadas de tus capacitaciones
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};