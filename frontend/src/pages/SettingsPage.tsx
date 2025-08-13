import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-hot-toast';
import {
  Role,
  UserPosition,
  Technology,
  CourseModality,
  Gender,
} from '@/types';
import { catalogService } from '@/services/api';
import {
  Settings,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Users,
  Briefcase,
  Monitor,
  Globe,
  UserCheck,
  Shield,
  Database,
  Palette,
  Bell,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

interface ConfigurationState {
  activeTab: string;
  isAddingItem: boolean;
  editingItem: any;
  newItemName: string;
  newItemDescription: string;
}

const SettingsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [state, setState] = useState<ConfigurationState>({
    activeTab: 'catalogs',
    isAddingItem: false,
    editingItem: null,
    newItemName: '',
    newItemDescription: '',
  });

  // Queries
  const { data: roles = [] } = useQuery('roles', catalogService.getRoles);
  const { data: positions = [] } = useQuery('positions', catalogService.getPositions);
  const { data: technologies = [] } = useQuery('technologies', catalogService.getTechnologies);
  const { data: modalities = [] } = useQuery('modalities', catalogService.getModalities);
  const { data: genders = [] } = useQuery('genders', catalogService.getGenders);

  // Mutations
  const createRoleMutation = useMutation(catalogService.createRole, {
    onSuccess: () => {
      toast.success('Rol creado exitosamente');
      queryClient.invalidateQueries('roles');
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Error al crear rol');
    },
  });

  const createPositionMutation = useMutation(catalogService.createPosition, {
    onSuccess: () => {
      toast.success('Posicion creada exitosamente');
      queryClient.invalidateQueries('positions');
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Error al crear posicion');
    },
  });

  const createTechnologyMutation = useMutation(catalogService.createTechnology, {
    onSuccess: () => {
      toast.success('Tecnologia creada exitosamente');
      queryClient.invalidateQueries('technologies');
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Error al crear tecnologia');
    },
  });

  const createModalityMutation = useMutation(catalogService.createModality, {
    onSuccess: () => {
      toast.success('Modalidad creada exitosamente');
      queryClient.invalidateQueries('modalities');
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Error al crear modalidad');
    },
  });

  const resetForm = () => {
    setState(prev => ({
      ...prev,
      isAddingItem: false,
      editingItem: null,
      newItemName: '',
      newItemDescription: '',
    }));
  };

  const handleAddItem = (type: string) => {
    if (!state.newItemName.trim()) {
      toast.error('El nombre es requerido');
      return;
    }

    switch (type) {
      case 'role':
        createRoleMutation.mutate({
          role_name: state.newItemName,
          role_description: state.newItemDescription || 'Rol del sistema',
        });
        break;
      case 'position':
        createPositionMutation.mutate({
          position_name: state.newItemName,
        });
        break;
      case 'technology':
        createTechnologyMutation.mutate({
          technology_name: state.newItemName,
        });
        break;
      case 'modality':
        createModalityMutation.mutate({
          course_modality_name: state.newItemName,
        });
        break;
    }
  };

  const tabs = [
    {
      id: 'catalogs',
      name: 'Roles',
      icon: Database,
      description: 'Gestiona roles del sistema',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Roles</h1>
          <p className="text-gray-600 mt-1">
            Administra los roles del sistema
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm text-gray-600">Sistema en linea</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setState(prev => ({ ...prev, activeTab: tab.id }))}
                className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                  state.activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon
                  className={`-ml-0.5 mr-2 h-5 w-5 ${
                    state.activeTab === tab.id ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                  }`}
                />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {state.activeTab === 'catalogs' && (
        <div className="space-y-6">
          <div className="max-w-2xl mx-auto">
            {/* Roles */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Roles del Sistema</h3>
                </div>
                <Button
                  size="sm"
                  onClick={() => setState(prev => ({ ...prev, isAddingItem: true, editingItem: 'role' }))}
                  className="flex items-center space-x-1"
                >
                  <Plus size={14} />
                  <span>Agregar</span>
                </Button>
              </div>
              
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {roles.map((role) => (
                  <div key={role.role_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div>
                      <p className="font-medium text-gray-900">{role.role_name}</p>
                      <p className="text-sm text-gray-600">{role.role_description}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" className="p-2">
                        <Edit size={14} />
                      </Button>
                      <Button variant="outline" size="sm" className="p-2 text-red-600">
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              
              {state.isAddingItem && state.editingItem === 'role' && (
                <div className="mt-4 p-4 border border-gray-200 rounded-md bg-blue-50">
                  <div className="space-y-3">
                    <Input
                      placeholder="Nombre del rol"
                      value={state.newItemName}
                      onChange={(e) => setState(prev => ({ ...prev, newItemName: e.target.value }))}
                    />
                    <Input
                      placeholder="Descripcion del rol"
                      value={state.newItemDescription}
                      onChange={(e) => setState(prev => ({ ...prev, newItemDescription: e.target.value }))}
                    />
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        onClick={() => handleAddItem('role')}
                        disabled={createRoleMutation.isLoading}
                        className="flex items-center space-x-1"
                      >
                        <Save size={14} />
                        <span>{createRoleMutation.isLoading ? 'Guardando...' : 'Guardar'}</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={resetForm}
                        className="flex items-center space-x-1"
                      >
                        <X size={14} />
                        <span>Cancelar</span>
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      )}


      {/* System Status */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Estado del Sistema</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <div>
              <p className="font-medium text-gray-900">Base de Datos</p>
              <p className="text-sm text-gray-600">Conectada y funcionando</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <div>
              <p className="font-medium text-gray-900">API Backend</p>
              <p className="text-sm text-gray-600">Operativa</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div>
              <p className="font-medium text-gray-900">Power BI</p>
              <p className="text-sm text-gray-600">Configuracion pendiente</p>
            </div>
          </div>
        </div>
        
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-600">{roles.length}</p>
              <p className="text-sm text-gray-600">Roles Configurados</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{positions.length}</p>
              <p className="text-sm text-gray-600">Posiciones Activas</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">{technologies.length}</p>
              <p className="text-sm text-gray-600">Tecnologias</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-600">{modalities.length}</p>
              <p className="text-sm text-gray-600">Modalidades</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default SettingsPage;