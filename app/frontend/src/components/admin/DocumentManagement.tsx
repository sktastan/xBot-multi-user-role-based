import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FileUp, Database, CheckCircle, Loader2, Trash2, RefreshCcw, Download, FileText } from 'lucide-react';

// ---------------------------------------------------------------------
//   DocumentManagement component for handling RAG document uploads.
// -------------------------------------------------------------------
const DocumentManagement: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [roles, setRoles] = useState<{id: number, name: string}[]>([]);
    const [documents, setDocuments] = useState<string[]>([]);
    const [selectedRole, setSelectedRole] = useState("Employee Level");
    const [uploading, setUploading] = useState(false);
    const [status, setStatus] = useState<{message: string, success: boolean} | null>(null);
    const [stats, setStats] = useState({ document_chunks: 0 });

    const API_BASE = "/admin";

    // ---------------------------------------------------------------------
    //   Fetches available roles and RAG system statistics on mount.
    // -------------------------------------------------------------------
    useEffect(() => {
        fetchRoles();
        fetchStats();
        fetchDocuments();
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

    // ---------------------------------------------------------------------
    //   Fetches the list of unique document names from the backend.
    // -------------------------------------------------------------------
    const fetchDocuments = async () => {
        const res = await axios.get(`${API_BASE}/rag/documents`);
        setDocuments(res.data.documents);
    };

    const handleDeleteDocument = async (filename: string) => {
        if (!window.confirm(`Are you sure you want to delete "${filename}" from the index?`)) return;
        
        try {
            await axios.delete(`${API_BASE}/rag/documents/${filename}`);
            fetchDocuments();
            fetchStats();
        } catch (err) {
            alert("Failed to delete document");
        }
    };

    const handleResetIndex = async () => {
        if (!window.confirm("WARNING: This will permanently delete ALL indexed data. Continue?")) return;
        
        try {
            await axios.post(`${API_BASE}/rag/reset`);
            fetchDocuments();
            fetchStats();
            setStatus({ message: "Vector index cleared successfully", success: true });
        } catch (err) {
            setStatus({ message: "Failed to reset index", success: false });
        }
    };

    const handleBackup = async () => {
        try {
            const response = await axios.post(`${API_BASE}/rag/backup`, {}, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `vector_db_backup_${new Date().getTime()}.zip`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            alert("Backup failed");
        }
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
            fetchDocuments();
        } catch (err: any) {
            setStatus({ message: err.response?.data?.detail || "Upload failed", success: false });
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="doc-management-container">
            <div className="admin-header-modern" style={{marginBottom: '2rem'}}>
                <div className="header-info">
                    <h1>Knowledge Base</h1>
                </div>
                <div className="header-actions">
                    <button className="btn-outline" onClick={handleBackup}>
                        <Download size={16} /> Backup Database
                    </button>
                    <button className="btn-outline btn-danger-outline" onClick={handleResetIndex}>
                        <RefreshCcw size={16} /> Reset Index
                    </button>
                </div>
            </div>

            <div className="stats-container">
                <div className="stat-card">
                    <label>Total Chunks</label>
                    <div className="value">{stats.document_chunks}</div>
                </div>
                <div className="stat-card">
                    <label>Indexed Files</label>
                    <div className="value">{documents.length}</div>
                </div>
            </div>

            <div className="management-grid doc-mgmt-grid">
                <div className="management-card doc-upload-card">
                    <h4 className="card-title"><FileUp size={16} style={{marginRight: '8px'}} /> Index New Source</h4>
                    
                    <div className="form-group-modern">
                        <label>Role Access Level</label>
                        <select 
                            className="admin-select-input" 
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value)}
                        >
                            {roles.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                        </select>
                    </div>

                    <div className="form-group-modern">
                        <label>Select Document</label>
                        <div className="file-upload-wrapper">
                            <input 
                                type="file" 
                                className="admin-file-input" 
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                                accept=".pdf,.csv,.txt,.md,.docx"
                            />
                        </div>
                    </div>

                    {status && (
                        <div className={status.success ? 'status-message success' : 'status-message error'}>
                            {status.success ? <CheckCircle size={16} style={{marginRight: '8px'}}/> : <span style={{marginRight: '8px'}}>⚠️</span>}
                            <span>{status.message}</span>
                        </div>
                    )}

                    <button 
                        className="btn-primary doc-upload-btn" 
                        onClick={handleUpload} 
                        disabled={uploading || !file}
                    >
                        {uploading ? (
                            <><Loader2 className="animate-spin" size={16} style={{marginRight: '8px'}}/> Processing...</>
                        ) : (
                            <><FileUp size={16} style={{marginRight: '8px'}}/> Index Knowledge</>
                        )}
                    </button>
                </div>

                <div className="management-card doc-list-card">
                    <div className="doc-list-header">
                        <h4 className="card-title" style={{marginBottom: 0, borderBottom: 'none'}}><FileText size={16} style={{marginRight: '8px'}}/> Indexed Knowledge</h4>
                        <span className="doc-count-badge">{documents.length} Files</span>
                    </div>
                    
                    <div className="document-list">
                        {documents.length === 0 ? (
                            <div className="empty-state">
                                <Database size={48} className="empty-icon" />
                                <p>The knowledge base is empty.</p>
                                <small>Upload documents on the left to get started.</small>
                            </div>
                        ) : (
                            <div className="mgmt-table-wrapper" style={{border: 'none', borderRadius: '0', background: 'transparent'}}>
                                <table className="mgmt-table doc-table">
                                    <thead>
                                        <tr>
                                            <th>Source Filename</th>
                                            <th style={{textAlign: 'right'}}>Management</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {documents.map((doc) => (
                                            <tr key={doc}>
                                                <td>
                                                    <div className="doc-name-cell">
                                                        <div className="doc-icon"><FileText size={16} /></div>
                                                        <strong>{doc}</strong>
                                                    </div>
                                                </td>
                                                <td style={{textAlign: 'right'}}>
                                                    <button 
                                                        onClick={() => handleDeleteDocument(doc)}
                                                        className="btn-icon-danger"
                                                        title="Remove from index"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DocumentManagement;