import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/ui';
import { CalendarEvent, SessionCreateForm } from '@/types/advanced';
import { Calendar, Clock, Video, Plus, Edit, Trash2 } from 'lucide-react';

interface InstructorCalendarProps {
  sessions: CalendarEvent[];
  onCreateSession: (session: SessionCreateForm) => void;
  onEditSession: (sessionId: number, session: SessionCreateForm) => void;
  onDeleteSession: (sessionId: number) => void;
}

export const InstructorCalendar: React.FC<InstructorCalendarProps> = ({
  sessions,
  onCreateSession,
  onEditSession,
  onDeleteSession,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [editingSession, setEditingSession] = useState<CalendarEvent | null>(null);

  const [sessionForm, setSessionForm] = useState<SessionCreateForm>({
    course_id: 0,
    session_date: '',
    session_time: '',
    session_link: '',
    session_description: '',
    duration_minutes: 60,
  });

  const handleDateClick = (date: string) => {
    setSelectedDate(date);
    setSessionForm({ ...sessionForm, session_date: date });
    setShowSessionForm(true);
    setEditingSession(null);
  };

  const handleSubmitSession = () => {
    if (editingSession) {
      onEditSession(editingSession.event_id!, sessionForm);
    } else {
      onCreateSession(sessionForm);
    }
    setShowSessionForm(false);
    setEditingSession(null);
    resetForm();
  };

  const resetForm = () => {
    setSessionForm({
      course_id: 0,
      session_date: '',
      session_time: '',
      session_link: '',
      session_description: '',
      duration_minutes: 60,
    });
  };

  const handleEditSession = (session: CalendarEvent) => {
    setEditingSession(session);
    setSessionForm({
      course_id: 0, // You'd need to get this from the session
      session_date: session.start.split('T')[0],
      session_time: session.start.split('T')[1]?.split(':').slice(0, 2).join(':') || '',
      session_link: session.link || '',
      session_description: session.description || '',
      duration_minutes: 60,
    });
    setShowSessionForm(true);
  };

  // Generar calendario simple
  const generateCalendarDays = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    const days = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const dateString = date.toISOString().split('T')[0];
      const daySessions = sessions.filter(s => s.start.startsWith(dateString));
      
      days.push({
        date: dateString,
        day,
        sessions: daySessions,
        isToday: dateString === today.toISOString().split('T')[0],
      });
    }
    return days;
  };

  const calendarDays = generateCalendarDays();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Calendario de Sesiones</h2>
        <Button
          onClick={() => {
            setShowSessionForm(true);
            setEditingSession(null);
            resetForm();
          }}
          className="flex items-center gap-2"
        >
          <Plus size={16} />
          Nueva Sesión
        </Button>
      </div>

      {/* Calendario */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            {new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
              <div key={day} className="text-center font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map(({ date, day, sessions, isToday }) => (
              <div
                key={date}
                onClick={() => handleDateClick(date)}
                className={`
                  min-h-[80px] p-2 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors
                  ${isToday ? 'bg-blue-50 border-blue-200' : 'border-gray-200'}
                `}
              >
                <div className={`text-sm font-medium ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                  {day}
                </div>
                <div className="space-y-1 mt-1">
                  {sessions.map(session => (
                    <div
                      key={session.event_id}
                      className="text-xs bg-blue-100 text-blue-800 px-1 py-0.5 rounded truncate"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditSession(session);
                      }}
                    >
                      {session.title}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Formulario de sesión */}
      {showSessionForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingSession ? 'Editar Sesión' : 'Nueva Sesión de Clase'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Fecha</label>
                <input
                  type="date"
                  value={sessionForm.session_date}
                  onChange={(e) => setSessionForm({ ...sessionForm, session_date: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Hora</label>
                <input
                  type="time"
                  value={sessionForm.session_time}
                  onChange={(e) => setSessionForm({ ...sessionForm, session_time: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Enlace de la Sesión</label>
                <input
                  type="url"
                  value={sessionForm.session_link}
                  onChange={(e) => setSessionForm({ ...sessionForm, session_link: e.target.value })}
                  placeholder="https://meet.google.com/xxx-xxxx-xxx"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Descripción</label>
                <textarea
                  value={sessionForm.session_description}
                  onChange={(e) => setSessionForm({ ...sessionForm, session_description: e.target.value })}
                  placeholder="Tema de la clase, agenda, requisitos..."
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
                  rows={3}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Duración (minutos)</label>
                <input
                  type="number"
                  value={sessionForm.duration_minutes}
                  onChange={(e) => setSessionForm({ ...sessionForm, duration_minutes: parseInt(e.target.value) })}
                  min="15"
                  max="480"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <Button onClick={handleSubmitSession}>
                {editingSession ? 'Actualizar Sesión' : 'Crear Sesión'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowSessionForm(false);
                  setEditingSession(null);
                  resetForm();
                }}
              >
                Cancelar
              </Button>
              {editingSession && (
                <Button
                  variant="outline"
                  onClick={() => {
                    if (editingSession.event_id) {
                      onDeleteSession(editingSession.event_id);
                      setShowSessionForm(false);
                      setEditingSession(null);
                    }
                  }}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 size={16} />
                  Eliminar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de próximas sesiones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Próximas Sesiones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sessions
              .filter(s => new Date(s.start) >= new Date())
              .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
              .slice(0, 5)
              .map(session => (
                <div key={session.event_id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{session.title}</h4>
                    <p className="text-sm text-gray-600">
                      {new Date(session.start).toLocaleDateString('es-ES')} - {' '}
                      {new Date(session.start).toLocaleTimeString('es-ES', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                    {session.description && (
                      <p className="text-sm text-gray-500 mt-1">{session.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {session.link && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(session.link, '_blank')}
                        className="flex items-center gap-1"
                      >
                        <Video size={14} />
                        Unirse
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditSession(session)}
                    >
                      <Edit size={14} />
                    </Button>
                  </div>
                </div>
              ))
            }
            {sessions.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No hay sesiones programadas
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};