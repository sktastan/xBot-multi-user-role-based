//===========================================================
//  
//  admin_dashboard.tsx
//  Main dashboard component for administrators, providing
//  overview, user management, and knowledge base management.
//  
//============================================================
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/admin_panel.css';
import ThemeToggle from '../ThemeToggle';
import UserManagement from './UserManagement';
import DocumentManagement from './DocumentManagement';
import { LayoutDashboard, ShieldCheck, Database } from 'lucide-react';
// import Chatbot from '../users/Chatbot';

// ---------------------------------------------------------------------
//   Props for the AdminDashboard component.
// -------------------------------------------------------------------
interface AdminDashboardProps {
    admin: { name: string; email: string };
    onLogout: () => void;
}

// ---------------------------------------------------------------------
//   Interface for a generic user or admin entity, including login status.
// -------------------------------------------------------------------
interface Entity {
    name: string;
    email: string;
    is_logged_in: boolean;
    created_at?: string;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ admin, onLogout }) => {
    // ---------------------------------------------------------------------
    //   State variables for managing dashboard data and UI.
    // -------------------------------------------------------------------
    const navigate = useNavigate();
    const [users, setUsers] = useState<Entity[]>([]);
    const [admins, setAdmins] = useState<Entity[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'overview' | 'roles' | 'knowledge'>('overview');

    const API_BASE = `http://${window.location.hostname}:8000/admin`;

    // ---------------------------------------------------------------------
    //   Fetches user and admin data from the backend.
    // -------------------------------------------------------------------
    const fetchData = async () => {
        setIsLoading(true);
        setError('');
        try {
            const [usersRes, adminsRes] = await Promise.all([
                fetch(`${API_BASE}/users`),
                fetch(`${API_BASE}/admins`)
            ]);

            if (!usersRes.ok || !adminsRes.ok) {
                const statusInfo = `Users: ${usersRes.status}, Admins: ${adminsRes.status}`;
                throw new Error(`Server returned error (${statusInfo}). Verify backend router registration.`);
            }

            const [usersData, adminsData] = await Promise.all([
                usersRes.json(),
                adminsRes.json()
            ]);

            console.log("Fetched Data - Users:", usersData, "Admins:", adminsData);
            setUsers(usersData);
            setAdmins(adminsData);
        } catch (err) {
            console.error("Management fetch error:", err);
            setError((err as Error).message || 'Connection error. Verify the backend is running.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        // ---------------------------------------------------------------------
        //   Initial data fetch and sets up polling for real-time updates.
        // -------------------------------------------------------------------
        fetchData();
        // Poll for updates every 5 seconds to show real-time login status
        const interval = setInterval(fetchData, 5000);

        // Cleanup interval on unmount
        return () => clearInterval(interval);
    }, []);

    // ---------------------------------------------------------------------
    //   Handles the removal of a user or admin account.
    // -------------------------------------------------------------------
    const handleRemove = async (type: 'user' | 'admin', email: string) => {
        if (!window.confirm(`Are you sure you want to remove this ${type}?`)) return;

        try {
            const response = await fetch(`${API_BASE}/${type}s/${email}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                fetchData(); // Refresh lists
            } else {
                const data = await response.json();
                setError(data.detail || 'Action failed');
            }
        } catch (err) {
            setError('Connection error during deletion');
        }
    };

    // ---------------------------------------------------------------------
    //   Filters admin and user lists based on the search term.
    // -------------------------------------------------------------------
    const filteredAdmins = admins.filter(a =>
        a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="admin-dashboard">
            <header className="admin-header-modern">
                <div className="header-info">
                    <h1>Admin Panel</h1>
                    <div className="admin-badge">
                        <span className="dot"></span>
                        <span>{admin.name} <span className="email-subtle">({admin.email})</span></span>
                    </div>
                </div>
                <div className="header-actions">
                    <ThemeToggle />
                    <button onClick={() => navigate('/admin/signin')} className="btn-primary">Add Admin</button>
                    <button onClick={onLogout} className="btn-outline">Log Out</button>
                </div>
            </header>

            <div className="admin-navigation-tabs">
                <button
                    className={`nav-tab ${activeTab === 'overview' ? 'active' : ''}`}
                    onClick={() => setActiveTab('overview')}
                >
                    <LayoutDashboard size={18} /> Overview
                </button>

                <button
                    className={`nav-tab ${activeTab === 'roles' ? 'active' : ''}`}
                    onClick={() => setActiveTab('roles')}
                >
                    <ShieldCheck size={18} /> Access Control
                </button>

                <button
                    className={`nav-tab ${activeTab === 'knowledge' ? 'active' : ''}`}
                    onClick={() => setActiveTab('knowledge')}
                >
                    <Database size={18} /> Knowledge Base
                </button>
            </div>

            {activeTab === 'overview' && (
                <>
                    <div className="stats-container">
                        <div className="stat-card">
                            <label>Administrators</label>
                            <div className="value">{admins.length}</div>
                        </div>
                        <div className="stat-card">
                            <label>Total Users</label>
                            <div className="value">{users.length}</div>
                        </div>
                        <div className="stat-card">
                            <label>Active Now</label>
                            <div className="value">
                                {users.filter(u => u.is_logged_in).length + admins.filter(a => a.is_logged_in).length}
                            </div>
                        </div>
                    </div>

                    <div className="management-toolbar">
                        <div className="search-box">
                            <input
                                type="text"
                                placeholder="Search for an account..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="admin-search-input"
                            />
                        </div>
                    </div>

                    {error && <p className="error-message">{error}</p>}

                    <section className="dashboard-content">
                        <div className="management-grid">
                            <div className="management-card">
                                <h4 className="card-title">Administrators</h4>
                                {isLoading ? <p>Loading...</p> : (
                                    <ul className="account-list">
                                        {filteredAdmins.map(a => (
                                            <li key={a.email} className="account-item">
                                                <span className={a.is_logged_in ? 'logged-in-user' : ''}>
                                                    {a.is_logged_in && <span className="user-status-dot online"></span>}
                                                    <strong>{a.name}</strong><br />
                                                    <small>{a.email}</small><br />
                                                    {a.created_at && <small className="text-gray-500">Joined: {new Date(a.created_at).toLocaleString()}</small>}
                                                </span>
                                                <button className="btn-outline" onClick={() => handleRemove('admin', a.email)} disabled={a.email === admin.email}>Remove</button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                            <div className="management-card">
                                <h4 className="card-title">User Accounts</h4>
                                {isLoading ? <p>Loading...</p> : (
                                    <ul className="account-list">
                                        {filteredUsers.map(u => (
                                            <li key={u.email} className="account-item">
                                                <span className={u.is_logged_in ? 'logged-in-user' : ''}>
                                                    {u.is_logged_in && <span className="user-status-dot online"></span>}
                                                    <strong>{u.name}</strong><br />
                                                    <small>{u.email}</small><br />
                                                    {u.created_at && <small className="text-gray-500">Joined: {new Date(u.created_at).toLocaleString()}</small>}
                                                </span>
                                                <button className="btn-outline" onClick={() => handleRemove('user', u.email)}>Remove</button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    </section>
                </>
            )}

            {activeTab === 'knowledge' && (
                <DocumentManagement />
            )}

            {activeTab === 'roles' && (
                <UserManagement />
            )}

            {/* Admin AI Chatbot */}
            {/* <section style={{ marginTop: '2.5rem' }}>
                <Chatbot userEmail={admin.email} isAdmin={true} />
            </section> */}
        </div>
    );
};

export default AdminDashboard;