import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { StudyTimeProvider } from './context/StudyTimeContext';
import { AppLayout } from './components/layout/AppLayout';
import { Login } from './pages/Auth/Login';
import { Register } from './pages/Auth/Register';
import { ForgotPassword } from './pages/Auth/ForgotPassword';
import { EducationProfileSetup } from './pages/Auth/EducationProfileSetup';
import { HomeDashboard } from './pages/Dashboard/HomeDashboard';
import { MyProfile } from './pages/Profile/MyProfile';
import { AskDoubt } from './pages/Doubt/AskDoubt';
import { LearningHistory } from './pages/History/LearningHistory';
import { WeakTopicsPage } from './pages/WeakTopics/WeakTopicsPage';
import { PracticePage } from './pages/Practice/PracticePage';
import { ProgressReportPage } from './pages/Progress/ProgressReportPage';
import { SettingsPage } from './pages/Settings/SettingsPage';

// Guard for protected routes
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading, isFirstTimeUser } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-slate-500">Loading ConceptTrace AI...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (isFirstTimeUser) {
    return <Navigate to="/setup" replace />;
  }

  return <>{children}</>;
};

// Guard for education profile setup
const SetupRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <StudyTimeProvider>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            
            {/* First-time Setup Route */}
            <Route 
              path="/setup" 
              element={
                <SetupRoute>
                  <EducationProfileSetup />
                </SetupRoute>
              } 
            />

            {/* Protected App Routes */}
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<HomeDashboard />} />
              <Route path="/profile" element={<MyProfile />} />
              <Route path="/doubt" element={<AskDoubt />} />
              <Route path="/history" element={<LearningHistory />} />
              <Route path="/weak-topics" element={<WeakTopicsPage />} />
              <Route path="/practice" element={<PracticePage />} />
              <Route path="/progress" element={<ProgressReportPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </StudyTimeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
