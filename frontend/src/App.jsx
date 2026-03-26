import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import { Plus, Wifi, WifiOff, MessageSquare, Trash2, Send, QrCode, Loader2, Code, Copy, CheckCircle } from 'lucide-react';
import './App.css';

const SOCKET_URL = window.location.origin;
const API_BASE = `${window.location.origin}/api`;
const API_KEY = 'your_secret_api_key'; 

function App() {
    const [sessions, setSessions] = useState([]);
    const [newSessionId, setNewSessionId] = useState('');
    const [isInitializing, setIsInitializing] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [activeQr, setActiveQr] = useState(null);
    const [selectedSession, setSelectedSession] = useState(null);
    const [message, setMessage] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [statusMessage, setStatusMessage] = useState('');

    useEffect(() => {
        const socket = io(SOCKET_URL, { transports: ['websocket'] });

        socket.on('qr', ({ sessionId, qr }) => {
            setIsInitializing(false);
            if (sessionId === newSessionId || sessions.find(s => s.id === sessionId)) {
                setActiveQr({ sessionId, qr });
            }
        });

        socket.on('ready', ({ sessionId }) => {
            setIsInitializing(false);
            setShowSuccess(true);
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
            setStatusMessage(`Session ${sessionId} disconnected.`);
        });

        fetchSessions();

        return () => socket.disconnect();
    }, [newSessionId]);

    const fetchSessions = async () => {
        try {
            const res = await axios.get(`${API_BASE}/sessions`, {
                headers: { 'x-api-key': API_KEY }
            });
            setSessions(res.data);
            return res.data;
        } catch (err) {
            console.error('Failed to fetch sessions', err);
        }
    };

    const createSession = async () => {
        if (!newSessionId) return;
        setIsInitializing(true);
        setActiveQr(null);
        try {
            await axios.post(`${API_BASE}/sessions`, { sessionId: newSessionId }, {
                headers: { 'x-api-key': API_KEY }
            });
            setStatusMessage('Initializing session... QR code will appear soon.');
        } catch (err) {
            setIsInitializing(false);
            setStatusMessage('Error creating session');
        }
    };

    const sendMessage = async () => {
        if (!selectedSession || !phoneNumber || !message) return;
        try {
            await axios.post(`${API_BASE}/send-message`, {
                sessionId: selectedSession.id,
                number: phoneNumber,
                message: message
            }, {
                headers: { 'x-api-key': API_KEY }
            });
            setMessage('');
            setStatusMessage('Message sent!');
        } catch (err) {
            setStatusMessage('Failed to send message');
        }
    };

    const deleteSession = async (sessionId) => {
        if (!window.confirm(`Are you sure you want to logout session ${sessionId}?`)) return;
        try {
            await axios.delete(`${API_BASE}/sessions/${sessionId}`, {
                headers: { 'x-api-key': API_KEY }
            });
            setSelectedSession(null);
            fetchSessions();
            setStatusMessage(`Session ${sessionId} deleted.`);
        } catch (err) {
            setStatusMessage('Failed to delete session');
        }
    };

    return (
        <div className="dashboard">
            <header>
                <div className="logo">
                    <MessageSquare size={32} color="#25D366" />
                    <h1>WhatsApp Gateway</h1>
                    <span>v2.0 Premium</span>
                </div>
                <div className="header-actions">
                    <input 
                        type="text" 
                        placeholder="New Session Name..." 
                        value={newSessionId}
                        onChange={(e) => setNewSessionId(e.target.value)}
                    />
                    <button className="btn-primary" onClick={createSession}>
                        <Plus size={20} /> Add Account
                    </button>
                </div>
            </header>

            <main>
                <aside className="sidebar">
                    <h2>Active Sessions</h2>
                    <div className="session-list">
                        {sessions.map(session => (
                            <div 
                                key={session.id} 
                                className={`session-item ${selectedSession && selectedSession.id === session.id ? 'active' : ''}`}
                                onClick={() => setSelectedSession(session)}
                            >
                                <span className="session-name">{session.id}</span>
                                <div className="status-badge connected">
                                    <Wifi size={14} /> Connected
                                </div>
                            </div>
                        ))}
                        {sessions.length === 0 && <p className="empty-state">No sessions found.</p>}
                    </div>
                </aside>

                <section className="content">
                    {showSuccess ? (
                        <div className="success-state card">
                            <CheckCircle size={80} color="#25D366" />
                            <h2>Berhasil Terkonek!</h2>
                            <p>Perangkat Anda sudah terhubung sebagai <strong>{selectedSession?.id}</strong>.</p>
                            <div className="next-steps info-box">
                                <strong>Langkah Selanjutnya:</strong>
                                <ul>
                                    <li>Sekarang Anda bisa kirim pesan lewat dashboard ini.</li>
                                    <li>Atau gunakan **API Key** dan **Session ID** untuk kirim otomatis dari sistem lain.</li>
                                </ul>
                            </div>
                        </div>
                    ) : isInitializing ? (
                        <div className="loading-state card">
                            <Loader2 size={64} className="spinner" color="#25D366" />
                            <h3>Initializing <span>{newSessionId}</span></h3>
                            <p>Starting WhatsApp... This may take up to 60 seconds.</p>
                        </div>
                    ) : activeQr ? (
                        <div className="qr-container card">
                            <h3>Scan QR for <span>{activeQr.sessionId}</span></h3>
                            <div className="qr-box">
                                {/* In a real app, use a QR component. For now, showing the raw string or using a service */}
                                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(activeQr.qr)}`} alt="QR Code" />
                            </div>
                            <p>Open WhatsApp on your phone and scan the code to link.</p>
                        </div>
                    ) : showSuccess ? (
                        <div className="success-state card">
                            <CheckCircle size={80} color="#25D366" style={{ marginBottom: '1.25rem' }} />
                            <h2>Berhasil Terkonek!</h2>
                            <p>Perangkat Anda sudah terhubung sebagai <strong>{selectedSession?.id}</strong>.</p>
                            <div className="next-steps info-box">
                                <strong>Langkah Selanjutnya:</strong>
                                <ul style={{ paddingLeft: '1.25rem', marginTop: '0.5rem', textAlign: 'left' }}>
                                    <li>Dashboard ini sudah bisa digunakan untuk tes kirim.</li>
                                    <li>Gunakan **API Key** di website Anda untuk kirim otomatis.</li>
                                </ul>
                            </div>
                        </div>
                    ) : selectedSession ? (
                        <div className="chat-interface card">
                            <div className="chat-header">
                                <h2>Messaging: <span>{selectedSession.id}</span></h2>
                                <button className="btn-danger" onClick={() => deleteSession(selectedSession.id)}>
                                    <Trash2 size={18} /> Logout
                                </button>
                            </div>
                            <div className="form-group">
                                <label>Recipient Number</label>
                                <input 
                                    type="text" 
                                    placeholder="628123456789" 
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <label>Message</label>
                                <textarea 
                                    placeholder="Type your message here..." 
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                ></textarea>
                            </div>
                            <button className="btn-send" onClick={sendMessage}>
                                <Send size={20} /> Send Message
                            </button>
                        </div>
                    ) : (
                        <div className="welcome-state card">
                            <div className="guide-header">
                                <Code size={32} color="#25D366" />
                                <h2>Panduan Integrasi API</h2>
                            </div>
                            <p>Sesi aktif akan muncul di sebelah kiri. Berikut cara kirim pesan dari sistem Anda:</p>
                            
                            <div className="guide-tabs">
                                <div className="guide-section">
                                    <h4>1. Kirim via URL (GET)</h4>
                                    <pre>
                                        <code>{`https://${window.location.host}/api/send?apikey=${API_KEY}&sessionId=NAMA_SESI&number=628...&message=Halo`}</code>
                                    </pre>
                                </div>

                                <div className="guide-section">
                                    <h4>2. Kirim via JSON (POST)</h4>
                                    <pre>
                                        <code>{`{
  "apikey": "${API_KEY}",
  "sessionId": "NAMA_SESI",
  "number": "628123456789",
  "message": "Pesan Anda"
}`}</code>
                                    </pre>
                                </div>
                            </div>
                            
                            <div className="info-box">
                                <p><strong>Tips:</strong> Ganti <code>NAMA_SESI</code> dengan nama yang Anda buat di kolom "New Session ID".</p>
                            </div>
                        </div>
                    )}
                </section>
            </main>
            
            {statusMessage && (
                <div className="toast" onClick={() => setStatusMessage('')}>
                    {statusMessage}
                </div>
            )}
        </div>
    );
}

export default App;
