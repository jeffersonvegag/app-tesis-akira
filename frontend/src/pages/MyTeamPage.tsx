import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { toast } from 'react-hot-toast';
import {
  Team,
  TeamMember,
} from '@/types';
import {
  teamService,
} from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import {
  Users,
  GraduationCap,
  UserCheck,
  Crown,
  Mail,
  Search,
  Calendar,
  BookOpen,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

interface MyTeamPageState {
  searchTerm: string;
  filterRole: string;
}

const MyTeamPage: React.FC = () => {
  const { user } = useAuthStore();
  const [state, setState] = useState<MyTeamPageState>({
    searchTerm: '',
    filterRole: '',
  });

  // Query para obtener los equipos del supervisor actual
  const { data: teams = [], isLoading: loadingTeams } = useQuery(
    ['teams-by-supervisor', user?.user_id],
    () => {
      if (!user?.user_id) return Promise.resolve([]);
      return teamService.getTeamsBySupervisor(user.user_id);
    },
    {
      enabled: !!user?.user_id,
    }
  );

  // Combinar todos los miembros de todos los equipos
  const allMembers: (TeamMember & { teamName: string })[] = teams.flatMap(team =>
    team.team_members.map(member => ({
      ...member,
      teamName: team.team_name,
    }))
  );

  // Filtrar miembros
  const filteredMembers = allMembers.filter(member => {
    const matchesSearch = 
      member.user.person.person_first_name.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
      member.user.person.person_last_name.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
      member.user.person.person_email.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
      member.teamName.toLowerCase().includes(state.searchTerm.toLowerCase());
    
    const matchesRole = !state.filterRole || member.member_role === state.filterRole;
    
    return matchesSearch && matchesRole;
  });

  const stats = {
    totalTeams: teams.length,
    totalMembers: allMembers.length,
    instructors: allMembers.filter(m => m.member_role === 'instructor').length,
    clients: allMembers.filter(m => m.member_role === 'client').length,
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">No se pudo cargar la información del usuario</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
          <Crown className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mi Equipo</h1>
          <p className="text-gray-600">
            Supervisor: {user.person.person_first_name} {user.person.person_last_name}
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Equipos a Cargo</p>
              <p className="text-2xl font-bold text-blue-600">{stats.totalTeams}</p>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Miembros</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalMembers}</p>
            </div>
            <UserCheck className="w-8 h-8 text-gray-600" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Instructores</p>
              <p className="text-2xl font-bold text-purple-600">{stats.instructors}</p>
            </div>
            <GraduationCap className="w-8 h-8 text-purple-600" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Clientes</p>
              <p className="text-2xl font-bold text-green-600">{stats.clients}</p>
            </div>
            <Users className="w-8 h-8 text-green-600" />
          </div>
        </Card>
      </div>

      {/* Equipos Overview */}
      {teams.length > 0 && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Mis Equipos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teams.map((team) => (
              <div key={team.team_id} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  <h3 className="font-medium text-gray-900">{team.team_name}</h3>
                </div>
                {team.team_description && (
                  <p className="text-sm text-gray-600 mb-3">{team.team_description}</p>
                )}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-4">
                    <span className="flex items-center space-x-1">
                      <GraduationCap className="w-3 h-3 text-purple-600" />
                      <span className="text-purple-600">
                        {team.team_members.filter(m => m.member_role === 'instructor').length}
                      </span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <UserCheck className="w-3 h-3 text-green-600" />
                      <span className="text-green-600">
                        {team.team_members.filter(m => m.member_role === 'client').length}
                      </span>
                    </span>
                  </div>
                  <span className="text-gray-500">
                    {new Date(team.team_created_at).toLocaleDateString('es-ES')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar miembros..."
                value={state.searchTerm}
                onChange={(e) => setState(prev => ({ ...prev, searchTerm: e.target.value }))}
                className="pl-10 w-64"
              />
            </div>
            <select
              value={state.filterRole}
              onChange={(e) => setState(prev => ({ ...prev, filterRole: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">Todos los roles</option>
              <option value="instructor">Instructores</option>
              <option value="client">Clientes</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Members List */}
      <div className="space-y-4">
        {loadingTeams ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <Card key={index} className="p-4 animate-pulse">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : filteredMembers.length === 0 ? (
          <Card className="p-8 text-center">
            <Users className="mx-auto w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {teams.length === 0 ? 'No tienes equipos asignados' : 'No se encontraron miembros'}
            </h3>
            <p className="text-gray-500">
              {teams.length === 0
                ? 'Contacta al administrador para que te asigne equipos'
                : 'Ajusta los filtros de búsqueda para encontrar miembros'
              }
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMembers.map((member) => (
              <Card key={`${member.team_id}-${member.user_id}`} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    member.member_role === 'instructor' 
                      ? 'bg-purple-100 text-purple-600' 
                      : 'bg-green-100 text-green-600'
                  }`}>
                    {member.member_role === 'instructor' ? (
                      <GraduationCap className="w-5 h-5" />
                    ) : (
                      <UserCheck className="w-5 h-5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {member.user.person.person_first_name} {member.user.person.person_last_name}
                      </h3>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        member.member_role === 'instructor'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {member.member_role === 'instructor' ? 'Instructor' : 'Cliente'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 space-y-1">
                      <div className="flex items-center space-x-1">
                        <Mail className="w-3 h-3" />
                        <span className="truncate">{member.user.person.person_email}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Users className="w-3 h-3" />
                        <span>Equipo: {member.teamName}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>Desde: {new Date(member.joined_at).toLocaleDateString('es-ES')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyTeamPage;