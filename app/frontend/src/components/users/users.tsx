//===========================================================
//  
//  users.tsx
//  A toggle-based container that switches between the user
//  login and sign-in forms.
//  
//============================================================
import React, { useState } from 'react';
import '../../styles/user_panel.css';
import ThemeToggle from '../ThemeToggle';

// ---------------------------------------------------------------------
//   Props for the Users authentication wrapper.
// -------------------------------------------------------------------
interface UsersProps {
    onLoginSuccess: (user: { name: string; email: string }) => void;
}

// ---------------------------------------------------------------------
//   Component for toggling between login and registration views.
// -------------------------------------------------------------------
const Users: React.FC<UsersProps> = ({ onLoginSuccess }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // ---------------------------------------------------------------------
    //   Handles the authentication form submission.
    // -------------------------------------------------------------------
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const endpoint = isLogin ? '/login' : '/signin';
        const payload = isLogin 
            ? { email: formData.email, password: formData.password }
            : formData;

        try {
            const response = await fetch(`${window.location.origin}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                const data = await response.json();
                if (isLogin) {
                    onLoginSuccess(data);
                } else {
                    setIsLogin(true);
                }
            } else {
                // Handle non-OK responses safely
                let errorMessage = 'Authentication failed';
                try {
                    const data = await response.json();
                    errorMessage = data.detail || errorMessage;
                } catch (parseErr) {
                    errorMessage = `Error ${response.status}: ${response.statusText}`;
                }
                setError(errorMessage);
            }
        } catch (err) {
            setError('Could not connect to server. Please check your internet or if the backend is running.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
                <ThemeToggle />
            </div>
            <div className="auth-card">
                <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
                <p style={{ textAlign: 'center', color: 'var(--user-text-muted)', marginBottom: '2rem' }}>
                    {isLogin ? 'Enter your details to access your account' : 'Join us today! It only takes a minute.'}
                </p>

                <form onSubmit={handleSubmit}>
                    {!isLogin && (
                        <div className="form-group">
                            <label>Full Name</label>
                            <input 
                                type="text" 
                                className="user-input" 
                                placeholder="John Doe" 
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                required 
                            />
                        </div>
                    )}
                    <div className="form-group">
                        <label>Email Address</label>
                        <input 
                            type="email" 
                            className="user-input" 
                            placeholder="name@example.com" 
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            required 
                        />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input 
                            type="password" 
                            className="user-input" 
                            placeholder="••••••••" 
                            value={formData.password}
                            onChange={(e) => setFormData({...formData, password: e.target.value})}
                            required 
                        />
                    </div>

                    {error && <p className="error-message" style={{ marginTop: 0, marginBottom: '1rem' }}>{error}</p>}

                    <button type="submit" className="btn-user-modern" disabled={loading}>
                        {loading ? 'Processing...' : (isLogin ? 'Login' : 'Create Account')}
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--user-text-muted)' }}>
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <button 
                        className="toggle-auth-btn" 
                        onClick={() => { setIsLogin(!isLogin); setError(''); }}
                    >
                        {isLogin ? 'Sign Up' : 'Login'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Users;