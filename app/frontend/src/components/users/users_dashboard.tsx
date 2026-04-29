//===========================================================
//  
//  users_dashboard.tsx
//  Main view for authenticated users, displaying the welcome
//  banner and the AI chatbot.
//  
//============================================================
import React from 'react';
import '../../styles/user_panel.css';
import ThemeToggle from '../ThemeToggle';
import Chatbot from './Chatbot';

// ---------------------------------------------------------------------
//   Props for the User Dashboard.
// -------------------------------------------------------------------
interface DashboardProps {
    user: { name: string; email: string; data: string | null };
    onLogout: () => void;
}

// ---------------------------------------------------------------------
//   Authenticated user dashboard component.
// -------------------------------------------------------------------
const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {

    return (
        <div className="user-dashboard">
            <header className="user-header">
                <h1>User Panel</h1>
                <div>
                    <ThemeToggle />
                    <button onClick={onLogout}
                        className="btn-user-primary"
                    >
                        Log Out
                    </button>
                </div>
            </header>

            <div className="user-welcome-banner">
                <h1>Hello, {user.name}!</h1>
                <p style={{ opacity: 0.9, marginTop: '0.5rem' }}>Member: {user.email}</p>
                {user.data && (
                    <p style={{ marginTop: '1rem', fontWeight: 'bold' }}>Your Profile Data: {user.data}</p>
                )}
            </div>
            <Chatbot userEmail={user.email} />
        </div>
    );
};

export default Dashboard;