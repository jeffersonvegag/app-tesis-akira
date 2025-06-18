import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { courseService, catalogService } from '@/services/api';
import { Course, Technology, CourseModality } from '@/types';
import { Button, Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { Plus, Search, Filter, Edit, Trash2, ExternalLink, Clock, BookOpen } from 'lucide-react';
import { toast } from 'react-hot-toast';

const CourseCard: React.FC<{
  course: Course;
  onEdit: (course: Course) => void;
  onDelete: (courseId: number) => void;
}> = ({ course, onEdit, onDelete }) => {
  const handleDelete = () => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este curso?')) {
      onDelete(course.course_id);
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg line-clamp-2">{course.course_name}</CardTitle>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Clock size={14} />
                <span>{course.course_duration}</span>
              </div>
              {course.technology && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                  {course.technology.technology_name}
                </span>
              )}
              {course.modality && (
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                  {course.modality.course_modality_name}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(course)}
            >
              <Edit size={16} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 size={16} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {course.course_credentials && (
          <p className="text-sm text-gray-600 mb-3">
            <strong>Credenciales:</strong> {course.course_credentials}
          </p>
        )}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(course.course_link, '_blank')}
            className="flex items-center gap-2"
          >
            <ExternalLink size={14} />
            Ver Curso
          </Button>
          <span className="text-xs text-gray-500">
            Creado: {new Date(course.course_created_at).toLocaleDateString()}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

const CourseModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  course?: Course;
  onSave: (courseData: any) => void;
}> = ({ isOpen, onClose, course, onSave }) => {
  const [formData, setFormData] = useState({
    course_name: '',
    course_link: '',
    course_duration: '',
    technology_id: '',
    course_modality_id: '',
    course_credentials: '',
  });

  const { data: technologies } = useQuery('technologies', catalogService.getTechnologies);
  const { data: modalities } = useQuery('modalities', catalogService.getModalities);

  useEffect(() => {
    if (course) {
      setFormData({
        course_name: course.course_name,
        course_link: course.course_link,
        course_duration: course.course_duration,
        technology_id: course.technology_id?.toString() || '',
        course_modality_id: course.course_modality_id?.toString() || '',
        course_credentials: course.course_credentials || '',
      });
    } else {
      setFormData({
        course_name: '',
        course_link: '',
        course_duration: '',
        technology_id: '',
        course_modality_id: '',
        course_credentials: '',
      });
    }
  }, [course, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSend = {
      ...formData,
      technology_id: formData.technology_id ? parseInt(formData.technology_id) : undefined,
      course_modality_id: formData.course_modality_id ? parseInt(formData.course_modality_id) : undefined,
    };
    onSave(dataToSend);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">
          {course ? 'Editar Curso' : 'Nuevo Curso'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nombre del Curso *</label>
            <input
              type="text"
              required
              value={formData.course_name}
              onChange={(e) => setFormData({ ...formData, course_name: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">URL del Curso *</label>
            <input
              type="url"
              required
              value={formData.course_link}
              onChange={(e) => setFormData({ ...formData, course_link: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Duración *</label>
            <input
              type="time"
              required
              value={formData.course_duration}
              onChange={(e) => setFormData({ ...formData, course_duration: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Tecnología</label>
            <select
              value={formData.technology_id}
              onChange={(e) => setFormData({ ...formData, technology_id: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Seleccionar tecnología</option>
              {technologies?.map((tech) => (
                <option key={tech.technology_id} value={tech.technology_id}>
                  {tech.technology_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Modalidad</label>
            <select
              value={formData.course_modality_id}
              onChange={(e) => setFormData({ ...formData, course_modality_id: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Seleccionar modalidad</option>
              {modalities?.map((modality) => (
                <option key={modality.course_modality_id} value={modality.course_modality_id}>
                  {modality.course_modality_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Credenciales</label>
            <textarea
              value={formData.course_credentials}
              onChange={(e) => setFormData({ ...formData, course_credentials: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              rows={3}
              placeholder="Información sobre certificaciones o credenciales que otorga el curso"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1">
              {course ? 'Actualizar' : 'Crear'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const CoursesPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTechnology, setSelectedTechnology] = useState('');
  const [selectedModality, setSelectedModality] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | undefined>();

  const { data: courses, isLoading, refetch } = useQuery('courses', () => courseService.getCourses());
  const { data: technologies } = useQuery('technologies', catalogService.getTechnologies);
  const { data: modalities } = useQuery('modalities', catalogService.getModalities);

  const filteredCourses = courses?.filter((course) => {
    const matchesSearch = course.course_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTechnology = !selectedTechnology || course.technology?.technology_id.toString() === selectedTechnology;
    const matchesModality = !selectedModality || course.modality?.course_modality_id.toString() === selectedModality;
    
    return matchesSearch && matchesTechnology && matchesModality;
  });

  const handleSaveCourse = async (courseData: any) => {
    try {
      if (selectedCourse) {
        await courseService.updateCourse(selectedCourse.course_id, courseData);
        toast.success('Curso actualizado exitosamente');
      } else {
        await courseService.createCourse(courseData);
        toast.success('Curso creado exitosamente');
      }
      setIsModalOpen(false);
      setSelectedCourse(undefined);
      refetch();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Error al guardar el curso');
    }
  };

  const handleDeleteCourse = async (courseId: number) => {
    try {
      await courseService.deleteCourse(courseId);
      toast.success('Curso eliminado exitosamente');
      refetch();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Error al eliminar el curso');
    }
  };

  const handleEditCourse = (course: Course) => {
    setSelectedCourse(course);
    setIsModalOpen(true);
  };

  const handleNewCourse = () => {
    setSelectedCourse(undefined);
    setIsModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Cargando cursos...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Cursos</h1>
          <p className="text-gray-600 mt-2">
            Administra el catálogo de cursos y capacitaciones
          </p>
        </div>
        <Button onClick={handleNewCourse} className="flex items-center gap-2">
          <Plus size={20} />
          Nuevo Curso
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar cursos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            
            <select
              value={selectedTechnology}
              onChange={(e) => setSelectedTechnology(e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Todas las tecnologías</option>
              {technologies?.map((tech) => (
                <option key={tech.technology_id} value={tech.technology_id}>
                  {tech.technology_name}
                </option>
              ))}
            </select>

            <select
              value={selectedModality}
              onChange={(e) => setSelectedModality(e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Todas las modalidades</option>
              {modalities?.map((modality) => (
                <option key={modality.course_modality_id} value={modality.course_modality_id}>
                  {modality.course_modality_name}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de cursos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses?.map((course) => (
          <CourseCard
            key={course.course_id}
            course={course}
            onEdit={handleEditCourse}
            onDelete={handleDeleteCourse}
          />
        ))}
      </div>

      {filteredCourses?.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay cursos</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || selectedTechnology || selectedModality
              ? 'No se encontraron cursos con los filtros aplicados'
              : 'Comienza creando tu primer curso'}
          </p>
        </div>
      )}

      <CourseModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedCourse(undefined);
        }}
        course={selectedCourse}
        onSave={handleSaveCourse}
      />
    </div>
  );
};