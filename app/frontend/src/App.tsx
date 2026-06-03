//===========================================================
//  
//  App.tsx
//  The root React component managing routing, authentication
//  persistence, and global application state.
//  
//============================================================
import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './styles/theme.css'
import './styles/index.css'
import './styles/user_panel.css'
import './styles/admin_panel.css'
import Users from './components/users/users';
import Dashboard from './components/users/users_dashboard';
import AdminLoginForm from './components/admin/admin_login_form';
import AdminSigninForm from './components/admin/admin_signin_form';
import AdminDashboard from './components/admin/admin_dashboard';
import AdminSetupForm from './components/admin/admin_setup_form';

// This is the main App component that renders the user login and sign-in forms.
// ---------------------------------------------------------------------
//   Main Application Component.
// -------------------------------------------------------------------
function App() {
  // Initialize state directly from localStorage to avoid unauthenticated "flashes"
  const [user, setUser] = useState<{ name: string; email: string; data?: string | null } | null>(() => {
    const saved = localStorage.getItem('user_session');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isLoggedIn, setIsLoggedIn] = useState(!!user);

  // Setup status
  const [isSetup, setIsSetup] = useState<boolean | null>(null);
  const [checkLoading, setCheckLoading] = useState(true);

  // Admin state
  const [admin, setAdmin] = useState<{ name: string; email: string; data?: string | null } | null>(() => {
    const saved = localStorage.getItem('admin_session');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(!!admin);

  // Persist sessions whenever state changes
  useEffect(() => {
    if (user) {
      localStorage.setItem('user_session', JSON.stringify(user));
    } else {
      localStorage.removeItem('user_session');
    }
  }, [user]);

  useEffect(() => {
    if (admin) {
      localStorage.setItem('admin_session', JSON.stringify(admin));
    } else {
      localStorage.removeItem('admin_session');
    }
  }, [admin]);

  // Persist theme across refreshes — use unified light-mode class on <html>
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'light') {
      document.documentElement.classList.add('light-mode');
    } else {
      document.documentElement.classList.remove('light-mode');
    }
  }, []);

  // Check setup status once on mount
  useEffect(() => {
    const API_URL = `${window.location.origin}/admin-setup/status`;
    fetch(API_URL)
      .then(res => res.json())
      .then(data => {
        setIsSetup(data.is_setup);
        // If system is not set up, clear any stale sessions from previous DB states
        if (data.is_setup === false) {
          setAdmin(null);
          setIsAdminLoggedIn(false);
          setUser(null);
          setIsLoggedIn(false);
        }
      })
      .catch(() => setIsSetup(false)) // Default to false if check fails to ensure setup page is shown
      .finally(() => setCheckLoading(false));
  }, []);

  if (checkLoading) return <div className="loading">Checking System Status...</div>;

  return (
    <Router>
      <Routes>
        {/* Admin Routes */}
        <Route path="/admin" element={<Navigate to={isSetup ? "/admin/login" : "/admin/setup"} replace />} />
        
        <Route path="/admin/setup" element={
          isSetup ? <Navigate to="/admin/login" replace /> : 
          <AdminSetupForm onSetupComplete={() => setIsSetup(true)} />
        } />

        <Route path="/admin/login" element={
          !isSetup ? <Navigate to="/admin/setup" replace /> :
          isAdminLoggedIn ? <Navigate to="/admin/dashboard" replace /> : 
          <AdminLoginForm onLogin={(adminData) => {
            setAdmin(adminData);
            setIsAdminLoggedIn(true);
          }} />
        } />
        <Route path="/admin/signin" element={
          !isSetup ? <Navigate to="/admin/setup" replace /> : 
          isAdminLoggedIn ? <AdminSigninForm /> : <Navigate to="/admin/login" replace />
        } />
        <Route path="/admin/dashboard" element={
          !isSetup ? <Navigate to="/admin/setup" replace /> :
          isAdminLoggedIn && admin ? (
            <AdminDashboard admin={admin} onLogout={async () => {
              try {
                const API_URL = `${window.location.origin}/admin/logout/${admin.email}`;
                await fetch(API_URL, { method: 'POST' });
              } finally {
                setIsAdminLoggedIn(false);
                setAdmin(null);
              }
            }} />
          ) : <Navigate to="/admin/login" replace />
        } />

        {/* User Routes */}
        <Route path="/dashboard" element={
          isLoggedIn && user ? (
            <Dashboard user={user} onLogout={async () => { 
              try {
                // Assuming the new endpoint we added to admin_management
                const API_URL = `${window.location.origin}/admin/logout-user/${user.email}`;
                await fetch(API_URL, { method: 'POST' });
              } finally {
                setIsLoggedIn(false);
                setUser(null);
              }
            }} />
          ) : <Navigate to="/" replace />
        } />
        <Route path="/" element={
          isLoggedIn ? <Navigate to="/dashboard" replace /> : 
          <Users onLoginSuccess={(userData) => {
            setUser(userData);
            setIsLoggedIn(true);
          }} />
        } />
      </Routes>
    </Router>
  );
}

export default App
