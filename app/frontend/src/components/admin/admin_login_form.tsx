//===========================================================
//  
//  admin_login_form.tsx
//  React component for the administrator login form.
//  
//============================================================
import React, { useState } from 'react';
import '../../styles/admin_panel.css';
import ThemeToggle from '../ThemeToggle';

// ---------------------------------------------------------------------
//   Props for the AdminLoginForm component.
// -------------------------------------------------------------------
interface AdminLoginFormProps {
    onLogin: (admin: { name: string; email: string }) => void;
}

// ---------------------------------------------------------------------
//   AdminLoginForm component handles admin authentication.
// -------------------------------------------------------------------
const AdminLoginForm: React.FC<AdminLoginFormProps> = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        // ---------------------------------------------------------------------
        //   Handles the submission of the login form.
        // -------------------------------------------------------------------
        e.preventDefault();

        if (!email || !password) {
            setError('Please fill in all fields');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const API_URL = "/admin/login";
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();
            if (response.ok) {
                onLogin(data);
            } else {
                const errorMsg = data.detail || 'Login failed';
                setError(errorMsg);
            }
        } catch (err) {
            console.error("Admin login error:", err);
            setError("Connection error. Is the backend running?");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
                <ThemeToggle />
            </div>
            <div className="auth-card">
                <h2>Admin Login</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Email Address</label>
                        <input type="email" placeholder="admin@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="admin-search-input" />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="admin-search-input" />
                    </div>
                    <button type="submit" disabled={isLoading} className="btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                        {isLoading ? 'Authenticating...' : 'Login to Dashboard'}
                    </button>
                </form>
                {error && <p className="error-message">{error}</p>}
            </div>
        </div>
    );
};

export default AdminLoginForm;