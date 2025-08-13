import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-hot-toast';
import {
  Training,
  UserTrainingAssignment,
  UserTrainingAssignmentCreateForm,
  User,
  Technology,
  TrainingCreateForm,
} from '@/types';
import {
  trainingService,
  userTrainingAssignmentService,
  userService,
  catalogService,
} from '@/services/api';
import {
  Plus,
  Search,
  Edit,
  Users,
  BookOpen,
  GraduationCap,
  X,
  Save,
  CheckCircle,
  XCircle,
  PlayCircle,
  Clock,
  Cpu,
  Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

interface TrainingInstructorAssignment {
  training: Training;
  instructor?: User;
  userCount: number;
  assignments: UserTrainingAssignment[];
}

interface AssignmentsState {
  selectedTraining: Training | null;
  isAssignInstructorModalOpen: boolean;
  isAssignUsersModalOpen: boolean;
  isCreateTechnologyModalOpen: boolean;
  isCreateTrainingModalOpen: boolean;
  searchTerm: string;
  filterStatus: string;
}

const CourseAssignmentsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [state, setState] = useState<AssignmentsState>({
    selectedTraining: null,
    isAssignInstructorModalOpen: false,
    isAssignUsersModalOpen: false,
    isCreateTechnologyModalOpen: false,
    isCreateTrainingModalOpen: false,
    searchTerm: '',
    filterStatus: '',
  });

  const [selectedInstructor, setSelectedInstructor] = useState<number | undefined>();
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [technologyForm, setTechnologyForm] = useState({ technology_name: '' });
  const [trainingForm, setTrainingForm] = useState<TrainingCreateForm & { technologies: number[] }>({
    training_name: '',
    training_description: '',
    technologies: []
  });

  // Queries
  const { data: trainings = [], isLoading: loadingTrainings } = useQuery(
    'trainings',
    () => trainingService.getTrainings()
  );

  const { data: users = [] } = useQuery('users', () => userService.getUsers());

  const { data: allAssignments = [], isLoading: loadingAssignments } = useQuery(
    'user-training-assignments',
    () => userTrainingAssignmentService.getAssignments()
  );

  const { data: technologies = [] } = useQuery('technologies', () => catalogService.getTechnologies());

  // Mutations
  const assignUsersMutation = useMutation(
    (assignments: UserTrainingAssignmentCreateForm[]) =>
      Promise.all(assignments.map(assignment => userTrainingAssignmentService.createAssignment(assignment))),
    {
      onSuccess: () => {
        toast.success('Usuarios asignados exitosamente');
        queryClient.invalidateQueries('user-training-assignments');
        setState(prev => ({ ...prev, isAssignUsersModalOpen: false }));
        setSelectedUsers([]);
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.detail || 'Error al asignar usuarios');
      },
    }
  );

  const updateInstructorMutation = useMutation(
    ({ trainingId, instructorId }: { trainingId: number; instructorId: number | undefined }) =>
      userTrainingAssignmentService.updateTrainingInstructor(trainingId, instructorId),
    {
      onSuccess: () => {
        toast.success('Instructor asignado exitosamente');
        queryClient.invalidateQueries('user-training-assignments');
        setState(prev => ({ ...prev, isAssignInstructorModalOpen: false }));
        setSelectedInstructor(undefined);
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.detail || 'Error al asignar instructor');
      },
    }
  );

  const createTechnologyMutation = useMutation(
    (technologyData: { technology_name: string }) => catalogService.createTechnology(technologyData),
    {
      onSuccess: () => {
        toast.success('Tecnología creada exitosamente');
        queryClient.invalidateQueries('technologies');
        setState(prev => ({ ...prev, isCreateTechnologyModalOpen: false }));
        setTechnologyForm({ technology_name: '' });
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.detail || 'Error al crear tecnología');
      },
    }
  );

  const createTrainingMutation = useMutation(
    async (trainingData: { training_name: string; training_description?: string; technologies: number[] }) => {
      // Crear la capacitación primero
      const training = await trainingService.createTraining({
        training_name: trainingData.training_name,
        training_description: trainingData.training_description
      });
      
      // Luego asignar las tecnologías (esto requeriría un endpoint específico)
      // Por ahora solo creamos la capacitación básica
      return training;
    },
    {
      onSuccess: () => {
        toast.success('Capacitación creada exitosamente');
        queryClient.invalidateQueries('trainings');
        setState(prev => ({ ...prev, isCreateTrainingModalOpen: false }));
        setTrainingForm({ training_name: '', training_description: '', technologies: [] });
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.detail || 'Error al crear capacitación');
      },
    }
  );

  // Process data for display
  const trainingAssignments: TrainingInstructorAssignment[] = trainings.map(training => {
    const trainingAssignments = allAssignments.filter(a => a.training_id === training.training_id);
    const instructor = trainingAssignments.find(a => a.instructor)?.instructor;
    
    return {
      training,
      instructor,
      userCount: trainingAssignments.length,
      assignments: trainingAssignments,
    };
  });

  // Filter data
  const filteredTrainingAssignments = trainingAssignments.filter(item => {
    const matchesSearch = 
      item.training.training_name.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
      item.instructor?.person.person_first_name.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
      item.instructor?.person.person_last_name.toLowerCase().includes(state.searchTerm.toLowerCase());
    
    const matchesStatus = !state.filterStatus || 
      (state.filterStatus === 'with_instructor' && item.instructor) ||
      (state.filterStatus === 'without_instructor' && !item.instructor) ||
      (state.filterStatus === 'with_users' && item.userCount > 0) ||
      (state.filterStatus === 'without_users' && item.userCount === 0);
    
    return matchesSearch && matchesStatus;
  });

  // Available users for assignment (clients only, not already assigned to selected training)
  const availableUsers = users.filter(user => 
    user.role.role_name === 'Cliente' && 
    (!state.selectedTraining || !allAssignments.some(a => 
      a.training_id === state.selectedTraining!.training_id && a.user_id === user.user_id
    ))
  );

  const instructors = users.filter(user => user.role.role_name === 'Instructor');

  const handleAssignInstructor = (training: Training) => {
    setState(prev => ({ 
      ...prev, 
      selectedTraining: training,
      isAssignInstructorModalOpen: true 
    }));
    // Set current instructor if exists
    const currentInstructor = trainingAssignments.find(t => t.training.training_id === training.training_id)?.instructor;
    setSelectedInstructor(currentInstructor?.user_id);
  };

  const handleAssignUsers = (training: Training) => {
    setState(prev => ({ 
      ...prev, 
      selectedTraining: training,
      isAssignUsersModalOpen: true 
    }));
    setSelectedUsers([]);
  };

  const handleSubmitUserAssignments = () => {
    if (!state.selectedTraining || selectedUsers.length === 0) {
      toast.error('Selecciona al menos un usuario');
      return;
    }

    const assignments: UserTrainingAssignmentCreateForm[] = selectedUsers.map(userId => ({
      user_id: userId,
      training_id: state.selectedTraining!.training_id,
      instructor_id: selectedInstructor,
    }));

    assignUsersMutation.mutate(assignments);
  };

  const handleCreateTechnology = () => {
    if (!technologyForm.technology_name.trim()) {
      toast.error('El nombre de la tecnología es requerido');
      return;
    }
    createTechnologyMutation.mutate(technologyForm);
  };

  const handleCreateTraining = () => {
    if (!trainingForm.training_name.trim()) {
      toast.error('El nombre de la capacitación es requerido');
      return;
    }
    createTrainingMutation.mutate(trainingForm);
  };

  const stats = {
    totalTrainings: trainings.length,
    withInstructor: trainingAssignments.filter(t => t.instructor).length,
    withUsers: trainingAssignments.filter(t => t.userCount > 0).length,
    totalAssignments: allAssignments.length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Capacitaciones</h1>
          <p className="text-gray-600 mt-1">
            Asigna instructores a capacitaciones y gestiona usuarios por capacitación
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Capacitaciones</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalTrainings}</p>
            </div>
            <BookOpen className="w-8 h-8 text-gray-600" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Con Instructor</p>
              <p className="text-2xl font-bold text-green-600">{stats.withInstructor}</p>
            </div>
            <GraduationCap className="w-8 h-8 text-green-600" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Con Usuarios</p>
              <p className="text-2xl font-bold text-blue-600">{stats.withUsers}</p>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Asignaciones</p>
              <p className="text-2xl font-bold text-purple-600">{stats.totalAssignments}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-purple-600" />
          </div>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar capacitaciones..."
                value={state.searchTerm}
                onChange={(e) => setState(prev => ({ ...prev, searchTerm: e.target.value }))}
                className="pl-10 w-64"
              />
            </div>
            <select
              value={state.filterStatus}
              onChange={(e) => setState(prev => ({ ...prev, filterStatus: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">Todos los estados</option>
              <option value="with_instructor">Con instructor</option>
              <option value="without_instructor">Sin instructor</option>
              <option value="with_users">Con usuarios</option>
              <option value="without_users">Sin usuarios</option>
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => setState(prev => ({ ...prev, isCreateTechnologyModalOpen: true }))}
              className="flex items-center space-x-2"
              size="sm"
            >
              <Cpu size={16} />
              <span>Nueva Tecnología</span>
            </Button>
            <Button
              onClick={() => setState(prev => ({ ...prev, isCreateTrainingModalOpen: true }))}
              className="flex items-center space-x-2"
              size="sm"
            >
              <Plus size={16} />
              <span>Nueva Capacitación</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* Trainings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {loadingTrainings || loadingAssignments ? (
          Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </Card>
          ))
        ) : filteredTrainingAssignments.length === 0 ? (
          <div className="col-span-full">
            <Card className="p-8 text-center">
              <BookOpen className="mx-auto w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron capacitaciones</h3>
              <p className="text-gray-500">Ajusta los filtros o verifica que existan capacitaciones</p>
            </Card>
          </div>
        ) : (
          filteredTrainingAssignments.map((item) => (
            <Card key={item.training.training_id} className="p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {item.training.training_name}
                    </h3>
                  </div>
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    item.training.training_status === 'A' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {item.training.training_status === 'A' ? 'Activa' : 'Inactiva'}
                  </div>
                </div>
              </div>
              
              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Instructor:</span>
                  <span className={`font-medium ${item.instructor ? 'text-green-600' : 'text-red-600'}`}>
                    {item.instructor 
                      ? `${item.instructor.person.person_first_name} ${item.instructor.person.person_last_name}`
                      : 'No asignado'
                    }
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Usuarios asignados:</span>
                  <span className="font-medium text-blue-600">{item.userCount}</span>
                </div>
                
                {item.training.training_description && (
                  <p className="text-xs text-gray-500 line-clamp-2">
                    {item.training.training_description}
                  </p>
                )}
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t space-x-2">
                <div className="text-xs text-gray-500">
                  <Clock size={12} className="inline mr-1" />
                  {new Date(item.training.training_created_at).toLocaleDateString('es-ES')}
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAssignInstructor(item.training)}
                    className="px-2 py-1 text-xs"
                  >
                    <GraduationCap size={12} className="mr-1" />
                    Instructor
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAssignUsers(item.training)}
                    className="px-2 py-1 text-xs"
                  >
                    <Users size={12} className="mr-1" />
                    Usuarios
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Assign Instructor Modal */}
      {state.isAssignInstructorModalOpen && state.selectedTraining && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Asignar Instructor</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setState(prev => ({ ...prev, isAssignInstructorModalOpen: false, selectedTraining: null }));
                  setSelectedInstructor(undefined);
                }}
                className="p-2"
              >
                <X size={16} />
              </Button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900">{state.selectedTraining.training_name}</h3>
                <p className="text-sm text-gray-600">{state.selectedTraining.training_description}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seleccionar Instructor
                </label>
                <select
                  value={selectedInstructor || ''}
                  onChange={(e) => setSelectedInstructor(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sin instructor</option>
                  {instructors.map(instructor => (
                    <option key={instructor.user_id} value={instructor.user_id}>
                      {instructor.person.person_first_name} {instructor.person.person_last_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setState(prev => ({ ...prev, isAssignInstructorModalOpen: false, selectedTraining: null }));
                  setSelectedInstructor(undefined);
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  if (state.selectedTraining) {
                    updateInstructorMutation.mutate({
                      trainingId: state.selectedTraining.training_id,
                      instructorId: selectedInstructor
                    });
                  }
                }}
                disabled={updateInstructorMutation.isLoading}
                className="flex items-center space-x-2"
              >
                <Save size={16} />
                <span>{updateInstructorMutation.isLoading ? 'Asignando...' : 'Asignar'}</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Users Modal */}
      {state.isAssignUsersModalOpen && state.selectedTraining && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Asignar Usuarios</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setState(prev => ({ ...prev, isAssignUsersModalOpen: false, selectedTraining: null }));
                  setSelectedUsers([]);
                }}
                className="p-2"
              >
                <X size={16} />
              </Button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900">{state.selectedTraining.training_name}</h3>
                <p className="text-sm text-gray-600">Selecciona los usuarios que quieres asignar a esta capacitación</p>
              </div>

              {availableUsers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="mx-auto w-12 h-12 text-gray-400 mb-4" />
                  <p className="text-gray-500">No hay usuarios disponibles para asignar</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {availableUsers.map(user => (
                    <label
                      key={user.user_id}
                      className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.user_id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUsers(prev => [...prev, user.user_id]);
                          } else {
                            setSelectedUsers(prev => prev.filter(id => id !== user.user_id));
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">
                          {user.person.person_first_name} {user.person.person_last_name}
                        </div>
                        <div className="text-xs text-gray-500">{user.person.person_email}</div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-between items-center mt-6">
              <div className="text-sm text-gray-600">
                {selectedUsers.length} usuario(s) seleccionado(s)
              </div>
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setState(prev => ({ ...prev, isAssignUsersModalOpen: false, selectedTraining: null }));
                    setSelectedUsers([]);
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSubmitUserAssignments}
                  disabled={selectedUsers.length === 0 || assignUsersMutation.isLoading}
                  className="flex items-center space-x-2"
                >
                  <Save size={16} />
                  <span>{assignUsersMutation.isLoading ? 'Asignando...' : 'Asignar Usuarios'}</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Technology Modal */}
      {state.isCreateTechnologyModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Crear Nueva Tecnología</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setState(prev => ({ ...prev, isCreateTechnologyModalOpen: false }));
                  setTechnologyForm({ technology_name: '' });
                }}
                className="p-2"
              >
                <X size={16} />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de la Tecnología *
                </label>
                <Input
                  value={technologyForm.technology_name}
                  onChange={(e) => setTechnologyForm(prev => ({ ...prev, technology_name: e.target.value }))}
                  placeholder="Ej: React, Python, AWS..."
                  className="w-full"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setState(prev => ({ ...prev, isCreateTechnologyModalOpen: false }));
                  setTechnologyForm({ technology_name: '' });
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreateTechnology}
                disabled={createTechnologyMutation.isLoading}
                className="flex items-center space-x-2"
              >
                <Save size={16} />
                <span>{createTechnologyMutation.isLoading ? 'Creando...' : 'Crear Tecnología'}</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Create Training Modal */}
      {state.isCreateTrainingModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Crear Nueva Capacitación</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setState(prev => ({ ...prev, isCreateTrainingModalOpen: false }));
                  setTrainingForm({ training_name: '', training_description: '', technologies: [] });
                }}
                className="p-2"
              >
                <X size={16} />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de la Capacitación *
                </label>
                <Input
                  value={trainingForm.training_name}
                  onChange={(e) => setTrainingForm(prev => ({ ...prev, training_name: e.target.value }))}
                  placeholder="Ej: Desarrollo Frontend con React"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción (Opcional)
                </label>
                <textarea
                  value={trainingForm.training_description || ''}
                  onChange={(e) => setTrainingForm(prev => ({ ...prev, training_description: e.target.value }))}
                  placeholder="Describe el contenido y objetivos de la capacitación..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tecnologías Asociadas
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-300 rounded-md p-3">
                  {technologies.length === 0 ? (
                    <p className="text-sm text-gray-500">No hay tecnologías disponibles</p>
                  ) : (
                    technologies.map(technology => (
                      <label
                        key={technology.technology_id}
                        className="flex items-center space-x-3 p-2 rounded hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={trainingForm.technologies.includes(technology.technology_id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setTrainingForm(prev => ({
                                ...prev,
                                technologies: [...prev.technologies, technology.technology_id]
                              }));
                            } else {
                              setTrainingForm(prev => ({
                                ...prev,
                                technologies: prev.technologies.filter(id => id !== technology.technology_id)
                              }));
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm">{technology.technology_name}</span>
                      </label>
                    ))
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {trainingForm.technologies.length} tecnología(s) seleccionada(s)
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setState(prev => ({ ...prev, isCreateTrainingModalOpen: false }));
                  setTrainingForm({ training_name: '', training_description: '', technologies: [] });
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreateTraining}
                disabled={createTrainingMutation.isLoading}
                className="flex items-center space-x-2"
              >
                <Save size={16} />
                <span>{createTrainingMutation.isLoading ? 'Creando...' : 'Crear Capacitación'}</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseAssignmentsPage;