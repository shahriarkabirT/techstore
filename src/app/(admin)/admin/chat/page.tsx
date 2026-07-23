'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useAdminSocket } from '@/context/AdminSocketContext';

// Interfaces (Should ideally be in a types file)
interface AdminMessage {
    sender: 'user' | 'admin' | 'system';
    text: string;
    timestamp: Date;
    read: boolean;
}

interface AdminChatSession {
    _id: string;
    socketId: string;
    user: {
        name: string;
        phone: string;
        email?: string;
    };
    status: 'active' | 'closed';
    messages: AdminMessage[];
    updatedAt: string;
    userRead: boolean; // Read by user
    adminRead: boolean; // Read by admin
}

export default function AdminChatPage() {
    const [sessions, setSessions] = useState<AdminChatSession[]>([]);
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
    const [inputMsg, setInputMsg] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const { user } = useAuth();
    const { socket, isConnected } = useAdminSocket();
    const joinedSessions = useRef<Set<string>>(new Set());

    // Pagination state
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const isLoadingRef = useRef(false); // Ref to manage loading state for useCallback

    const loadSessions = useCallback(async (pageNum: number) => {
        if (isLoadingRef.current) return;

        isLoadingRef.current = true;
        setLoading(true);
        try {
            const res = await fetch(`/api/chat/active?page=${pageNum}&limit=20`);
            const data = await res.json();

            if (data.length < 20) {
                setHasMore(false);
            }

            setSessions(prev => {
                const existingIds = new Set(prev.map(s => s._id));
                const newSessions = data.filter((s: AdminChatSession) => !existingIds.has(s._id));
                return [...prev, ...newSessions].sort((a, b) =>
                    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
                );
            });
            setPage(pageNum);
        } catch (err) {
            console.error('Failed to load sessions', err);
        } finally {
            isLoadingRef.current = false;
            setLoading(false);
        }
    }, []); // Empty dependency array ensures this useCallback is stable

    // Initial load
    useEffect(() => {
        loadSessions(1);
    }, [loadSessions]); // loadSessions is now stable

    // Derived State Memoization
    const filteredSessions = useMemo(() => {
        const query = searchQuery.toLowerCase();
        return sessions.filter(s =>
            s.user.name.toLowerCase().includes(query) ||
            s.user.email?.toLowerCase().includes(query) ||
            s.user.phone.includes(searchQuery)
        );
    }, [sessions, searchQuery]);

    const activeSession = useMemo(() =>
        sessions.find(s => s._id === activeSessionId),
        [sessions, activeSessionId]);

    const handleScroll = useCallback(() => {
        if (scrollContainerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
            if (scrollHeight - scrollTop <= clientHeight + 50 && hasMore && !isLoadingRef.current) {
                loadSessions(page + 1);
            }
        }
    }, [loadSessions, hasMore, page]); // Dependencies for handleScroll

    // Socket event listeners
    useEffect(() => {
        if (!socket) return;

        const onNewChatSession = (session: AdminChatSession) => {
            setSessions(prev => [session, ...prev]);
        };

        const onMessageReceived = ({ sessionId, message }: { sessionId: string, message: AdminMessage }) => {
            setSessions(prev => {
                const updated = prev.map(session => {
                    if (session._id === sessionId) {
                        return {
                            ...session,
                            messages: [...session.messages, message],
                            updatedAt: new Date().toISOString(),
                        };
                    }
                    return session;
                });
                return updated.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
            });
        };

        socket.on('admin_message_received', onMessageReceived);
        socket.on('new_chat_session', onNewChatSession);
        socket.on('session_updated', (updatedSession: AdminChatSession) => {
            setSessions(prev => prev.map(s => s._id === updatedSession._id ? updatedSession : s));
        });

        return () => {
            socket.off('admin_message_received', onMessageReceived);
            socket.off('new_chat_session', onNewChatSession);
            socket.off('session_updated');
        };
    }, [socket]);

    // Agent join logic
    useEffect(() => {
        if (activeSessionId && user?.name && socket && isConnected) {
            if (!joinedSessions.current.has(activeSessionId)) {
                socket.emit('agent_joined', { sessionId: activeSessionId, adminName: user.name });
                joinedSessions.current.add(activeSessionId);
            }
        }
    }, [activeSessionId, user, socket, isConnected]);

    // Scroll messages to bottom
    useEffect(() => {
        if (activeSessionId) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [activeSessionId, sessions]);

    // Mark as read effect
    useEffect(() => {
        if (!activeSessionId || !socket || !activeSession) return;
        const hasUnread = activeSession.messages.some(m => m.sender === 'user' && !m.read);
        if (hasUnread) {
            socket.emit('mark_session_read', { sessionId: activeSessionId });
        }
    }, [activeSession, activeSessionId, socket]);

    const handleSessionSelect = useCallback((sessionId: string) => {
        setActiveSessionId(sessionId);
        if (socket) {
            socket.emit('mark_session_read', { sessionId });
            setSessions(prev => prev.map(s => {
                if (s._id === sessionId) {
                    const updatedMessages = s.messages.map(m => m.sender === 'user' ? { ...m, read: true } : m);
                    return { ...s, messages: updatedMessages, adminRead: true };
                }
                return s;
            }));
        }
    }, [socket]);

    const handleSendMessage = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        if (!inputMsg.trim() || !activeSessionId || !socket) return;

        socket.emit('send_message', {
            sessionId: activeSessionId,
            text: inputMsg,
            sender: 'admin'
        });

        const newMessage: AdminMessage = {
            sender: 'admin',
            text: inputMsg,
            timestamp: new Date(),
            read: false
        };

        setSessions(prev => prev.map(s => {
            if (s._id === activeSessionId) {
                return { ...s, messages: [...s.messages, newMessage] };
            }
            return s;
        }));

        setInputMsg('');
    }, [inputMsg, activeSessionId, socket]);

    const handleEndChat = useCallback(async () => {
        if (!activeSessionId || !socket) return;
        if (!confirm('Are you sure you want to end this chat?')) return;

        socket.emit('toggle_chat_status', { sessionId: activeSessionId, status: 'closed' });
        setSessions(prev => prev.map(s => {
            if (s._id === activeSessionId) {
                return { ...s, status: 'closed' };
            }
            return s;
        }));
    }, [activeSessionId, socket]);

    const handleDeleteSession = useCallback(async () => {
        if (!activeSessionId) return;

        try {
            const res = await fetch(`/api/chat/${activeSessionId}`, {
                method: 'DELETE',
            });
            const data = await res.json();

            if (data.success) {
                setSessions(prev => prev.filter(s => s._id !== activeSessionId));
                setActiveSessionId(null);
                setShowMoreMenu(false);
                setConfirmDelete(false);
            } else {
                alert(data.message || 'Failed to delete session');
            }
        } catch (err) {
            console.error('Delete session error:', err);
            alert('An error occurred while deleting the session');
        }
    }, [activeSessionId]);

    const menuRef = useRef<HTMLDivElement>(null);
    const [showMoreMenu, setShowMoreMenu] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowMoreMenu(false);
                setConfirmDelete(false);
            }
        };
        if (showMoreMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showMoreMenu]);

    return (
        <div className="flex h-[calc(100dvh-6rem)] bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Sidebar List */}
            <div className={`border-r border-gray-200 bg-gray-50 flex-col w-full md:w-80 ${activeSessionId ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-4 border-b border-gray-200 bg-white">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-bold text-gray-900 text-lg">Inbox</h2>
                        <div className="flex items-center gap-2">
                            <span className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                            <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">{isConnected ? 'Online' : 'Offline'}</span>
                        </div>
                    </div>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search chats..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-gray-100 border-none rounded-lg py-2 pl-9 pr-4 text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
                        />
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-gray-400 absolute left-3 top-2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                        </svg>
                    </div>
                </div>
                <div
                    ref={scrollContainerRef}
                    onScroll={handleScroll}
                    className="flex-1 overflow-y-auto"
                >
                    {filteredSessions.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="bg-gray-100 h-12 w-12 rounded-full flex items-center justify-center mx-auto mb-3">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-400">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.883.167 1.5 1.054 1.5 2.064v4.331c0 1.01-.617 1.897-1.5 2.064l-7.5 1.425a2.25 2.25 0 0 1-1.5 0l-7.5-1.425A2.252 2.252 0 0 1 1.5 14.906v-4.33c0-1.01.617-1.897 1.5-2.064l7.5-1.425a2.25 2.25 0 0 1 1.5 0l7.5 1.425Z" />
                                </svg>
                            </div>
                            <p className="text-gray-500 text-sm font-medium">No results found</p>
                        </div>
                    ) : (
                        filteredSessions.map(session => {
                            const validMsg = session.messages.filter(m => !(m.sender === 'system' && m.text.includes('Please wait for a moment')));
                            const lastMsg = validMsg[validMsg.length - 1];
                            const hasUnread = session.messages.some(m => m.sender === 'user' && !m.read);
                            const isActive = activeSessionId === session._id;

                            return (
                                <button
                                    key={session._id}
                                    onClick={() => handleSessionSelect(session._id)}
                                    className={`w-full text-left p-4 border-b border-gray-100 transition-all flex items-start gap-3 relative
                                        ${isActive ? 'bg-white shadow-sm z-10' : 'hover:bg-gray-100/50'}
                                        ${hasUnread && !isActive ? 'bg-indigo-50/40' : ''}
                                    `}
                                >
                                    {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600 rounded-r-full" />}

                                    <div className="relative shrink-0">
                                        <div className={`h-11 w-11 rounded-xl flex items-center justify-center font-bold text-white shadow-sm ${session.status === 'active' ? 'bg-gradient-to-br from-indigo-500 to-indigo-700' : 'bg-gray-400'
                                            }`}>
                                            {session.user.name[0]?.toUpperCase()}
                                        </div>
                                        {session.status === 'active' && (
                                            <span className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 border-2 border-white rounded-full"></span>
                                        )}
                                    </div>

                                    <div className="min-w-0 flex-1 pt-0.5">
                                        <div className="flex justify-between items-start mb-0.5">
                                            <h3 className={`truncate text-sm md:text-base leading-tight ${hasUnread ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'
                                                }`}>
                                                {session.user.name}
                                            </h3>
                                            <span className="text-[10px] text-gray-400 font-medium shrink-0 ml-2">
                                                {new Date(lastMsg?.timestamp || session.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between gap-2">
                                            <p className={`text-xs truncate transition-colors ${hasUnread ? 'text-indigo-600 font-medium' : 'text-gray-500'
                                                }`}>
                                                {lastMsg?.sender === 'admin' ? (
                                                    <span className="text-gray-400">You: </span>
                                                ) : null}
                                                {lastMsg?.text || 'New conversation'}
                                            </p>
                                            {hasUnread && !isActive && (
                                                <div className="h-2 w-2 rounded-full bg-indigo-600 shrink-0" />
                                            )}
                                        </div>
                                    </div>
                                </button>
                            );
                        })
                    )}
                    {loading && (
                        <div className="p-6 text-center">
                            <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-indigo-600 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
                        </div>
                    ) || (hasMore && filteredSessions.length >= 20) && (
                        <button
                            onClick={() => loadSessions(page + 1)}
                            className="w-full py-4 text-xs font-medium text-gray-400 hover:text-indigo-600 transition-colors"
                        >
                            Load more history
                        </button>
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className={`flex-1 flex-col bg-white ${activeSessionId ? 'flex' : 'hidden md:flex'}`}>
                {activeSession ? (
                    <>
                        {/* Header */}
                        <div className="p-3 pr-4 md:p-4 border-b border-gray-200 flex items-center justify-between bg-white gap-2 shadow-sm z-10">
                            <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                                <button
                                    onClick={() => setActiveSessionId(null)}
                                    className="md:hidden p-2 -ml-1 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full shrink-0 transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                                    </svg>
                                </button>
                                <div className="min-w-0 flex-1">
                                    <h3 className="font-bold text-gray-900 truncate text-sm md:text-base leading-tight">{activeSession.user.name}</h3>
                                    <div className="text-[10px] md:text-xs text-gray-500 truncate flex items-center gap-1.5 mt-0.5">
                                        <span className="shrink-0">{activeSession.user.phone}</span>
                                        {activeSession.user.email && (
                                            <>
                                                <span className="h-1 w-1 bg-gray-300 rounded-full" />
                                                <span className="truncate">{activeSession.user.email}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleEndChat}
                                    disabled={activeSession.status === 'closed'}
                                    className={`px-3 py-1.5 md:px-4 md:py-2 border rounded-lg text-xs md:text-sm font-bold transition-all shrink-0 shadow-sm ${activeSession.status === 'closed'
                                        ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
                                        : 'bg-white border-rose-200 text-rose-600 hover:bg-rose-600 hover:text-white hover:border-rose-600 active:scale-95'
                                        }`}
                                >
                                    {activeSession.status === 'closed' ? 'Ended' : 'End Chat'}
                                </button>

                                <div className="relative" ref={menuRef}>
                                    <button
                                        onClick={() => setShowMoreMenu(!showMoreMenu)}
                                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z" />
                                        </svg>
                                    </button>

                                    {showMoreMenu && (
                                        <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 py-2 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                                            {activeSession.status === 'active' ? (
                                                <div className="px-4 py-3 space-y-1">
                                                    <div className="flex items-center gap-2 text-gray-400">
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                                                        </svg>
                                                        <p className="text-[11px] font-bold uppercase tracking-widest leading-none">Cannot Delete</p>
                                                    </div>
                                                    <p className="text-xs text-gray-500 font-medium">Please end this chat first before deleting the history.</p>
                                                </div>
                                            ) : !confirmDelete ? (
                                                <button
                                                    onClick={() => setConfirmDelete(true)}
                                                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-rose-600 hover:bg-rose-50 transition-colors font-semibold"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.053.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                                    </svg>
                                                    Delete Chat History
                                                </button>
                                            ) : (
                                                <div className="px-4 py-3 space-y-3">
                                                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest leading-none">Confirm Deletion?</p>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={handleDeleteSession}
                                                            className="flex-1 py-2 bg-rose-600 text-white text-xs font-bold rounded-lg hover:bg-rose-700 transition-colors shadow-sm"
                                                        >
                                                            Yes, Delete
                                                        </button>
                                                        <button
                                                            onClick={() => setConfirmDelete(false)}
                                                            className="flex-1 py-2 bg-gray-100 text-gray-600 text-xs font-bold rounded-lg hover:bg-gray-200 transition-colors"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 space-y-4 bg-[#f8f9fc]">
                            {activeSession.messages.filter(msg => !(msg.sender === 'system' && msg.text.includes('Please wait for a moment'))).map((msg, idx) => {
                                const isAdmin = msg.sender === 'admin';
                                const isSystem = msg.sender === 'system';

                                if (isSystem) {
                                    return (
                                        <div key={idx} className="flex justify-center my-6">
                                            <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 bg-white px-3 py-1 rounded-full border border-gray-100 shadow-sm">
                                                {msg.text}
                                            </div>
                                        </div>
                                    );
                                }

                                return (
                                    <div key={idx} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`group relative max-w-[85%] md:max-w-[75%] px-4 py-2.5 rounded-2xl text-sm transition-all shadow-sm ${isAdmin
                                            ? 'bg-indigo-600 text-white rounded-br-none hover:bg-indigo-700'
                                            : 'bg-white border border-gray-100 text-gray-800 rounded-bl-none hover:bg-gray-50'
                                            }`}>
                                            <p className="break-words leading-relaxed">{msg.text}</p>
                                            <span className={`text-[9px] font-medium block mt-1.5 opacity-60 ${isAdmin ? 'text-indigo-100 text-right' : 'text-gray-400'}`}>
                                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        {activeSession.status === 'active' ? (
                            <div className="p-3 pb-8 md:p-6 border-t border-gray-100 bg-white">
                                <form onSubmit={handleSendMessage} className="flex gap-2 bg-gray-50 p-1.5 rounded-2xl border border-gray-200 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
                                    <input
                                        type="text"
                                        value={inputMsg}
                                        onChange={(e) => setInputMsg(e.target.value)}
                                        placeholder="Type your message..."
                                        className="flex-1 bg-transparent border-none px-3 py-2 text-base md:text-sm focus:ring-0 outline-none"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!inputMsg.trim()}
                                        className="h-10 w-10 md:w-auto md:px-6 flex items-center justify-center bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md active:scale-95"
                                    >
                                        <span className="hidden md:inline">Send Message</span>
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 md:hidden">
                                            <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
                                        </svg>
                                    </button>
                                </form>
                            </div>
                        ) : (
                            <div className="p-6 bg-gray-50 border-t border-gray-200 flex flex-col items-center gap-2">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Conversation Ended</span>
                                <p className="text-xs text-gray-500 italic">This session is archived and read-only.</p>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center bg-[#f8f9fc] p-12 text-center">
                        <div className="w-24 h-24 bg-white rounded-[2rem] shadow-xl flex items-center justify-center mb-6 rotate-3">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-indigo-500">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-gray-800 mb-2">Welcome to your Inbox</h2>
                        <p className="max-w-xs text-gray-500 text-sm leading-relaxed">Select a conversation from the sidebar to start chatting with your customers.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
