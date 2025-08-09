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

  // Mutations
  const createTeamMutation = useMutation(
    (teamData: TeamCreateWithMembersForm) => teamService.createTeam(teamData),
    {
      onSuccess: () => {
        toast.success('Equipo creado exitosamente');
        queryClient.invalidateQueries('teams');
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
        queryClient.invalidateQueries('teams');
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
        queryClient.invalidateQueries('teams');
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
        queryClient.invalidateQueries('teams');
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
        queryClient.invalidateQueries('teams');
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

  const stats = {
    totalTeams: filteredTeamsByRole.length,
    totalMembers: filteredTeamsByRole.reduce((acc, team) => acc + team.team_members.length, 0),
    activeInstructors: new Set(
      filteredTeamsByRole.flatMap(team => 
        team.team_members
          .filter(member => member.member_role === 'instructor')
          .map(member => member.user_id)
      )
    ).size,
    activeClients: new Set(
      filteredTeamsByRole.flatMap(team => 
        team.team_members
          .filter(member => member.member_role === 'client')
          .map(member => member.user_id)
      )
    ).size,
  };

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
                  <p className="text-2xl font-bold text-green-600">3</p>
                </div>
                <BookOpen className="w-8 h-8 text-green-600" />
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Progreso Promedio</p>
                  <p className="text-2xl font-bold text-purple-600">75%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completados</p>
                  <p className="text-2xl font-bold text-orange-600">12</p>
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
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Capacitaciones Asignadas</h2>
                <Button
                  size="sm"
                  onClick={() => setState(prev => ({ ...prev, isAssignCourseModalOpen: true }))}
                  className="flex items-center space-x-2"
                >
                  <Plus size={16} />
                  <span>Asignar</span>
                </Button>
              </div>
              <div className="space-y-3">
                {/* Mock data for now */}
                {[
                  { name: 'React Fundamentals', progress: 80, completed: 4, total: 5 },
                  { name: 'Python Backend', progress: 60, completed: 3, total: 5 },
                  { name: 'Database Design', progress: 90, completed: 5, total: 5 },
                ].map((training, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900">{training.name}</h3>
                      <span className="text-sm text-gray-500">{training.completed}/{training.total} completados</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all" 
                        style={{ width: `${training.progress}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{training.progress}% completado</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Progreso del Equipo</h2>
              <div className="space-y-4">
                {/* Mock team member progress */}
                {[
                  { name: 'Pedro Cliente', completed: 2, total: 3, progress: 67 },
                  { name: 'Elena Cliente', completed: 3, total: 3, progress: 100 },
                  { name: 'Roberto Cliente', completed: 1, total: 3, progress: 33 },
                  { name: 'Sofia Cliente', completed: 2, total: 3, progress: 67 },
                ].map((member, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">{member.name.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{member.name}</p>
                        <p className="text-sm text-gray-500">{member.completed}/{member.total} capacitaciones</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            member.progress === 100 ? 'bg-green-600' : 'bg-blue-600'
                          }`} 
                          style={{ width: `${member.progress}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-700">{member.progress}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </>
      )}

      {/* Search */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder={isSupervisor ? "Buscar en mi equipo..." : "Buscar equipos por nombre o supervisor..."}
            value={state.searchTerm}
            onChange={(e) => setState(prev => ({ ...prev, searchTerm: e.target.value }))}
            className="pl-10"
          />
        </div>
      </Card>

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
                                  <span
                                    key={member.team_member_id}
                                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-700"
                                  >
                                    <UserCheck className="w-3 h-3 mr-1" />
                                    {member.user.person.person_first_name} {member.user.person.person_last_name}
                                  </span>
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

      {/* Assign Course Modal - Placeholder */}
      {state.isAssignCourseModalOpen && state.selectedTeam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Asignar Capacitación</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setState(prev => ({ ...prev, isAssignCourseModalOpen: false }))}
                className="p-2"
              >
                <X size={16} />
              </Button>
            </div>

            <div className="text-center py-8">
              <BookOpen className="mx-auto w-12 h-12 text-gray-400 mb-2" />
              <p className="text-gray-500 mb-4">
                Esta funcionalidad estará disponible próximamente
              </p>
              <p className="text-sm text-gray-400">
                Podrás asignar capacitaciones específicas a tu equipo
              </p>
            </div>
          </div>
        </div>
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
    </div>
  );
};

export default TeamsPage;