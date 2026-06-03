//===========================================================
//  
//  Chatbot.tsx
//  Main chatbot component for the user panel, supporting
//  streaming responses and conversation history.
//  
//============================================================
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import {
    MessageSquare, Plus, Trash2, Send, Bot,
    ShieldCheck, ChevronLeft, ChevronRight, Sparkles, Zap
} from 'lucide-react';
import '../../styles/chatbot.css';

// ---------------------------------------------------------------------
//   Interface for chat messages.
// -------------------------------------------------------------------
interface Message {
    prompt: string;
    response: string;
    provider?: string;
    model?: string;
    timestamp?: string;
}

const CLOUD_MODELS: Record<string, string[]> = {
    openai: ['gpt-5.5', 'gpt-5.4', 'gpt-4o', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'],
    claude: ['claude-4.6-sonnet', 'claude-4.6-opus', 'claude-4.5-sonnet', 'claude-4-opus'],
    gemini: ['gemini-3.1-pro', 'gemini-3.0-flash', 'gemini-2.5-pro', 'gemini-2.5-flash'],
    huggingface: [
        'Qwen/Qwen2.5-0.5B-Instruct', 
        'Qwen/Qwen2.5-1.5B-Instruct', 
        'Qwen/Qwen3.5-0.8B', 
        'Qwen/Qwen3-0.6B'
    ]
};

// ---------------------------------------------------------------------
//   Interface for conversation metadata.
// -------------------------------------------------------------------
interface Conversation {
    id: string;
    title: string;
    createdAt?: string;
}

// ---------------------------------------------------------------------
//   Props for the Chatbot component.
// -------------------------------------------------------------------
interface ChatbotProps {
    userEmail: string;
    isAdmin?: boolean;
}

// ---------------------------------------------------------------------
//   The primary Chatbot functional component.
// -------------------------------------------------------------------
const Chatbot: React.FC<ChatbotProps> = ({ userEmail, isAdmin = false }) => {
    const [prompt, setPrompt] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [currentId, setCurrentId] = useState<string | null>(null);
    const [streamingResponse, setStreamingResponse] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedProvider, setSelectedProvider] = useState('huggingface');
    const [availableModels, setAvailableModels] = useState<string[]>([]);
    const [selectedModel, setSelectedModel] = useState<string>('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const API_BASE = `${window.location.origin}/users`;

    const role = isAdmin ? 'admin' : 'user';

    useEffect(() => {
        if (userEmail) fetchConversations();
    }, [userEmail]);

    useEffect(() => {
        if (currentId) fetchHistory(currentId);
        else setMessages([]);
    }, [currentId]);


    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    // ---------------------------------------------------------------------
    //   Fetch available models when provider changes.
    // -------------------------------------------------------------------
    useEffect(() => {
        const fetchModels = async () => {
            if (selectedProvider === 'ollama') {
                try {
                    const res = await axios.get('http://127.0.0.1:11434/api/tags');
                    const models = Array.isArray(res.data?.models) ? res.data.models.map((m: any) => m.name) : [];
                    setAvailableModels(models);
                    if (models.length > 0) setSelectedModel(models[0]);
                    else setSelectedModel('');
                } catch (err) {
                    console.error('Failed to fetch Ollama models', err);
                    setAvailableModels(['qwen3:0.6b', 'llama3']);
                    setSelectedModel('qwen3:0.6b');
                }
            } else {
                const models = CLOUD_MODELS[selectedProvider] || [];
                setAvailableModels(models);
                if (models.length > 0) setSelectedModel(models[0]);
                else setSelectedModel('');
            }
        };
        fetchModels();
    }, [selectedProvider]);

    // ---------------------------------------------------------------------
    //   Explicitly request resources to be freed on the backend.
    // -------------------------------------------------------------------
    const handleUnloadModel = async (provider: string) => {
        if (provider === 'huggingface') {
            try {
                console.log(`[DASHBOARD] Requesting unload for ${provider}...`);
                const res = await axios.post(`${API_BASE}/chat/unload`);
                console.log('[DASHBOARD] Unload response:', res.data);
            } catch (err) {
                console.error('[DASHBOARD] Failed to unload model:', err);
            }
        }
    };

    // ---------------------------------------------------------------------
    //   Fetches conversation list for the current user.
    // -------------------------------------------------------------------
    const fetchConversations = async () => {
        try {
            const res = await axios.get(`${API_BASE}/chat/conversations/${userEmail}`);
            setConversations(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error('Error fetching conversations:', err);
            setConversations([]);
        }
    };

    // ---------------------------------------------------------------------
    //   Fetches the full message history for a specific conversation.
    // -------------------------------------------------------------------
    const fetchHistory = async (id: string) => {
        try {
            const res = await axios.get(`${API_BASE}/chat/history/${id}`);
            setMessages(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error('Error fetching history:', err);
            setMessages([]);
        }
    };

    // ---------------------------------------------------------------------
    //   Handles sending a message and processing the streaming response.
    // -------------------------------------------------------------------
    const handleSend = async () => {
        if (!prompt.trim()) return;
        setLoading(true);
        setStreamingResponse('');
        const conversationId = currentId || `conv_${Date.now()}`;
        const sentPrompt = prompt;
        setPrompt('');

        try {
            const response = await fetch(`${API_BASE}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: userEmail,
                    prompt: sentPrompt,
                    conversation_id: conversationId,
                    provider: selectedProvider,
                    model: selectedModel,
                    stream: true // Informing backend we want a stream
                }),
            });

            if (!response.ok) throw new Error(`Server error: ${response.status}`);
            if (!response.body) throw new Error('No response body');

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let accumulated = '';
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                // Append new data to buffer
                buffer += decoder.decode(value, { stream: true });

                // Process complete SSE messages (delimited by double newline)
                let boundary;
                while ((boundary = buffer.indexOf('\n\n')) !== -1) {
                    const packet = buffer.slice(0, boundary).trim();
                    buffer = buffer.slice(boundary + 2);

                    if (packet.startsWith('data: ')) {
                        try {
                            const jsonStr = packet.replace('data: ', '');
                            const data = JSON.parse(jsonStr);
                            accumulated += data.content;
                            setStreamingResponse(accumulated);
                        } catch (e) {
                            console.error('Failed to parse stream packet:', e);
                        }
                    }
                }
            }

            setMessages(prev => [
                ...prev,
                { prompt: sentPrompt, response: accumulated, provider: selectedProvider, model: selectedModel, timestamp: new Date().toISOString() },
            ]);
            setStreamingResponse('');

            if (!currentId) {
                setCurrentId(conversationId);
                fetchConversations();
            }
        } catch (err) {
            console.error('Chat error:', err);
            setStreamingResponse('⚠️ Error: Failed to get response. Ensure the backend and LLM provider are running.');
        } finally {
            setLoading(false);
            inputRef.current?.focus();
        }
    };

    // ---------------------------------------------------------------------
    //   Resets the state to start a fresh conversation.
    // -------------------------------------------------------------------
    const handleNewConversation = () => {
        setCurrentId(null);
        setPrompt('');
        inputRef.current?.focus();
    };

    // ---------------------------------------------------------------------
    //   Deletes a conversation and its associated history.
    // -------------------------------------------------------------------
    const handleDeleteConversation = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!window.confirm('Delete this conversation?')) return;
        try {
            await axios.delete(`${API_BASE}/chat/conversations/${id}`);
            setConversations(prev => prev.filter(c => c.id !== id));
            if (currentId === id) setCurrentId(null);
        } catch (err) {
            console.error('Error deleting conversation:', err);
        }
    };

    const isEmpty = messages.length === 0 && !loading;

    return (
        <div className={`chatbot-root chatbot-role-${role}`}>
            {/* ── Sidebar ────────────────────────────────── */}
            <aside className={`chatbot-sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
                <div className="chatbot-sidebar-inner custom-scrollbar">
                    {/* Header */}
                    <div className="chatbot-sidebar-header">
                        <div className="chatbot-sidebar-brand">
                            <div className="chatbot-brand-icon">
                                {isAdmin ? <ShieldCheck size={16} /> : <Sparkles size={16} />}
                            </div>
                            <span className="chatbot-brand-label">
                                {isAdmin ? 'Admin AI' : 'Assistant'}
                            </span>
                        </div>
                    </div>

                    {/* New Chat */}
                    <button className="chatbot-new-btn" onClick={handleNewConversation}>
                        <Plus size={16} />
                        <span>New Chat</span>
                    </button>

                    {/* Conversations */}
                    {Array.isArray(conversations) && conversations.length > 0 ? (
                        <div className="chatbot-conv-section">
                            <p className="chatbot-conv-label">Recent</p>
                            <div className="chatbot-conv-list">
                                {conversations.filter(c => c && c.id).map(conv => (
                                    <div
                                        key={conv.id}
                                        className={`chatbot-conv-item ${currentId === conv.id ? 'active' : ''}`}
                                        onClick={() => setCurrentId(conv.id)}
                                    >
                                        <MessageSquare size={13} className="chatbot-conv-icon" />
                                        <span className="chatbot-conv-title">{conv.title}</span>
                                        <button
                                            className="chatbot-conv-delete"
                                            onClick={e => handleDeleteConversation(e, conv.id)}
                                            title="Delete"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="chatbot-conv-empty">
                            <MessageSquare size={28} className="chatbot-conv-empty-icon" />
                            <p>{loading ? 'Loading...' : 'No conversations yet'}</p>
                            <span>Start a new chat above</span>
                        </div>
                    )}
                </div>

                {/* Collapse toggle */}
                <button
                    className="chatbot-sidebar-toggle"
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    title={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
                >
                    {isSidebarOpen ? <ChevronLeft size={15} /> : <ChevronRight size={15} />}
                </button>
            </aside>

            {/* ── Main Area ───────────────────────────────── */}
            <main className="chatbot-main">
                {/* Top bar */}
                <header className="chatbot-topbar">
                    <div className="chatbot-topbar-left">
                        <div className="chatbot-avatar">
                            {isAdmin ? <ShieldCheck size={18} /> : <Bot size={18} />}
                        </div>
                        <div>
                            <h2 className="chatbot-topbar-title">
                                {isAdmin ? 'Admin Intelligence' : 'AI Assistant'}
                            </h2>
                            <p className="chatbot-topbar-status">
                                <span className="chatbot-status-dot" />
                                Online
                            </p>
                        </div>
                    </div>

                    {/* Provider select */}
                    <div className="chatbot-provider-wrapper">
                        <Zap size={13} className="chatbot-provider-icon" />
                        <select
                            value={selectedProvider}
                            onChange={e => {
                                const newValue = e.target.value;
                                if (selectedProvider === 'huggingface' && newValue !== 'huggingface') {
                                    handleUnloadModel('huggingface');
                                }
                                setSelectedProvider(newValue);
                            }}
                            className="chatbot-provider-select"
                        >
                            <option value="ollama">Ollama</option>
                            <option value="huggingface">Hugging Face</option>
                            <option value="openai">OpenAI</option>
                            <option value="claude">Claude</option>
                            <option value="gemini">Gemini</option>
                        </select>
                        {Array.isArray(availableModels) && availableModels.length > 0 && (
                            <select
                                value={selectedModel}
                                onChange={e => setSelectedModel(e.target.value)}
                                className="chatbot-provider-select"
                                style={{ marginLeft: '8px' }}
                            >
                                {availableModels.map(m => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                        )}
                    </div>
                </header>

                {/* Messages */}
                <div className="chatbot-messages custom-scrollbar">
                    {isEmpty && (
                        <div className="chatbot-empty-state">
                            <div className="chatbot-empty-icon">
                                {isAdmin ? <ShieldCheck size={40} /> : <Sparkles size={40} />}
                            </div>
                            <h3 className="chatbot-empty-title">
                                {isAdmin ? 'Admin Intelligence Ready' : 'How can I help you?'}
                            </h3>
                            <p className="chatbot-empty-sub">
                                Start a conversation — ask me anything.
                            </p>
                            <div className="chatbot-suggestions">
                                {(isAdmin
                                    ? ['Summarize user activity', 'Security best practices', 'Analyze system metrics']
                                    : ['Explain a concept', 'Help me write code', 'Brainstorm ideas']
                                ).map(suggestion => (
                                    <button
                                        key={suggestion}
                                        className="chatbot-suggestion-chip"
                                        onClick={() => { setPrompt(suggestion); inputRef.current?.focus(); }}
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {Array.isArray(messages) && messages.map((msg, i) => (
                        <div key={i} className="chatbot-message-group animate-fade-slide-up">
                            {/* User bubble */}
                            <div className="chatbot-bubble-row user">
                                <div className="chatbot-bubble user-bubble">
                                    {msg.prompt}
                                </div>
                            </div>

                            {/* AI bubble */}
                            <div className="chatbot-bubble-row ai">
                                <div className="chatbot-ai-avatar">
                                    {isAdmin ? <ShieldCheck size={15} /> : <Bot size={15} />}
                                </div>
                                <div className="chatbot-bubble ai-bubble">
                                    <div className="chatbot-markdown">
                                        <ReactMarkdown>{msg.response}</ReactMarkdown>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                                        {msg.provider ? (
                                            <span className="chatbot-provider-tag" style={{ marginTop: 0 }}>
                                                {msg.provider} {msg.model ? `- ${msg.model}` : ''}
                                            </span>
                                        ) : <span></span>}
                                        {msg.timestamp && (
                                            <span style={{ fontSize: '10px', color: 'var(--text-subtle, #888)' }}>
                                                {new Date(msg.timestamp + (msg.timestamp.includes('T') ? '' : 'Z')).toLocaleString()}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Streaming AI bubble */}
                    {streamingResponse && (
                        <div className="chatbot-message-group animate-fade-slide-up">
                            <div className="chatbot-bubble-row ai">
                                <div className="chatbot-ai-avatar">
                                    {isAdmin ? <ShieldCheck size={15} /> : <Bot size={15} />}
                                </div>
                                <div className="chatbot-bubble ai-bubble">
                                    <div className="chatbot-markdown">
                                        <ReactMarkdown>{streamingResponse}</ReactMarkdown>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                                        <span className="chatbot-provider-tag" style={{ marginTop: 0 }}>
                                            {selectedProvider} {selectedModel ? `- ${selectedModel}` : ''} (streaming...)
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Typing indicator */}
                    {loading && !streamingResponse && (
                        <div className="chatbot-bubble-row ai animate-fade-in">
                            <div className="chatbot-ai-avatar">
                                {isAdmin ? <ShieldCheck size={15} /> : <Bot size={15} />}
                            </div>
                            <div className="chatbot-bubble ai-bubble chatbot-typing">
                                <span /><span /><span />
                            </div>
                        </div>
                    )}

                    <div ref={chatEndRef} />
                </div>

                {/* Input area */}
                <div className="chatbot-input-area">
                    <div className="chatbot-input-wrapper">
                        <input
                            ref={inputRef}
                            type="text"
                            className="chatbot-input"
                            value={prompt}
                            onChange={e => setPrompt(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                            placeholder={isAdmin ? 'Ask Admin Intelligence…' : 'Message AI Assistant…'}
                            disabled={loading}
                        />
                        <button
                            className="chatbot-send-btn"
                            onClick={handleSend}
                            disabled={loading || !prompt.trim()}
                            title="Send"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                    <p className="chatbot-input-hint">
                        Press <kbd>Enter</kbd> to send
                    </p>
                </div>
            </main>
        </div>
    );
};

export default Chatbot;