import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatDate = (date: string | Date) => {
  return new Date(date).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const formatTime = (time: string) => {
  return time.slice(0, 5); // Formato HH:MM
};

export const getRoleDisplayName = (roleId: number) => {
  const roleNames: Record<number, string> = {
    1: 'Administrador del Sistema',
    2: 'Área de Capacitación',
    3: 'Supervisor',
    4: 'Empleado',
    5: 'Instructor',
    6: 'Administrador de Reportes',
  };
  return roleNames[roleId] || 'Rol desconocido';
};

export const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    'A': 'text-green-600 bg-green-100',
    'I': 'text-red-600 bg-red-100',
    'P': 'text-yellow-600 bg-yellow-100',
    'E': 'text-blue-600 bg-blue-100',
    'C': 'text-green-600 bg-green-100',
    'X': 'text-gray-600 bg-gray-100',
  };
  return colors[status] || 'text-gray-600 bg-gray-100';
};

export const getStatusText = (status: string) => {
  const statusTexts: Record<string, string> = {
    'A': 'Activo',
    'I': 'Inactivo',
    'P': 'Pendiente',
    'E': 'En Progreso',
    'C': 'Completado',
    'X': 'Cancelado',
  };
  return statusTexts[status] || 'Desconocido';
};