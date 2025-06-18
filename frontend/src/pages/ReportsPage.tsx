import React from 'react';
import { useAuthStore } from '@/store/authStore';
import { UserRoles } from '@/types';
import { PowerBIDemo } from '@/components/powerbi';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  BookOpen, 
  Award, 
  Calendar,
  Download,
  Filter
} from 'lucide-react';

const MetricCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: string;
  trendType?: 'up' | 'down' | 'neutral';
}> = ({ title, value, icon: Icon, trend, trendType = 'neutral' }) => {
  const trendColors = {
    up: 'text-green-600',
    down: 'text-red-600',
    neutral: 'text-gray-600',
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {trend && (
              <p className={`text-xs ${trendColors[trendType]} flex items-center gap-1`}>
                <TrendingUp size={12} />
                {trend}
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

export const ReportsPage: React.FC = () => {
  const { user } = useAuthStore();

  if (!user) return null;

  const renderReportsByRole = () => {
    switch (user.role.role_id) {
      case UserRoles.SYSTEM_ADMIN:
      case UserRoles.REPORTS_ADMIN:
        return (
          <>
            {/* Métricas generales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <MetricCard
                title="Total Empleados"
                value="456"
                icon={Users}
                trend="+12% vs mes anterior"
                trendType="up"
              />
              <MetricCard
                title="Cursos Completados"
                value="89%"
                icon={BookOpen}
                trend="+5% vs objetivo"
                trendType="up"
              />
              <MetricCard
                title="Certificaciones"
                value="234"
                icon={Award}
                trend="+18 este mes"
                trendType="up"
              />
              <MetricCard
                title="Tiempo Promedio"
                value="2.3h"
                icon={Calendar}
                trend="-15min vs anterior"
                trendType="up"
              />
            </div>

            {/* Reportes de Power BI */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <PowerBIDemo
                title="Estadísticas Globales de Capacitación"
                description="Vista general del progreso de capacitaciones en toda la organización"
                height={450}
              />
              <PowerBIDemo
                title="Comparación por Cliente/Empresa"
                description="Análisis comparativo entre Banco Guayaquil, Banco Machala y otros clientes"
                height={450}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PowerBIDemo
                title="Cursos Más y Menos Populares"
                description="Ranking de cursos por número de inscripciones y completaciones"
                height={400}
              />
              <PowerBIDemo
                title="Empleados con Mayor/Menor Avance"
                description="Identificación de empleados destacados y que requieren seguimiento"
                height={400}
              />
            </div>
          </>
        );

      case UserRoles.TRAINING_AREA:
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <MetricCard
                title="Empleados en Capacitación"
                value="342"
                icon={Users}
                trend="+8% vs mes anterior"
                trendType="up"
              />
              <MetricCard
                title="Efectividad de Cursos"
                value="87%"
                icon={TrendingUp}
                trend="+3% vs objetivo"
                trendType="up"
              />
              <MetricCard
                title="Plan Anual Completado"
                value="73%"
                icon={Calendar}
                trend="En progreso"
                trendType="neutral"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PowerBIDemo
                title="Efectividad de Capacitaciones"
                description="Métricas de cumplimiento y efectividad por curso y modalidad"
                height={400}
              />
              <PowerBIDemo
                title="Progreso del Plan Anual"
                description="Estado de avance del plan de capacitaciones anual"
                height={400}
              />
            </div>
          </>
        );

      case UserRoles.SUPERVISOR:
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <MetricCard
                title="Miembros del Equipo"
                value="15"
                icon={Users}
                trend="Asignados"
                trendType="neutral"
              />
              <MetricCard
                title="Progreso del Equipo"
                value="82%"
                icon={TrendingUp}
                trend="+7% este mes"
                trendType="up"
              />
              <MetricCard
                title="Cursos Pendientes"
                value="8"
                icon={BookOpen}
                trend="Requiere seguimiento"
                trendType="down"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PowerBIDemo
                title="Progreso de Mi Equipo"
                description="Estado detallado de las capacitaciones de tu equipo"
                height={400}
              />
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Resumen del Equipo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">12</p>
                        <p className="text-sm text-green-800">Cursos Completados</p>
                      </div>
                      <div className="text-center p-4 bg-yellow-50 rounded-lg">
                        <p className="text-2xl font-bold text-yellow-600">3</p>
                        <p className="text-sm text-yellow-800">En Progreso</p>
                      </div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-lg font-semibold text-blue-800">
                        Próxima Revisión: 15 Jun 2025
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        );

      default:
        return (
          <div className="text-center py-12">
            <BarChart3 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">Sin acceso a reportes</h3>
            <p className="text-gray-500">
              Tu rol actual no tiene permisos para ver reportes administrativos
            </p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reportes y Análisis</h1>
          <p className="text-gray-600 mt-2">
            Monitoreo y análisis del progreso de capacitaciones
          </p>
        </div>
        
        {/* Controles de exportación solo para roles administrativos */}
        {[UserRoles.SYSTEM_ADMIN, UserRoles.TRAINING_AREA, UserRoles.REPORTS_ADMIN].includes(user.role.role_id as UserRoles) && (
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
              <Filter size={16} />
              Filtros
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">
              <Download size={16} />
              Exportar
            </button>
          </div>
        )}
      </div>

      {/* Contenido dinámico por rol */}
      {renderReportsByRole()}

      {/* Información sobre Power BI */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <BarChart3 className="w-8 h-8 text-blue-600 mt-1" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">
                Integración con Power BI
              </h3>
              <p className="text-blue-800 text-sm mb-3">
                Los reportes mostrados se conectan directamente con Microsoft Power BI para 
                proporcionar análisis en tiempo real del progreso de capacitaciones.
              </p>
              <div className="grid md:grid-cols-2 gap-4 text-xs text-blue-700">
                <div>
                  <p className="font-medium mb-1">Características:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Actualización automática de datos</li>
                    <li>Filtros interactivos por fecha y equipo</li>
                    <li>Exportación a Excel y PDF</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium mb-1">Métricas incluidas:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Tasas de completación por curso</li>
                    <li>Progreso individual y por equipos</li>
                    <li>Comparativas entre departamentos</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};