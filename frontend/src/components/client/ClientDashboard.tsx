import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { useAuthStore } from '@/store/authStore';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/ui';
import { Training, Technology, UserTrainingAssignment } from '@/types';
import { trainingService, userTrainingAssignmentService } from '@/services/api';
import { 
  BookOpen, 
  Calendar, 
  Clock, 
  Play, 
  CheckCircle, 
  AlertCircle,
  TrendingUp,
  Award,
  Video,
  Download,
  ExternalLink,
  Users,
  MapPin
} from 'lucide-react';

interface ClientDashboardProps {
  userLevel: string;
}

export const ClientDashboard: React.FC<ClientDashboardProps> = ({
  userLevel,
}) => {
  const [selectedAssignment, setSelectedAssignment] = useState<UserTrainingAssignment | null>(null);
  const { user } = useAuthStore();
  
  // Obtener capacitaciones ASIGNADAS al usuario desde la BD
  const { data: userAssignments, isLoading } = useQuery(
    ['user-training-assignments-dashboard', user?.user_id],
    () => user ? userTrainingAssignmentService.getAssignmentsByUser(user.user_id) : [],
    { enabled: !!user }
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'in_progress':
        return 'text-blue-600 bg-blue-100';
      case 'assigned':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completado';
      case 'in_progress':
        return 'En Progreso';
      case 'assigned':
        return 'Asignado';
      default:
        return 'Desconocido';
    }
  };

  const getLevelBadgeColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'trainee':
        return 'bg-gray-100 text-gray-800';
      case 'junior':
        return 'bg-blue-100 text-blue-800';
      case 'semi-senior':
        return 'bg-green-100 text-green-800';
      case 'senior':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Cargando mis capacitaciones...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con información del usuario */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">Mis Capacitaciones Asignadas</h1>
            <div className="flex items-center gap-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getLevelBadgeColor(userLevel)} text-primary-700`}>
                Nivel: {userLevel}
              </span>
              <div className="flex items-center gap-2 text-primary-100">
                <BookOpen size={16} />
                <span>{userAssignments?.length || 0} Capacitaciones Asignadas</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{userAssignments?.filter(a => a.assignment_status === 'completed').length || 0}</div>
            <div className="text-primary-100">Completadas</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mis Capacitaciones Asignadas */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Resumen de Mis Capacitaciones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userAssignments?.map(assignment => (
                  <div 
                    key={assignment.assignment_id} 
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setSelectedAssignment(assignment)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium text-gray-900 line-clamp-1">
                            {assignment.training.training_name}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(assignment.assignment_status)}`}>
                            {getStatusText(assignment.assignment_status)}
                          </span>
                        </div>
                        
                        {assignment.training.training_description && (
                          <p className="text-sm text-gray-600 mb-3">
                            {assignment.training.training_description}
                          </p>
                        )}

                        {/* Barra de progreso */}
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                          <div 
                            className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${assignment.completion_percentage}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>Asignada: {new Date(assignment.assignment_created_at).toLocaleDateString('es-ES')}</span>
                          <span>{assignment.completion_percentage}% completado</span>
                        </div>
                      </div>
                      
                      <div className="ml-4 flex flex-col gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Navegar a la página de detalles
                            window.location.href = '/my-courses?tab=assignments';
                          }}
                        >
                          <ExternalLink size={14} />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {!userAssignments || userAssignments.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No tienes capacitaciones asignadas
                  </h3>
                  <p className="text-gray-600">
                    Ve a la sección "Capacitaciones" para seleccionar las que te interesan
                  </p>
                  <div className="mt-4">
                    <Button
                      onClick={() => window.location.href = '/capacitaciones'}
                      className="flex items-center gap-2"
                    >
                      <ExternalLink size={16} />
                      Ver Capacitaciones Disponibles
                    </Button>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Estadísticas de capacitaciones */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Award className="w-4 h-4" />
                Estadísticas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Asignadas</span>
                  <span className="font-medium">{userAssignments?.length || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">En Progreso</span>
                  <span className="font-medium">{userAssignments?.filter(a => a.assignment_status === 'in_progress').length || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Completadas</span>
                  <span className="font-medium">{userAssignments?.filter(a => a.assignment_status === 'completed').length || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Mi Nivel</span>
                  <span className="font-medium">{userLevel}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información adicional */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4" />
                Información
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-sm text-gray-600">
                  Solo se muestran las capacitaciones que tienes asignadas. Los porcentajes se actualizan en tiempo real.
                </div>
                <div className="text-xs text-gray-500">
                  Última actualización: {new Date().toLocaleString('es-ES')}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};