import React from 'react';
import { useAuthStore } from '@/store/authStore';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { PowerBIDemo } from '@/components/powerbi';
import { UserRoles } from '@/types/advanced';
import {
  Users,
  BookOpen,
  GraduationCap,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  BarChart3,
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
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <StatsCard
                title="Mi Equipo"
                value="12"
                icon={Users}
                change="Miembros asignados"
                changeType="neutral"
              />
              <StatsCard
                title="Progreso del Equipo"
                value="78%"
                icon={TrendingUp}
                change="+12% este mes"
                changeType="positive"
              />
              <StatsCard
                title="Capacitaciones Pendientes"
                value="5"
                icon={AlertCircle}
                change="Requiere seguimiento"
                changeType="negative"
              />
            </div>

            <div className="text-center py-8">
              <Users className="w-16 h-16 text-primary-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                ¡Bienvenido, Supervisor!
              </h3>
              <p className="text-gray-600 mb-6">
                Ve al panel de "Mi Equipo" para gestionar a tus colaboradores y asignar capacitaciones.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md mx-auto">
                <a href="/my-team" className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors">
                  Gestionar Mi Equipo
                </a>
                <a href="/reports" className="bg-gray-100 text-gray-900 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors">
                  Ver Reportes
                </a>
              </div>
            </div>
          </>
        );

      case UserRoles.SUPERVISOR:
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <StatsCard
                title="Mi Equipo"
                value="12"
                icon={Users}
                change="Empleados asignados"
                changeType="neutral"
              />
              <StatsCard
                title="Progreso del Equipo"
                value="78%"
                icon={TrendingUp}
                change="+12% este mes"
                changeType="positive"
              />
              <StatsCard
                title="Capacitaciones Pendientes"
                value="5"
                icon={AlertCircle}
                change="Requiere seguimiento"
                changeType="negative"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PowerBIDemo
                title="Progreso de Mi Equipo"
                description="Estado actual de las capacitaciones de tu equipo"
              />
              <Card>
                <CardHeader>
                  <CardTitle>Empleados con Alertas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                      <div>
                        <p className="font-medium">Juan Pérez</p>
                        <p className="text-sm text-gray-600">2 cursos vencidos</p>
                      </div>
                      <AlertCircle className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <div>
                        <p className="font-medium">María García</p>
                        <p className="text-sm text-gray-600">Sin actividad 15 días</p>
                      </div>
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        );

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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                <a href="/my-courses" className="bg-primary-600 text-white px-6 py-3 rounded-md hover:bg-primary-700 transition-colors">
                  Ver Mis Cursos
                </a>
                <a href="/materials" className="bg-blue-100 text-blue-800 px-6 py-3 rounded-md hover:bg-blue-200 transition-colors">
                  Material de Apoyo
                </a>
                <a href="/my-courses" className="bg-green-100 text-green-800 px-6 py-3 rounded-md hover:bg-green-200 transition-colors">
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