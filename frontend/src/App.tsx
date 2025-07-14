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
                isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />
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
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="courses" element={<CoursesPage />} />
              <Route path="/course-management" element={<CourseManagementPage />} />
              <Route path="users" element={<UserManagementPage />} />
              <Route path="my-team" element={<SupervisorPage />} />
              <Route path="my-courses" element={<ClientPage />} />
              <Route path="calendar" element={<InstructorPage />} />
              <Route path="materials" element={<InstructorPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="/course-assignments" element={<CourseAssignmentsPage />} />
              <Route path="capacitaciones" element={<CapacitacionesPage />} />

            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
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