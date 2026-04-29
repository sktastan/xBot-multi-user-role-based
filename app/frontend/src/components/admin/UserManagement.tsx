//===========================================================
//  
//  UserManagement.tsx
//  React component for administrators to manage user roles
//  and view user details.
//  
//============================================================
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { UserCog, Shield, Users as UsersIcon, CheckCircle, AlertCircle } from 'lucide-react';

// ---------------------------------------------------------------------
//   Interface for defining a system role.
// -------------------------------------------------------------------
interface Role {
    id: number;
    name: string;
    description: string;
}

// ---------------------------------------------------------------------
//   Interface for a user managed by the admin panel.
// -------------------------------------------------------------------
interface ManagedUser {
    name: string;
    email: string;
    role_id: number;
    role_name: string;
    created_at: string;
}

// ---------------------------------------------------------------------
//   UserManagement component for displaying and modifying user roles.
// -------------------------------------------------------------------
const UserManagement: React.FC = () => {
    const [users, setUsers] = useState<ManagedUser[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [updateStatus, setUpdateStatus] = useState<{ email: string, success: boolean } | null>(null);

    const API_BASE = `http://${window.location.hostname}:8000/admin`;

    useEffect(() => {
        // ---------------------------------------------------------------------
        //   Fetches initial user and role data on component mount.
        // -------------------------------------------------------------------
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [usersRes, rolesRes] = await Promise.all([
                axios.get(`${API_BASE}/managed-users`),
                axios.get(`${API_BASE}/roles`)
            ]);
            setUsers(usersRes.data);
            setRoles(rolesRes.data);
        } catch (err) {
            console.error("Failed to fetch management data", err);
        } finally {
            setLoading(false);
        }
    };

    // ---------------------------------------------------------------------
    //   Handles the change of a user's role and updates the backend.
    // -------------------------------------------------------------------
    const handleRoleChange = async (email: string, newRoleId: number) => {
        try {
            await axios.post(`${API_BASE}/update-user-role`, {
                email: email,
                role_id: newRoleId
            });
            setUpdateStatus({ email, success: true });
            setUsers(prev => prev.map(u => u.email === email ? { ...u, role_id: newRoleId } : u));
            setTimeout(() => setUpdateStatus(null), 3000);
        } catch (err) {
            setUpdateStatus({ email, success: false });
        }
    };

    if (loading) return <div className="p-8 text-center">Loading User Directory...</div>;

    return (
        <div className="admin-management-container">
            <div className="mgmt-header">
                <UsersIcon size={24} />
                <h2>User Directory & Access Control</h2>
            </div>

            <div className="mgmt-table-wrapper">
                <table className="mgmt-table">
                    <thead>
                        <tr>
                            <th>User Information</th>
                            <th>Current Role</th>
                            <th>Assign New Role</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                            <tr key={user.email}>
                                <td>
                                    <div className="user-info">
                                        <span className="user-name">{user.name} - </span>
                                        <span className="user-email">{user.email}</span>
                                    </div>
                                </td>
                                <td>
                                    <span className="role-badge">{roles.find(r => r.id === user.role_id)?.name || 'None'}</span>
                                </td>
                                <td>
                                    <select
                                        className="role-select"
                                        value={user.role_id || ""}
                                        onChange={(e) => handleRoleChange(user.email, parseInt(e.target.value))}
                                    >
                                        <option value="" disabled>Select Role</option>
                                        {roles.map(role => (
                                            <option key={role.id} value={role.id}>{role.name}</option>
                                        ))}
                                    </select>
                                </td>
                                <td>
                                    {updateStatus?.email === user.email && (
                                        <div className={`status-indicator ${updateStatus.success ? 'success' : 'error'}`}>
                                            {updateStatus.success ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                                            <span>{updateStatus.success ? 'Saved' : 'Error'}</span>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default UserManagement;