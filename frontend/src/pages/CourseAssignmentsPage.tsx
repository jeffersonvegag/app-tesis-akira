import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-hot-toast';
import {
  CourseAssignment,
  CourseAssignmentCreateForm,
  User,
  Course,
} from '@/types';
import {
  courseAssignmentService,
  userService,
  courseService,
} from '@/services/api';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Users,
  BookOpen,
  Calendar,
  Clock,
  User as UserIcon,
  GraduationCap,
  X,
  Save,
  Download,
  CheckCircle,
  XCircle,
  PlayCircle,
  PauseCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

interface CourseAssignmentsState {
  selectedAssignment: CourseAssignment | null;
  isCreateAssignmentModalOpen: boolean;
  isEditAssignmentModalOpen: boolean;
  isViewAssignmentModalOpen: boolean;
  searchTerm: string;
  filterStatus: string;
  filterCourse: string;
  filterInstructor: string;
}

const CourseAssignmentsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [state, setState] = useState<CourseAssignmentsState>({
    selectedAssignment: null,
    isCreateAssignmentModalOpen: false,
    isEditAssignmentModalOpen: false,
    isViewAssignmentModalOpen: false,
    searchTerm: '',
    filterStatus: '',
    filterCourse: '',
    filterInstructor: '',
  });

  const [assignmentForm, setAssignmentForm] = useState<CourseAssignmentCreateForm>({
    course_id: 0,
    client_id: 0,
    instructor_id: undefined,
    assignment_status: 'P',
    assignment_start_date: '',
    assignment_end_date: '',
  });

  // Queries
  const { data: assignments = [], isLoading: loadingAssignments, refetch: refetchAssignments } = useQuery(
    'courseAssignments',
    () => courseAssignmentService.getCourseAssignments(),
    { staleTime: 0 }
  );
  
  const { data: users = [] } = useQuery('users', () => userService.getUsers());
  const { data: courses = [] } = useQuery('courses', () => courseService.getCourses());

  // Mutations
  const createAssignmentMutation = useMutation(courseAssignmentService.createCourseAssignment, {
    onSuccess: () => {
      toast.success('Asignación creada exitosamente');
      queryClient.invalidateQueries('courseAssignments');
      setState(prev => ({ ...prev, isCreateAssignmentModalOpen: false }));
      resetAssignmentForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Error al crear asignación');
    },
  });

  const updateAssignmentMutation = useMutation(
    ({ id, data }: { id: number; data: CourseAssignmentCreateForm }) =>
      courseAssignmentService.updateCourseAssignment(id, data),
    {
      onSuccess: () => {
        toast.success('Asignación actualizada exitosamente');
        queryClient.invalidateQueries('courseAssignments');
        setState(prev => ({ ...prev, isEditAssignmentModalOpen: false, selectedAssignment: null }));
        resetAssignmentForm();
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.detail || 'Error al actualizar asignación');
      },
    }
  );

  const deleteAssignmentMutation = useMutation(courseAssignmentService.deleteCourseAssignment, {
    onSuccess: () => {
      toast.success('Asignación eliminada exitosamente');
      queryClient.invalidateQueries('courseAssignments');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Error al eliminar asignación');
    },
  });

  const resetAssignmentForm = () => {
    setAssignmentForm({
      course_id: 0,
      client_id: 0,
      instructor_id: undefined,
      assignment_status: 'P',
      assignment_start_date: '',
      assignment_end_date: '',
    });
  };

  const handleCreateAssignment = () => {
    if (!assignmentForm.course_id || !assignmentForm.client_id) {
      toast.error('El curso y el cliente son requeridos');
      return;
    }

    const assignmentData: CourseAssignmentCreateForm = {
      course_id: Number(assignmentForm.course_id),
      client_id: Number(assignmentForm.client_id),
      instructor_id: assignmentForm.instructor_id ? Number(assignmentForm.instructor_id) : undefined,
      assignment_status: assignmentForm.assignment_status,
      assignment_start_date: assignmentForm.assignment_start_date || undefined,
      assignment_end_date: assignmentForm.assignment_end_date || undefined,
    };

    createAssignmentMutation.mutate(assignmentData);
  };

  const handleEditAssignment = () => {
    if (!state.selectedAssignment) return;
    
    if (!assignmentForm.course_id || !assignmentForm.client_id) {
      toast.error('El curso y el cliente son requeridos');
      return;
    }

    const assignmentData: CourseAssignmentCreateForm = {
      course_id: Number(assignmentForm.course_id),
      client_id: Number(assignmentForm.client_id),
      instructor_id: assignmentForm.instructor_id ? Number(assignmentForm.instructor_id) : undefined,
      assignment_status: assignmentForm.assignment_status,
      assignment_start_date: assignmentForm.assignment_start_date || undefined,
      assignment_end_date: assignmentForm.assignment_end_date || undefined,
    };

    updateAssignmentMutation.mutate({ id: state.selectedAssignment.course_assignment_id, data: assignmentData });
  };

  const openEditModal = (assignment: CourseAssignment) => {
    setAssignmentForm({
      course_id: assignment.course_id,
      client_id: assignment.client_id,
      instructor_id: assignment.instructor_id || undefined,
      assignment_status: assignment.assignment_status,
      assignment_start_date: assignment.assignment_start_date ? assignment.assignment_start_date.split('T')[0] : '',
      assignment_end_date: assignment.assignment_end_date ? assignment.assignment_end_date.split('T')[0] : '',
    });
    setState(prev => ({
      ...prev,
      selectedAssignment: assignment,
      isEditAssignmentModalOpen: true,
    }));
  };

  // Filtros
  const clients = users.filter(user => user.role.role_name === 'Cliente');
  const instructors = users.filter(user => user.role.role_name === 'Instructor');

  // Asignaciones filtradas
  const filteredAssignments = assignments.filter(assignment => {
    const matchesSearch =
      assignment.client.person.person_first_name.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
      assignment.client.person.person_last_name.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
      assignment.course.course_name.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
      assignment.instructor?.person.person_first_name.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
      assignment.instructor?.person.person_last_name.toLowerCase().includes(state.searchTerm.toLowerCase());
    
    const matchesStatus = !state.filterStatus || assignment.assignment_status === state.filterStatus;
    const matchesCourse = !state.filterCourse || assignment.course_id.toString() === state.filterCourse;
    const matchesInstructor = !state.filterInstructor || assignment.instructor_id?.toString() === state.filterInstructor;
    
    return matchesSearch && matchesStatus && matchesCourse && matchesInstructor;
  });

  // Estadísticas
  const stats = {
    total: assignments.length,
    pending: assignments.filter(a => a.assignment_status === 'P').length,
    inProgress: assignments.filter(a => a.assignment_status === 'E').length,
    completed: assignments.filter(a => a.assignment_status === 'C').length,
    cancelled: assignments.filter(a => a.assignment_status === 'X').length,
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'P': return <PauseCircle className="w-4 h-4 text-yellow-600" />;
      case 'E': return <PlayCircle className="w-4 h-4 text-blue-600" />;
      case 'C': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'X': return <XCircle className="w-4 h-4 text-red-600" />;
      default: return <PauseCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'P': return 'Pendiente';
      case 'E': return 'En Progreso';
      case 'C': return 'Completado';
      case 'X': return 'Cancelado';
      default: return 'Desconocido';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'P': return 'bg-yellow-100 text-yellow-800';
      case 'E': return 'bg-blue-100 text-blue-800';
      case 'C': return 'bg-green-100 text-green-800';
      case 'X': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Asignaciones de Cursos</h1>
          <p className="text-gray-600 mt-1">
            Gestiona las asignaciones de cursos a clientes con sus instructores correspondientes
          </p>
        </div>
        <Button
          onClick={() => setState(prev => ({ ...prev, isCreateAssignmentModalOpen: true }))}
          className="flex items-center space-x-2"
        >
          <Plus size={16} />
          <span>Nueva Asignación</span>
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Users className="w-8 h-8 text-gray-600" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pendientes</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <PauseCircle className="w-8 h-8 text-yellow-600" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">En Progreso</p>
              <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
            </div>
            <PlayCircle className="w-8 h-8 text-blue-600" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completados</p>
              <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Cancelados</p>
              <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-600" />
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
                placeholder="Buscar asignaciones..."
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
              <option value="P">Pendiente</option>
              <option value="E">En Progreso</option>
              <option value="C">Completado</option>
              <option value="X">Cancelado</option>
            </select>
            <select
              value={state.filterCourse}
              onChange={(e) => setState(prev => ({ ...prev, filterCourse: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">Todos los cursos</option>
              {courses.map(course => (
                <option key={course.course_id} value={course.course_id}>
                  {course.course_name}
                </option>
              ))}
            </select>
            <select
              value={state.filterInstructor}
              onChange={(e) => setState(prev => ({ ...prev, filterInstructor: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">Todos los instructores</option>
              {instructors.map(instructor => (
                <option key={instructor.user_id} value={instructor.user_id}>
                  {instructor.person.person_first_name} {instructor.person.person_last_name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" className="flex items-center space-x-2">
              <Download size={16} />
              <span>Exportar</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchAssignments()}
              className="flex items-center space-x-2"
            >
              <span>Actualizar</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* Assignments Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {loadingAssignments ? (
          Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </Card>
          ))
        ) : filteredAssignments.length === 0 ? (
          <div className="col-span-full">
            <Card className="p-8 text-center">
              <Users className="mx-auto w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron asignaciones</h3>
              <p className="text-gray-500 mb-4">Comienza creando tu primera asignación de curso</p>
              <Button
                onClick={() => setState(prev => ({ ...prev, isCreateAssignmentModalOpen: true }))}
                className="flex items-center space-x-2"
              >
                <Plus size={16} />
                <span>Crear Primera Asignación</span>
              </Button>
            </Card>
          </div>
        ) : (
          filteredAssignments.map((assignment) => (
            <Card key={assignment.course_assignment_id} className="p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {assignment.course.course_name}
                    </h3>
                  </div>
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(assignment.assignment_status)}`}>
                    {getStatusIcon(assignment.assignment_status)}
                    <span className="ml-1">{getStatusText(assignment.assignment_status)}</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3 mb-4">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <UserIcon size={14} />
                  <span className="font-medium">Cliente:</span>
                  <span>{assignment.client.person.person_first_name} {assignment.client.person.person_last_name}</span>
                </div>
                
                {assignment.instructor && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <GraduationCap size={14} />
                    <span className="font-medium">Instructor:</span>
                    <span>{assignment.instructor.person.person_first_name} {assignment.instructor.person.person_last_name}</span>
                  </div>
                )}
                
                {assignment.assignment_start_date && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Calendar size={14} />
                    <span className="font-medium">Inicio:</span>
                    <span>{new Date(assignment.assignment_start_date).toLocaleDateString('es-ES')}</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-xs text-gray-500">
                  <Clock size={12} className="inline mr-1" />
                  {new Date(assignment.assignment_created_at).toLocaleDateString('es-ES')}
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setState(prev => ({
                        ...prev,
                        selectedAssignment: assignment,
                        isViewAssignmentModalOpen: true,
                      }))
                    }
                    className="p-2"
                  >
                    <Eye size={14} />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditModal(assignment)}
                    className="p-2"
                  >
                    <Edit size={14} />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (window.confirm('¿Estás seguro de eliminar esta asignación?')) {
                        deleteAssignmentMutation.mutate(assignment.course_assignment_id);
                      }
                    }}
                    className="p-2 text-red-600 hover:text-red-800"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Create Assignment Modal */}
      {state.isCreateAssignmentModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Nueva Asignación de Curso</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setState(prev => ({ ...prev, isCreateAssignmentModalOpen: false }));
                  resetAssignmentForm();
                }}
                className="p-2"
              >
                <X size={16} />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Curso *
                </label>
                <select
                  value={assignmentForm.course_id}
                  onChange={(e) => setAssignmentForm(prev => ({ ...prev, course_id: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={0}>Seleccionar curso</option>
                  {courses.map(course => (
                    <option key={course.course_id} value={course.course_id}>
                      {course.course_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cliente *
                </label>
                <select
                  value={assignmentForm.client_id}
                  onChange={(e) => setAssignmentForm(prev => ({ ...prev, client_id: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={0}>Seleccionar cliente</option>
                  {clients.map(client => (
                    <option key={client.user_id} value={client.user_id}>
                      {client.person.person_first_name} {client.person.person_last_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Instructor
                </label>
                <select
                  value={assignmentForm.instructor_id || ''}
                  onChange={(e) => setAssignmentForm(prev => ({ ...prev, instructor_id: e.target.value ? Number(e.target.value) : undefined }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccionar instructor (opcional)</option>
                  {instructors.map(instructor => (
                    <option key={instructor.user_id} value={instructor.user_id}>
                      {instructor.person.person_first_name} {instructor.person.person_last_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <select
                  value={assignmentForm.assignment_status}
                  onChange={(e) => setAssignmentForm(prev => ({ ...prev, assignment_status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="P">Pendiente</option>
                  <option value="E">En Progreso</option>
                  <option value="C">Completado</option>
                  <option value="X">Cancelado</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de Inicio
                  </label>
                  <Input
                    type="date"
                    value={assignmentForm.assignment_start_date}
                    onChange={(e) => setAssignmentForm(prev => ({ ...prev, assignment_start_date: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de Fin
                  </label>
                  <Input
                    type="date"
                    value={assignmentForm.assignment_end_date}
                    onChange={(e) => setAssignmentForm(prev => ({ ...prev, assignment_end_date: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setState(prev => ({ ...prev, isCreateAssignmentModalOpen: false }));
                  resetAssignmentForm();
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreateAssignment}
                disabled={createAssignmentMutation.isLoading}
                className="flex items-center space-x-2"
              >
                <Save size={16} />
                <span>{createAssignmentMutation.isLoading ? 'Guardando...' : 'Crear Asignación'}</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Assignment Modal */}
      {state.isEditAssignmentModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Editar Asignación</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setState(prev => ({ ...prev, isEditAssignmentModalOpen: false, selectedAssignment: null }));
                  resetAssignmentForm();
                }}
                className="p-2"
              >
                <X size={16} />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Curso *
                </label>
                <select
                  value={assignmentForm.course_id}
                  onChange={(e) => setAssignmentForm(prev => ({ ...prev, course_id: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={0}>Seleccionar curso</option>
                  {courses.map(course => (
                    <option key={course.course_id} value={course.course_id}>
                      {course.course_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cliente *
                </label>
                <select
                  value={assignmentForm.client_id}
                  onChange={(e) => setAssignmentForm(prev => ({ ...prev, client_id: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={0}>Seleccionar cliente</option>
                  {clients.map(client => (
                    <option key={client.user_id} value={client.user_id}>
                      {client.person.person_first_name} {client.person.person_last_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Instructor
                </label>
                <select
                  value={assignmentForm.instructor_id || ''}
                  onChange={(e) => setAssignmentForm(prev => ({ ...prev, instructor_id: e.target.value ? Number(e.target.value) : undefined }))}
className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
               >
                 <option value="">Seleccionar instructor (opcional)</option>
                 {instructors.map(instructor => (
                   <option key={instructor.user_id} value={instructor.user_id}>
                     {instructor.person.person_first_name} {instructor.person.person_last_name}
                   </option>
                 ))}
               </select>
             </div>

             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">
                 Estado
               </label>
               <select
                 value={assignmentForm.assignment_status}
                 onChange={(e) => setAssignmentForm(prev => ({ ...prev, assignment_status: e.target.value }))}
                 className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
               >
                 <option value="P">Pendiente</option>
                 <option value="E">En Progreso</option>
                 <option value="C">Completado</option>
                 <option value="X">Cancelado</option>
               </select>
             </div>

             <div className="grid grid-cols-2 gap-4">
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">
                   Fecha de Inicio
                 </label>
                 <Input
                   type="date"
                   value={assignmentForm.assignment_start_date}
                   onChange={(e) => setAssignmentForm(prev => ({ ...prev, assignment_start_date: e.target.value }))}
                 />
               </div>
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">
                   Fecha de Fin
                 </label>
                 <Input
                   type="date"
                   value={assignmentForm.assignment_end_date}
                   onChange={(e) => setAssignmentForm(prev => ({ ...prev, assignment_end_date: e.target.value }))}
                 />
               </div>
             </div>
           </div>

           <div className="flex justify-end space-x-3 mt-6">
             <Button
               variant="outline"
               onClick={() => {
                 setState(prev => ({ ...prev, isEditAssignmentModalOpen: false, selectedAssignment: null }));
                 resetAssignmentForm();
               }}
             >
               Cancelar
             </Button>
             <Button
               onClick={handleEditAssignment}
               disabled={updateAssignmentMutation.isLoading}
               className="flex items-center space-x-2"
             >
               <Save size={16} />
               <span>{updateAssignmentMutation.isLoading ? 'Actualizando...' : 'Actualizar Asignación'}</span>
             </Button>
           </div>
         </div>
       </div>
     )}

     {/* View Assignment Modal */}
     {state.isViewAssignmentModalOpen && state.selectedAssignment && (
       <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
         <div className="bg-white rounded-lg p-6 w-full max-w-lg">
           <div className="flex justify-between items-center mb-6">
             <h2 className="text-xl font-bold text-gray-900">Detalles de la Asignación</h2>
             <Button
               variant="outline"
               size="sm"
               onClick={() => setState(prev => ({ ...prev, isViewAssignmentModalOpen: false, selectedAssignment: null }))}
               className="p-2"
             >
               <X size={16} />
             </Button>
           </div>
           
           <div className="space-y-4">
             <div>
               <h3 className="text-lg font-medium text-gray-900 mb-2 flex items-center">
                 <BookOpen className="w-5 h-5 mr-2 text-blue-600" />
                 {state.selectedAssignment.course.course_name}
               </h3>
               <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(state.selectedAssignment.assignment_status)}`}>
                 {getStatusIcon(state.selectedAssignment.assignment_status)}
                 <span className="ml-2">{getStatusText(state.selectedAssignment.assignment_status)}</span>
               </div>
             </div>

             <div className="grid grid-cols-1 gap-4">
               <div className="bg-gray-50 p-4 rounded-lg">
                 <label className="block text-sm font-medium text-gray-500 mb-1">Cliente</label>
                 <div className="flex items-center">
                   <UserIcon size={16} className="mr-2 text-gray-600" />
                   <p className="text-sm text-gray-900">
                     {state.selectedAssignment.client.person.person_first_name} {state.selectedAssignment.client.person.person_last_name}
                   </p>
                 </div>
                 <p className="text-xs text-gray-500 mt-1">
                   {state.selectedAssignment.client.person.person_email}
                 </p>
               </div>
               
               {state.selectedAssignment.instructor && (
                 <div className="bg-gray-50 p-4 rounded-lg">
                   <label className="block text-sm font-medium text-gray-500 mb-1">Instructor</label>
                   <div className="flex items-center">
                     <GraduationCap size={16} className="mr-2 text-gray-600" />
                     <p className="text-sm text-gray-900">
                       {state.selectedAssignment.instructor.person.person_first_name} {state.selectedAssignment.instructor.person.person_last_name}
                     </p>
                   </div>
                   <p className="text-xs text-gray-500 mt-1">
                     {state.selectedAssignment.instructor.person.person_email}
                   </p>
                 </div>
               )}
               
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-sm font-medium text-gray-500">Fecha de Creación</label>
                   <p className="text-sm text-gray-900 flex items-center">
                     <Calendar size={14} className="mr-1" />
                     {new Date(state.selectedAssignment.assignment_created_at).toLocaleDateString('es-ES')}
                   </p>
                 </div>
                 {state.selectedAssignment.assignment_start_date && (
                   <div>
                     <label className="block text-sm font-medium text-gray-500">Fecha de Inicio</label>
                     <p className="text-sm text-gray-900 flex items-center">
                       <Calendar size={14} className="mr-1" />
                       {new Date(state.selectedAssignment.assignment_start_date).toLocaleDateString('es-ES')}
                     </p>
                   </div>
                 )}
                 {state.selectedAssignment.assignment_end_date && (
                   <div>
                     <label className="block text-sm font-medium text-gray-500">Fecha de Fin</label>
                     <p className="text-sm text-gray-900 flex items-center">
                       <Calendar size={14} className="mr-1" />
                       {new Date(state.selectedAssignment.assignment_end_date).toLocaleDateString('es-ES')}
                     </p>
                   </div>
                 )}
               </div>
               
               {state.selectedAssignment.course.course_link && (
                 <div>
                   <label className="block text-sm font-medium text-gray-500">Enlace del Curso</label>
                   <a 
                     href={state.selectedAssignment.course.course_link} 
                     target="_blank" 
                     rel="noopener noreferrer"
                     className="text-sm text-blue-600 hover:underline break-all"
                   >
                     {state.selectedAssignment.course.course_link}
                   </a>
                 </div>
               )}
             </div>
           </div>

           <div className="flex justify-end pt-6">
             <Button onClick={() => setState(prev => ({ ...prev, isViewAssignmentModalOpen: false, selectedAssignment: null }))}>
               Cerrar
             </Button>
           </div>
         </div>
       </div>
     )}
   </div>
 );
};

export default CourseAssignmentsPage;