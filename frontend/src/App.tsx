import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import { Layout } from './components/layout/Layout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { CoursesPage } from './pages/CoursesPage';
import { ReportsPage } from './pages/ReportsPage';
import { InstructorPage } from './pages/InstructorPage';
import { ClientPage } from './pages/ClientPage';
import { SupervisorPage } from './pages/SupervisorPage';
import UserManagementPage from './pages/UserManagementPage';
import SettingsPage from './pages/SettingsPage';
import CourseManagementPage from './pages/CourseManagementPage';
import CourseAssignmentsPage from './pages/CourseAssignmentsPage';
import { CapacitacionesPage } from './pages/CapacitacionesPage';
import TeamsPage from './pages/TeamsPage';
import MyTeamPage from './pages/MyTeamPage';
import MaterialsPage from './pages/MaterialsPage';
import MyCoursesPage from './pages/MyCoursesPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutos
    },
  },
});

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

const DefaultRedirect: React.FC = () => {
  const { user } = useAuthStore();
  
  if (!user) return <Navigate to="/login" replace />;
  
  // Redirigir según el rol del usuario
  switch (user.role.role_id) {
    case 1: // Administrador
      return <Navigate to="/users" replace />;
    case 2: // Supervisor
      return <Navigate to="/teams" replace />;
    case 3: // Cliente
      return <Navigate to="/my-courses" replace />;
    case 4: // Instructor
      return <Navigate to="/materials" replace />;
    default:
      return <Navigate to="/users" replace />;
  }
};

const App: React.FC = () => {
  const { loadUserData, isAuthenticated } = useAuthStore();

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="App">
          <Routes>
            <Route
              path="/login"
              element={
                isAuthenticated ? <DefaultRedirect /> : <LoginPage />
              }
            />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DefaultRedirect />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="courses" element={<CoursesPage />} />
              <Route path="/course-management" element={<CourseManagementPage />} />
              <Route path="users" element={<UserManagementPage />} />
              <Route path="teams" element={<TeamsPage />} />
              <Route path="my-team" element={<MyTeamPage />} />
              <Route path="my-courses" element={<MyCoursesPage />} />
              <Route path="calendar" element={<InstructorPage />} />
              <Route path="materials" element={<MaterialsPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="/course-assignments" element={<CourseAssignmentsPage />} />
              <Route path="capacitaciones" element={<CapacitacionesPage />} />

            </Route>
            <Route path="*" element={<DefaultRedirect />} />
          </Routes>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
            }}
          />
        </div>
      </Router>
    </QueryClientProvider>
  );
};

export default App;