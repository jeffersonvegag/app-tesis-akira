import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-hot-toast';
import {
  User,
  Person,
  Role,
  UserPosition,
  Gender,
  UserCreateForm,
  PersonCreateForm,
} from '@/types';
import {
  userService,
  personService,
  catalogService,
} from '@/services/api';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  UserPlus,
  Users,
  Filter,
  Download,
  Mail,
  Calendar,
  X,
  Save,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

interface UserManagementState {
  selectedUser: User | null;
  isCreateUserModalOpen: boolean;
  isCreatePersonModalOpen: boolean;
  isEditUserModalOpen: boolean;
  isViewUserModalOpen: boolean;
  searchTerm: string;
  filterRole: string;
  filterStatus: string;
}

interface PersonFormData {
  person_dni: string;
  person_first_name: string;
  person_last_name: string;
  person_gender: string;
  person_email: string;
}

interface UserFormData {
  user_username: string;
  user_password: string;
  person_id: string;
  user_role: string;
}

const UserManagementPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [state, setState] = useState<UserManagementState>({
    selectedUser: null,
    isCreateUserModalOpen: false,
    isCreatePersonModalOpen: false,
    isEditUserModalOpen: false,
    isViewUserModalOpen: false,
    searchTerm: '',
    filterRole: '',
    filterStatus: '',
  });

  const [personForm, setPersonForm] = useState<PersonFormData>({
    person_dni: '',
    person_first_name: '',
    person_last_name: '',
    person_gender: '',
    person_email: '',
  });

  const [userForm, setUserForm] = useState<UserFormData>({
    user_username: '',
    user_password: '',
    person_id: '',
    user_role: '',
  });

  // Queries
  const { data: users = [], isLoading: loadingUsers, refetch: refetchUsers } = useQuery(
    'users',
    () => userService.getUsers(),
    { staleTime: 0 }
  );

  const { data: persons = [] } = useQuery('persons', () => personService.getPersons());
  const { data: roles = [] } = useQuery('roles', () => catalogService.getRoles());
  const { data: genders = [] } = useQuery('genders', () => catalogService.getGenders());

  // Mutations
  const createUserMutation = useMutation(userService.createUser, {
    onSuccess: () => {
      toast.success('Usuario creado exitosamente');
      queryClient.invalidateQueries('users');
      setState(prev => ({ ...prev, isCreateUserModalOpen: false }));
      resetUserForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Error al crear usuario');
    },
  });

  const createPersonMutation = useMutation(personService.createPerson, {
    onSuccess: () => {
      toast.success('Persona creada exitosamente');
      queryClient.invalidateQueries('persons');
      setState(prev => ({ ...prev, isCreatePersonModalOpen: false }));
      resetPersonForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Error al crear persona');
    },
  });

  const updateUserMutation = useMutation(
    ({ id, data }: { id: number; data: UserCreateForm }) =>
      userService.updateUser(id, data),
    {
      onSuccess: () => {
        toast.success('Usuario actualizado exitosamente');
        queryClient.invalidateQueries('users');
        setState(prev => ({ ...prev, isEditUserModalOpen: false, selectedUser: null }));
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.detail || 'Error al actualizar usuario');
      },
    }
  );

  const deleteUserMutation = useMutation(userService.deleteUser, {
    onSuccess: () => {
      toast.success('Usuario eliminado exitosamente');
      queryClient.invalidateQueries('users');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Error al eliminar usuario');
    },
  });

  // Reset form functions
  const resetPersonForm = () => {
    setPersonForm({
      person_dni: '',
      person_first_name: '',
      person_last_name: '',
      person_gender: '',
      person_email: '',
    });
  };

  const resetUserForm = () => {
    setUserForm({
      user_username: '',
      user_password: '',
      person_id: '',
      user_role: '',
      });
  };

  // Handle form submissions
  const handleCreatePerson = () => {
    if (!personForm.person_dni.trim() || !personForm.person_first_name.trim() || !personForm.person_last_name.trim() || !personForm.person_email.trim()) {
      toast.error('Todos los campos son requeridos');
      return;
    }

    const personData: PersonCreateForm = {
      person_dni: parseInt(personForm.person_dni),
      person_first_name: personForm.person_first_name,
      person_last_name: personForm.person_last_name,
      person_gender: parseInt(personForm.person_gender),
      person_email: personForm.person_email,
    };

    createPersonMutation.mutate(personData);
  };

  const handleCreateUser = () => {
    if (!userForm.user_username.trim() || !userForm.user_password.trim() || !userForm.person_id || !userForm.user_role) {
      toast.error('Todos los campos son requeridos');
      return;
    }

    const userData: UserCreateForm = {
      user_username: userForm.user_username,
      user_password: userForm.user_password,
      person_id: Number(userForm.person_id),
      user_role: Number(userForm.user_role),
    };

    console.log('Creating user with data:', userData);
    createUserMutation.mutate(userData);
  };

  // Filtered users
  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.person.person_first_name.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
      user.person.person_last_name.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
      user.user_username.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
      user.person.person_email.toLowerCase().includes(state.searchTerm.toLowerCase());
    
    const matchesRole = !state.filterRole || user.user_role.toString() === state.filterRole;
    const matchesStatus = !state.filterStatus || user.user_status === state.filterStatus;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Statistics
  const stats = {
    total: users.length,
    active: users.filter(u => u.user_status === 'A').length,
    inactive: users.filter(u => u.user_status === 'I').length,
    byRole: roles.map(role => ({
      role: role.role_name,
      count: users.filter(u => u.user_role === role.role_id).length,
    })),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
          <p className="text-gray-600 mt-1">
            Administra usuarios, personas y sus permisos en el sistema
          </p>
        </div>
        <div className="flex space-x-3">
          <Button
            onClick={() => setState(prev => ({ ...prev, isCreatePersonModalOpen: true }))}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <UserPlus size={16} />
            <span>Nueva Persona</span>
          </Button>
          <Button
            onClick={() => setState(prev => ({ ...prev, isCreateUserModalOpen: true }))}
            className="flex items-center space-x-2"
          >
            <Plus size={16} />
            <span>Nuevo Usuario</span>
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Usuarios</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Activos</p>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            </div>
            <div className="w-3 h-3 bg-green-500 rounded-full" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Inactivos</p>
              <p className="text-2xl font-bold text-red-600">{stats.inactive}</p>
            </div>
            <div className="w-3 h-3 bg-red-500 rounded-full" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Roles Activos</p>
              <p className="text-2xl font-bold text-purple-600">{roles.length}</p>
            </div>
            <Filter className="w-8 h-8 text-purple-600" />
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
                placeholder="Buscar usuarios..."
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
              {roles.map(role => (
                <option key={role.role_id} value={role.role_id}>
                  {role.role_name}
                </option>
              ))}
            </select>
            <select
              value={state.filterStatus}
              onChange={(e) => setState(prev => ({ ...prev, filterStatus: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">Todos los estados</option>
              <option value="A">Activo</option>
              <option value="I">Inactivo</option>
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
              onClick={() => refetchUsers()}
              className="flex items-center space-x-2"
            >
              <span>Actualizar</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* Users Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Información Personal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rol y Posición
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha Creación
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loadingUsers ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    Cargando usuarios...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No se encontraron usuarios
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.user_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700">
                            {user.person.person_first_name[0]}{user.person.person_last_name[0]}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            @{user.user_username}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {user.user_id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {user.person.person_first_name} {user.person.person_last_name}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center">
                        <Mail size={12} className="mr-1" />
                        {user.person.person_email}
</div>
                     <div className="text-sm text-gray-500">
                       DNI: {user.person.person_dni}
                     </div>
                   </td>
                   <td className="px-6 py-4 whitespace-nowrap">
                     <div className="text-sm text-gray-900">{user.role.role_name}</div>
                   </td>
                   <td className="px-6 py-4 whitespace-nowrap">
                     <span
                       className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                         user.user_status === 'A'
                           ? 'bg-green-100 text-green-800'
                           : 'bg-red-100 text-red-800'
                       }`}
                     >
                       {user.user_status === 'A' ? 'Activo' : 'Inactivo'}
                     </span>
                   </td>
                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                     <div className="flex items-center">
                       <Calendar size={12} className="mr-1" />
                       {new Date(user.user_created_at).toLocaleDateString('es-ES')}
                     </div>
                   </td>
                   <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                     <div className="flex items-center justify-end space-x-2">
                       <Button
                         variant="outline"
                         size="sm"
                         onClick={() =>
                           setState(prev => ({
                             ...prev,
                             selectedUser: user,
                             isViewUserModalOpen: true,
                           }))
                         }
                         className="p-2"
                       >
                         <Eye size={16} />
                       </Button>
                       <Button
                         variant="outline"
                         size="sm"
                         onClick={() =>
                           setState(prev => ({
                             ...prev,
                             selectedUser: user,
                             isEditUserModalOpen: true,
                           }))
                         }
                         className="p-2"
                       >
                         <Edit size={16} />
                       </Button>
                       <Button
                         variant="outline"
                         size="sm"
                         onClick={() => {
                           if (window.confirm('¿Estás seguro de eliminar este usuario?')) {
                             deleteUserMutation.mutate(user.user_id);
                           }
                         }}
                         className="p-2 text-red-600 hover:text-red-800"
                       >
                         <Trash2 size={16} />
                       </Button>
                     </div>
                   </td>
                 </tr>
               ))
             )}
           </tbody>
         </table>
       </div>
     </Card>

     {/* Create Person Modal */}
     {state.isCreatePersonModalOpen && (
       <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
         <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
           <div className="flex justify-between items-center mb-6">
             <h2 className="text-xl font-bold text-gray-900">Crear Nueva Persona</h2>
             <Button
               variant="outline"
               size="sm"
               onClick={() => {
                 setState(prev => ({ ...prev, isCreatePersonModalOpen: false }));
                 resetPersonForm();
               }}
               className="p-2"
             >
               <X size={16} />
             </Button>
           </div>

           <div className="space-y-4">
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">
                 DNI *
               </label>
               <Input
                 type="number"
                 placeholder="Ej: 1234567890"
                 value={personForm.person_dni}
                 onChange={(e) => setPersonForm(prev => ({ ...prev, person_dni: e.target.value }))}
               />
             </div>

             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">
                 Nombres *
               </label>
               <Input
                 placeholder="Ej: Juan Carlos"
                 value={personForm.person_first_name}
                 onChange={(e) => setPersonForm(prev => ({ ...prev, person_first_name: e.target.value }))}
               />
             </div>

             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">
                 Apellidos *
               </label>
               <Input
                 placeholder="Ej: Pérez González"
                 value={personForm.person_last_name}
                 onChange={(e) => setPersonForm(prev => ({ ...prev, person_last_name: e.target.value }))}
               />
             </div>

             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">
                 Género *
               </label>
               <select
                 value={personForm.person_gender}
                 onChange={(e) => setPersonForm(prev => ({ ...prev, person_gender: e.target.value }))}
                 className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
               >
                 <option value="">Seleccionar género</option>
                 {genders.map(gender => (
                   <option key={gender.gender_id} value={gender.gender_id}>
                     {gender.gender_name}
                   </option>
                 ))}
               </select>
             </div>

             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">
                 Email *
               </label>
               <Input
                 type="email"
                 placeholder="Ej: juan.perez@empresa.com"
                 value={personForm.person_email}
                 onChange={(e) => setPersonForm(prev => ({ ...prev, person_email: e.target.value }))}
               />
             </div>
           </div>

           <div className="flex justify-end space-x-3 mt-6">
             <Button
               variant="outline"
               onClick={() => {
                 setState(prev => ({ ...prev, isCreatePersonModalOpen: false }));
                 resetPersonForm();
               }}
             >
               Cancelar
             </Button>
             <Button
               onClick={handleCreatePerson}
               disabled={createPersonMutation.isLoading}
               className="flex items-center space-x-2"
             >
               <Save size={16} />
               <span>{createPersonMutation.isLoading ? 'Guardando...' : 'Crear Persona'}</span>
             </Button>
           </div>
         </div>
       </div>
     )}

     {/* Create User Modal */}
     {state.isCreateUserModalOpen && (
       <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
         <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
           <div className="flex justify-between items-center mb-6">
             <h2 className="text-xl font-bold text-gray-900">Crear Nuevo Usuario</h2>
             <Button
               variant="outline"
               size="sm"
               onClick={() => {
                 setState(prev => ({ ...prev, isCreateUserModalOpen: false }));
                 resetUserForm();
               }}
               className="p-2"
             >
               <X size={16} />
             </Button>
           </div>

           <div className="space-y-4">
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">
                 Nombre de Usuario *
               </label>
               <Input
                 placeholder="Ej: juan.perez"
                 value={userForm.user_username}
                 onChange={(e) => setUserForm(prev => ({ ...prev, user_username: e.target.value }))}
               />
             </div>

             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">
                 Contraseña *
               </label>
               <Input
                 type="password"
                 placeholder="Mínimo 8 caracteres"
                 value={userForm.user_password}
                 onChange={(e) => setUserForm(prev => ({ ...prev, user_password: e.target.value }))}
               />
             </div>

             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">
                 Persona *
               </label>
               <select
                 value={userForm.person_id}
                 onChange={(e) => setUserForm(prev => ({ ...prev, person_id: e.target.value }))}
                 className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
               >
                 <option value="">Seleccionar persona</option>
                 {persons.map(person => (
                   <option key={person.person_id} value={person.person_id}>
                     {person.person_first_name} {person.person_last_name} - {person.person_dni}
                   </option>
                 ))}
               </select>
             </div>

             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">
                 Rol *
               </label>
               <select
                 value={userForm.user_role}
                 onChange={(e) => setUserForm(prev => ({ ...prev, user_role: e.target.value }))}
                 className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
               >
                 <option value="">Seleccionar rol</option>
                 {roles.map(role => (
                   <option key={role.role_id} value={role.role_id}>
                     {role.role_name}
                   </option>
                 ))}
               </select>
             </div>

             <div>
             </div>
           </div>

           <div className="flex justify-end space-x-3 mt-6">
             <Button
               variant="outline"
               onClick={() => {
                 setState(prev => ({ ...prev, isCreateUserModalOpen: false }));
                 resetUserForm();
               }}
             >
               Cancelar
             </Button>
             <Button
               onClick={handleCreateUser}
               disabled={createUserMutation.isLoading}
               className="flex items-center space-x-2"
             >
               <Save size={16} />
               <span>{createUserMutation.isLoading ? 'Guardando...' : 'Crear Usuario'}</span>
             </Button>
           </div>
         </div>
       </div>
     )}

     {/* Edit User Modal */}
     {state.isEditUserModalOpen && (
       <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
         <div className="bg-white rounded-lg p-6 w-full max-w-md">
           <h2 className="text-xl font-bold mb-4">Editar Usuario</h2>
           <p className="text-gray-600 mb-4">Funcionalidad pendiente de implementar</p>
           <Button onClick={() => setState(prev => ({ ...prev, isEditUserModalOpen: false, selectedUser: null }))}>
             Cerrar
           </Button>
         </div>
       </div>
     )}

     {/* View User Modal */}
     {state.isViewUserModalOpen && state.selectedUser && (
       <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
         <div className="bg-white rounded-lg p-6 w-full max-w-lg">
           <h2 className="text-xl font-bold mb-4">Detalles del Usuario</h2>
           
           <div className="space-y-4">
             <div className="flex items-center space-x-4">
               <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                 <span className="text-xl font-medium text-gray-700">
                   {state.selectedUser.person.person_first_name[0]}{state.selectedUser.person.person_last_name[0]}
                 </span>
               </div>
               <div>
                 <h3 className="text-lg font-medium text-gray-900">
                   {state.selectedUser.person.person_first_name} {state.selectedUser.person.person_last_name}
                 </h3>
                 <p className="text-gray-600">@{state.selectedUser.user_username}</p>
               </div>
             </div>

             <div className="grid grid-cols-2 gap-4">
               <div>
                 <label className="block text-sm font-medium text-gray-500">DNI</label>
                 <p className="text-sm text-gray-900">{state.selectedUser.person.person_dni}</p>
               </div>
               <div>
                 <label className="block text-sm font-medium text-gray-500">Email</label>
                 <p className="text-sm text-gray-900">{state.selectedUser.person.person_email}</p>
               </div>
               <div>
                 <label className="block text-sm font-medium text-gray-500">Rol</label>
                 <p className="text-sm text-gray-900">{state.selectedUser.role.role_name}</p>
               </div>
               <div>
                 <label className="block text-sm font-medium text-gray-500">Estado</label>
                 <span
                   className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                     state.selectedUser.user_status === 'A'
                       ? 'bg-green-100 text-green-800'
                       : 'bg-red-100 text-red-800'
                   }`}
                 >
                   {state.selectedUser.user_status === 'A' ? 'Activo' : 'Inactivo'}
                 </span>
               </div>
               <div>
                 <label className="block text-sm font-medium text-gray-500">Fecha de Creación</label>
                 <p className="text-sm text-gray-900">
                   {new Date(state.selectedUser.user_created_at).toLocaleString('es-ES')}
                 </p>
               </div>
             </div>
           </div>

           <div className="flex justify-end pt-6">
             <Button onClick={() => setState(prev => ({ ...prev, isViewUserModalOpen: false, selectedUser: null }))}>
               Cerrar
             </Button>
           </div>
         </div>
       </div>
     )}
   </div>
 );
};

export default UserManagementPage;