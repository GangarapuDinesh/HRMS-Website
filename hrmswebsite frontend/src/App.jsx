import { useState } from 'react';
import {BrowserRouter,Routes,Route,Navigate,useNavigate,} from 'react-router-dom';
import {registerUser,loginUser,logoutUser,} from './services/authService';
import Home from './pages/home/Home';
import Dashboard from './pages/dashboard/Dashboard';
import AuthPages from './pages/auth/AuthPages';
import EmployeeDocuments from './pages/documents/EmployeeDocuments';
import Terms from './pages/policies/Terms';
import PrivacyPolicy from './pages/policies/PrivacyPolicy';
import CookiePolicy from './pages/policies/CookiePolicy';
import './App.css';
function getSavedUser() {
  const token = sessionStorage.getItem('hrms-token');
  const savedUser = sessionStorage.getItem('hrms-user');
  if (!token || !savedUser) {
    return null;
  }

  try {
    return JSON.parse(savedUser);
  } catch {
    logoutUser();
    return null;
  }
}

function normalizeRole(role) {
  return String(role || '')
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_');
}

function AppContent() {
  const navigate = useNavigate();
  const [user, setUser] = useState(getSavedUser);
  const [mode, setMode] = useState('login');

  function openAuth(nextMode) {
    setMode(nextMode);
    navigate('/auth');
  }

  async function handleRegister(data) {
    if (!data?.fullName?.trim()) {
      throw new Error('Please enter your full name.');
    }

    if (!data?.email?.trim()) {
      throw new Error('Please enter your email address.');
    }

    if (!data?.password) {
      throw new Error('Please enter your password.');
    }
    return registerUser({
      fullName: data.fullName.trim(),
      email: data.email.trim().toLowerCase(),
      password: data.password,
      phone: data.phone?.trim() || '',
      department: data.department?.trim() || '',
      designation: data.designation?.trim() || '',
      role: 'EMPLOYEE',
    });
  }
  async function handleLogin(data) {
    const result = await loginUser({
      email: data.email,
      password: data.password,
      role: data.role,
    });
    const token =
      sessionStorage.getItem('hrms-token') ||
      result.token ||
      result.accessToken;

    if (!token) {
      throw new Error('Login succeeded without a JWT token. Check AuthResponse.java and authService.js.');
    }

    const backendUser = result.user || {};

    const userData = {
      userId:
        result.userId ??
        backendUser.userId ??
        backendUser.id,

      employeeId:
        result.employeeId ??
        backendUser.employeeId ??
        backendUser.employee?.id ??
        backendUser.employeeRecordId,

      fullName:
        result.fullName ??
        backendUser.fullName ??
        backendUser.name,

      email:
        result.email ??
        backendUser.email ??
        data.email,

      role:
        result.role ??
        backendUser.role,
    };

    if (!userData.role) {
      logoutUser();

      throw new Error('Login response did not include the user role. Check AuthResponse.java.');
    }

    if (
      normalizeRole(userData.role) !==
      normalizeRole(data.role)
    ) {
      logoutUser();

      throw new Error('The selected role does not match your account role. Please select the correct role.');
    }

    sessionStorage.setItem(
      'hrms-user',
      JSON.stringify(userData)
    );

    setUser(userData);
    navigate('/dashboard', { replace: true });
  }

  function handleLogout() {
    logoutUser();
    setUser(null);
    setMode('login');
    navigate('/', { replace: true });
  }

  function openDocuments() {
    navigate('/documents');
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          user ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Home
              onLogin={() => openAuth('login')}
              onRegister={() => openAuth('register')}
            />
          )
        }
      />

      <Route
        path="/auth"
        element={
          user ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <AuthPages
              initialMode={mode}
              onBack={() => navigate('/')}
              onLogin={handleLogin}
              onRegister={handleRegister}
            />
          )
        }
      />

      <Route
        path="/dashboard"
        element={
          user ? (
            <Dashboard
              user={user}
              onLogout={handleLogout}
              onOpenDocuments={openDocuments}
            />
          ) : (
            <Navigate to="/auth" replace />
          )
        }
      />

      <Route
        path="/documents"
        element={
          user ? (
            <EmployeeDocuments employeeId={user.employeeId} />
          ) : (
            <Navigate to="/auth" replace />
          )
        }
      />

      <Route path="/terms" element={<Terms />} />

      <Route
        path="/privacy-policy"
        element={<PrivacyPolicy />}
      />

      <Route
        path="/cookie-policy"
        element={<CookiePolicy />}
      />

      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
