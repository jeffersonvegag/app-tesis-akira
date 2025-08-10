import React from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import {
  userTrainingAssignmentService,
  technologyProgressService,
  materialProgressService,
  trainingMaterialService,
} from '@/services/api';
import {
  BookOpen,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  User,
  Video,
  FileText,
  ExternalLink,
  Play,
  Pause,
  RotateCcw,
  Trophy,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

const MyCoursesPage: React.FC = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  // Obtener asignaciones del usuario
  const { data: assignments = [], isLoading: loadingAssignments } = useQuery(
    ['user-training-assignments', user?.user_id],
    () => {
      if (!user?.user_id) return Promise.resolve([]);
      return userTrainingAssignmentService.getAssignmentsByUser(user.user_id);
    },
    { enabled: !!user?.user_id }
  );

  // Mutations para actualizar progreso
  const updateTechnologyProgressMutation = useMutation(
    technologyProgressService.createProgress,
    {
      onSuccess: () => {
        toast.success('Progreso actualizado');
        queryClient.invalidateQueries(['technology-progress']);
        queryClient.invalidateQueries(['user-training-assignments']);
      },
      onError: () => {
        toast.error('Error al actualizar progreso');
      },
    }
  );

  const updateMaterialProgressMutation = useMutation(
    materialProgressService.createProgress,
    {
      onSuccess: () => {
        toast.success('Material marcado como completado');
        queryClient.invalidateQueries(['material-progress']);
        queryClient.invalidateQueries(['user-training-assignments']);
      },
      onError: () => {
        toast.error('Error al actualizar progreso del material');
      },
    }
  );

  // Mutation para actualizar el estado de la asignación (removido para evitar loops infinitos)
  // const updateAssignmentStatusMutation = useMutation(
  //   async ({ assignmentId, status, percentage }: { assignmentId: number, status: string, percentage: number }) => {
  //     // Aquí necesitarías el endpoint para actualizar el assignment_status
  //     // Por ahora simularemos con una llamada que actualice el completion_percentage
  //     console.log(`Actualizando assignment ${assignmentId} to status: ${status}, percentage: ${percentage}`);
  //     return Promise.resolve();
  //   },
  //   {
  //     onSuccess: () => {
  //       queryClient.invalidateQueries(['user-training-assignments']);
  //     },
  //   }
  // );

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'completado':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'in_progress':
      case 'en_progreso':
        return <Play className="w-5 h-5 text-blue-500" />;
      case 'not_started':
      case 'no_iniciado':
        return <Clock className="w-5 h-5 text-gray-500" />;
      case 'paused':
      case 'pausado':
        return <Pause className="w-5 h-5 text-yellow-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'completado':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'in_progress':
      case 'en_progreso':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'not_started':
      case 'no_iniciado':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'paused':
      case 'pausado':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'completado':
        return 'Completado';
      case 'in_progress':
      case 'en_progreso':
        return 'En Progreso';
      case 'not_started':
      case 'no_iniciado':
        return 'No Iniciado';
      case 'paused':
      case 'pausado':
        return 'Pausado';
      default:
        return 'Sin Estado';
    }
  };

  // Componente para mostrar el progreso de una capacitación
  const TrainingProgressCard: React.FC<{ assignment: any }> = ({ assignment }) => {
    // Obtener progreso de tecnologías para esta asignación
    const { data: technologyProgress = [] } = useQuery(
      ['technology-progress', assignment.assignment_id],
      () => technologyProgressService.getProgressByAssignment(assignment.assignment_id),
      { enabled: !!assignment.assignment_id }
    );

    // Obtener progreso de materiales para esta asignación
    const { data: materialProgress = [] } = useQuery(
      ['material-progress', assignment.assignment_id],
      () => materialProgressService.getProgressByAssignment(assignment.assignment_id),
      { enabled: !!assignment.assignment_id }
    );

    // Obtener materiales de la capacitación
    const { data: materials = [] } = useQuery(
      ['training-materials', assignment.training_id],
      () => trainingMaterialService.getMaterials(undefined, assignment.training_id),
      { enabled: !!assignment.training_id }
    );

    const handleTechnologyToggle = (technologyId: number, isCompleted: boolean) => {
      updateTechnologyProgressMutation.mutate({
        assignment_id: assignment.assignment_id,
        technology_id: technologyId,
        is_completed: isCompleted ? 'Y' : 'N',
      });
    };

    const handleMaterialToggle = (materialId: number, isCompleted: boolean) => {
      updateMaterialProgressMutation.mutate({
        user_id: user!.user_id,
        material_id: materialId,
        assignment_id: assignment.assignment_id,
        is_completed: isCompleted ? 'Y' : 'N',
      });
    };

    // Calcular progreso general
    const instructorUrlsCount = assignment.instructor_urls?.length || 0;
    const totalItems = (assignment.training?.training_technologies?.length || 0) + materials.length + instructorUrlsCount;
    const completedTechnologies = technologyProgress.filter(p => p.is_completed === 'Y').length;
    const completedMaterials = materialProgress.filter(p => p.is_completed === 'Y').length;
    const completedUrls = materialProgress.filter(p => p.url_id && p.is_completed === 'Y').length;
    const completedItems = completedTechnologies + completedMaterials + completedUrls;
    const progressPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
    
    // Verificar si la capacitación está completa basada en checks (sin auto-actualización)
    const isFullyCompleted = totalItems > 0 && completedItems === totalItems;
    
    // Estado local para evitar múltiples notificaciones del mismo assignment
    const [completionNotified, setCompletionNotified] = React.useState(new Set<number>());
    
    // Notificar completación solo una vez por assignment (sin actualizar backend)
    React.useEffect(() => {
      if (isFullyCompleted && !completionNotified.has(assignment.assignment_id)) {
        setCompletionNotified(prev => new Set(prev).add(assignment.assignment_id));
        toast.success('¡Todos los elementos completados! Informa a tu supervisor.');
      }
    }, [isFullyCompleted, assignment.assignment_id, completionNotified]);

    return (
      <Card key={assignment.assignment_id} className="overflow-hidden hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <BookOpen className="w-6 h-6 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  {assignment.training?.training_name || 'Capacitación sin nombre'}
                </h3>
                <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(assignment.assignment_status || 'no_iniciado')}`}>
                  <div className="flex items-center space-x-1">
                    {getStatusIcon(assignment.assignment_status || 'no_iniciado')}
                    <span>{getStatusText(assignment.assignment_status || 'no_iniciado')}</span>
                  </div>
                </div>
              </div>

              {assignment.training?.training_description && (
                <p className="text-gray-600 mb-3">
                  {assignment.training.training_description}
                </p>
              )}

              {/* Barra de progreso general */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Progreso General</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">{progressPercentage}%</span>
                    {isFullyCompleted && (
                      <div className="flex items-center space-x-1 text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-xs font-medium">¡Completado!</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all duration-300 ${
                      isFullyCompleted 
                        ? 'bg-gradient-to-r from-green-500 to-green-600' 
                        : 'bg-gradient-to-r from-blue-500 to-green-500'
                    }`}
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {completedItems} de {totalItems} elementos completados
                  {isFullyCompleted && (
                    <span className="text-green-600 font-medium ml-2">- ¡Todos los elementos completados!</span>
                  )}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-2 text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>
                    Asignado: {new Date(assignment.assignment_date).toLocaleDateString('es-ES')}
                  </span>
                </div>

                {assignment.instructor && (
                  <div className="flex items-center space-x-2 text-gray-600">
                    <User className="w-4 h-4" />
                    <span>
                      Instructor: {assignment.instructor.person.person_first_name} {assignment.instructor.person.person_last_name}
                    </span>
                  </div>
                )}

                {assignment.instructor_meeting_link && (
                  <div className="col-span-full">
                    <Button
                      onClick={() => window.open(assignment.instructor_meeting_link, '_blank')}
                      variant="outline"
                      size="sm"
                      className="flex items-center space-x-2"
                    >
                      <Video className="w-4 h-4" />
                      <span>Unirse a Clase Virtual</span>
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tecnologías y progreso */}
          {assignment.training?.training_technologies && assignment.training.training_technologies.length > 0 && (
            <div className="border-t pt-4 mb-4">
              <h4 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
                <Trophy className="w-4 h-4" />
                <span>Tecnologías a Desarrollar</span>
              </h4>
              <div className="space-y-2">
                {assignment.training.training_technologies.map((tt: any) => {
                  const progress = technologyProgress.find(p => p.technology_id === tt.technology.technology_id);
                  const isCompleted = progress?.is_completed === 'Y';
                  
                  return (
                    <div
                      key={tt.technology.technology_id}
                      className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <input
                        type="checkbox"
                        checked={isCompleted}
                        onChange={(e) => handleTechnologyToggle(tt.technology.technology_id, e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <span className="font-medium text-gray-900 text-sm">
                          {tt.technology.technology_name}
                        </span>
                        <span className="text-xs text-gray-500 ml-2">
                          ({tt.level_name})
                        </span>
                      </div>
                      {isCompleted && (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* URLs del Instructor */}
          {assignment.instructor_urls && assignment.instructor_urls.length > 0 && (
            <div className="border-t pt-4 mb-4">
              <h4 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
                <ExternalLink className="w-4 h-4" />
                <span>Enlaces del Instructor</span>
              </h4>
              <div className="space-y-2">
                {assignment.instructor_urls.map((url: any, index: number) => {
                  // Crear un ID único para el URL basado en el assignment y el índice
                  const urlId = `${assignment.assignment_id}_url_${index}`;
                  const progress = materialProgress.find(p => p.url_id === urlId);
                  const isCompleted = progress?.is_completed === 'Y';
                  
                  return (
                    <div
                      key={urlId}
                      className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg"
                    >
                      <input
                        type="checkbox"
                        checked={isCompleted}
                        onChange={(e) => {
                          // Simular el toggle para URLs del instructor
                          updateMaterialProgressMutation.mutate({
                            user_id: user!.user_id,
                            url_id: urlId,
                            assignment_id: assignment.assignment_id,
                            is_completed: e.target.checked ? 'Y' : 'N',
                          });
                        }}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <span className="font-medium text-gray-900 text-sm">
                          {url.title || `Enlace ${index + 1}`}
                        </span>
                        {url.description && (
                          <p className="text-xs text-gray-600 mt-1">
                            {url.description}
                          </p>
                        )}
                        <p className="text-xs text-blue-600 mt-1 break-all">
                          {url.url}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          let cleanUrl = url.url;
                          if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
                            cleanUrl = 'https://' + cleanUrl;
                          }
                          window.open(cleanUrl, '_blank');
                        }}
                        className="flex items-center space-x-1 text-blue-600 border-blue-600 hover:bg-blue-50"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Visitar</span>
                      </Button>
                      {isCompleted && (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Materiales y progreso */}
          {materials.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
                <FileText className="w-4 h-4" />
                <span>Materiales de Apoyo</span>
              </h4>
              <div className="space-y-2">
                {materials.map((material: any) => {
                  const progress = materialProgress.find(p => p.material_id === material.material_id);
                  const isCompleted = progress?.is_completed === 'Y';
                  
                  return (
                    <div
                      key={material.material_id}
                      className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <input
                        type="checkbox"
                        checked={isCompleted}
                        onChange={(e) => handleMaterialToggle(material.material_id, e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <span className="font-medium text-gray-900 text-sm">
                          {material.material_title}
                        </span>
                        {material.material_description && (
                          <p className="text-xs text-gray-600 mt-1">
                            {material.material_description}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          let url = material.material_url;
                          if (!url.startsWith('http://') && !url.startsWith('https://')) {
                            url = 'https://' + url;
                          }
                          window.open(url, '_blank');
                        }}
                        className="flex items-center space-x-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Abrir</span>
                      </Button>
                      {isCompleted && (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Acciones */}
          <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t">
            <Button
              onClick={() => window.location.href = '/materials'}
              variant="outline"
              size="sm"
              className="flex items-center space-x-2"
            >
              <FileText className="w-4 h-4" />
              <span>Ver Materiales</span>
            </Button>
            
            {/* Indicador de progreso visual */}
            {isFullyCompleted ? (
              <div className="flex items-center space-x-2 px-3 py-2 bg-green-100 text-green-700 rounded-md text-sm font-medium">
                <CheckCircle className="w-4 h-4" />
                <span>¡Todos los elementos completados! Contacta a tu supervisor</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-md text-sm font-medium">
                <Clock className="w-4 h-4" />
                <span>{completedItems}/{totalItems} elementos completados</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mis Capacitaciones</h1>
        <p className="text-gray-600 mt-1">
          Revisa el progreso de tus capacitaciones asignadas y accede a los materiales
        </p>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <BookOpen className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{assignments.length}</p>
                <p className="text-sm text-gray-600">Total Asignadas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {(() => {
                    // Contar completadas basado en el status del backend únicamente
                    return assignments.filter(assignment => {
                      return assignment.assignment_status?.toLowerCase() === 'completed' || 
                             assignment.assignment_status?.toLowerCase() === 'completado';
                    }).length;
                  })()}
                </p>
                <p className="text-sm text-gray-600">Completadas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Clock className="w-8 h-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {(() => {
                    // Contar pendientes como las que NO están completadas en el backend
                    const completedCount = assignments.filter(assignment => {
                      return assignment.assignment_status?.toLowerCase() === 'completed' || 
                             assignment.assignment_status?.toLowerCase() === 'completado';
                    }).length;
                    return assignments.length - completedCount;
                  })()}
                </p>
                <p className="text-sm text-gray-600">Pendientes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de capacitaciones */}
      {loadingAssignments ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : assignments.length === 0 ? (
        <Card className="p-8 text-center">
          <BookOpen className="mx-auto w-16 h-16 text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No tienes capacitaciones asignadas
          </h3>
          <p className="text-gray-600 mb-6">
            Contacta a tu supervisor para que te asigne capacitaciones según tu plan de desarrollo
          </p>
          <Button
            onClick={() => window.location.href = '/capacitaciones'}
            className="bg-primary-600 text-white hover:bg-primary-700"
          >
            Ver Catálogo de Capacitaciones
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {assignments.map((assignment) => (
            <TrainingProgressCard key={assignment.assignment_id} assignment={assignment} />
          ))}
        </div>
      )}
    </div>
  );
};

export default MyCoursesPage;