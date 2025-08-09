import React, { useState } from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { UserRoles } from '@/types/advanced';
import {
  Menu,
  X,
  Home,
  Users,
  BookOpen,
  GraduationCap,
  BarChart3,
  Settings,
  LogOut,
  UserCircle,
  ChevronDown,
} from 'lucide-react';

const Sidebar: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    {
      title: 'Dashboard',
      icon: Home,
      path: '/dashboard',
      roles: [UserRoles.ADMIN, UserRoles.CLIENT, UserRoles.INSTRUCTOR],
    },
    {
      title: 'Gestión de Usuarios',
      icon: Users,
      path: '/users',
      roles: [UserRoles.ADMIN],
    },
    {
      title: 'Asignación de Cursos',
      icon: BookOpen,
      path: '/course-assignments',
      roles: [UserRoles.ADMIN],
    },
    {
      title: 'Gestión de Equipos',
      icon: Users,
      path: '/teams',
      roles: [UserRoles.ADMIN],
    },
    {
      title: 'Mi Equipo',
      icon: Users,
      path: '/teams',
      roles: [UserRoles.SUPERVISOR],
    },
    {
      title: 'Mis Cursos',
      icon: BookOpen,
      path: '/my-courses',
      roles: [UserRoles.CLIENT],
    },
    {
      title: 'Calendario de Clases',
      icon: GraduationCap,
      path: '/calendar',
      roles: [UserRoles.INSTRUCTOR],
    },
    {
      title: 'Material de Apoyo',
      icon: BookOpen,
      path: '/materials',
      roles: [UserRoles.INSTRUCTOR, UserRoles.CLIENT],
    },
    {
      title: 'Reportes',
      icon: BarChart3,
      path: '/reports',
      roles: [UserRoles.ADMIN, UserRoles.SUPERVISOR],
    },
    {
      title: 'Configuración',
      icon: Settings,
      path: '/settings',
      roles: [UserRoles.ADMIN],
    },
  ];

  const filteredMenuItems = menuItems.filter(item =>
    user && item.roles.includes(user.role.role_id as UserRoles)
  );

  return (
    <>
      {/* Overlay para móvil */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-50 h-full w-64 transform bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h1 className="text-xl font-bold text-primary-600">Career Plan</h1>
            <button
              onClick={onClose}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <X size={24} />
            </button>
          </div>

          {/* User Info */}
          <div className="p-4 border-b">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                <UserCircle className="w-6 h-6 text-primary-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {user?.person.person_first_name} {user?.person.person_last_name}
                </p>
                <p className="text-xs text-gray-500">{user?.role.role_name}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {filteredMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                  onClick={() => onClose()}
                >
                  <Icon size={20} />
                  <span>{item.title}</span>
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t">
            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 px-3 py-2 w-full text-left rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              <LogOut size={20} />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

const Header: React.FC<{ onMenuClick: () => void }> = ({ onMenuClick }) => {
  const { user } = useAuthStore();

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden text-gray-500 hover:text-gray-700"
          >
            <Menu size={24} />
          </button>
          <h2 className="text-lg font-semibold text-gray-900">
            Sistema de Capacitaciones - Viamatica
          </h2>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="hidden md:block text-right">
            <p className="text-sm font-medium text-gray-900">
              {user?.person.person_first_name} {user?.person.person_last_name}
            </p>
            <p className="text-xs text-gray-500">{user?.role.role_name}</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="lg:ml-64">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};