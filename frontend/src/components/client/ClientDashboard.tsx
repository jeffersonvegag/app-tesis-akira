import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/ui';
import { UserCourseProgress, ClassSession, StudyMaterial } from '@/types/advanced';
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
  userProgress: UserCourseProgress[];
  todaySessions: ClassSession[];
  upcomingSessions: ClassSession[];
  materials: StudyMaterial[];
  userLevel: string;
  completionRate: number;
}

export const ClientDashboard: React.FC<ClientDashboardProps> = ({
  userProgress,
  todaySessions,
  upcomingSessions,
  materials,
  userLevel,
  completionRate,
}) => {
  const [selectedCourse, setSelectedCourse] = useState<UserCourseProgress | null>(null);

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

  return (
    <div className="space-y-6">
      {/* Header con información del usuario */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">Mi Plan de Capacitación</h1>
            <div className="flex items-center gap-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getLevelBadgeColor(userLevel)} text-primary-700`}>
                Nivel: {userLevel}
              </span>
              <div className="flex items-center gap-2 text-primary-100">
                <TrendingUp size={16} />
                <span>{completionRate}% Completado</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{userProgress.filter(p => p.status === 'completed').length}</div>
            <div className="text-primary-100">Cursos Completados</div>
          </div>
        </div>
      </div>

      {/* Sesiones de hoy */}
      {todaySessions.length > 0 && (
        <Card className="border-l-4 border-l-primary-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary-700">
              <Calendar className="w-5 h-5" />
              Clases de Hoy - {new Date().toLocaleDateString('es-ES')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {todaySessions.map(session => (
                <div key={session.session_id} className="flex items-center justify-between p-4 bg-primary-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                      <Video className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{session.course.course_name}</h4>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Clock size={14} />
                          {new Date(session.session_date + 'T' + session.session_time).toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users size={14} />
                          {session.instructor.person.person_first_name} {session.instructor.person.person_last_name}
                        </div>
                      </div>
                      {session.session_description && (
                        <p className="text-sm text-gray-600 mt-1">{session.session_description}</p>
                      )}
                    </div>
                  </div>
                  <Button
                    onClick={() => window.open(session.session_link, '_blank')}
                    className="flex items-center gap-2"
                  >
                    <Play size={16} />
                    Unirse
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mis Cursos */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Mis Cursos Asignados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userProgress.map(progress => (
                  <div 
                    key={progress.progress_id} 
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setSelectedCourse(progress)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium text-gray-900 line-clamp-1">
                            {progress.course.course_name}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(progress.status)}`}>
                            {getStatusText(progress.status)}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                          <span>Duración: {progress.course.course_duration}</span>
                          {progress.course.area && (
                            <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                              {progress.course.area}
                            </span>
                          )}
                          {progress.course.client_type && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                              {progress.course.client_type}
                            </span>
                          )}
                        </div>

                        {/* Barra de progreso */}
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress.progress_percentage}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-600 mt-1">
                          <span>Progreso</span>
                          <span>{progress.progress_percentage}%</span>
                        </div>
                      </div>
                      
                      <div className="ml-4 flex flex-col gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(progress.course.course_link, '_blank');
                          }}
                        >
                          <ExternalLink size={14} />
                        </Button>
                        {progress.status === 'completed' && (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {userProgress.length === 0 && (
                <div className="text-center py-8">
                  <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No tienes cursos asignados
                  </h3>
                  <p className="text-gray-600">
                    Tu supervisor te asignará cursos según tu nivel y especialización
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Próximas sesiones */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4" />
                Próximas Clases
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingSessions.slice(0, 3).map(session => (
                  <div key={session.session_id} className="text-sm">
                    <div className="font-medium text-gray-900 line-clamp-1">
                      {session.course.course_name}
                    </div>
                    <div className="flex items-center gap-1 text-gray-600">
                      <Clock size={12} />
                      {new Date(session.session_date).toLocaleDateString('es-ES')} - {' '}
                      {new Date(session.session_date + 'T' + session.session_time).toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                ))}
                {upcomingSessions.length === 0 && (
                  <p className="text-gray-500 text-sm">No hay clases programadas</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Material de apoyo reciente */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Download className="w-4 h-4" />
                Material de Apoyo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {materials.slice(0, 3).map(material => (
                  <div key={material.material_id} className="text-sm">
                    <div className="font-medium text-gray-900 line-clamp-1">
                      {material.material_name}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 text-xs">
                        {material.material_type}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(material.material_link, '_blank')}
                      >
                        <ExternalLink size={12} />
                      </Button>
                    </div>
                  </div>
                ))}
                {materials.length === 0 && (
                  <p className="text-gray-500 text-sm">No hay materiales disponibles</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Estadísticas personales */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Award className="w-4 h-4" />
                Mi Progreso
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Cursos Completados</span>
                  <span className="font-medium">{userProgress.filter(p => p.status === 'completed').length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">En Progreso</span>
                  <span className="font-medium">{userProgress.filter(p => p.status === 'in_progress').length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Pendientes</span>
                  <span className="font-medium">{userProgress.filter(p => p.status === 'assigned').length}</span>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex justify-between text-sm font-medium">
                    <span>Progreso Total</span>
                    <span className="text-primary-600">{completionRate}%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};