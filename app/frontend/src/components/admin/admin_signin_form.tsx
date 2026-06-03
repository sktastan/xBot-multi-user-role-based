//===========================================================
//  
//  admin_signin_form.tsx
//  React component for registering new administrator accounts.
//  
//============================================================
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/admin_panel.css';

// ---------------------------------------------------------------------
//   AdminSigninForm component for creating new admin accounts.
// -------------------------------------------------------------------
const AdminSigninForm: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '', // ---------------------------------------------------------------------
    //   State for form input fields.
    // -------------------------------------------------------------------
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    // ---------------------------------------------------------------------
    //   Handles the submission of the admin registration form.
    // -------------------------------------------------------------------
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Use the same host as the current window for API calls
      const response = await fetch("/admin/signin", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        // Automatically return to the admin panel upon successful registration
        navigate('/admin/dashboard');
      } else {
        const data = await response.json();
        setError(data.detail || 'Failed to register new admin.');
      }
    } catch (err) {
      setError('Failed to connect to the server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>Register Admin</h2>
        <p style={{ textAlign: 'center', color: 'var(--admin-text-muted)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
          Create a new administrator account.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input type="text" placeholder="John Doe" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="admin-search-input" required />
          </div>
          <div className="form-group">
            <label>Email Address</label>
            <input type="email" placeholder="admin@example.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="admin-search-input" required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" placeholder="••••••••" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="admin-search-input" required />
          </div>
          
          {error && <p className="error-message">{error}</p>}
          
          <div style={{ display: 'flex', gap: '10px', marginTop: '1.5rem' }}>
            <button type="submit" disabled={loading} className="btn-primary" style={{ flex: 2 }}>
              {loading ? 'Registering...' : 'Register'}
            </button>
            <button type="button" onClick={() => navigate('/admin/dashboard')} className="btn-outline" style={{ flex: 1 }}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminSigninForm;