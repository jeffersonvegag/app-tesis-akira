import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import {
  Training,
  TrainingMaterial,
  TrainingMaterialCreateForm,
  TrainingMaterialUpdateForm,
  UserRoles,
} from '@/types';
import {
  trainingMaterialService,
  userTrainingAssignmentService,
} from '@/services/api';
import {
  BookOpen,
  Plus,
  ExternalLink,
  FileText,
  Video,
  Link2,
  Edit,
  Trash2,
  ChevronDown,
  ChevronRight,
  Save,
  X,
  Calendar,
  User,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface MaterialsPageState {
  expandedTrainings: Set<number>;
  isCreateModalOpen: boolean;
  editingMaterial: TrainingMaterial | null;
  selectedTrainingId: number | null;
}

const MaterialsPage: React.FC = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const isInstructor = user?.role.role_id === UserRoles.INSTRUCTOR;
  const isClient = user?.role.role_id === UserRoles.CLIENT;

  const [state, setState] = useState<MaterialsPageState>({
    expandedTrainings: new Set(),
    isCreateModalOpen: false,
    editingMaterial: null,
    selectedTrainingId: null,
  });

  const [formData, setFormData] = useState<TrainingMaterialCreateForm>({
    training_id: 0,
    material_title: '',
    material_description: '',
    material_url: '',
    material_type: 'link',
  });

  // Queries - Obtener solo las capacitaciones asignadas al instructor
  const { data: assignedTrainings = [], isLoading: loadingTrainings } = useQuery(
    ['assigned-trainings-for-instructor', user?.user_id],
    async () => {
      if (!isInstructor || !user?.user_id) return Promise.resolve([]);
      // Obtener solo las capacitaciones asignadas a este instructor
      return trainingMaterialService.getInstructorAssignedTrainings(user.user_id);
    },
    { enabled: !!user?.user_id && isInstructor }
  );

  // Para clientes, obtenemos sus asignaciones primero
  const { data: clientAssignments = [] } = useQuery(
    ['user-training-assignments', user?.user_id],
    async () => {
      if (!user?.user_id || !isClient) return Promise.resolve([]);
      return userTrainingAssignmentService.getAssignmentsByUser(user.user_id);
    },
    { enabled: !!user?.user_id && isClient }
  );

  const { data: allMaterials = [], isLoading: loadingMaterials } = useQuery(
    ['training-materials', user?.user_id],
    async () => {
      if (!user?.user_id) return Promise.resolve([]);
      
      if (isInstructor) {
        return trainingMaterialService.getMaterials(user.user_id);
      } else if (isClient) {
        // Para clientes, obtener materiales de todas las capacitaciones
        return trainingMaterialService.getMaterials();
      }
      
      return Promise.resolve([]);
    },
    { enabled: !!user?.user_id }
  );

  // Mutations
  const createMaterialMutation = useMutation(
    (materialData: TrainingMaterialCreateForm) =>
      trainingMaterialService.createMaterial(materialData, user!.user_id),
    {
      onSuccess: () => {
        toast.success('Material creado exitosamente');
        queryClient.invalidateQueries('training-materials');
        handleCloseModal();
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.detail || 'Error al crear material');
      },
    }
  );

  const updateMaterialMutation = useMutation(
    ({ materialId, materialData }: { materialId: number; materialData: TrainingMaterialUpdateForm }) =>
      trainingMaterialService.updateMaterial(materialId, materialData, user!.user_id),
    {
      onSuccess: () => {
        toast.success('Material actualizado exitosamente');
        queryClient.invalidateQueries('training-materials');
        handleCloseModal();
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.detail || 'Error al actualizar material');
      },
    }
  );

  const deleteMaterialMutation = useMutation(
    (materialId: number) => trainingMaterialService.deleteMaterial(materialId, user!.user_id),
    {
      onSuccess: () => {
        toast.success('Material eliminado exitosamente');
        queryClient.invalidateQueries('training-materials');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.detail || 'Error al eliminar material');
      },
    }
  );

  // Helper functions
  const toggleTrainingExpansion = (trainingId: number) => {
    setState(prev => {
      const newExpanded = new Set(prev.expandedTrainings);
      if (newExpanded.has(trainingId)) {
        newExpanded.delete(trainingId);
      } else {
        newExpanded.add(trainingId);
      }
      return { ...prev, expandedTrainings: newExpanded };
    });
  };

  const getMaterialsByTraining = (trainingId: number) => {
    return allMaterials.filter(material => material.training_id === trainingId);
  };

  const handleOpenCreateModal = (trainingId: number) => {
    setState(prev => ({
      ...prev,
      isCreateModalOpen: true,
      selectedTrainingId: trainingId,
      editingMaterial: null,
    }));
    setFormData({
      training_id: trainingId,
      material_title: '',
      material_description: '',
      material_url: '',
      material_type: 'link',
    });
  };

  const handleOpenEditModal = (material: TrainingMaterial) => {
    setState(prev => ({
      ...prev,
      isCreateModalOpen: true,
      editingMaterial: material,
      selectedTrainingId: material.training_id,
    }));
    setFormData({
      training_id: material.training_id,
      material_title: material.material_title,
      material_description: material.material_description || '',
      material_url: material.material_url,
      material_type: material.material_type,
    });
  };

  const handleCloseModal = () => {
    setState(prev => ({
      ...prev,
      isCreateModalOpen: false,
      editingMaterial: null,
      selectedTrainingId: null,
    }));
    setFormData({
      training_id: 0,
      material_title: '',
      material_description: '',
      material_url: '',
      material_type: 'link',
    });
  };

  const handleSubmit = () => {
    if (!formData.material_title.trim() || !formData.material_url.trim()) {
      toast.error('Título y enlace son obligatorios');
      return;
    }

    if (state.editingMaterial) {
      updateMaterialMutation.mutate({
        materialId: state.editingMaterial.material_id,
        materialData: {
          material_title: formData.material_title,
          material_description: formData.material_description,
          material_url: formData.material_url,
          material_type: formData.material_type,
        },
      });
    } else {
      createMaterialMutation.mutate(formData);
    }
  };

  const handleDelete = (material: TrainingMaterial) => {
    if (window.confirm(`¿Estás seguro de eliminar "${material.material_title}"?`)) {
      deleteMaterialMutation.mutate(material.material_id);
    }
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="w-4 h-4 text-red-500" />;
      case 'document':
        return <FileText className="w-4 h-4 text-blue-500" />;
      case 'link':
      default:
        return <Link2 className="w-4 h-4 text-green-500" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'video':
        return 'bg-red-100 text-red-700';
      case 'document':
        return 'bg-blue-100 text-blue-700';
      case 'link':
      default:
        return 'bg-green-100 text-green-700';
    }
  };

  if (!user) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Material de Apoyo</h1>
        <p className="text-gray-600 mt-1">
          {isInstructor 
            ? 'Gestiona los materiales de apoyo para tus capacitaciones asignadas'
            : 'Accede a los materiales de apoyo de tus capacitaciones'
          }
        </p>
      </div>

      {/* Lista de capacitaciones */}
      {loadingTrainings || loadingMaterials ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (isInstructor && assignedTrainings.length === 0) || (isClient && clientAssignments.length === 0) ? (
        <Card className="p-8 text-center">
          <BookOpen className="mx-auto w-16 h-16 text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {isInstructor ? 'No tienes capacitaciones asignadas' : 'No tienes capacitaciones asignadas'}
          </h3>
          <p className="text-gray-600">
            {isInstructor 
              ? 'Contacta al supervisor para que te asigne capacitaciones'
              : 'Contacta a tu supervisor para que te asigne capacitaciones'
            }
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {(isInstructor ? assignedTrainings : 
            // Para clientes, usar las capacitaciones de sus asignaciones
            clientAssignments.map(assignment => assignment.training).filter(Boolean)
          ).map((training) => {
            const materials = getMaterialsByTraining(training.training_id);
            const isExpanded = state.expandedTrainings.has(training.training_id);
            
            // Auto-expandir si tiene materiales y es la primera vez que se renderiza
            if (materials.length > 0 && !isExpanded) {
              setTimeout(() => {
                setState(prev => ({
                  ...prev,
                  expandedTrainings: new Set([...prev.expandedTrainings, training.training_id])
                }));
              }, 100);
            }

            return (
              <Card key={training.training_id} className="overflow-hidden">
                <CardHeader 
                  className="cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
                  onClick={() => toggleTrainingExpansion(training.training_id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5 text-gray-600" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-600" />
                        )}
                        <BookOpen className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{training.training_name}</CardTitle>
                        {training.training_description && (
                          <p className="text-sm text-gray-600 mt-1">{training.training_description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full font-medium">
                        {materials.length} materiales
                      </span>
                      {isInstructor && (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenCreateModal(training.training_id);
                          }}
                          size="sm"
                          className="flex items-center space-x-1"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Agregar Material</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="p-6">
                    {materials.length === 0 ? (
                      <div className="text-center py-8">
                        <FileText className="mx-auto w-12 h-12 text-gray-400 mb-4" />
                        <p className="text-gray-500">
                          {isInstructor 
                            ? 'No has subido materiales para esta capacitación'
                            : 'El instructor aún no ha subido materiales'
                          }
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {materials.map((material) => (
                          <Card key={material.material_id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center space-x-2">
                                  {getIconForType(material.material_type)}
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(material.material_type)}`}>
                                    {material.material_type}
                                  </span>
                                </div>
                                {isInstructor && (
                                  <div className="flex space-x-1">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleOpenEditModal(material)}
                                      className="p-1"
                                    >
                                      <Edit className="w-3 h-3" />
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleDelete(material)}
                                      className="p-1 text-red-600 hover:bg-red-50"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                )}
                              </div>

                              <h4 className="font-medium text-gray-900 mb-2 line-clamp-2">
                                {material.material_title}
                              </h4>

                              {material.material_description && (
                                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                  {material.material_description}
                                </p>
                              )}

                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-1 text-xs text-gray-500">
                                  <Calendar className="w-3 h-3" />
                                  <span>{new Date(material.material_created_at).toLocaleDateString('es-ES')}</span>
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    let url = material.material_url;
                                    // Agregar protocolo si no lo tiene
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
                              </div>

                              {isClient && (
                                <div className="mt-3 pt-3 border-t">
                                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                                    <User className="w-3 h-3" />
                                    <span>Instructor: {material.instructor.person.person_first_name} {material.instructor.person.person_last_name}</span>
                                  </div>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal para crear/editar material */}
      {state.isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {state.editingMaterial ? 'Editar Material' : 'Nuevo Material de Apoyo'}
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCloseModal}
                className="p-2"
              >
                <X size={16} />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título *
                </label>
                <Input
                  value={formData.material_title}
                  onChange={(e) => setFormData(prev => ({ ...prev, material_title: e.target.value }))}
                  placeholder="Nombre del material"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Material
                </label>
                <select
                  value={formData.material_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, material_type: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="link">Enlace</option>
                  <option value="document">Documento</option>
                  <option value="video">Video</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL/Enlace *
                </label>
                <Input
                  type="url"
                  value={formData.material_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, material_url: e.target.value }))}
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción
                </label>
                <textarea
                  value={formData.material_description}
                  onChange={(e) => setFormData(prev => ({ ...prev, material_description: e.target.value }))}
                  placeholder="Descripción del material..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={handleCloseModal}
                disabled={createMaterialMutation.isLoading || updateMaterialMutation.isLoading}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createMaterialMutation.isLoading || updateMaterialMutation.isLoading}
                className="flex items-center space-x-2"
              >
                {(createMaterialMutation.isLoading || updateMaterialMutation.isLoading) && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                )}
                <Save size={16} />
                <span>
                  {state.editingMaterial ? 'Actualizar' : 'Crear'}
                </span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaterialsPage;