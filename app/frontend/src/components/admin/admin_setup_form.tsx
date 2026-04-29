//===========================================================
//  
//  admin_setup_form.tsx
//  React component for the initial system setup and primary
//  admin account creation.
//  
//============================================================
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/admin_panel.css';

// ---------------------------------------------------------------------
//   Props for the AdminSetupForm component.
// -------------------------------------------------------------------
interface AdminSetupFormProps {
  onSetupComplete: () => void;
}

// ---------------------------------------------------------------------
//   AdminSetupForm component for initializing the system.
// -------------------------------------------------------------------
const AdminSetupForm: React.FC<AdminSetupFormProps> = ({ onSetupComplete }) => {
  const [formData, setFormData] = useState({
    system_name: '',
    admin_name: '',
    admin_email: '',
    admin_password: '',
  });
  const [error, setError] = useState('');
  // ---------------------------------------------------------------------
  //   State for form input fields and loading/error status.
  // -------------------------------------------------------------------
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    // ---------------------------------------------------------------------
    //   Handles the submission of the system setup form.
    // -------------------------------------------------------------------

    try {
      const API_URL = `http://${window.location.hostname}:8000/admin-setup/run`;
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        onSetupComplete();
        navigate('/admin/login');
      } else {
        const data = await response.json();
        setError(data.detail || 'Setup failed. Please try again.');
      }
    } catch (err) {
      setError('Failed to connect to the server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: '450px' }}>
        <h2>System Setup</h2>
        <p style={{ textAlign: 'center', color: 'var(--admin-text-muted)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
          Initialize the system and create the primary admin account.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>System Name</label>
            <input type="text" placeholder="e.g., Enterprise Portal" value={formData.system_name} onChange={(e) => setFormData({ ...formData, system_name: e.target.value })} className="admin-search-input" required />
          </div>
          <div className="form-group">
            <label>Admin Name</label>
            <input type="text" placeholder="Root Admin" value={formData.admin_name} onChange={(e) => setFormData({ ...formData, admin_name: e.target.value })} className="admin-search-input" required />
          </div>
          <div className="form-group">
            <label>Admin Email</label>
            <input type="email" placeholder="admin@domain.com" value={formData.admin_email} onChange={(e) => setFormData({ ...formData, admin_email: e.target.value })} className="admin-search-input" required />
          </div>
          <div className="form-group">
            <label>Admin Password</label>
            <input type="password" placeholder="••••••••" value={formData.admin_password} onChange={(e) => setFormData({ ...formData, admin_password: e.target.value })} className="admin-search-input" required />
          </div>
          
          {error && <p className="error-message">{error}</p>}
          
          <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
            {loading ? 'Initializing...' : 'Initialize System'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminSetupForm;