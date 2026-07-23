'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { io, Socket } from 'socket.io-client';
import { usePathname } from 'next/navigation';
import { RootState } from '@/redux/store';
import {
    toggleChat,
    setIdentity,
    setSessionId,
    addMessage,
    setConnected,
    setMessages,
    setStatus
} from '@/redux/features/chat/chatSlice';

let socket: Socket;

const getSocket = () => {
    if (!socket) {
        socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'https://demo.ccloudlab.com', {
            path: '/api/socket/io',
            autoConnect: false,
            transports: ['websocket', 'polling'],
            upgrade: false,
            timeout: 10000,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
        });
    }
    return socket;
};

// Lightweight notification sound using Web Audio API — no external files needed
function playNotificationSound() {
    try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const now = ctx.currentTime;

        // First tone — soft "ding"
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(880, now); // A5
        gain1.gain.setValueAtTime(0.08, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc1.connect(gain1).connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.3);

        // Second tone — harmonic follow-up
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1320, now + 0.08); // E6
        gain2.gain.setValueAtTime(0.05, now + 0.08);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc2.connect(gain2).connect(ctx.destination);
        osc2.start(now + 0.08);
        osc2.stop(now + 0.35);

        // Cleanup
        setTimeout(() => ctx.close(), 500);
    } catch {
        // Silently fail — audio may not be available
    }
}

export default function ChatWidget() {
    const dispatch = useDispatch();
    const pathname = usePathname();
    const { isOpen, identity, messages, sessionId, isConnected, status } = useSelector((state: RootState) => state.chat);

    const [inputMsg, setInputMsg] = useState('');
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [hasNewMessage, setHasNewMessage] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const isOpenRef = useRef(isOpen);

    // Keep isOpenRef in sync inside an effect (not during render)
    useEffect(() => {
        isOpenRef.current = isOpen;
    }, [isOpen]);

    // Initialize Socket event listeners (but don't connect yet)
    useEffect(() => {
        const socket = getSocket();

        const onConnect = () => dispatch(setConnected(true));
        const onDisconnect = () => dispatch(setConnected(false));

        const onChatHistory = (session: any) => {
            dispatch(setSessionId(session._id));
            dispatch(setMessages(session.messages));
            if (session.status) {
                dispatch(setStatus(session.status));
            }
        };

        const onMessage = (msg: any) => {
            dispatch(addMessage(msg));
            // Play notification & show badge for admin messages when chat is closed
            if (msg.sender === 'admin') {
                playNotificationSound();
                if (!isOpenRef.current) {
                    setHasNewMessage(true);
                }
            }
        };

        const onStatusChanged = (newStatus: 'active' | 'closed') => {
            dispatch(setStatus(newStatus));
        };

        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);
        socket.on('chat_history', onChatHistory);
        socket.on('user_message_received', onMessage);
        socket.on('status_changed', onStatusChanged);

        // Restore identity from localStorage (but don't connect)
        const storedIdentity = localStorage.getItem('chat_identity');
        if (storedIdentity && !identity) {
            const parsed = JSON.parse(storedIdentity);
            dispatch(setIdentity(parsed));
        }

        return () => {
            socket.off('connect', onConnect);
            socket.off('disconnect', onDisconnect);
            socket.off('chat_history', onChatHistory);
            socket.off('user_message_received', onMessage);
            socket.off('status_changed', onStatusChanged);
        };
    }, [dispatch, identity]);

    // Connect socket only when chat is opened
    useEffect(() => {
        if (!isOpen || !identity) return;
        const socket = getSocket();
        if (!socket.connected) {
            socket.auth = identity;
            socket.once('connect', () => {
                socket.emit('join_chat', identity);
            });
            socket.connect();
        }
    }, [isOpen, identity]);

    // Handler that clears the notification badge when chat is opened
    const handleToggleChat = useCallback(() => {
        dispatch(toggleChat());
        // If chat is currently closed, opening it should clear the badge
        if (!isOpen) {
            setHasNewMessage(false);
        }
    }, [dispatch, isOpen]);

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isOpen]);

    const handleStartChat = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !phone) return;

        const userIdentity = { name, phone, email };
        dispatch(setIdentity(userIdentity));
        localStorage.setItem('chat_identity', JSON.stringify(userIdentity));

        const socket = getSocket();
        socket.once('connect', () => {
            socket.emit('join_chat', userIdentity);
        });
        socket.connect();

        // Play a subtle sound on chat start
        playNotificationSound();
    };

    const handleNewChat = () => {
        if (!identity) return;
        dispatch(setStatus('active'));
        const socket = getSocket();
        socket.emit('join_chat', identity);
    };

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputMsg.trim() || !sessionId) return;

        const socket = getSocket();
        socket.emit('send_message', {
            sessionId,
            text: inputMsg,
            sender: 'user'
        });

        setInputMsg('');
    };

    if (pathname?.startsWith('/admin')) return null;

    // Floating Action Button (closed state) - Handled by SpeedDial component
    if (!isOpen) {
        return null;
    }

    // Chat Panel (open state)
    return (
        <div className="fixed inset-x-0 top-0 bottom-16 z-[10000] w-full bg-white flex flex-col overflow-hidden md:bottom-6 md:right-6 md:w-[380px] md:h-[520px] md:rounded-xl md:inset-auto md:shadow-2xl md:border md:border-gray-200">

            {/* Header */}
            <div className="bg-white/80 backdrop-blur-md px-5 py-4 flex items-center justify-between border-b border-black/[0.05]">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-800">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-[14px] font-bold text-gray-800 leading-tight">Live Chat</h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                            <span className="text-[11px] text-gray-500 font-medium">{isConnected ? 'Online now' : 'Connecting...'}</span>
                        </div>
                    </div>
                </div>
                <button
                    onClick={handleToggleChat}
                    className="p-1.5 hover:bg-black/5 rounded-md transition-colors cursor-pointer outline-none"
                    aria-label="Close chat"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-gray-400">
                        <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                    </svg>
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden bg-gray-50 relative">
                {!identity ? (
                    /* Identity Form */
                    <form onSubmit={handleStartChat} className="p-6 space-y-4 h-full flex flex-col justify-center">
                        <div className="text-center mb-2">
                            <div className="w-12 h-12 rounded-xl bg-white/40 backdrop-blur-md shadow-xl shadow-black/5 border border-black/[0.05] flex items-center justify-center mx-auto mb-3">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-800">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                                </svg>
                            </div>
                            <h4 className="text-[15px] font-bold text-gray-900">Start a conversation</h4>
                            <p className="text-[13px] text-gray-400 mt-1">We typically reply within a few minutes.</p>
                        </div>

                        <div>
                            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Name *</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full border border-gray-200 rounded-md px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none transition-all bg-white"
                                placeholder="Your name"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Phone *</label>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full border border-gray-200 rounded-md px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none transition-all bg-white"
                                placeholder="01XXXXXXXXX"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Email <span className="text-gray-300 normal-case">(optional)</span></label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full border border-gray-200 rounded-md px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none transition-all bg-white"
                                placeholder="you@email.com"
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-white/40 backdrop-blur-md text-gray-800 border border-black/[0.05] shadow-lg shadow-black/[0.03] py-3 rounded-xl font-bold text-[13px] hover:bg-white/60 transition-all duration-300 mt-1 cursor-pointer outline-none"
                        >
                            Start Chat
                        </button>
                    </form>
                ) : (
                    /* Chat Area */
                    <div className="flex flex-col h-full">
                        <div className="flex-1 p-4 overflow-y-auto space-y-3">
                            {messages.length === 0 && (
                                <div className="text-center text-gray-400 text-sm mt-8">
                                    <p>Send a message to start the conversation.</p>
                                </div>
                            )}
                            {messages.map((msg, index) => {
                                const isMe = msg.sender === 'user';
                                const isSystem = msg.sender === 'system';

                                if (isSystem) {
                                    return (
                                        <div key={index} className="flex justify-center my-2">
                                            <span className="text-[10px] bg-gray-200 text-gray-500 px-2.5 py-1 rounded-md font-medium">
                                                {msg.text}
                                            </span>
                                        </div>
                                    );
                                }

                                return (
                                    <div key={index} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        <div
                                            className={`max-w-[80%] px-3.5 py-2.5 text-[13px] leading-relaxed shadow-sm ${isMe
                                                ? 'bg-white/40 backdrop-blur-md text-gray-800 border border-black/[0.05] rounded-xl rounded-br-sm'
                                                : 'bg-white border border-gray-100 text-gray-800 rounded-xl rounded-bl-sm shadow-sm'
                                                }`}
                                        >
                                            <p>{msg.text}</p>
                                            <span className={`text-[10px] block mt-1 ${isMe ? 'text-gray-400' : 'text-gray-300'}`}>
                                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        {status === 'closed' ? (
                            <div className="p-4 bg-white border-t border-gray-100 text-center">
                                <p className="text-[12px] text-gray-400 mb-3">This conversation has ended.</p>
                                <button
                                    onClick={handleNewChat}
                                    className="px-5 py-2 bg-white/40 backdrop-blur-md text-gray-800 border border-black/[0.05] text-[12px] font-bold rounded-lg hover:bg-white/60 transition-all duration-300 cursor-pointer outline-none"
                                >
                                    New Conversation
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-gray-100 flex gap-2">
                                <input
                                    type="text"
                                    value={inputMsg}
                                    onChange={(e) => setInputMsg(e.target.value)}
                                    placeholder="Type a message..."
                                    className="flex-1 bg-gray-50 border border-gray-200 rounded-md px-3.5 py-2.5 text-[13px] focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none transition-all"
                                />
                                <button
                                    type="submit"
                                    disabled={!inputMsg.trim()}
                                    className="px-3.5 bg-white/40 backdrop-blur-md text-gray-800 border border-black/[0.05] rounded-lg hover:bg-white/60 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300 cursor-pointer outline-none"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                        <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
                                    </svg>
                                </button>
                            </form>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
