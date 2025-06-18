import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/ui';
import { User, Course, UserCourseProgress, CourseAssignmentForm } from '@/types/advanced';
import { 
  Users, 
  BookOpen, 
  Plus, 
  Search, 
  Filter,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  User as UserIcon,
  Target
} from 'lucide-react';

interface SupervisorDashboardProps {
  teamMembers: User[];
  availableCourses: Course[];
  teamProgress: UserCourseProgress[];
  onAssignCourse: (assignment: CourseAssignmentForm) => void;
}

export const SupervisorDashboard: React.FC<SupervisorDashboardProps> = ({
  teamMembers,
  availableCourses,
  teamProgress,
  onAssignCourse,
}) => {
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');

  const [assignmentForm, setAssignmentForm] = useState<CourseAssignmentForm>({
    course_id: 0,
    client_ids: [],
    assigned_by: 0, // Se llenará con el ID del supervisor
    priority: 'medium',
    notes: '',
  });

  // Filtrar cursos disponibles
  const filteredCourses = availableCourses.filter(course => {
    const matchesSearch = course.course_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesArea = !selectedArea || course.area === selectedArea;
    const matchesLevel = !selectedLevel || course.level_required === selectedLevel;
    return matchesSearch && matchesArea && matchesLevel;
  });

  // Obtener áreas únicas de los cursos
  const areas = [...new Set(availableCourses.map(c => c.area).filter(Boolean))];
  const levels = [...new Set(availableCourses.map(c => c.level_required).filter(Boolean))];

  // Calcular estadísticas del equipo
  const teamStats = {
    totalMembers: teamMembers.length,
    completedCourses: teamProgress.filter(p => p.status === 'completed').length,
    inProgress: teamProgress.filter(p => p.status === 'in_progress').length,
    pending: teamProgress.filter(p => p.status === 'assigned').length,
    averageCompletion: teamMembers.length > 0 
      ? Math.round(teamProgress.filter(p => p.status === 'completed').length / teamMembers.length * 100) 
      : 0,
  };

  const handleAssignCourse = () => {
    if (assignmentForm.course_id && assignmentForm.client_ids.length > 0) {
      onAssignCourse(assignmentForm);
      setShowAssignModal(false);
      setAssignmentForm({
        course_id: 0,
        client_ids: [],
        assigned_by: 0,
        priority: 'medium',
        notes: '',
      });
    }
  };

  const getProgressForUser = (userId: number) => {
    const userProgress = teamProgress.filter(p => p.user_id === userId);
    const completed = userProgress.filter(p => p.status === 'completed').length;
    const total = userProgress.length;
    return { completed, total, percentage: total > 0 ? Math.round((completed / total) * 100) : 0 };
  };

  const getUsersNeedingAttention = () => {
    return teamMembers.filter(member => {
      const progress = getProgressForUser(member.user_id);
      return progress.percentage < 50 || progress.total === 0;
    });
  };

  return (
    <div className="space-y-6">
      {/* Header con estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Mi Equipo</p>
                <p className="text-2xl font-bold text-gray-900">{teamStats.totalMembers}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Cursos Completados</p>
                <p className="text-2xl font-bold text-green-600">{teamStats.completedCourses}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">En Progreso</p>
                <p className="text-2xl font-bold text-blue-600">{teamStats.inProgress}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Promedio Completado</p>
                <p className="text-2xl font-bold text-purple-600">{teamStats.averageCompletion}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerta para miembros que necesitan atención */}
      {getUsersNeedingAttention().length > 0 && (
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-700">
              <AlertTriangle className="w-5 h-5" />
              Miembros que Requieren Atención
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {getUsersNeedingAttention().map(member => {
                const progress = getProgressForUser(member.user_id);
                return (
                  <div key={member.user_id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <div>
                      <p className="font-medium">{member.person.person_first_name} {member.person.person_last_name}</p>
                      <p className="text-sm text-gray-600">
                        {progress.total === 0 ? 'Sin cursos asignados' : `${progress.percentage}% completado`}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedClient(member);
                        setShowAssignModal(true);
                      }}
                    >
                      Asignar Curso
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista del equipo */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Mi Equipo
                </CardTitle>
                <Button
                  onClick={() => setShowAssignModal(true)}
                  className="flex items-center gap-2"
                >
                  <Plus size={16} />
                  Asignar Curso
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {teamMembers.map(member => {
                  const progress = getProgressForUser(member.user_id);
                  const memberProgress = teamProgress.filter(p => p.user_id === member.user_id);
                  
                  return (
                    <div key={member.user_id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                            <UserIcon className="w-5 h-5 text-primary-600" />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">
                              {member.person.person_first_name} {member.person.person_last_name}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <span>{member.position.position_name}</span>
                              {member.client_level && (
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                                  {member.client_level}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">
                            {progress.completed}/{progress.total} cursos
                          </div>
                          <div className="text-xs text-gray-600">
                            {progress.percentage}% completado
                          </div>
                        </div>
                      </div>

                      {/* Barra de progreso */}
                      <div className="mt-3">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-primary-600 h-2 rounded-full transition-all"
                            style={{ width: `${progress.percentage}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Cursos recientes */}
                      <div className="mt-3">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-gray-600">Cursos activos:</span>
                          {memberProgress.filter(p => p.status === 'in_progress').slice(0, 2).map(p => (
                            <span key={p.progress_id} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                              {p.course.course_name.substring(0, 20)}...
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="mt-3 flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedClient(member);
                            setShowAssignModal(true);
                          }}
                        >
                          Asignar Curso
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            // Ver detalle del progreso
                            console.log('Ver progreso detallado de', member.person.person_first_name);
                          }}
                        >
                          Ver Progreso
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Catálogo de cursos */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <BookOpen className="w-4 h-4" />
                Catálogo de Cursos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Filtros */}
              <div className="space-y-3 mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar cursos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full p-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                
                <select
                  value={selectedArea}
                  onChange={(e) => setSelectedArea(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">Todas las áreas</option>
                  {areas.map(area => (
                    <option key={area} value={area}>{area}</option>
                  ))}
                </select>

                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">Todos los niveles</option>
                  {levels.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>

              {/* Lista de cursos */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredCourses.slice(0, 10).map(course => (
                  <div 
                    key={course.course_id} 
                    className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => {
                      setAssignmentForm({ ...assignmentForm, course_id: course.course_id });
                      setShowAssignModal(true);
                    }}
                  >
                    <div className="font-medium text-sm line-clamp-2">{course.course_name}</div>
                    <div className="flex items-center gap-2 mt-1">
                      {course.area && (
                        <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                          {course.area}
                        </span>
                      )}
                      {course.level_required && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                          {course.level_required}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal de asignación */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Asignar Curso</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Curso *</label>
                <select
                  value={assignmentForm.course_id}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, course_id: parseInt(e.target.value) })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value={0}>Seleccionar curso</option>
                  {availableCourses.map(course => (
                    <option key={course.course_id} value={course.course_id}>
                      {course.course_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Clientes * {selectedClient && `(${selectedClient.person.person_first_name} preseleccionado)`}
                </label>
                <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2">
                  {teamMembers.map(member => (
                    <label key={member.user_id} className="flex items-center gap-2 p-1">
                      <input
                        type="checkbox"
                        checked={assignmentForm.client_ids.includes(member.user_id) || (selectedClient && selectedClient.user_id === member.user_id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setAssignmentForm({
                              ...assignmentForm,
                              client_ids: [...assignmentForm.client_ids, member.user_id]
                            });
                          } else {
                            setAssignmentForm({
                              ...assignmentForm,
                              client_ids: assignmentForm.client_ids.filter(id => id !== member.user_id)
                            });
                          }
                        }}
                      />
                      <span className="text-sm">
                        {member.person.person_first_name} {member.person.person_last_name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Prioridad</label>
                <select
                  value={assignmentForm.priority}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, priority: e.target.value as 'low' | 'medium' | 'high' })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="low">Baja</option>
                  <option value="medium">Media</option>
                  <option value="high">Alta</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Notas</label>
                <textarea
                  value={assignmentForm.notes}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, notes: e.target.value })}
                  placeholder="Instrucciones especiales, fecha límite, etc."
                  className="w-full p-2 border border-gray-300 rounded-md"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <Button onClick={handleAssignCourse}>
                Asignar Curso
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedClient(null);
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};