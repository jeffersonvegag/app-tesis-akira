import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-hot-toast';
import {
  Team,
  TeamCreateWithMembersForm,
  User,
  UserRoles,
} from '@/types';
import {
  teamService,
  userService,
  userTrainingAssignmentService,
  trainingService,
  technologyProgressService,
  materialProgressService,
  trainingMaterialService,
} from '@/services/api';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Users,
  Crown,
  GraduationCap,
  UserCheck,
  X,
  Save,
  UserPlus,
  BookOpen,
  BarChart3,
  CheckCircle,
  Clock,
  Target,
  TrendingUp,
  Award,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/store/authStore';

interface TeamsPageState {
  searchTerm: string;
  isCreateModalOpen: boolean;
  selectedTeam: Team | null;
  isEditModalOpen: boolean;
  isAddMemberModalOpen: boolean;
  isAssignCourseModalOpen: boolean;
  isAssignTrainingModalOpen: boolean;
  selectedMemberType: 'client' | 'instructor';
  isClientAssignmentsModalOpen: boolean;
  selectedClientId: number | null;
}

const TeamsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuthStore();
  const isSupervisor = currentUser?.role.role_id === UserRoles.SUPERVISOR;
  const [state, setState] = useState<TeamsPageState>({
    searchTerm: '',
    isCreateModalOpen: false,
    selectedTeam: null,
    isEditModalOpen: false,
    isAddMemberModalOpen: false,
    isAssignCourseModalOpen: false,
    isAssignTrainingModalOpen: false,
    selectedMemberType: 'client',
    isClientAssignmentsModalOpen: false,
    selectedClientId: null,
  });

  const [formData, setFormData] = useState<TeamCreateWithMembersForm>({
    team_name: '',
    team_description: '',
    supervisor_id: 0,
    instructors: [],
    clients: [],
  });

  // Queries
  const { data: teams = [], isLoading: loadingTeams } = useQuery(
    'teams',
    () => teamService.getTeams()
  );

  // Filter teams based on user role
  const filteredTeamsByRole = isSupervisor 
    ? teams.filter(team => team.supervisor.user_id === currentUser?.user_id)
    : teams;

  const { data: users = [] } = useQuery('users', () => userService.getUsers());

  // Obtener capacitaciones disponibles
  const { data: trainings = [] } = useQuery('trainings', () => trainingService.getTrainings());

  // Obtener asignaciones del cliente seleccionado
  const { data: clientAssignments = [] } = useQuery(
    ['client-assignments', state.selectedClientId],
    () => state.selectedClientId ? userTrainingAssignmentService.getAssignmentsByUser(state.selectedClientId) : [],
    { enabled: !!state.selectedClientId }
  );

  // Obtener todas las asignaciones para calcular estadísticas
  const { data: allAssignments = [] } = useQuery(
    'user-training-assignments', 
    () => userTrainingAssignmentService.getAssignments(),
    { enabled: isSupervisor && !!currentUser?.user_id }
  );

  // Obtener todos los progresos de tecnologías para calcular completación real
  const { data: allTechnologyProgress = [] } = useQuery(
    'all-technology-progress',
    async () => {
      const allProgress = [];
      for (const assignment of allAssignments) {
        try {
          const progress = await technologyProgressService.getProgressByAssignment(assignment.assignment_id);
          allProgress.push(...progress);
        } catch (error) {
          // Silently handle errors for assignments without progress
        }
      }
      return allProgress;
    },
    { enabled: isSupervisor && allAssignments.length > 0 }
  );

  // Obtener todos los progresos de materiales para calcular completación real
  const { data: allMaterialProgress = [] } = useQuery(
    'all-material-progress',
    async () => {
      const allProgress = [];
      for (const assignment of allAssignments) {
        try {
          const progress = await materialProgressService.getProgressByAssignment(assignment.assignment_id);
          allProgress.push(...progress);
        } catch (error) {
          // Silently handle errors for assignments without progress
        }
      }
      return allProgress;
    },
    { enabled: isSupervisor && allAssignments.length > 0 }
  );

  // Obtener todos los materiales para calcular totales
  const { data: allTrainingMaterials = [] } = useQuery(
    'all-training-materials',
    async () => {
      const allMaterials = [];
      const processedTrainings = new Set();
      
      for (const assignment of allAssignments) {
        if (!processedTrainings.has(assignment.training_id)) {
          processedTrainings.add(assignment.training_id);
          try {
            const materials = await trainingMaterialService.getMaterials(undefined, assignment.training_id);
            allMaterials.push(...materials.map(m => ({ ...m, training_id: assignment.training_id })));
          } catch (error) {
            // Silently handle errors
          }
        }
      }
      return allMaterials;
    },
    { enabled: isSupervisor && allAssignments.length > 0 }
  );

  // Mutations
  const createTeamMutation = useMutation(
    (teamData: TeamCreateWithMembersForm) => teamService.createTeam(teamData),
    {
      onSuccess: () => {
        toast.success('Equipo creado exitosamente');
        // Invalidar todas las queries relacionadas para refrescar completamente la vista
        queryClient.invalidateQueries('teams');
        queryClient.invalidateQueries('users');
        queryClient.invalidateQueries('user-training-assignments');
        queryClient.invalidateQueries('all-technology-progress');
        queryClient.invalidateQueries('all-material-progress');
        queryClient.invalidateQueries('all-training-materials');
        setState(prev => ({ ...prev, isCreateModalOpen: false }));
        resetForm();
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.detail || 'Error al crear equipo');
      },
    }
  );

  const deleteTeamMutation = useMutation(
    (teamId: number) => teamService.deleteTeam(teamId),
    {
      onSuccess: () => {
        toast.success('Equipo eliminado exitosamente');
        // Invalidar todas las queries relacionadas para refrescar completamente la vista
        queryClient.invalidateQueries('teams');
        queryClient.invalidateQueries('users');
        queryClient.invalidateQueries('user-training-assignments');
        queryClient.invalidateQueries('all-technology-progress');
        queryClient.invalidateQueries('all-material-progress');
        queryClient.invalidateQueries('all-training-materials');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.detail || 'Error al eliminar equipo');
      },
    }
  );

  const addMemberMutation = useMutation(
    ({ teamId, memberData }: { teamId: number, memberData: { user_id: number, member_role: 'client' | 'instructor' } }) => 
      teamService.addTeamMember(teamId, memberData),
    {
      onSuccess: () => {
        toast.success('Miembro agregado exitosamente');
        // Invalidar todas las queries relacionadas para refrescar completamente la vista
        queryClient.invalidateQueries('teams');
        queryClient.invalidateQueries('users');
        queryClient.invalidateQueries('user-training-assignments');
        queryClient.invalidateQueries('all-technology-progress');
        queryClient.invalidateQueries('all-material-progress');
        queryClient.invalidateQueries('all-training-materials');
        setState(prev => ({ ...prev, isAddMemberModalOpen: false }));
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.detail || 'Error al agregar miembro');
      },
    }
  );

  const updateTeamMutation = useMutation(
    ({ teamId, teamData }: { teamId: number, teamData: { team_name: string, team_description: string, supervisor_id: number } }) => 
      teamService.updateTeam(teamId, teamData),
    {
      onSuccess: () => {
        toast.success('Equipo actualizado exitosamente');
        // Invalidar todas las queries relacionadas para refrescar completamente la vista
        queryClient.invalidateQueries('teams');
        queryClient.invalidateQueries('users');
        queryClient.invalidateQueries('user-training-assignments');
        queryClient.invalidateQueries('all-technology-progress');
        queryClient.invalidateQueries('all-material-progress');
        queryClient.invalidateQueries('all-training-materials');
        setState(prev => ({ ...prev, isEditModalOpen: false, selectedTeam: null }));
        resetForm();
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.detail || 'Error al actualizar equipo');
      },
    }
  );

  const removeMemberMutation = useMutation(
    ({ teamId, memberId }: { teamId: number, memberId: number }) => 
      teamService.removeTeamMember(teamId, memberId),
    {
      onSuccess: () => {
        toast.success('Miembro removido exitosamente');
        // Invalidar todas las queries relacionadas para refrescar completamente la vista
        queryClient.invalidateQueries('teams');
        queryClient.invalidateQueries('users');
        queryClient.invalidateQueries('user-training-assignments');
        queryClient.invalidateQueries('all-technology-progress');
        queryClient.invalidateQueries('all-material-progress');
        queryClient.invalidateQueries('all-training-materials');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.detail || 'Error al remover miembro');
      },
    }
  );

  const assignTrainingMutation = useMutation(
    async ({ teamId, trainingId, instructorId }: { teamId: number, trainingId: number, instructorId?: number }) => {
      // Obtener todos los clientes del equipo
      const team = teams.find(t => t.team_id === teamId);
      if (!team) throw new Error('Equipo no encontrado');
      
      const clients = team.team_members.filter(m => m.member_role === 'client');
      
      // Asignar la capacitación a cada cliente del equipo usando el servicio API
      const assignments = await Promise.all(
        clients.map(async (client) => {
          return userTrainingAssignmentService.createAssignment({
            user_id: client.user_id,
            training_id: trainingId,
            instructor_id: instructorId
          });
        })
      );
      
      return assignments;
    },
    {
      onSuccess: () => {
        toast.success('Capacitación asignada exitosamente a todos los miembros del equipo');
        // Invalidar todas las queries relacionadas para refrescar completamente la vista
        queryClient.invalidateQueries('teams');
        queryClient.invalidateQueries('users');
        queryClient.invalidateQueries('user-training-assignments');
        queryClient.invalidateQueries('all-technology-progress');
        queryClient.invalidateQueries('all-material-progress');
        queryClient.invalidateQueries('all-training-materials');
        setState(prev => ({ ...prev, isAssignTrainingModalOpen: false, selectedTeam: null }));
      },
      onError: (error: any) => {
        console.error('Error al asignar capacitación:', error);
        const message = error?.message || 'Error al asignar capacitación';
        toast.error(message);
      },
    }
  );

  // Filter users by role
  const supervisors = users.filter(user => user.role.role_id === UserRoles.SUPERVISOR);
  const instructors = users.filter(user => user.role.role_id === UserRoles.INSTRUCTOR);
  const clients = users.filter(user => user.role.role_id === UserRoles.CLIENT);

  // Debug logs
  React.useEffect(() => {
    console.log('Todos los usuarios:', users);
    console.log('UserRoles.INSTRUCTOR:', UserRoles.INSTRUCTOR);
    console.log('Instructores filtrados:', instructors);
    console.log('Supervisores filtrados:', supervisors);
    console.log('Clientes filtrados:', clients);
  }, [users, instructors, supervisors, clients]);

  // Filter teams
  const filteredTeams = filteredTeamsByRole.filter(team =>
    team.team_name.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
    team.supervisor.person.person_first_name.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
    team.supervisor.person.person_last_name.toLowerCase().includes(state.searchTerm.toLowerCase())
  );

  const resetForm = () => {
    setFormData({
      team_name: '',
      team_description: '',
      supervisor_id: 0,
      instructors: [],
      clients: [],
    });
  };

  const handleSubmit = () => {
    if (!formData.team_name.trim()) {
      toast.error('El nombre del equipo es requerido');
      return;
    }
    if (!formData.supervisor_id) {
      toast.error('Debe seleccionar un supervisor');
      return;
    }

    createTeamMutation.mutate(formData);
  };

  const handleDeleteTeam = (team: Team) => {
    if (window.confirm(`¿Está seguro de eliminar el equipo "${team.team_name}"?`)) {
      deleteTeamMutation.mutate(team.team_id);
    }
  };

  const handleAddMember = (team: Team, memberType: 'client' | 'instructor') => {
    setState(prev => ({ 
      ...prev, 
      selectedTeam: team,
      isAddMemberModalOpen: true,
      selectedMemberType: memberType
    }));
  };

  const handleAddMemberSubmit = (userId: number) => {
    if (!state.selectedTeam) return;
    
    addMemberMutation.mutate({
      teamId: state.selectedTeam.team_id,
      memberData: {
        user_id: userId,
        member_role: state.selectedMemberType
      }
    });
  };

  // Get available users to add (not already in the team)
  const getAvailableUsers = (team: Team, role: 'client' | 'instructor') => {
    const targetUsers = role === 'client' ? clients : instructors;
    const existingMemberIds = team.team_members.map(member => member.user_id);
    return targetUsers.filter(user => !existingMemberIds.includes(user.user_id));
  };

  const handleEditTeam = (team: Team) => {
    setState(prev => ({ ...prev, selectedTeam: team, isEditModalOpen: true }));
    setFormData({
      team_name: team.team_name,
      team_description: team.team_description || '',
      supervisor_id: team.supervisor.user_id,
      instructors: team.team_members.filter(m => m.member_role === 'instructor').map(m => m.user_id),
      clients: team.team_members.filter(m => m.member_role === 'client').map(m => m.user_id),
    });
  };

  const handleUpdateTeam = () => {
    if (!state.selectedTeam) return;
    if (!formData.team_name.trim()) {
      toast.error('El nombre del equipo es requerido');
      return;
    }
    if (!formData.supervisor_id) {
      toast.error('Debe seleccionar un supervisor');
      return;
    }

    updateTeamMutation.mutate({
      teamId: state.selectedTeam.team_id,
      teamData: {
        team_name: formData.team_name,
        team_description: formData.team_description,
        supervisor_id: formData.supervisor_id
      }
    });
  };

  const handleRemoveMember = (teamId: number, memberId: number) => {
    if (window.confirm('¿Está seguro de remover este miembro del equipo?')) {
      removeMemberMutation.mutate({ teamId, memberId });
    }
  };

  // Función para calcular si una asignación está realmente completa basándose en progresos individuales
  const isAssignmentReallyCompleted = (assignment: any): boolean => {
    // Si ya está marcada como completed en el backend, es completed
    if (assignment.assignment_status === 'completed') {
      return true;
    }

    // Calcular si está completa basándose en elementos marcados
    const assignmentId = assignment.assignment_id;
    const trainingId = assignment.training_id;

    // Obtener tecnologías para esta capacitación
    const trainingTechnologies = assignment.training?.training_technologies || [];
    const technologyProgress = allTechnologyProgress.filter(p => p.assignment_id === assignmentId);
    const completedTechnologies = technologyProgress.filter(p => p.is_completed === 'Y').length;

    // Obtener materiales para esta capacitación
    const trainingMaterials = allTrainingMaterials.filter(m => m.training_id === trainingId);
    const materialProgress = allMaterialProgress.filter(p => p.assignment_id === assignmentId);
    const completedMaterials = materialProgress.filter(p => p.is_completed === 'Y' && p.material_id).length;

    // Obtener URLs del instructor
    const instructorUrls = assignment.instructor_urls || [];
    const completedUrls = materialProgress.filter(p => p.is_completed === 'Y' && p.url_id).length;

    // Calcular totales
    const totalItems = trainingTechnologies.length + trainingMaterials.length + instructorUrls.length;
    const completedItems = completedTechnologies + completedMaterials + completedUrls;

    // La asignación está completa si todos los elementos están marcados
    return totalItems > 0 && completedItems === totalItems;
  };

  // Función para calcular el porcentaje real de progreso de una asignación
  const getAssignmentProgressPercentage = (assignment: any): number => {
    // Si ya está marcada como completed en el backend, es 100%
    if (assignment.assignment_status === 'completed') {
      return 100;
    }

    // Calcular porcentaje basándose en elementos marcados
    const assignmentId = assignment.assignment_id;
    const trainingId = assignment.training_id;

    // Obtener tecnologías para esta capacitación
    const trainingTechnologies = assignment.training?.training_technologies || [];
    const technologyProgress = allTechnologyProgress.filter(p => p.assignment_id === assignmentId);
    const completedTechnologies = technologyProgress.filter(p => p.is_completed === 'Y').length;

    // Obtener materiales para esta capacitación
    const trainingMaterials = allTrainingMaterials.filter(m => m.training_id === trainingId);
    const materialProgress = allMaterialProgress.filter(p => p.assignment_id === assignmentId);
    const completedMaterials = materialProgress.filter(p => p.is_completed === 'Y' && p.material_id).length;

    // Obtener URLs del instructor
    const instructorUrls = assignment.instructor_urls || [];
    const completedUrls = materialProgress.filter(p => p.is_completed === 'Y' && p.url_id).length;

    // Calcular totales
    const totalItems = trainingTechnologies.length + trainingMaterials.length + instructorUrls.length;
    const completedItems = completedTechnologies + completedMaterials + completedUrls;

    // Calcular porcentaje
    return totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
  };

  const stats = React.useMemo(() => {
    const totalTeams = filteredTeamsByRole.length;
    const totalMembers = filteredTeamsByRole.reduce((acc, team) => acc + team.team_members.length, 0);
    const activeInstructors = new Set(
      filteredTeamsByRole.flatMap(team => 
        team.team_members
          .filter(member => member.member_role === 'instructor')
          .map(member => member.user_id)
      )
    ).size;
    const activeClients = new Set(
      filteredTeamsByRole.flatMap(team => 
        team.team_members
          .filter(member => member.member_role === 'client')
          .map(member => member.user_id)
      )
    ).size;

    // Calcular estadísticas de capacitaciones para el supervisor
    const supervisorTeams = filteredTeamsByRole.filter(team => 
      team.supervisor.user_id === currentUser?.user_id
    );
    const allMemberIds = supervisorTeams.flatMap(team => 
      team.team_members.map(member => member.user_id)
    );
    const supervisorAssignments = allAssignments.filter(assignment => 
      allMemberIds.includes(assignment.user_id)
    );

    // Capacitaciones únicas activas
    const activeTrainings = new Set(
      supervisorAssignments.map(assignment => assignment.training_id)
    ).size;

    // Total de asignaciones completadas (usando lógica real de completación)
    const completedAssignments = supervisorAssignments.filter(
      assignment => isAssignmentReallyCompleted(assignment)
    ).length;

    // Progreso promedio (basado en porcentajes reales de cada asignación)
    const averageProgress = supervisorAssignments.length > 0
      ? Math.round(supervisorAssignments.reduce((acc, assignment) => 
          acc + getAssignmentProgressPercentage(assignment), 0
        ) / supervisorAssignments.length)
      : 0;

    return {
      totalTeams,
      totalMembers,
      activeInstructors,
      activeClients,
      activeTrainings,
      completedAssignments,
      averageProgress
    };
  }, [filteredTeamsByRole, currentUser?.user_id, allAssignments, allTechnologyProgress, allMaterialProgress, allTrainingMaterials]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isSupervisor ? 'Mi Equipo' : 'Gestión de Equipos'}
          </h1>
          <p className="text-gray-600 mt-1">
            {isSupervisor 
              ? 'Administra tu equipo de trabajo, agrega clientes y asigna capacitaciones'
              : 'Crear y administrar equipos de trabajo con supervisores, instructores y clientes'
            }
          </p>
        </div>
        {!isSupervisor && (
          <Button
            onClick={() => setState(prev => ({ ...prev, isCreateModalOpen: true }))}
            className="flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Crear Equipo</span>
          </Button>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {isSupervisor ? (
          <>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Miembros</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.totalMembers}</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Capacitaciones Activas</p>
                  <p className="text-2xl font-bold text-green-600">{stats.activeTrainings}</p>
                </div>
                <BookOpen className="w-8 h-8 text-green-600" />
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Progreso Promedio</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.averageProgress}%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completados</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.completedAssignments}</p>
                </div>
                <Award className="w-8 h-8 text-orange-600" />
              </div>
            </Card>
          </>
        ) : (
          <>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Equipos</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalTeams}</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Miembros</p>
                  <p className="text-2xl font-bold text-green-600">{stats.totalMembers}</p>
                </div>
                <UserCheck className="w-8 h-8 text-green-600" />
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Instructores Activos</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.activeInstructors}</p>
                </div>
                <GraduationCap className="w-8 h-8 text-purple-600" />
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Clientes Activos</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.activeClients}</p>
                </div>
                <Users className="w-8 h-8 text-orange-600" />
              </div>
            </Card>
          </>
        )}
      </div>

      {isSupervisor && (
        <>
          {/* Training Management Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Capacitaciones Asignadas</h2>
              </div>
              <div className="space-y-3">
                {(() => {
                  // Obtener todas las asignaciones de los equipos del supervisor
                  const supervisorTeams = teams.filter(team => team.supervisor.user_id === currentUser?.user_id);
                  const allMemberIds = supervisorTeams.flatMap(team => 
                    team.team_members.map(member => member.user_id)
                  );
                  const supervisorAssignments = allAssignments.filter(assignment => 
                    allMemberIds.includes(assignment.user_id)
                  );

                  // Agrupar por capacitación y calcular estadísticas
                  const trainingStats = supervisorAssignments.reduce((acc, assignment) => {
                    const trainingId = assignment.training_id;
                    if (!acc[trainingId]) {
                      acc[trainingId] = {
                        training: assignment.training,
                        assignments: [],
                        completed: 0,
                        total: 0
                      };
                    }
                    acc[trainingId].assignments.push(assignment);
                    acc[trainingId].total++;
                    if (isAssignmentReallyCompleted(assignment)) {
                      acc[trainingId].completed++;
                    }
                    return acc;
                  }, {} as any);

                  const trainingList = Object.values(trainingStats);

                  if (trainingList.length === 0) {
                    return (
                      <div className="text-center py-8">
                        <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          Sin capacitaciones asignadas
                        </h3>
                        <p className="text-gray-600">
                          No hay capacitaciones asignadas a tus equipos aún
                        </p>
                      </div>
                    );
                  }

                  return trainingList.map((trainingStat: any, index: number) => {
                    // Calcular progreso promedio basado en porcentajes reales de cada asignación
                    const progress = trainingStat.total > 0 
                      ? Math.round(trainingStat.assignments.reduce((acc: number, assignment: any) => 
                          acc + getAssignmentProgressPercentage(assignment), 0
                        ) / trainingStat.total)
                      : 0;
                    
                    return (
                      <div key={index} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium text-gray-900">{trainingStat.training?.training_name || 'Capacitación'}</h3>
                          <span className="text-sm text-gray-500">{trainingStat.completed}/{trainingStat.total} completados</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all ${progress === 100 ? 'bg-green-600' : 'bg-blue-600'}`}
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{progress}% completado</p>
                      </div>
                    );
                  });
                })()}
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Progreso del Equipo</h2>
              <div className="space-y-4">
                {(() => {
                  // Obtener todos los miembros de los equipos del supervisor
                  const supervisorTeams = teams.filter(team => team.supervisor.user_id === currentUser?.user_id);
                  const allClients = supervisorTeams.flatMap(team => 
                    team.team_members.filter(member => member.member_role === 'client')
                  );

                  if (allClients.length === 0) {
                    return (
                      <div className="text-center py-8">
                        <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          Sin clientes en tus equipos
                        </h3>
                        <p className="text-gray-600">
                          Agrega clientes a tus equipos para ver su progreso
                        </p>
                      </div>
                    );
                  }

                  // Calcular progreso real para cada cliente
                  return allClients.map((client, index) => {
                    const clientAssignments = allAssignments.filter(assignment => 
                      assignment.user_id === client.user_id
                    );
                    
                    const totalAssignments = clientAssignments.length;
                    const completedAssignments = clientAssignments.filter(
                      assignment => isAssignmentReallyCompleted(assignment)
                    ).length;
                    
                    // Calcular progreso promedio basado en porcentajes individuales de cada asignación
                    const progress = totalAssignments > 0 
                      ? Math.round(clientAssignments.reduce((acc, assignment) => 
                          acc + getAssignmentProgressPercentage(assignment), 0
                        ) / totalAssignments)
                      : 0;

                    const clientName = `${client.user.person.person_first_name} ${client.user.person.person_last_name}`;
                    
                    return (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">
                              {client.user.person.person_first_name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{clientName}</p>
                            <p className="text-sm text-gray-500">
                              {completedAssignments}/{totalAssignments} capacitaciones
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                progress === 100 ? 'bg-green-600' : 'bg-blue-600'
                              }`} 
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-gray-700">{progress}%</span>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </Card>
          </div>
        </>
      )}


      {/* Teams Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {loadingTeams ? (
          Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </Card>
          ))
        ) : filteredTeams.length === 0 ? (
          <div className="col-span-full">
            <Card className="p-8 text-center">
              <Users className="mx-auto w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron equipos</h3>
              <p className="text-gray-500">Crea un nuevo equipo o ajusta los filtros de búsqueda</p>
            </Card>
          </div>
        ) : (
          filteredTeams.map((team) => (
            <Card key={team.team_id} className="p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">{team.team_name}</h3>
                  </div>
                  {team.team_description && (
                    <p className="text-sm text-gray-600 mb-2">{team.team_description}</p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {isSupervisor && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddMember(team, 'client')}
                        className="p-2 text-green-600 hover:bg-green-50"
                        title="Agregar Cliente"
                      >
                        <UserPlus size={16} />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setState(prev => ({ ...prev, selectedTeam: team, isAssignCourseModalOpen: true }))}
                        className="p-2 text-blue-600 hover:bg-blue-50"
                        title="Asignar Capacitación"
                      >
                        <BookOpen size={16} />
                      </Button>
                    </>
                  )}
                  {!isSupervisor && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setState(prev => ({ ...prev, selectedTeam: team, isAssignTrainingModalOpen: true }))}
                        className="p-2 text-green-600 hover:bg-green-50"
                        title="Asignar Capacitación"
                      >
                        <BookOpen size={16} />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditTeam(team)}
                        className="p-2 text-blue-600 hover:bg-blue-50"
                        title="Editar Equipo"
                      >
                        <Edit size={16} />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteTeam(team)}
                        className="p-2 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Crown className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm text-gray-600">Supervisor:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {team.supervisor.person.person_first_name} {team.supervisor.person.person_last_name}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <GraduationCap className="w-4 h-4 text-purple-600" />
                    <span className="text-gray-600">Instructores:</span>
                    <span className="font-medium text-purple-600">
                      {team.team_members.filter(m => m.member_role === 'instructor').length}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <UserCheck className="w-4 h-4 text-green-600" />
                    <span className="text-gray-600">Clientes:</span>
                    <span className="font-medium text-green-600">
                      {team.team_members.filter(m => m.member_role === 'client').length}
                    </span>
                  </div>
                </div>

                {/* Lista de integrantes */}
                <div className="pt-3 border-t">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Integrantes del Equipo</h4>
                  <div className="space-y-2">
                    {team.team_members.length === 0 ? (
                      <p className="text-xs text-gray-500">No hay integrantes asignados</p>
                    ) : (
                      <>
                        {/* Instructores */}
                        {team.team_members.filter(m => m.member_role === 'instructor').length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-purple-600 mb-1">Instructores:</p>
                            <div className="flex flex-wrap gap-1">
                              {team.team_members
                                .filter(m => m.member_role === 'instructor')
                                .map(member => (
                                  <span
                                    key={member.team_member_id}
                                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-700"
                                  >
                                    <GraduationCap className="w-3 h-3 mr-1" />
                                    {member.user.person.person_first_name} {member.user.person.person_last_name}
                                  </span>
                                ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Clientes */}
                        {team.team_members.filter(m => m.member_role === 'client').length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-green-600 mb-1">Clientes:</p>
                            <div className="flex flex-wrap gap-1">
                              {team.team_members
                                .filter(m => m.member_role === 'client')
                                .map(member => (
                                  <button
                                    key={member.team_member_id}
                                    onClick={() => setState(prev => ({
                                      ...prev,
                                      isClientAssignmentsModalOpen: true,
                                      selectedClientId: member.user_id
                                    }))}
                                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-700 hover:bg-green-200 transition-colors cursor-pointer"
                                    title="Ver capacitaciones asignadas"
                                  >
                                    <UserCheck className="w-3 h-3 mr-1" />
                                    {member.user.person.person_first_name} {member.user.person.person_last_name}
                                  </button>
                                ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div className="text-xs text-gray-500 pt-2 border-t">
                  Creado: {new Date(team.team_created_at).toLocaleDateString('es-ES')}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Create Team Modal */}
      {state.isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Crear Nuevo Equipo</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setState(prev => ({ ...prev, isCreateModalOpen: false }));
                  resetForm();
                }}
                className="p-2"
              >
                <X size={16} />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Equipo
                </label>
                <Input
                  value={formData.team_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, team_name: e.target.value }))}
                  placeholder="Ingrese el nombre del equipo"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción (Opcional)
                </label>
                <textarea
                  value={formData.team_description}
                  onChange={(e) => setFormData(prev => ({ ...prev, team_description: e.target.value }))}
                  placeholder="Descripción del equipo"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Supervisor
                </label>
                <select
                  value={formData.supervisor_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, supervisor_id: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={0}>Seleccionar supervisor</option>
                  {supervisors.map(supervisor => (
                    <option key={supervisor.user_id} value={supervisor.user_id}>
                      {supervisor.person.person_first_name} {supervisor.person.person_last_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Instructores ({instructors.length} encontrados)
                </label>
                {instructors.length === 0 && (
                  <div className="text-sm text-red-600 mb-2">
                    No se encontraron instructores. Total usuarios: {users.length}
                  </div>
                )}
                <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2">
                  {instructors.map(instructor => (
                    <label
                      key={instructor.user_id}
                      className="flex items-center space-x-3 p-2 rounded hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.instructors.includes(instructor.user_id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData(prev => ({
                              ...prev,
                              instructors: [...prev.instructors, instructor.user_id]
                            }));
                          } else {
                            setFormData(prev => ({
                              ...prev,
                              instructors: prev.instructors.filter(id => id !== instructor.user_id)
                            }));
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm">
                        {instructor.person.person_first_name} {instructor.person.person_last_name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Clientes
                </label>
                <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2">
                  {clients.map(client => (
                    <label
                      key={client.user_id}
                      className="flex items-center space-x-3 p-2 rounded hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.clients.includes(client.user_id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData(prev => ({
                              ...prev,
                              clients: [...prev.clients, client.user_id]
                            }));
                          } else {
                            setFormData(prev => ({
                              ...prev,
                              clients: prev.clients.filter(id => id !== client.user_id)
                            }));
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm">
                        {client.person.person_first_name} {client.person.person_last_name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setState(prev => ({ ...prev, isCreateModalOpen: false }));
                  resetForm();
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createTeamMutation.isLoading}
                className="flex items-center space-x-2"
              >
                <Save size={16} />
                <span>{createTeamMutation.isLoading ? 'Creando...' : 'Crear Equipo'}</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {state.isAddMemberModalOpen && state.selectedTeam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                Agregar {state.selectedMemberType === 'client' ? 'Cliente' : 'Instructor'}
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setState(prev => ({ ...prev, isAddMemberModalOpen: false }))}
                className="p-2"
              >
                <X size={16} />
              </Button>
            </div>

            <div className="space-y-3">
              {getAvailableUsers(state.selectedTeam, state.selectedMemberType).map(user => (
                <div
                  key={user.user_id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-md hover:bg-gray-50"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {user.person.person_first_name} {user.person.person_last_name}
                    </p>
                    <p className="text-sm text-gray-500">{user.person.person_email}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleAddMemberSubmit(user.user_id)}
                    disabled={addMemberMutation.isLoading}
                    className="flex items-center space-x-1"
                  >
                    <Plus size={14} />
                    <span>Agregar</span>
                  </Button>
                </div>
              ))}
              
              {getAvailableUsers(state.selectedTeam, state.selectedMemberType).length === 0 && (
                <div className="text-center py-8">
                  <UserCheck className="mx-auto w-12 h-12 text-gray-400 mb-2" />
                  <p className="text-gray-500">
                    No hay {state.selectedMemberType === 'client' ? 'clientes' : 'instructores'} disponibles para agregar
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Assign Course Modal - Functional */}
      {state.isAssignCourseModalOpen && state.selectedTeam && (
        <TeamAssignmentModal
          team={state.selectedTeam}
          trainings={trainings}
          onClose={() => setState(prev => ({ ...prev, isAssignCourseModalOpen: false, selectedTeam: null }))}
        />
      )}

      {/* Edit Team Modal */}
      {state.isEditModalOpen && state.selectedTeam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Editar Equipo: {state.selectedTeam.team_name}</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setState(prev => ({ ...prev, isEditModalOpen: false, selectedTeam: null }));
                  resetForm();
                }}
                className="p-2"
              >
                <X size={16} />
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Información básica del equipo */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Información del Equipo</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Equipo
                  </label>
                  <Input
                    value={formData.team_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, team_name: e.target.value }))}
                    placeholder="Ingrese el nombre del equipo"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción (Opcional)
                  </label>
                  <textarea
                    value={formData.team_description}
                    onChange={(e) => setFormData(prev => ({ ...prev, team_description: e.target.value }))}
                    placeholder="Descripción del equipo"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Supervisor
                  </label>
                  <select
                    value={formData.supervisor_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, supervisor_id: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={0}>Seleccionar supervisor</option>
                    {supervisors.map(supervisor => (
                      <option key={supervisor.user_id} value={supervisor.user_id}>
                        {supervisor.person.person_first_name} {supervisor.person.person_last_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Gestión de miembros */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Miembros del Equipo</h3>
                
                {/* Miembros actuales */}
                {state.selectedTeam.team_members.length > 0 && (
                  <div>
                    <h4 className="text-md font-medium text-gray-800 mb-2">Miembros Actuales</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {state.selectedTeam.team_members.map(member => (
                        <div
                          key={member.team_member_id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                              member.member_role === 'instructor' 
                                ? 'bg-purple-100 text-purple-700' 
                                : 'bg-green-100 text-green-700'
                            }`}>
                              {member.member_role === 'instructor' ? 'I' : 'C'}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 text-sm">
                                {member.user.person.person_first_name} {member.user.person.person_last_name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {member.member_role === 'instructor' ? 'Instructor' : 'Cliente'}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveMember(state.selectedTeam!.team_id, member.team_member_id)}
                            className="p-2 text-red-600 hover:bg-red-50"
                          >
                            <X size={14} />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Agregar nuevos miembros */}
                <div>
                  <h4 className="text-md font-medium text-gray-800 mb-2">Agregar Nuevos Miembros</h4>
                  
                  {/* Instructores disponibles */}
                  {getAvailableUsers(state.selectedTeam, 'instructor').length > 0 && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Instructores Disponibles
                      </label>
                      <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2">
                        {getAvailableUsers(state.selectedTeam, 'instructor').map(instructor => (
                          <label
                            key={instructor.user_id}
                            className="flex items-center space-x-3 p-2 rounded hover:bg-gray-50 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={formData.instructors.includes(instructor.user_id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData(prev => ({
                                    ...prev,
                                    instructors: [...prev.instructors, instructor.user_id]
                                  }));
                                } else {
                                  setFormData(prev => ({
                                    ...prev,
                                    instructors: prev.instructors.filter(id => id !== instructor.user_id)
                                  }));
                                }
                              }}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm">
                              {instructor.person.person_first_name} {instructor.person.person_last_name}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Clientes disponibles */}
                  {getAvailableUsers(state.selectedTeam, 'client').length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Clientes Disponibles
                      </label>
                      <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2">
                        {getAvailableUsers(state.selectedTeam, 'client').map(client => (
                          <label
                            key={client.user_id}
                            className="flex items-center space-x-3 p-2 rounded hover:bg-gray-50 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={formData.clients.includes(client.user_id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData(prev => ({
                                    ...prev,
                                    clients: [...prev.clients, client.user_id]
                                  }));
                                } else {
                                  setFormData(prev => ({
                                    ...prev,
                                    clients: prev.clients.filter(id => id !== client.user_id)
                                  }));
                                }
                              }}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm">
                              {client.person.person_first_name} {client.person.person_last_name}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setState(prev => ({ ...prev, isEditModalOpen: false, selectedTeam: null }));
                  resetForm();
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleUpdateTeam}
                disabled={updateTeamMutation.isLoading}
                className="flex items-center space-x-2"
              >
                <Save size={16} />
                <span>{updateTeamMutation.isLoading ? 'Actualizando...' : 'Actualizar Equipo'}</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Training Modal */}
      {state.isAssignTrainingModalOpen && state.selectedTeam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                Asignar Capacitación a: {state.selectedTeam.team_name}
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setState(prev => ({ ...prev, isAssignTrainingModalOpen: false, selectedTeam: null }))}
                className="p-2"
              >
                <X size={16} />
              </Button>
            </div>

            {/* Información del equipo */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-md font-semibold text-gray-900 mb-2">Información del Equipo</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Supervisor:</span>
                  <span className="ml-2 font-medium">
                    {state.selectedTeam.supervisor.person.person_first_name} {state.selectedTeam.supervisor.person.person_last_name}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Total Clientes:</span>
                  <span className="ml-2 font-medium text-green-600">
                    {state.selectedTeam.team_members.filter(m => m.member_role === 'client').length}
                  </span>
                </div>
              </div>
              <div className="mt-2">
                <span className="text-gray-600">Clientes:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {state.selectedTeam.team_members
                    .filter(m => m.member_role === 'client')
                    .map(member => (
                      <span
                        key={member.team_member_id}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-700"
                      >
                        {member.user.person.person_first_name} {member.user.person.person_last_name}
                      </span>
                    ))}
                </div>
                {state.selectedTeam.team_members.filter(m => m.member_role === 'client').length === 0 && (
                  <span className="text-xs text-red-600 mt-1 block">
                    ⚠️ Este equipo no tiene clientes asignados. Agrega clientes antes de asignar capacitaciones.
                  </span>
                )}
              </div>
            </div>

            {/* Selección de capacitación */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Seleccionar Capacitación</h3>
              
              {trainings.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="mx-auto w-12 h-12 text-gray-400 mb-2" />
                  <p className="text-gray-500">No hay capacitaciones disponibles</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Ejecuta primero los endpoints de inicialización:
                  </p>
                  <p className="text-xs text-blue-600 mt-1 font-mono">
                    POST /api/v1/init-data<br/>
                    POST /api/v1/init-technologies-trainings
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {trainings.map((training: any) => (
                    <div
                      key={training.training_id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{training.training_name}</h4>
                          {training.training_description && (
                            <p className="text-sm text-gray-600 mt-1">
                              {training.training_description}
                            </p>
                          )}
                          
                          {/* Tecnologías asociadas */}
                          {training.training_technologies && training.training_technologies.length > 0 && (
                            <div className="mt-2">
                              <span className="text-xs text-gray-500">Tecnologías:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {training.training_technologies.map((tt: any, index: number) => (
                                  <span
                                    key={index}
                                    className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-100 text-blue-700"
                                  >
                                    {tt.technology?.technology_name || 'Tecnología'}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="ml-4">
                          <Button
                            size="sm"
                            onClick={() => {
                              const clientCount = state.selectedTeam!.team_members.filter(m => m.member_role === 'client').length;
                              if (clientCount === 0) {
                                toast.error('Este equipo no tiene clientes asignados');
                                return;
                              }
                              
                              if (window.confirm(
                                `¿Asignar "${training.training_name}" a ${clientCount} cliente(s) del equipo "${state.selectedTeam!.team_name}"?`
                              )) {
                                assignTrainingMutation.mutate({
                                  teamId: state.selectedTeam!.team_id,
                                  trainingId: training.training_id
                                });
                              }
                            }}
                            disabled={
                              assignTrainingMutation.isLoading ||
                              state.selectedTeam!.team_members.filter(m => m.member_role === 'client').length === 0
                            }
                            className="flex items-center space-x-2"
                          >
                            <BookOpen size={14} />
                            <span>
                              {assignTrainingMutation.isLoading ? 'Asignando...' : 'Asignar'}
                            </span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end mt-6 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setState(prev => ({ ...prev, isAssignTrainingModalOpen: false, selectedTeam: null }))}
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Client Assignments Modal */}
      {state.isClientAssignmentsModalOpen && state.selectedClientId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                Capacitaciones Asignadas
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setState(prev => ({ 
                  ...prev, 
                  isClientAssignmentsModalOpen: false, 
                  selectedClientId: null 
                }))}
                className="p-2"
              >
                <X size={16} />
              </Button>
            </div>

            {/* Client Info */}
            {(() => {
              const clientUser = users.find(u => u.user_id === state.selectedClientId);
              return clientUser && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <UserCheck className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {clientUser.person.person_first_name} {clientUser.person.person_last_name}
                      </h3>
                      <p className="text-sm text-gray-600">{clientUser.person.person_email}</p>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Assignments */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Capacitaciones</h3>
              
              {clientAssignments.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">
                    Sin capacitaciones asignadas
                  </h4>
                  <p className="text-gray-600">
                    Este cliente no tiene capacitaciones asignadas aún
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {clientAssignments.map(assignment => (
                    <div
                      key={assignment.assignment_id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-semibold text-gray-900 text-sm">
                          {assignment.training?.training_name || 'Capacitación'}
                        </h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          assignment.assignment_status === 'completed' ? 'bg-green-100 text-green-800' :
                          assignment.assignment_status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {assignment.assignment_status === 'completed' ? 'Completado' :
                           assignment.assignment_status === 'in_progress' ? 'En progreso' :
                           'Asignado'}
                        </span>
                      </div>
                      
                      {assignment.training?.training_description && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {assignment.training.training_description}
                        </p>
                      )}

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Progreso:</span>
                          <span className="font-medium text-gray-900">
                            {assignment.completion_percentage || 0}%
                          </span>
                        </div>
                        
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all ${
                              assignment.completion_percentage >= 100 ? 'bg-green-600' : 'bg-blue-600'
                            }`}
                            style={{ width: `${assignment.completion_percentage || 0}%` }}
                          ></div>
                        </div>

                        {assignment.instructor && (
                          <div className="flex items-center space-x-2 text-sm pt-2">
                            <GraduationCap className="w-4 h-4 text-purple-600" />
                            <span className="text-gray-600">Instructor:</span>
                            <span className="text-purple-600 font-medium">
                              {assignment.instructor.person.person_first_name} {assignment.instructor.person.person_last_name}
                            </span>
                          </div>
                        )}

                        {assignment.instructor_meeting_link && (
                          <div className="pt-2">
                            <Button
                              size="sm"
                              onClick={() => window.open(assignment.instructor_meeting_link!, '_blank')}
                              className="w-full text-xs"
                            >
                              <ExternalLink size={14} className="mr-1" />
                              Unirse a sesión
                            </Button>
                          </div>
                        )}

                        <div className="text-xs text-gray-500 pt-2 border-t">
                          Asignado: {new Date(assignment.assignment_created_at).toLocaleDateString('es-ES')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end mt-6 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setState(prev => ({ 
                  ...prev, 
                  isClientAssignmentsModalOpen: false, 
                  selectedClientId: null 
                }))}
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Modal component for assigning trainings to teams
const TeamAssignmentModal: React.FC<{
  team: Team;
  trainings: any[];
  onClose: () => void;
}> = ({ team, trainings, onClose }) => {
  const [selectedTraining, setSelectedTraining] = React.useState<number | null>(null);
  const [selectedInstructor, setSelectedInstructor] = React.useState<number | null>(null);
  const [selectedClients, setSelectedClients] = React.useState<number[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  
  const queryClient = useQueryClient();
  
  // Obtener lista de instructores
  const { data: users = [] } = useQuery('users', () => userService.getUsers());
  const instructors = users.filter(user => user.role.role_name === 'Instructor');
  
  // Filtrar clientes del equipo
  const teamClients = team.team_members?.filter(member => member.member_role === 'client') || [];
  
  const handleAssign = async () => {
    if (selectedTraining) {
      setIsLoading(true);
      try {
        let result;
        
        if (selectedClients.length > 0) {
          // Asignar a clientes específicos
          result = await teamService.assignTrainingToSpecificClients(
            team.team_id, 
            selectedTraining, 
            selectedClients,
            selectedInstructor || undefined
          );
        } else {
          // Asignar a todos los clientes del equipo
          result = await teamService.assignTrainingToTeam(
            team.team_id, 
            selectedTraining, 
            selectedInstructor || undefined
          );
        }
        
        const instructorInfo = selectedInstructor 
          ? ` con instructor ${instructors.find(i => i.user_id === selectedInstructor)?.person.person_first_name} ${instructors.find(i => i.user_id === selectedInstructor)?.person.person_last_name}`
          : '';
        
        toast.success(`Capacitación asignada exitosamente: ${result.summary.assignments_created} asignaciones creadas${instructorInfo}`);
        
        // Invalidar queries para refrescar los datos
        queryClient.invalidateQueries(['teams-by-supervisor']);
        queryClient.invalidateQueries('teams');
        queryClient.invalidateQueries('user-training-assignments');
        queryClient.invalidateQueries('all-technology-progress');
        queryClient.invalidateQueries('all-material-progress');
        queryClient.invalidateQueries('all-training-materials');
        
        onClose();
      } catch (error: any) {
        toast.error(error.response?.data?.detail || 'Error al asignar capacitación');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleClientSelection = (clientId: number, isChecked: boolean) => {
    setSelectedClients(prev => {
      if (isChecked) {
        return [...prev, clientId];
      } else {
        return prev.filter(id => id !== clientId);
      }
    });
  };

  const handleSelectAllClients = () => {
    if (selectedClients.length === teamClients.length) {
      setSelectedClients([]);
    } else {
      setSelectedClients(teamClients.map(client => client.user_id));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Asignar Capacitación a: {team.team_name}
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="p-2"
          >
            <X size={16} />
          </Button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seleccionar Capacitación *
            </label>
            <select
              value={selectedTraining || ''}
              onChange={(e) => setSelectedTraining(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            >
              <option value="">Seleccionar capacitación...</option>
              {trainings.map(training => (
                <option key={training.training_id} value={training.training_id}>
                  {training.training_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Asignar Instructor (Opcional)
            </label>
            <select
              value={selectedInstructor || ''}
              onChange={(e) => setSelectedInstructor(e.target.value ? Number(e.target.value) : null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            >
              <option value="">Sin instructor asignado</option>
              {instructors.map(instructor => (
                <option key={instructor.user_id} value={instructor.user_id}>
                  {instructor.person.person_first_name} {instructor.person.person_last_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Seleccionar Clientes
              </label>
              {teamClients.length > 0 && (
                <button
                  type="button"
                  onClick={handleSelectAllClients}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  disabled={isLoading}
                >
                  {selectedClients.length === teamClients.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
                </button>
              )}
            </div>
            
            {teamClients.length === 0 ? (
              <div className="text-sm text-gray-500 italic p-3 bg-gray-50 rounded-md">
                No hay clientes en este equipo
              </div>
            ) : (
              <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2">
                {teamClients.map(client => (
                  <label
                    key={client.user_id}
                    className="flex items-center space-x-3 p-2 rounded hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedClients.includes(client.user_id)}
                      onChange={(e) => handleClientSelection(client.user_id, e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      disabled={isLoading}
                    />
                    <span className="text-sm">
                      {client.user.person.person_first_name} {client.user.person.person_last_name}
                    </span>
                  </label>
                ))}
              </div>
            )}
            
            <div className="text-xs text-gray-500 mt-1">
              {selectedClients.length > 0 
                ? `${selectedClients.length} cliente(s) seleccionado(s)`
                : 'Si no seleccionas clientes específicos, se asignará a todos los clientes del equipo'
              }
            </div>
          </div>

          <div className="bg-blue-50 p-3 rounded-md">
            <p className="text-sm text-blue-700">
              <strong>Nota:</strong> Puedes seleccionar clientes específicos o dejar vacío para asignar a todos los clientes del equipo.
            </p>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleAssign}
            disabled={!selectedTraining || isLoading}
            className="flex items-center space-x-2"
          >
            {isLoading && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            )}
            <span>{isLoading ? 'Asignando...' : 'Asignar'}</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TeamsPage;