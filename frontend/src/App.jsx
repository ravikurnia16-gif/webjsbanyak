import React, { useState, useEffect, useMemo } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import { 
  Plus, Wifi, WifiOff, MessageSquare, Trash2, Send, QrCode, 
  Loader2, Code, Copy, CheckCircle, ListChecks, ArrowDown,
  LayoutDashboard, Smartphone, Globe, Settings, Search, X, RefreshCw, Square
} from 'lucide-react';
import './App.css';

const SOCKET_URL = window.location.origin;
const API_BASE = `${window.location.origin}/api`;

function App() {
    const [currentPage, setCurrentPage] = useState('dashboard');
    const [sessions, setSessions] = useState([]);
    const [newSessionId, setNewSessionId] = useState('');
    const [isInitializing, setIsInitializing] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [activeQr, setActiveQr] = useState(null);
    const [selectedSession, setSelectedSession] = useState(null);
    const [message, setMessage] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [statusMessage, setStatusMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isQrModalOpen, setIsQrModalOpen] = useState(false);
    const [appApiKey, setAppApiKey] = useState(localStorage.getItem('wa_api_key') || 'your_secret_api_key');
    const [logs, setLogs] = useState([
        { id: 1, dir: 'out', session: 'system', to: '62812xxxxxx', text: 'Sistem siap digunakan.', type: 'text', time: new Date().toLocaleTimeString(), status: 'Sent' }
    ]);

    useEffect(() => {
        const socket = io(SOCKET_URL, { transports: ['websocket'] });

        socket.on('qr', ({ sessionId, qr }) => {
            setIsInitializing(false);
            setActiveQr({ sessionId, qr });
            if (currentPage === 'dashboard' || currentPage === 'sessions') {
                setIsQrModalOpen(true);
            }
        });

        socket.on('ready', ({ sessionId }) => {
            setIsInitializing(false);
            setShowSuccess(true);
            setIsQrModalOpen(false);
            setTimeout(() => setShowSuccess(false), 8000);
            fetchSessions().then(data => {
                const connected = data?.find(s => s.id === sessionId);
                if (connected) setSelectedSession(connected);
            });
            if (activeQr?.sessionId === sessionId) setActiveQr(null);
            setStatusMessage(`Berhasil! Sesi ${sessionId} siap digunakan.`);
        });

        socket.on('disconnected', ({ sessionId }) => {
            fetchSessions();
            setStatusMessage(`Sesi ${sessionId} terputus.`);
        });

        /* 
        socket.on('message', (msg) => {
            setLogs(prev => [{
                id: Date.now(),
                dir: 'in',
                session: msg.sessionId || 'unknown',
                to: msg.from,
                text: msg.body,
                type: 'text',
                time: new Date().toLocaleTimeString(),
                status: 'Read'
            }, ...prev].slice(0, 50));
        });
        */

        fetchSessions();

        return () => socket.disconnect();
    }, []);

    const fetchSessions = async () => {
        try {
            const res = await axios.get(`${API_BASE}/sessions`, {
                headers: { 'x-api-key': appApiKey }
            });
            setSessions(res.data);
            return res.data;
        } catch (err) {
            console.error('Failed to fetch sessions', err);
        }
    };

    const createSession = async () => {
        if (!newSessionId) return;
        
        // Match LocalAuth.js:20 requirement: Only alphanumeric, underscores and hyphens
        if (!/^[a-zA-Z0-9_-]+$/.test(newSessionId)) {
            setStatusMessage('Error: ID Sesi hanya boleh berisi huruf, angka, _ dan -. (Tanpa Spasi)');
            alert('ID Sesi tidak valid! Gunakan hanya huruf, angka, garis bawah (_), atau tanda hubung (-). Spasi tidak diperbolehkan.');
            return;
        }

        setIsInitializing(true);
        setIsAddModalOpen(false);
        try {
            await axios.post(`${API_BASE}/sessions`, { sessionId: newSessionId }, {
                headers: { 'x-api-key': appApiKey }
            });
            setNewSessionId('');
            setStatusMessage('Initializing... Tunggu sebentar untuk QR Code.');
        } catch (err) {
            setIsInitializing(false);
            setStatusMessage('Gagal membuat sesi. Periksa API Key di Settings.');
        }
    };

    const sendMessage = async () => {
        if (!selectedSession || !phoneNumber || !message) return;
        
        // Check if session is connected
        const isConnected = selectedSession.status === 'CONNECTED' || selectedSession.status === 'AUTHENTICATED';
        if (!isConnected) {
            alert(`Sesi ${selectedSession.id} belum terkoneksi. Silakan Scan QR terlebih dahulu.`);
            return;
        }

        try {
            await axios.post(`${API_BASE}/send-message`, {
                sessionId: selectedSession.id,
                number: phoneNumber,
                message: message,
                apikey: appApiKey
            });
            setLogs(prev => [{
                id: Date.now(),
                dir: 'out',
                session: selectedSession.id,
                to: phoneNumber,
                text: message,
                type: 'text',
                time: new Date().toLocaleTimeString(),
                status: 'Sent'
            }, ...prev].slice(0, 50));
            setMessage('');
            setStatusMessage('Pesan terkirim!');
            setTimeout(() => setStatusMessage(''), 3000);
        } catch (err) {
            setStatusMessage('Gagal mengirim pesan. Periksa API Key di Settings.');
            alert('Gagal mengirim pesan. Pastikan nomor benar dan API Key valid.');
        }
    };

    const deleteSession = async (sid) => {
        if (!window.confirm(`Hapus sesi ${sid}?`)) return;
        try {
            await axios.delete(`${API_BASE}/sessions/${sid}`, {
                headers: { 'x-api-key': appApiKey }
            });
            fetchSessions();
            if (selectedSession?.id === sid) setSelectedSession(null);
            setStatusMessage(`Sesi ${sid} dihapus.`);
        } catch (err) {
            setStatusMessage('Gagal menghapus sesi');
        }
    };

    const filteredSessions = useMemo(() => {
        return sessions.filter(s => s.id.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [sessions, searchQuery]);

    const stats = useMemo(() => {
        const connectedCount = sessions.filter(s => s.status === 'CONNECTED' || s.status === 'AUTHENTICATED').length;
        return {
            total: sessions.length,
            connected: connectedCount,
            messages: logs.length
        };
    }, [sessions, logs]);

    const renderPage = () => {
        switch(currentPage) {
            case 'dashboard':
                return (
                    <div className="page-area active">
                        <div className="stats-row">
                            <div className="stat-card">
                                <div className="stat-top">
                                    <span className="stat-icon">📱</span>
                                    <span className="stat-badge badge-up">Account</span>
                                </div>
                                <div className="stat-num">{stats.total}</div>
                                <div className="stat-label">Total Sessions</div>
                                <div className="stat-sub">{stats.connected} Terkoneksi</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-top">
                                    <span className="stat-icon">📨</span>
                                    <span className="stat-badge badge-info">Live</span>
                                </div>
                                <div className="stat-num">{stats.messages}</div>
                                <div className="stat-label">Pesan Diolah</div>
                                <div className="stat-sub">Semua sesi</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-top">
                                    <span className="stat-icon">⚡</span>
                                    <span className="stat-badge badge-up">Server</span>
                                </div>
                                <div className="stat-num">99%</div>
                                <div className="stat-label">Sla Reliability</div>
                                <div className="stat-sub">Gateway: Online</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-top">
                                    <span className="stat-icon">🔐</span>
                                    <span className="stat-badge badge-info">Privacy</span>
                                </div>
                                <div className="stat-num">AES</div>
                                <div className="stat-label">Encryption</div>
                                <div className="stat-sub">End-to-End Ready</div>
                            </div>
                        </div>

                        <div className="sec-header">
                            <div className="sec-title">Quick Access: Sessions</div>
                            <button className="btn btn-outline btn-sm" onClick={() => setCurrentPage('sessions')}>Lihat Semua →</button>
                        </div>

                        <div className="sessions-grid">
                            {filteredSessions.slice(0, 3).map(session => {
                                const isConnected = session.status === 'CONNECTED' || session.status === 'AUTHENTICATED';
                                const isScanning = session.status === 'QR_RECEIVED';
                                return (
                                    <div key={session.id} className={`session-card ${selectedSession?.id === session.id ? 'selected' : ''}`} onClick={() => setSelectedSession(session)}>
                                        <div className="sess-top">
                                            <div className="sess-avatar">🤖<div className={`sess-status-dot ${isConnected ? 'dot-connected' : isScanning ? 'dot-scanning' : 'dot-stopped'}`}></div></div>
                                            <div className="sess-info">
                                                <div className="sess-name">{session.id}</div>
                                                <div className="sess-phone">{session.status || 'Active'}</div>
                                            </div>
                                            <div className="sess-actions">
                                                <div className="icon-btn" title="QR Code" onClick={(e) => { e.stopPropagation(); setIsQrModalOpen(true); }}><QrCode size={14}/></div>
                                                <div className="icon-btn" title="Delete" onClick={(e) => { e.stopPropagation(); deleteSession(session.id); }}><Trash2 size={14}/></div>
                                            </div>
                                        </div>
                                        <div className="sess-footer">
                                            <span className={`status-pill ${isConnected ? 'pill-connected' : isScanning ? 'pill-scanning' : 'pill-stopped'}`}>
                                                <span className="pill-dot"></span>{session.status || 'Disconnected'}
                                            </span>
                                            <span className="sess-uptime">{isConnected ? 'Online' : 'Offline'}</span>
                                        </div>
                                    </div>
                                );
                            })}
                            <div className="add-sess-card" onClick={() => setIsAddModalOpen(true)}>
                                <div className="add-icon"><Plus size={28}/></div>
                                <div className="add-text">Tambah Session Baru</div>
                            </div>
                        </div>

                        <div className="sec-header">
                            <div className="sec-title">Aktivitas Terakhir</div>
                        </div>
                        <div className="table-wrap">
                            <table className="log-table">
                                <thead>
                                    <tr>
                                        <th>Arah</th>
                                        <th>Session</th>
                                        <th>Dari / Ke</th>
                                        <th>Pesan</th>
                                        <th>Waktu</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.slice(0, 5).map(log => (
                                        <tr key={log.id}>
                                            <td><span className={`log-dir ${log.dir === 'in' ? 'dir-in' : 'dir-out'}`}>{log.dir === 'in' ? '◀ IN' : '▶ OUT'}</span></td>
                                            <td><span className="log-session-badge">{log.session}</span></td>
                                            <td style={{ fontFamily: 'var(--mono)', fontSize: '11px' }}>{log.to}</td>
                                            <td className="log-msg">{log.text}</td>
                                            <td className="log-time">{log.time}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            case 'sessions':
                return (
                    <div className="page-area active">
                        <div className="sec-header">
                            <div className="sec-title">Manajemen Sesi ({sessions.length})</div>
                            <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>＋ Tambah Session</button>
                        </div>
                        <div className="sessions-grid">
                            {filteredSessions.map(session => {
                                const isConnected = session.status === 'CONNECTED' || session.status === 'AUTHENTICATED';
                                const isScanning = session.status === 'QR_RECEIVED';
                                return (
                                    <div key={session.id} className={`session-card ${selectedSession?.id === session.id ? 'selected' : ''}`} onClick={() => setSelectedSession(session)}>
                                        <div className="sess-top">
                                            <div className="sess-avatar">📱<div className={`sess-status-dot ${isConnected ? 'dot-connected' : isScanning ? 'dot-scanning' : 'dot-stopped'}`}></div></div>
                                            <div className="sess-info">
                                                <div className="sess-name">{session.id}</div>
                                                <div className="sess-phone">{isConnected ? 'Terkoneksi' : isScanning ? 'Menunggu Scan' : 'Terputus'}</div>
                                            </div>
                                            <div className="sess-actions">
                                                <div className="icon-btn" onClick={(e) => { e.stopPropagation(); setIsQrModalOpen(true); }}><QrCode size={14}/></div>
                                                <div className="icon-btn" onClick={(e) => { e.stopPropagation(); deleteSession(session.id); }}><Trash2 size={14}/></div>
                                            </div>
                                        </div>
                                        <div className="sess-meta">
                                            <div className="sess-meta-item"><div className="sess-meta-label">ID</div><div className="sess-meta-val">{session.id}</div></div>
                                            <div className="sess-meta-item"><div className="sess-meta-label">Status</div><div className="sess-meta-val">{session.status || 'Offline'}</div></div>
                                        </div>
                                        <div className="sess-footer">
                                            <span className={`status-pill ${isConnected ? 'pill-connected' : isScanning ? 'pill-scanning' : 'pill-stopped'}`}>
                                                <span className="pill-dot"></span>{isConnected ? 'Connected' : isScanning ? 'Scanning' : 'Disconnected'}
                                            </span>
                                            <button className="btn btn-outline btn-sm" style={{ padding: '2px 8px' }} onClick={(e) => { e.stopPropagation(); setSelectedSession(session); setCurrentPage('messages'); }}>Open Chat</button>
                                        </div>
                                    </div>
                                );
                            })}
                            <div className="add-sess-card" onClick={() => setIsAddModalOpen(true)}>
                                <div className="add-icon"><Plus size={28}/></div>
                                <div className="add-text">Tambah Session Baru</div>
                            </div>
                        </div>
                    </div>
                );
            case 'messages':
                return (
                    <div className="page-area active">
                        <div className="sec-header">
                            <div className="sec-title">Kirim Pesan {selectedSession ? `(${selectedSession.id})` : ''}</div>
                        </div>
                        <div className="stats-row" style={{ gridTemplateColumns: '1.5fr 1fr' }}>
                            <div className="stat-card" style={{ textAlign: 'left' }}>
                                <div className="form-group-new">
                                    <label className="form-label-new">Recipient Number</label>
                                    <input className="form-input-new" placeholder="628123456789" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} />
                                </div>
                                <div className="form-group-new" style={{ marginTop: '1rem' }}>
                                    <label className="form-label-new">Message Content</label>
                                    <textarea className="form-input-new" style={{ height: '120px', resize: 'none' }} placeholder="Halo dari WA Gateway..." value={message} onChange={e => setMessage(e.target.value)} />
                                </div>
                                <button className="btn btn-primary" style={{ marginTop: '1rem', width: '100%' }} onClick={sendMessage} disabled={!selectedSession}>
                                    <Send size={16} /> {selectedSession ? 'Send Message' : 'Select a Session First'}
                                </button>
                                {statusMessage && <p style={{ fontSize: '12px', color: 'var(--wa)', marginTop: '0.5rem' }}>{statusMessage}</p>}
                            </div>
                            <div className="stat-card" style={{ textAlign: 'left' }}>
                                <label className="form-label-new">Langkah Cepat</label>
                                <div className="qr-steps" style={{ marginTop: '1rem' }}>
                                    <div className="qr-step"><div className="step-num">1</div><div className="step-text">Pilih sesi aktif di menu Sidebar atau Sessions.</div></div>
                                    <div className="qr-step"><div className="step-num">2</div><div className="step-text">Masukkan nomor tujuan (format: 628...).</div></div>
                                    <div className="qr-step"><div className="step-num">3</div><div className="step-text">Tulis pesan dan klik Send Message.</div></div>
                                </div>
                            </div>
                        </div>

                        <div className="sec-header" style={{ marginTop: '1rem' }}>
                            <div className="sec-title">History Pesan (Live)</div>
                        </div>
                        <div className="table-wrap">
                            <table className="log-table">
                                <thead>
                                    <tr>
                                        <th>Arah</th>
                                        <th>Session</th>
                                        <th>Tujuan</th>
                                        <th>Isi Pesan</th>
                                        <th>Waktu</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.map(log => (
                                        <tr key={log.id}>
                                            <td><span className={`log-dir ${log.dir === 'in' ? 'dir-in' : 'dir-out'}`}>{log.dir === 'in' ? '◀ IN' : '▶ OUT'}</span></td>
                                            <td><span className="log-session-badge">{log.session}</span></td>
                                            <td style={{ fontFamily: 'var(--mono)', fontSize: '11px' }}>{log.to}</td>
                                            <td className="log-msg" title={log.text}>{log.text}</td>
                                            <td className="log-time">{log.time}</td>
                                            <td><span className="status-pill pill-connected" style={{ fontSize: '10px', padding: '2px 8px' }}>✓ {log.status}</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            case 'webhooks':
                return (
                    <div className="page-area active">
                        <div className="sec-header">
                            <div className="sec-title">Webhook Integrasi</div>
                        </div>
                        <div className="webhook-card">
                            <div className="webhook-header">
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: '14px' }}>Global Webhook Endpoint</div>
                                    <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '3px' }}>Forward all events to internal system</div>
                                </div>
                                <span className="status-pill pill-connected"><span className="pill-dot"></span>Active</span>
                            </div>
                            <div className="webhook-url">{API_BASE}/webhook/forward</div>
                            <div className="webhook-events">
                                <span className="event-tag active">message</span>
                                <span className="event-tag active">qr</span>
                                <span className="event-tag active">ready</span>
                                <span className="event-tag">call_ignored</span>
                            </div>
                        </div>
                        <div className="info-box" style={{ background: 'var(--surface2)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                            <p style={{ fontSize: '12px', color: 'var(--muted2)' }}><strong>Note:</strong> Webhook global akan mengirimkan JSON body berisi <code>sessionId</code>, <code>event</code>, dan <code>data</code> ke URL yang Anda tentukan.</p>
                        </div>
                    </div>
                );
            case 'steps':
                return (
                    <div className="page-area active">
                        <div className="sec-header">
                            <div className="sec-title">Panduan Langkah Integrasi (POST Method)</div>
                        </div>
                        
                        <div className="stat-card" style={{ textAlign: 'left', animation: 'fadeUp .3s ease both' }}>
                            <div className="qr-steps" style={{ gap: '24px' }}>
                                <div className="qr-step">
                                    <div className="step-num">1</div>
                                    <div className="step-text">
                                        <strong style={{ color: 'var(--text)', fontSize: '14px' }}>Buat Sesi WhatsApp</strong><br/>
                                        Masuk ke menu <strong>Sessions</strong> dan klik <strong>Tambah Session</strong>. Berikan nama unik (contoh: <code>sesi-utama</code>).
                                    </div>
                                </div>
                                <div className="qr-step">
                                    <div className="step-num">2</div>
                                    <div className="step-text">
                                        <strong style={{ color: 'var(--text)', fontSize: '14px' }}>Hubungkan Perangkat (Scan QR)</strong><br/>
                                        Klik ikon QR pada sesi yang baru dibuat. Buka WhatsApp di HP Anda &gt; Perangkat Tertaut &gt; Tautkan Perangkat.
                                    </div>
                                </div>
                                <div className="qr-step">
                                    <div className="step-num">3</div>
                                    <div className="step-text">
                                        <strong style={{ color: 'var(--text)', fontSize: '14px' }}>Integrasi API (Method: POST)</strong><br/>
                                        Gunakan endpoint di bawah ini untuk mengirim pesan dari website Anda. Pastikan menggunakan <code>method: POST</code> dan <code>Content-Type: application/json</code>.
                                    </div>
                                </div>
                                <div className="code-example" style={{ marginLeft: '32px', marginTop: '-10px' }}>
                                    <div className="code-block">
{`// Contoh Integrasi JavaScript (Fetch)
fetch('${API_BASE}/send-message', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': '${appApiKey}'
  },
  body: JSON.stringify({
    sessionId: 'sesi-utama', // ID yang Anda buat
    number: '628123456789',
    message: 'Halo, ini pesan dari website!'
  })
})`}
                                    </div>
                                </div>
                                <div className="qr-step">
                                    <div className="step-num">4</div>
                                    <div className="step-text">
                                        <strong style={{ color: 'var(--text)', fontSize: '14px' }}>Keamanan API Key</strong><br/>
                                        Simpan <code>x-api-key</code> Anda dengan aman di server backend website Anda. Jangan tampilkan secara publik di frontend website Anda.
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="info-box" style={{ background: 'rgba(37, 211, 102, 0.05)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--wa)', marginTop: '10px' }}>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <div style={{ color: 'var(--wa)', fontSize: '20px' }}><CheckCircle size={24}/></div>
                                <div>
                                    <div style={{ color: 'var(--text)', fontWeight: 700, marginBottom: '4px' }}>Tips Sukses</div>
                                    <div style={{ fontSize: '12px', color: 'var(--muted2)', lineHeight: '1.6' }}>
                                        Gunakan format nomor internasional tanpa tanda plus (contoh: 628...). <br/>
                                        Sistem akan otomatis me-refresh status koneksi setiap kali Anda membuka dashboard ini.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'api':
                return (
                    <div className="page-area active">
                        <div className="sec-header">
                            <div className="sec-title">API Documentation</div>
                        </div>
                        <div className="table-wrap">
                            <table className="log-table">
                                <thead><tr><th>Method</th><th>Endpoint</th><th>Description</th></tr></thead>
                                <tbody>
                                    <tr><td><span className="api-method method-get">GET</span></td><td style={{ fontFamily: 'var(--mono)' }}>/api/sessions</td><td>List all active sessions</td></tr>
                                    <tr><td><span className="api-method method-post">POST</span></td><td style={{ fontFamily: 'var(--mono)' }}>/api/send-message</td><td>Send WhatsApp Message</td></tr>
                                    <tr><td><span className="api-method method-get">GET</span></td><td style={{ fontFamily: 'var(--mono)' }}>/api/send</td><td>Send via URL Query (GET)</td></tr>
                                </tbody>
                            </table>
                        </div>
                        <div className="code-example">
                            <div style={{ fontWeight: 700, fontSize: '13px', marginBottom: '12px' }}>Example: Integration (JavaScript)</div>
                            <div className="code-block">
                                {`// Kirim Pesan via API
fetch('${API_BASE}/send', {
  method: 'GET',
  headers: { 'x-api-key': '${appApiKey}' }
})`}
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <>
            <aside className="sidebar">
                <div className="sb-logo">
                    <div className="sb-logo-icon">💬</div>
                    <div>
                        <div className="sb-logo-text">WA<span>Multi</span></div>
                    </div>
                    <div className="sb-logo-badge">v1.4</div>
                </div>

                <div className="sb-section">Main Menu</div>
                <div className={`sb-item ${currentPage === 'dashboard' ? 'active' : ''}`} onClick={() => showPage('dashboard')}>
                    <LayoutDashboard className="sb-icon" size={18} /> Dashboard
                    <span className="sb-count">{sessions.length}</span>
                    <div className="sb-dot"></div>
                </div>
                <div className={`sb-item ${currentPage === 'sessions' ? 'active' : ''}`} onClick={() => showPage('sessions')}>
                    <Smartphone className="sb-icon" size={18} /> Sessions
                    <span className="sb-count">{sessions.length}</span>
                    <div className="sb-dot"></div>
                </div>
                <div className={`sb-item ${currentPage === 'messages' ? 'active' : ''}`} onClick={() => showPage('messages')}>
                    <MessageSquare className="sb-icon" size={18} /> Messenging
                    <div className="sb-dot"></div>
                </div>

                <div className={`sb-item ${currentPage === 'steps' ? 'active' : ''}`} onClick={() => showPage('steps')}>
                    <ListChecks className="sb-icon" size={18} /> Langkah
                    <div className="sb-dot"></div>
                </div>

                <div className="sb-section">Settings</div>
                <div className={`sb-item ${currentPage === 'settings' ? 'active' : ''}`} onClick={() => showPage('settings')}>
                    <Settings className="sb-icon" size={18} /> Configuration
                </div>

                <div className="sb-section">Developer</div>
                <div className={`sb-item ${currentPage === 'webhooks' ? 'active' : ''}`} onClick={() => showPage('webhooks')}>
                    <Globe className="sb-icon" size={18} /> Webhooks
                </div>
                <div className={`sb-item ${currentPage === 'api' ? 'active' : ''}`} onClick={() => showPage('api')}>
                    <Code className="sb-icon" size={18} /> API Docs
                </div>

                <div className="sb-footer">
                    <div className="sb-user">
                        <div className="sb-avatar">A</div>
                        <div>
                            <div className="sb-user-name">Premium User</div>
                            <div className="sb-user-role">Super Admin</div>
                        </div>
                    </div>
                </div>
            </aside>

            <div className="main-wrapper">
                <div className="topbar">
                    <div>
                        <span className="topbar-crumb">{currentPage}</span>
                    </div>
                    <div className="topbar-actions">
                        <div className="search">
                            <Search size={16} color="var(--muted)" />
                            <input type="text" placeholder="Search sessions..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                        </div>
                        <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>＋ Tambah Session</button>
                    </div>
                </div>

                <div className="content-area">
                    {renderPage()}
                </div>
            </div>

            {/* Modal: Add Session */}
            {isAddModalOpen && (
                <div className="modal-overlay open" onClick={(e) => e.target.classList.contains('modal-overlay') && setIsAddModalOpen(false)}>
                    <div className="modal">
                        <div className="modal-header">
                            <div className="modal-title">＋ Tambah Session Baru</div>
                            <div className="modal-close" onClick={() => setIsAddModalOpen(false)}><X size={18}/></div>
                        </div>
                        <div className="modal-body">
                            <div className="form-grid">
                                <div className="form-group-new full">
                                    <label className="form-label-new">Session ID</label>
                                    <input className="form-input-new" type="text" placeholder="contoh: bot-marketing" value={newSessionId} onChange={e => setNewSessionId(e.target.value)} />
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
                                <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setIsAddModalOpen(false)}>Batal</button>
                                <button className="btn btn-primary" style={{ flex: 1 }} onClick={createSession} disabled={isInitializing}>
                                    {isInitializing ? <Loader2 className="spinner" size={18} /> : '🚀 Buat & Get QR'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: QR Code */}
            {activeQr && (
                <div className={`modal-overlay ${isQrModalOpen ? 'open' : ''}`} onClick={(e) => e.target.classList.contains('modal-overlay') && setIsQrModalOpen(false)}>
                    <div className="modal">
                        <div className="modal-header">
                            <div className="modal-title">📷 Scan QR Code</div>
                            <div className="modal-close" onClick={() => setIsQrModalOpen(false)}><X size={18}/></div>
                        </div>
                        <div className="modal-body" style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '12px', color: 'var(--muted2)', marginBottom: '16px' }}>Session: <strong style={{ color: 'var(--wa)' }}>{activeQr.sessionId}</strong></div>
                            <div className="qr-wrapper">
                                <div className="qr-svg">
                                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(activeQr.qr)}`} alt="QR Code" />
                                </div>
                            </div>
                            <div className="qr-steps">
                                <div className="qr-step"><div className="step-num">1</div><div className="step-text">Buka WhatsApp &gt; Perangkat Tertaut.</div></div>
                                <div className="qr-step"><div className="step-num">2</div><div className="step-text">Scan QR code di atas.</div></div>
                            </div>
                            <button className="btn btn-primary" style={{ marginTop: '1.5rem', width: '100%' }} onClick={() => setIsQrModalOpen(false)}>Done</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );

    function showPage(id) {
        setCurrentPage(id);
    }
}

export default App;
