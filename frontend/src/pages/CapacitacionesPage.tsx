import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useAuthStore } from '@/store/authStore';
import { trainingService, userTrainingAssignmentService } from '@/services/api';
import { Training, Technology } from '@/types';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/ui';
import { BookOpen, Users, CheckCircle, Plus, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

const TrainingCard: React.FC<{
  training: Training;
  onSelect: (training: Training) => void;
  isAssigned: boolean;
}> = ({ training, onSelect, isAssigned }) => {
  const [technologies, setTechnologies] = useState<Technology[]>([]);
  const [loadingTechnologies, setLoadingTechnologies] = useState(false);

  const loadTechnologies = async () => {
    if (technologies.length === 0) {
      setLoadingTechnologies(true);
      try {
        const techs = await trainingService.getTrainingTechnologies(training.training_id);
        setTechnologies(techs);
      } catch (error) {
        console.error('Error loading technologies:', error);
      } finally {
        setLoadingTechnologies(false);
      }
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg line-clamp-2">{training.training_name}</CardTitle>
            {training.training_description && (
              <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                {training.training_description}
              </p>
            )}
            <div className="flex items-center gap-2 mt-3">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                training.training_status === 'A' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
              }`}>
                {training.training_status === 'A' ? 'Disponible' : 'Inactiva'}
              </span>
              {isAssigned && (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Ya asignada
                </span>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadTechnologies}
              className="w-full"
              disabled={loadingTechnologies}
            >
              {loadingTechnologies ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Users className="w-4 h-4 mr-2" />
              )}
              Ver Tecnologías ({technologies.length || '?'})
            </Button>
            
            {technologies.length > 0 && (
              <div className="mt-2 space-y-1">
                {technologies.map(tech => (
                  <div key={tech.technology_id} className="text-xs bg-gray-50 px-2 py-1 rounded">
                    {tech.technology_name}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">
              Creada: {new Date(training.training_created_at).toLocaleDateString('es-ES')}
            </span>
            <Button
              onClick={() => onSelect(training)}
              disabled={training.training_status !== 'A' || isAssigned}
              size="sm"
              className="flex items-center gap-2"
            >
              {isAssigned ? (
                <CheckCircle size={14} />
              ) : (
                <Plus size={14} />
              )}
              {isAssigned ? 'Asignada' : 'Seleccionar'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const CapacitacionesPage: React.FC = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  // Obtener capacitaciones disponibles
  const { data: trainings, isLoading: loadingTrainings } = useQuery(
    'available-trainings', 
    () => trainingService.getTrainings()
  );

  // Obtener capacitaciones ya asignadas al usuario
  const { data: userAssignments, isLoading: loadingAssignments } = useQuery(
    ['user-training-assignments', user?.user_id],
    () => user ? userTrainingAssignmentService.getAssignmentsByUser(user.user_id) : [],
    { enabled: !!user }
  );

  // Mutación para asignar capacitación
  const assignTrainingMutation = useMutation(
    userTrainingAssignmentService.createAssignment,
    {
      onSuccess: () => {
        toast.success('Capacitación asignada exitosamente');
        queryClient.invalidateQueries(['user-training-assignments', user?.user_id]);
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.detail || 'Error al asignar capacitación');
      },
    }
  );

  const handleSelectTraining = (training: Training) => {
    if (!user) {
      toast.error('Usuario no autenticado');
      return;
    }

    assignTrainingMutation.mutate({
      user_id: user.user_id,
      training_id: training.training_id,
    });
  };

  const assignedTrainingIds = userAssignments?.map(assignment => assignment.training_id) || [];

  if (loadingTrainings || loadingAssignments) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Cargando capacitaciones...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Capacitaciones Disponibles</h1>
          <p className="text-gray-600 mt-2">
            Selecciona las capacitaciones que deseas tomar
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-600">
            <div>Total disponibles: {trainings?.filter(t => t.training_status === 'A').length || 0}</div>
            <div>Ya asignadas: {userAssignments?.length || 0}</div>
          </div>
        </div>
      </div>

      {/* Lista de capacitaciones */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {trainings?.map((training) => (
          <TrainingCard
            key={training.training_id}
            training={training}
            onSelect={handleSelectTraining}
            isAssigned={assignedTrainingIds.includes(training.training_id)}
          />
        ))}
      </div>

      {(!trainings || trainings.length === 0) && (
        <div className="text-center py-12">
          <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay capacitaciones</h3>
          <p className="mt-1 text-sm text-gray-500">
            No hay capacitaciones disponibles en este momento
          </p>
        </div>
      )}
    </div>
  );
};