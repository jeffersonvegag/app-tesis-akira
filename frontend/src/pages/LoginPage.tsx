import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '@/store/authStore';
import { Button, Input, Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { LoginRequest } from '@/types';
import { toast } from 'react-hot-toast';
import { Eye, EyeOff, Lock, User } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginRequest>();

  const onSubmit = async (data: LoginRequest) => {
    setIsLoading(true);
    try {
      await login(data);
      toast.success('¡Bienvenido!');
      // Después del login exitoso, redirigir usando DefaultRedirect
      navigate('/');
    } catch (error: any) {
      console.error('Error en login:', error);
      toast.error(error.response?.data?.detail || 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
              <Lock className="w-8 h-8 text-primary-600" />
            </div>
            <CardTitle className="text-2xl">Iniciar Sesión</CardTitle>
            <p className="text-gray-600 text-sm">
              Sistema de Capacitaciones - Viamatica
            </p>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    {...register('username', {
                      required: 'El nombre de usuario es requerido',
                    })}
                    type="text"
                    placeholder="Nombre de usuario"
                    className="pl-10 w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                </div>
                {errors.username && (
                  <p className="text-sm text-red-600">{errors.username.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    {...register('password', {
                      required: 'La contraseña es requerida',
                    })}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Contraseña"
                    className="pl-10 pr-10 w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-600">
              <p>Usuarios de prueba:</p>
              <div className="mt-2 space-y-1 text-xs">
                <p><strong>Admin:</strong> admin / admin123</p>
                <p><strong>Supervisor:</strong> supervisor / sup123</p>
                <p><strong>Cliente:</strong> cliente / cli123</p>
                <p><strong>Instructor:</strong> instructor / ins123</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};