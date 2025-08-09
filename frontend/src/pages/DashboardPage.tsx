import React from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { PowerBIDemo } from '@/components/powerbi';
import { UserRoles } from '@/types/advanced';
import { teamService, trainingService, userService, userTrainingAssignmentService } from '@/services/api';
import {
  Users,
  BookOpen,
  GraduationCap,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Crown,
  UserCheck,
  Plus,
} from 'lucide-react';

const StatsCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ElementType;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
}> = ({ title, value, icon: Icon, change, changeType = 'neutral' }) => {
  const changeColors = {
    positive: 'text-green-600',
    negative: 'text-red-600',
    neutral: 'text-gray-600',
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {change && (
              <p className={`text-xs ${changeColors[changeType]}`}>
                {change}
              </p>
            )}
          </div>
          <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
            <Icon className="w-6 h-6 text-primary-600" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Componente específico para dashboard de supervisores
const SupervisorDashboard: React.FC<{ userId: number }> = ({ userId }) => {
  const [selectedTeam, setSelectedTeam] = React.useState<number | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = React.useState(false);
  
  // Queries para obtener datos del supervisor
  const { data: teams = [], isLoading: loadingTeams } = useQuery(
    ['teams-by-supervisor', userId],
    () => teamService.getTeamsBySupervisor(userId),
    { enabled: !!userId }
  );
  
  const { data: trainings = [] } = useQuery(
    'trainings',
    () => trainingService.getTrainings()
  );

  const { data: allAssignments = [] } = useQuery(
    'user-training-assignments',
    () => userTrainingAssignmentService.getAssignments()
  );

  // Calcular estadísticas
  const stats = React.useMemo(() => {
    const totalMembers = teams.reduce((acc, team) => acc + team.team_members.length, 0);
    const instructors = teams.reduce((acc, team) => 
      acc + team.team_members.filter(m => m.member_role === 'instructor').length, 0
    );
    const clients = teams.reduce((acc, team) => 
      acc + team.team_members.filter(m => m.member_role === 'client').length, 0
    );
    
    return {
      totalTeams: teams.length,
      totalMembers,
      instructors,
      clients
    };
  }, [teams]);

  const handleAssignTraining = (teamId: number) => {
    setSelectedTeam(teamId);
    setIsAssignModalOpen(true);
  };

  // Función para obtener estadísticas de capacitaciones por equipo
  const getTeamStats = (teamId: number) => {
    const team = teams.find(t => t.team_id === teamId);
    if (!team) return null;

    const instructors = team.team_members.filter(m => m.member_role === 'instructor');
    const clients = team.team_members.filter(m => m.member_role === 'client');
    
    // Obtener asignaciones para este equipo
    const allMemberIds = team.team_members.map(m => m.user_id);
    const teamAssignments = allAssignments.filter(assignment => 
      allMemberIds.includes(assignment.user_id)
    );

    // Instructores con capacitaciones asignadas
    const instructorsWithTrainings = new Set(
      teamAssignments
        .filter(a => instructors.some(i => i.user_id === a.user_id))
        .map(a => a.user_id)
    );

    // Clientes con capacitaciones asignadas
    const clientsWithTrainings = new Set(
      teamAssignments
        .filter(a => clients.some(c => c.user_id === a.user_id))
        .map(a => a.user_id)
    );

    // Agrupar capacitaciones por tipo
    const trainingGroups = teamAssignments.reduce((acc, assignment) => {
      const trainingId = assignment.training_id;
      if (!acc[trainingId]) {
        acc[trainingId] = {
          training: assignment.training,
          instructors: new Set(),
          clients: new Set(),
          totalAssignments: 0
        };
      }
      
      if (assignment.instructor) {
        acc[trainingId].instructors.add(
          assignment.instructor.person.person_first_name + ' ' + 
          assignment.instructor.person.person_last_name
        );
      }
      
      const isClient = clients.some(c => c.user_id === assignment.user_id);
      if (isClient) {
        acc[trainingId].clients.add(assignment.user_id);
      }
      
      acc[trainingId].totalAssignments++;
      
      return acc;
    }, {} as any);

    return {
      team,
      instructors: {
        total: instructors.length,
        withTrainings: instructorsWithTrainings.size
      },
      clients: {
        total: clients.length,
        withTrainings: clientsWithTrainings.size
      },
      trainings: Object.values(trainingGroups)
    };
  };

  if (loadingTeams) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <>
      {/* Estadísticas del supervisor */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Mis Equipos"
          value={stats.totalTeams}
          icon={Crown}
          change="Equipos bajo supervisión"
          changeType="neutral"
        />
        <StatsCard
          title="Total Miembros"
          value={stats.totalMembers}
          icon={Users}
          change="En todos mis equipos"
          changeType="neutral"
        />
        <StatsCard
          title="Instructores"
          value={stats.instructors}
          icon={GraduationCap}
          change="Facilitando capacitaciones"
          changeType="positive"
        />
        <StatsCard
          title="Clientes"
          value={stats.clients}
          icon={UserCheck}
          change="Recibiendo capacitaciones"
          changeType="positive"
        />
      </div>

      {/* Equipos del supervisor */}
      {teams.length === 0 ? (
        <Card className="p-8 text-center">
          <Users className="mx-auto w-16 h-16 text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No tienes equipos asignados
          </h3>
          <p className="text-gray-600 mb-6">
            Contacta al administrador para que te asigne equipos de trabajo
          </p>
          <a 
            href="/my-team" 
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
          >
            Ver Mi Perfil de Equipo
          </a>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Mis Equipos</h2>
            <a 
              href="/my-team" 
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              Ver gestión completa →
            </a>
          </div>
          
          {/* Lista de equipos con diseño mejorado */}
          <div className="space-y-6">
            {teams.map((team) => {
              const teamStats = getTeamStats(team.team_id);
              if (!teamStats) return null;

              return (
                <Card key={team.team_id} className="overflow-hidden">
                  <CardHeader className="bg-gray-50 pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Users className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg text-gray-900">{team.team_name}</CardTitle>
                          {team.team_description && (
                            <p className="text-sm text-gray-600 mt-1">{team.team_description}</p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleAssignTraining(team.team_id)}
                        className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Asignar Capacitación</span>
                      </button>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="p-6">
                    {/* Indicadores de progreso mejorados */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      {/* Instructores */}
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <GraduationCap className="w-5 h-5 text-purple-600" />
                            <span className="font-medium text-purple-900">Instructores</span>
                          </div>
                          <span className="text-2xl font-bold text-purple-700">
                            {teamStats.instructors.withTrainings}/{teamStats.instructors.total}
                          </span>
                        </div>
                        <div className="w-full bg-purple-200 rounded-full h-2">
                          <div 
                            className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                            style={{ 
                              width: teamStats.instructors.total > 0 
                                ? `${(teamStats.instructors.withTrainings / teamStats.instructors.total) * 100}%` 
                                : '0%' 
                            }}
                          ></div>
                        </div>
                        <p className="text-xs text-purple-700 mt-1">
                          {teamStats.instructors.withTrainings} con capacitaciones asignadas
                        </p>
                      </div>

                      {/* Clientes */}
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <UserCheck className="w-5 h-5 text-green-600" />
                            <span className="font-medium text-green-900">Clientes</span>
                          </div>
                          <span className="text-2xl font-bold text-green-700">
                            {teamStats.clients.withTrainings}/{teamStats.clients.total}
                          </span>
                        </div>
                        <div className="w-full bg-green-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full transition-all duration-300"
                            style={{ 
                              width: teamStats.clients.total > 0 
                                ? `${(teamStats.clients.withTrainings / teamStats.clients.total) * 100}%` 
                                : '0%' 
                            }}
                          ></div>
                        </div>
                        <p className="text-xs text-green-700 mt-1">
                          {teamStats.clients.withTrainings} recibiendo capacitaciones
                        </p>
                      </div>
                    </div>

                    {/* Tabla de capacitaciones */}
                    {teamStats.trainings.length > 0 ? (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
                          <BookOpen className="w-4 h-4" />
                          <span>Capacitaciones Asignadas</span>
                        </h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-gray-200">
                                <th className="text-left py-2 px-3 font-medium text-gray-700">Capacitación</th>
                                <th className="text-left py-2 px-3 font-medium text-gray-700">Instructor(es)</th>
                                <th className="text-center py-2 px-3 font-medium text-gray-700">Clientes</th>
                                <th className="text-center py-2 px-3 font-medium text-gray-700">Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {teamStats.trainings.map((trainingGroup: any, index: number) => (
                                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                                  <td className="py-3 px-3">
                                    <div className="font-medium text-gray-900">{trainingGroup.training.training_name}</div>
                                  </td>
                                  <td className="py-3 px-3">
                                    {trainingGroup.instructors.size > 0 ? (
                                      <div className="flex flex-wrap gap-1">
                                        {Array.from(trainingGroup.instructors).map((instructor: string, i: number) => (
                                          <span key={i} className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                                            {instructor}
                                          </span>
                                        ))}
                                      </div>
                                    ) : (
                                      <span className="text-gray-400 text-xs">Sin instructor</span>
                                    )}
                                  </td>
                                  <td className="py-3 px-3 text-center">
                                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                                      {trainingGroup.clients.size}
                                    </span>
                                  </td>
                                  <td className="py-3 px-3 text-center">
                                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                                      {trainingGroup.totalAssignments}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6 bg-gray-50 rounded-lg">
                        <BookOpen className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500 text-sm">No hay capacitaciones asignadas a este equipo</p>
                        <p className="text-gray-400 text-xs mt-1">Usa el botón "Asignar Capacitación" para comenzar</p>
                      </div>
                    )}

                    {/* Footer con información adicional */}
                    <div className="flex justify-between items-center pt-4 mt-4 border-t text-xs text-gray-500">
                      <span>Creado: {new Date(team.team_created_at).toLocaleDateString('es-ES')}</span>
                      <span>{team.team_members.length} miembros totales</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal para asignar capacitación (placeholder) */}
      {isAssignModalOpen && selectedTeam && (
        <TeamTrainingAssignmentModal
          teamId={selectedTeam}
          trainings={trainings}
          onClose={() => {
            setIsAssignModalOpen(false);
            setSelectedTeam(null);
          }}
        />
      )}
    </>
  );
};

// Modal para asignar capacitaciones a equipos
const TeamTrainingAssignmentModal: React.FC<{
  teamId: number;
  trainings: any[];
  onClose: () => void;
}> = ({ teamId, trainings, onClose }) => {
  const [selectedTraining, setSelectedTraining] = React.useState<number | null>(null);
  const [selectedInstructor, setSelectedInstructor] = React.useState<number | null>(null);
  const [selectedClients, setSelectedClients] = React.useState<number[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  
  const queryClient = useQueryClient();
  
  // Obtener lista de instructores
  const { data: users = [] } = useQuery('users', () => userService.getUsers());
  const instructors = users.filter(user => user.role.role_name === 'Instructor');
  
  // Obtener datos del equipo específico
  const { data: teamData } = useQuery(
    ['team', teamId],
    () => teamService.getTeam(teamId),
    { enabled: !!teamId }
  );
  
  // Filtrar clientes del equipo
  const teamClients = teamData?.team_members?.filter(member => member.member_role === 'client') || [];
  
  const handleAssign = async () => {
    if (selectedTraining) {
      setIsLoading(true);
      try {
        let result;
        
        if (selectedClients.length > 0) {
          // Asignar a clientes específicos
          result = await teamService.assignTrainingToSpecificClients(
            teamId, 
            selectedTraining, 
            selectedClients,
            selectedInstructor || undefined
          );
        } else {
          // Asignar a todos los clientes del equipo (comportamiento anterior)
          result = await teamService.assignTrainingToTeam(
            teamId, 
            selectedTraining, 
            selectedInstructor || undefined
          );
        }
        
        const instructorInfo = selectedInstructor 
          ? ` con instructor ${instructors.find(i => i.user_id === selectedInstructor)?.person.person_first_name} ${instructors.find(i => i.user_id === selectedInstructor)?.person.person_last_name}`
          : '';
        
        toast.success(`Capacitación asignada exitosamente: ${result.summary.assignments_created} asignaciones creadas${instructorInfo}`);
        // Invalidar todas las queries relacionadas para refrescar los datos
        queryClient.invalidateQueries(['teams-by-supervisor']);
        queryClient.invalidateQueries('teams');
        queryClient.invalidateQueries('user-training-assignments');
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
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Asignar Capacitación al Equipo
        </h3>
        
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
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleAssign}
            disabled={!selectedTraining || isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isLoading && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            )}
            <span>{isLoading ? 'Asignando...' : 'Asignar'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();

  const renderByRole = () => {
    if (!user) return null;

    switch (user.role.role_id) {
      case UserRoles.ADMIN:
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatsCard
                title="Total Usuarios"
                value="156"
                icon={Users}
                change="+12% vs mes anterior"
                changeType="positive"
              />
              <StatsCard
                title="Cursos Activos"
                value="42"
                icon={BookOpen}
                change="+5 nuevos este mes"
                changeType="positive"
              />
              <StatsCard
                title="Supervisores"
                value="8"
                icon={GraduationCap}
                change="Gestionando equipos"
                changeType="neutral"
              />
              <StatsCard
                title="Tasa de Finalización"
                value="87%"
                icon={TrendingUp}
                change="+3% vs mes anterior"
                changeType="positive"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PowerBIDemo
                title="Estadísticas Generales"
                description="Vista general del progreso de capacitaciones en toda la organización"
              />
              <PowerBIDemo
                title="Rendimiento por Área"
                description="Comparación de progreso entre diferentes departamentos y clientes"
              />
            </div>
          </>
        );

      case UserRoles.SUPERVISOR:
        return <SupervisorDashboard userId={user.user_id} />;

      case UserRoles.CLIENT:
        return (
          <>
            <div className="text-center py-12">
              <BookOpen className="w-20 h-20 text-primary-400 mx-auto mb-6" />
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                ¡Bienvenido a tu Plan de Capacitación!
              </h3>
              <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                Accede a tus cursos asignados, participa en clases en vivo y descarga material de apoyo.
                Tu supervisor ha diseñado un plan personalizado según tu nivel y especialidad.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
                <a href="/capacitaciones" className="bg-primary-600 text-white px-6 py-3 rounded-md hover:bg-primary-700 transition-colors text-center">
                  Capacitaciones
                </a>
                <a href="/my-courses" className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors text-center">
                  Mis Capacitaciones
                </a>
                <a href="/materials" className="bg-blue-100 text-blue-800 px-6 py-3 rounded-md hover:bg-blue-200 transition-colors text-center">
                  Material de Apoyo
                </a>
                <a href="/my-courses" className="bg-green-100 text-green-800 px-6 py-3 rounded-md hover:bg-green-200 transition-colors text-center">
                  Mi Progreso
                </a>
              </div>
            </div>
          </>
        );

      case UserRoles.INSTRUCTOR:
        return (
          <>
            <div className="text-center py-12">
              <GraduationCap className="w-20 h-20 text-purple-400 mx-auto mb-6" />
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                ¡Bienvenido, Instructor!
              </h3>
              <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                Gestiona tu calendario de clases, sube material de apoyo para tus estudiantes
                y lleva el control de asistencias en las sesiones en vivo.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                <a href="/calendar" className="bg-purple-600 text-white px-6 py-3 rounded-md hover:bg-purple-700 transition-colors">
                  Calendario de Clases
                </a>
                <a href="/materials" className="bg-orange-100 text-orange-800 px-6 py-3 rounded-md hover:bg-orange-200 transition-colors">
                  Subir Materiales
                </a>
                <a href="/calendar" className="bg-blue-100 text-blue-800 px-6 py-3 rounded-md hover:bg-blue-200 transition-colors">
                  Gestionar Asistencias
                </a>
              </div>
            </div>
          </>
        );

      default:
        return (
          <div className="text-center py-12">
            <p className="text-gray-500">Dashboard no configurado para este rol</p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          ¡Bienvenido, {user?.person.person_first_name}!
        </h1>
        <p className="text-gray-600 mt-2">
          Resumen de tu actividad en el sistema de capacitaciones
        </p>
      </div>

      {renderByRole()}
    </div>
  );
};