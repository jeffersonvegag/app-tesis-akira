import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';

import { toast } from 'react-hot-toast';
import {
  Course,
  Technology,
  CourseModality,
  CourseCreateForm,
} from '@/types';
import {
  courseService,
  catalogService,
  userService, 
} from '@/services/api';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  BookOpen,
  Clock,
  Link,
  Award,
  Download,
  Settings,
  Globe,
  Monitor,
  Calendar,
  X,
  Save,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

interface CourseManagementState {
  selectedCourse: Course | null;
  isCreateCourseModalOpen: boolean;
  isEditCourseModalOpen: boolean;
  isViewCourseModalOpen: boolean;
  isManageCatalogsModalOpen: boolean;
  searchTerm: string;
  filterTechnology: string;
  filterModality: string;
}

interface CourseFormData {
  course_name: string;
  course_link: string;
  course_duration_hours: string;
  course_duration_minutes: string;
  technology_id: string;
  course_modality_id: string;
  course_credentials: string;
  instructor_ids: string[];  // ← Agregar
  client_ids: string[];     // ← Agregar
}

const CourseManagementPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [state, setState] = useState<CourseManagementState>({
    selectedCourse: null,
    isCreateCourseModalOpen: false,
    isEditCourseModalOpen: false,
    isViewCourseModalOpen: false,
    isManageCatalogsModalOpen: false,
    searchTerm: '',
    filterTechnology: '',
    filterModality: '',
  });

  const [courseForm, setCourseForm] = useState<CourseFormData>({
    course_name: '',
    course_link: '',
    course_duration_hours: '',
    course_duration_minutes: '',
    technology_id: '',
    course_modality_id: '',
    course_credentials: '',
    instructor_ids: [],  // ← Agregar
    client_ids: [],     // ← Agregar
  });

  // Queries
  const { data: courses = [], isLoading: loadingCourses, refetch: refetchCourses } = useQuery(
    'courses',
    () => courseService.getCourses(),
    { staleTime: 0 }
  );
  const { data: users = [] } = useQuery('users', () => userService.getUsers());
  const { data: technologies = [] } = useQuery('technologies', () => catalogService.getTechnologies());
  const { data: modalities = [] } = useQuery('modalities', () => catalogService.getModalities());

  // Mutations
  const createCourseMutation = useMutation(courseService.createCourse, {
    onSuccess: () => {
      toast.success('Curso creado exitosamente');
      queryClient.invalidateQueries('courses');
      setState(prev => ({ ...prev, isCreateCourseModalOpen: false }));
      resetCourseForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Error al crear curso');
    },
  });

  const updateCourseMutation = useMutation(
    ({ id, data }: { id: number; data: CourseCreateForm }) =>
      courseService.updateCourse(id, data),
    {
      onSuccess: () => {
        toast.success('Curso actualizado exitosamente');
        queryClient.invalidateQueries('courses');
        setState(prev => ({ ...prev, isEditCourseModalOpen: false, selectedCourse: null }));
        resetCourseForm();
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.detail || 'Error al actualizar curso');
      },
    }
  );

  const deleteCourseMutation = useMutation(courseService.deleteCourse, {
    onSuccess: () => {
      toast.success('Curso eliminado exitosamente');
      queryClient.invalidateQueries('courses');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Error al eliminar curso');
    },
  });

  const resetCourseForm = () => {
    setCourseForm({
      course_name: '',
      course_link: '',
      course_duration_hours: '',
      course_duration_minutes: '',
      technology_id: '',
      course_modality_id: '',
      course_credentials: '',
      instructor_ids: [],  // ← Agregar
      client_ids: [],     // ← Agregar
    });
  };

  const handleCreateCourse = () => {
    if (!courseForm.course_name.trim()) {
      toast.error('El nombre del curso es requerido');
      return;
    }

    const duration = `${courseForm.course_duration_hours.padStart(2, '0')}:${courseForm.course_duration_minutes.padStart(2, '0')}:00`;
    
    const courseData: CourseCreateForm = {
      course_name: courseForm.course_name,
      course_link: courseForm.course_link,
      course_duration: duration,
      technology_id: courseForm.technology_id ? parseInt(courseForm.technology_id) : undefined,
      course_modality_id: courseForm.course_modality_id ? parseInt(courseForm.course_modality_id) : undefined,
      course_credentials: courseForm.course_credentials,
      instructor_ids: courseForm.instructor_ids.map(id => parseInt(id)), // ← Agregar
      client_ids: courseForm.client_ids.map(id => parseInt(id)),
    };

    createCourseMutation.mutate(courseData);
  };

  const handleEditCourse = () => {
    if (!state.selectedCourse) return;
    
    if (!courseForm.course_name.trim()) {
      toast.error('El nombre del curso es requerido');
      return;
    }

    const duration = `${courseForm.course_duration_hours.padStart(2, '0')}:${courseForm.course_duration_minutes.padStart(2, '0')}:00`;
    
    const courseData: CourseCreateForm = {
      course_name: courseForm.course_name,
      course_link: courseForm.course_link,
      course_duration: duration,
      technology_id: courseForm.technology_id ? parseInt(courseForm.technology_id) : undefined,
      course_modality_id: courseForm.course_modality_id ? parseInt(courseForm.course_modality_id) : undefined,
      course_credentials: courseForm.course_credentials,
    };

    updateCourseMutation.mutate({ id: state.selectedCourse.course_id, data: courseData });
  };

  const openEditModal = (course: Course) => {
    const [hours, minutes] = course.course_duration.split(':');
    setCourseForm({
      course_name: course.course_name,
      course_link: course.course_link || '',
      course_duration_hours: hours,
      course_duration_minutes: minutes,
      technology_id: course.technology_id?.toString() || '',
      course_modality_id: course.course_modality_id?.toString() || '',
      course_credentials: course.course_credentials || '',
      instructor_ids: [], // ← Aquí necesitarías cargar las asignaciones existentes
      client_ids: [],     // ← Aquí necesitarías cargar las asignaciones existentes
    });
    setState(prev => ({
      ...prev,
      selectedCourse: course,
      isEditCourseModalOpen: true,
    }));
  };

  // Filtered courses
  const filteredCourses = courses.filter(course => {
    const matchesSearch =
      course.course_name.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
      course.course_credentials?.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
      course.technology?.technology_name.toLowerCase().includes(state.searchTerm.toLowerCase());
    
    const matchesTechnology = !state.filterTechnology || course.technology_id?.toString() === state.filterTechnology;
    const matchesModality = !state.filterModality || course.course_modality_id?.toString() === state.filterModality;
    
    return matchesSearch && matchesTechnology && matchesModality;
  });

  // Statistics
  const stats = {
    total: courses.length,
    byTechnology: technologies.map(tech => ({
      technology: tech.technology_name,
      count: courses.filter(c => c.technology_id === tech.technology_id).length,
    })),
    byModality: modalities.map(mod => ({
      modality: mod.course_modality_name,
      count: courses.filter(c => c.course_modality_id === mod.course_modality_id).length,
    })),
    totalDuration: courses.reduce((acc, course) => {
      const duration = course.course_duration.split(':');
      return acc + parseInt(duration[0]) + (parseInt(duration[1]) / 60);
    }, 0),
  };

  const formatDuration = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Cursos</h1>
          <p className="text-gray-600 mt-1">
            Administra el catálogo de cursos, tecnologías y modalidades de capacitación
          </p>
        </div>
        <div className="flex space-x-3">
          <Button
            onClick={() => setState(prev => ({ ...prev, isManageCatalogsModalOpen: true }))}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <Settings size={16} />
            <span>Gestionar Catálogos</span>
          </Button>
          <Button
            onClick={() => setState(prev => ({ ...prev, isCreateCourseModalOpen: true }))}
            className="flex items-center space-x-2"
          >
            <Plus size={16} />
            <span>Nuevo Curso</span>
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Cursos</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <BookOpen className="w-8 h-8 text-blue-600" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tecnologías</p>
              <p className="text-2xl font-bold text-green-600">{technologies.length}</p>
            </div>
            <Monitor className="w-8 h-8 text-green-600" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Modalidades</p>
              <p className="text-2xl font-bold text-purple-600">{modalities.length}</p>
            </div>
            <Globe className="w-8 h-8 text-purple-600" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Horas Totales</p>
              <p className="text-2xl font-bold text-orange-600">{Math.round(stats.totalDuration)}h</p>
            </div>
            <Clock className="w-8 h-8 text-orange-600" />
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
                placeholder="Buscar cursos..."
                value={state.searchTerm}
                onChange={(e) => setState(prev => ({ ...prev, searchTerm: e.target.value }))}
                className="pl-10 w-64"
              />
            </div>
            <select
              value={state.filterTechnology}
              onChange={(e) => setState(prev => ({ ...prev, filterTechnology: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">Todas las tecnologías</option>
              {technologies.map(tech => (
                <option key={tech.technology_id} value={tech.technology_id}>
                  {tech.technology_name}
                </option>
              ))}
            </select>
            <select
              value={state.filterModality}
              onChange={(e) => setState(prev => ({ ...prev, filterModality: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">Todas las modalidades</option>
              {modalities.map(mod => (
                <option key={mod.course_modality_id} value={mod.course_modality_id}>
                  {mod.course_modality_name}
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
              onClick={() => refetchCourses()}
              className="flex items-center space-x-2"
            >
              <span>Actualizar</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* Course Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loadingCourses ? (
          Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </Card>
          ))
        ) : filteredCourses.length === 0 ? (
          <div className="col-span-full">
            <Card className="p-8 text-center">
              <BookOpen className="mx-auto w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron cursos</h3>
              <p className="text-gray-500 mb-4">Comienza creando tu primer curso de capacitación</p>
              <Button
                onClick={() => setState(prev => ({ ...prev, isCreateCourseModalOpen: true }))}
                className="flex items-center space-x-2"
              >
                <Plus size={16} />
                <span>Crear Primer Curso</span>
              </Button>
            </Card>
          </div>
        ) : (
          filteredCourses.map((course) => (
            <Card key={course.course_id} className="p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {course.course_name}
                  </h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                    <div className="flex items-center space-x-1">
                      <Clock size={14} />
                      <span>{formatDuration(course.course_duration)}</span>
                    </div>
                    {course.technology && (
                      <div className="flex items-center space-x-1">
                        <Monitor size={14} />
                        <span>{course.technology.technology_name}</span>
                      </div>
                    )}
                  </div>
                  {course.modality && (
                    <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mb-3">
                      <Globe size={12} className="mr-1" />
                      {course.modality.course_modality_name}
                    </div>
                  )}
                </div>
              </div>
              
              {course.course_credentials && (
                <div className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
                  <Award size={14} />
                  <span className="truncate">{course.course_credentials}</span>
                </div>
              )}
              
              {course.course_link && (
                <div className="flex items-center space-x-2 text-sm text-blue-600 mb-4">
                  <Link size={14} />
                  <a 
                    href={course.course_link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="truncate hover:underline"
                  >
                    Ver curso
                  </a>
                </div>
              )}
              
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-xs text-gray-500">
                  <Calendar size={12} className="inline mr-1" />
                  {new Date(course.course_created_at).toLocaleDateString('es-ES')}
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setState(prev => ({
                        ...prev,
                        selectedCourse: course,
                        isViewCourseModalOpen: true,
                      }))
                    }
                    className="p-2"
                  >
                    <Eye size={14} />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditModal(course)}
                    className="p-2"
                  >
                    <Edit size={14} />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (window.confirm('¿Estás seguro de eliminar este curso?')) {
                        deleteCourseMutation.mutate(course.course_id);
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

      {/* Create Course Modal */}
      {state.isCreateCourseModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Crear Nuevo Curso</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setState(prev => ({ ...prev, isCreateCourseModalOpen: false }));
                  resetCourseForm();
                }}
                className="p-2"
              >
                <X size={16} />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Curso *
                </label>
                <Input
                  placeholder="Ej: Introducción a React"
                  value={courseForm.course_name}
                  onChange={(e) => setCourseForm(prev => ({ ...prev, course_name: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Enlace del Curso
                </label>
                <Input
                  placeholder="https://..."
                  value={courseForm.course_link}
                  onChange={(e) => setCourseForm(prev => ({ ...prev, course_link: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duración
                </label>
                <div className="flex space-x-2">
                  <div className="flex-1">
                    <Input
                      type="number"
                      placeholder="Horas"
                      min="0"
                      max="999"
                      value={courseForm.course_duration_hours}
                      onChange={(e) => setCourseForm(prev => ({ ...prev, course_duration_hours: e.target.value }))}
                    />
                  </div>
                  <div className="flex-1">
                    <Input
                      type="number"
                      placeholder="Minutos"
                      min="0"
                      max="59"
                      value={courseForm.course_duration_minutes}
                      onChange={(e) => setCourseForm(prev => ({ ...prev, course_duration_minutes: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tecnología
                </label>
                <select
                  value={courseForm.technology_id}
                  onChange={(e) => setCourseForm(prev => ({ ...prev, technology_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccionar tecnología</option>
                  {technologies.map(tech => (
                    <option key={tech.technology_id} value={tech.technology_id}>
                      {tech.technology_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Modalidad
                </label>
                <select
                  value={courseForm.course_modality_id}
                  onChange={(e) => setCourseForm(prev => ({ ...prev, course_modality_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccionar modalidad</option>
                  {modalities.map(mod => (
                    <option key={mod.course_modality_id} value={mod.course_modality_id}>
                      {mod.course_modality_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Credenciales/Certificación
                </label>
                <Input
                  placeholder="Ej: Certificado de React Developer"
                  value={courseForm.course_credentials}
                  onChange={(e) => setCourseForm(prev => ({ ...prev, course_credentials: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Instructores
                </label>
                <select
                  multiple
                  value={courseForm.instructor_ids || []}
                  onChange={(e) => {
                    const selectedIds = Array.from(e.target.selectedOptions, option => option.value);
                    setCourseForm(prev => ({ ...prev, instructor_ids: selectedIds }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 h-32"
                >
                  {users.filter(user => user.role.role_name === 'Instructor').map(instructor => (
                    <option key={instructor.user_id} value={instructor.user_id}>
                      {instructor.person.person_first_name} {instructor.person.person_last_name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Mantén Ctrl/Cmd presionado para seleccionar múltiples</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Clientes
                </label>
                <select
                  multiple
                  value={courseForm.client_ids || []}
                  onChange={(e) => {
                    const selectedIds = Array.from(e.target.selectedOptions, option => option.value);
                    setCourseForm(prev => ({ ...prev, client_ids: selectedIds }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 h-32"
                >
                  {users.filter(user => user.role.role_name === 'Cliente').map(client => (
                    <option key={client.user_id} value={client.user_id}>
                      {client.person.person_first_name} {client.person.person_last_name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Mantén Ctrl/Cmd presionado para seleccionar múltiples</p>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setState(prev => ({ ...prev, isCreateCourseModalOpen: false }));
                  resetCourseForm();
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreateCourse}
                disabled={createCourseMutation.isLoading}
                className="flex items-center space-x-2"
              >
                <Save size={16} />
                <span>{createCourseMutation.isLoading ? 'Guardando...' : 'Crear Curso'}</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Course Modal */}
      {state.isEditCourseModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Editar Curso</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setState(prev => ({ ...prev, isEditCourseModalOpen: false, selectedCourse: null }));
                  resetCourseForm();
                }}
                className="p-2"
              >
                <X size={16} />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Curso *
                </label>
                <Input
                  placeholder="Ej: Introducción a React"
                  value={courseForm.course_name}
                  onChange={(e) => setCourseForm(prev => ({ ...prev, course_name: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Enlace del Curso
                </label>
                <Input
                  placeholder="https://..."
                  value={courseForm.course_link}
                  onChange={(e) => setCourseForm(prev => ({ ...prev, course_link: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duración
                </label>
                <div className="flex space-x-2">
                  <div className="flex-1">
                    <Input
                      type="number"
                      placeholder="Horas"
                      min="0"
                      max="999"
                      value={courseForm.course_duration_hours}
                      onChange={(e) => setCourseForm(prev => ({ ...prev, course_duration_hours: e.target.value }))}
                    />
                  </div>
                  <div className="flex-1">
                    <Input
                      type="number"
                      placeholder="Minutos"
                      min="0"
                      max="59"
                      value={courseForm.course_duration_minutes}
                      onChange={(e) => setCourseForm(prev => ({ ...prev, course_duration_minutes: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tecnología
                </label>
                <select
                  value={courseForm.technology_id}
                  onChange={(e) => setCourseForm(prev => ({ ...prev, technology_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccionar tecnología</option>
                  {technologies.map(tech => (
                    <option key={tech.technology_id} value={tech.technology_id}>
                      {tech.technology_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Modalidad
                </label>
                <select
                  value={courseForm.course_modality_id}
                  onChange={(e) => setCourseForm(prev => ({ ...prev, course_modality_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccionar modalidad</option>
                  {modalities.map(mod => (
                    <option key={mod.course_modality_id} value={mod.course_modality_id}>
                      {mod.course_modality_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Credenciales/Certificación
                </label>
                <Input
                  placeholder="Ej: Certificado de React Developer"
                  value={courseForm.course_credentials}
                  onChange={(e) => setCourseForm(prev => ({ ...prev, course_credentials: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Instructores
                </label>
                <select
                  multiple
                  value={courseForm.instructor_ids || []}
                  onChange={(e) => {
                    const selectedIds = Array.from(e.target.selectedOptions, option => option.value);
                    setCourseForm(prev => ({ ...prev, instructor_ids: selectedIds }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 h-32"
                >
                  {users.filter(user => user.role.role_name === 'Instructor').map(instructor => (
                    <option key={instructor.user_id} value={instructor.user_id}>
                      {instructor.person.person_first_name} {instructor.person.person_last_name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Mantén Ctrl/Cmd presionado para seleccionar múltiples</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Clientes
                </label>
                <select
                  multiple
                  value={courseForm.client_ids || []}
                  onChange={(e) => {
                    const selectedIds = Array.from(e.target.selectedOptions, option => option.value);
                    setCourseForm(prev => ({ ...prev, client_ids: selectedIds }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 h-32"
                >
                  {users.filter(user => user.role.role_name === 'Cliente').map(client => (
                    <option key={client.user_id} value={client.user_id}>
                      {client.person.person_first_name} {client.person.person_last_name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Mantén Ctrl/Cmd presionado para seleccionar múltiples</p>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setState(prev => ({ ...prev, isEditCourseModalOpen: false, selectedCourse: null }));
                  resetCourseForm();
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleEditCourse}
                disabled={updateCourseMutation.isLoading}
                className="flex items-center space-x-2"
              >
                <Save size={16} />
                <span>{updateCourseMutation.isLoading ? 'Actualizando...' : 'Actualizar Curso'}</span>
              </Button>
            </div>
          </div>
        </div>
      )}

{/* View Course Modal */}
     {state.isViewCourseModalOpen && state.selectedCourse && (
       <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
         <div className="bg-white rounded-lg p-6 w-full max-w-lg">
           <h2 className="text-xl font-bold mb-4">Detalles del Curso</h2>
           
           <div className="space-y-4">
             <div>
               <h3 className="text-lg font-medium text-gray-900 mb-2">
                 {state.selectedCourse.course_name}
               </h3>
             </div>

             <div className="grid grid-cols-2 gap-4">
               <div>
                 <label className="block text-sm font-medium text-gray-500">Duración</label>
                 <p className="text-sm text-gray-900">{formatDuration(state.selectedCourse.course_duration)}</p>
               </div>
               <div>
                 <label className="block text-sm font-medium text-gray-500">Tecnología</label>
                 <p className="text-sm text-gray-900">
                   {state.selectedCourse.technology?.technology_name || 'No especificada'}
                 </p>
               </div>
               <div>
                 <label className="block text-sm font-medium text-gray-500">Modalidad</label>
                 <p className="text-sm text-gray-900">
                   {state.selectedCourse.modality?.course_modality_name || 'No especificada'}
                 </p>
               </div>
               <div>
                 <label className="block text-sm font-medium text-gray-500">Fecha de Creación</label>
                 <p className="text-sm text-gray-900">
                   {new Date(state.selectedCourse.course_created_at).toLocaleDateString('es-ES')}
                 </p>
               </div>
             </div>
             
             {state.selectedCourse.course_credentials && (
               <div>
                 <label className="block text-sm font-medium text-gray-500">Credenciales</label>
                 <p className="text-sm text-gray-900">{state.selectedCourse.course_credentials}</p>
               </div>
             )}
             
             {state.selectedCourse.course_link && (
               <div>
                 <label className="block text-sm font-medium text-gray-500">Enlace del Curso</label>
                 <a 
                   href={state.selectedCourse.course_link} 
                   target="_blank" 
                   rel="noopener noreferrer"
                   className="text-sm text-blue-600 hover:underline break-all"
                 >
                   {state.selectedCourse.course_link}
                 </a>
               </div>
             )}
           </div>

           <div className="flex justify-end pt-6">
             <Button onClick={() => setState(prev => ({ ...prev, isViewCourseModalOpen: false, selectedCourse: null }))}>
               Cerrar
             </Button>
           </div>
         </div>
       </div>
     )}

     {/* Manage Catalogs Modal */}
     {state.isManageCatalogsModalOpen && (
       <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
         <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
           <h2 className="text-xl font-bold mb-4">Gestionar Catálogos</h2>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div>
               <h3 className="text-lg font-medium text-gray-900 mb-3">Tecnologías</h3>
               <div className="space-y-2 max-h-48 overflow-y-auto">
                 {technologies.map(tech => (
                   <div key={tech.technology_id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                     <span className="text-sm">{tech.technology_name}</span>
                     <Button variant="outline" size="sm" className="text-red-600">
                       <Trash2 size={12} />
                     </Button>
                   </div>
                 ))}
               </div>
               <Button variant="outline" size="sm" className="w-full mt-3">
                 <Plus size={14} className="mr-2" />
                 Agregar Tecnología
               </Button>
             </div>
             
             <div>
               <h3 className="text-lg font-medium text-gray-900 mb-3">Modalidades</h3>
               <div className="space-y-2 max-h-48 overflow-y-auto">
                 {modalities.map(mod => (
                   <div key={mod.course_modality_id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                     <span className="text-sm">{mod.course_modality_name}</span>
                     <Button variant="outline" size="sm" className="text-red-600">
                       <Trash2 size={12} />
                     </Button>
                   </div>
                 ))}
               </div>
               <Button variant="outline" size="sm" className="w-full mt-3">
                 <Plus size={14} className="mr-2" />
                 Agregar Modalidad
               </Button>
             </div>
           </div>

           <div className="flex justify-end pt-6">
             <Button onClick={() => setState(prev => ({ ...prev, isManageCatalogsModalOpen: false }))}>
               Cerrar
             </Button>
           </div>
         </div>
       </div>
     )}
   </div>
 );
};

export default CourseManagementPage;