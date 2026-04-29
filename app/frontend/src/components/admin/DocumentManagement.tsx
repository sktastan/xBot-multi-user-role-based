//===========================================================
//  
//  DocumentManagement.tsx
//  React component for administrators to upload and manage
//  knowledge base documents for the RAG system.
//  
//============================================================
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FileUp, Database, CheckCircle, Loader2 } from 'lucide-react';

// ---------------------------------------------------------------------
//   DocumentManagement component for handling RAG document uploads.
// -------------------------------------------------------------------
const DocumentManagement: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [roles, setRoles] = useState<{id: number, name: string}[]>([]);
    const [selectedRole, setSelectedRole] = useState("Employee Level");
    const [uploading, setUploading] = useState(false);
    const [status, setStatus] = useState<{message: string, success: boolean} | null>(null);
    const [stats, setStats] = useState({ document_chunks: 0 });

    const API_BASE = `http://${window.location.hostname}:8000/admin`;

    // ---------------------------------------------------------------------
    //   Fetches available roles and RAG system statistics on mount.
    // -------------------------------------------------------------------
    useEffect(() => {
        fetchRoles();
        fetchStats();
    }, []);

    // ---------------------------------------------------------------------
    //   Fetches the list of available roles from the backend.
    // -------------------------------------------------------------------
    const fetchRoles = async () => {
        const res = await axios.get(`${API_BASE}/roles`);
        setRoles(res.data);
    };

    // ---------------------------------------------------------------------
    //   Fetches the current status and indexed chunk count of the RAG system.
    // -------------------------------------------------------------------
    const fetchStats = async () => {
        const res = await axios.get(`${API_BASE}/rag/status`);
        setStats(res.data);
    };

    const handleUpload = async () => {
        if (!file) return;
        // ---------------------------------------------------------------------
        //   Handles the document upload process to the RAG system.
        // -------------------------------------------------------------------
        setUploading(true);
        setStatus(null);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('role', selectedRole);

        try {
            const res = await axios.post(`${API_BASE}/rag/upload`, formData);
            setStatus({ message: res.data.message, success: true });
            setFile(null);
            fetchStats();
        } catch (err: any) {
            setStatus({ message: err.response?.data?.detail || "Upload failed", success: false });
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="admin-management-container">
            <div className="mgmt-header">
                <Database size={24} />
                <h2>Knowledge Base Management</h2>
            </div>

            <div className="stats-container" style={{marginBottom: '2rem'}}>
                <div className="stat-card">
                    <label>Indexed Chunks</label>
                    <div className="value">{stats.document_chunks}</div>
                </div>
            </div>

            <div className="management-card" style={{maxWidth: '600px', margin: '0 auto'}}>
                <h4 className="card-title">Add New Knowledge Source</h4>
                <div className="form-group" style={{marginTop: '1.5rem'}}>
                    <label>Target Audience (Role Access)</label>
                    <select 
                        className="admin-search-input" 
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value)}
                    >
                        {roles.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                    </select>
                </div>

                <div className="form-group">
                    <label>Select Document (PDF, CSV, TXT)</label>
                    <input 
                        type="file" 
                        className="admin-search-input" 
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                        accept=".pdf,.csv,.txt,.md"
                    />
                </div>

                {status && (
                    <div className={`error-message ${status.success ? 'success' : ''}`} 
                         style={{background: status.success ? 'rgba(34, 197, 94, 0.1)' : '', color: status.success ? '#4ade80' : ''}}>
                        {status.success ? <CheckCircle size={16} /> : null}
                        {status.message}
                    </div>
                )}

                <button className="btn-primary" style={{width: '100%', marginTop: '1rem'}} onClick={handleUpload} disabled={uploading || !file}>
                    {uploading ? <><Loader2 className="animate-spin" size={16} /> Processing...</> : <><FileUp size={16} /> Index Document</>}
                </button>
            </div>
        </div>
    );
};

export default DocumentManagement;