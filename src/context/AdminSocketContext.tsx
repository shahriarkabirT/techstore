'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface AdminSocketContextType {
    socket: Socket | null;
    isConnected: boolean;
    unreadCount: number;
}

const AdminSocketContext = createContext<AdminSocketContextType | undefined>(undefined);

export function AdminSocketProvider({ children }: { children: React.ReactNode }) {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const { user } = useAuth();

    useEffect(() => {
        // Only connect if user is admin/moderator
        if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
            return;
        }

        const socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000', {
            path: '/api/socket/io',
            transports: ['websocket', 'polling'],
            upgrade: false,
            timeout: 10000,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
        });

        socketInstance.on('connect', () => {
            setIsConnected(true);
            socketInstance.emit('admin_join');
        });

        socketInstance.on('disconnect', () => {
            setIsConnected(false);
        });

        socketInstance.on('unread_count_update', (count: number) => {
            setUnreadCount(count);
        });

        // Use setTimeout to move the state update to the next tick, avoiding the
        // "synchronous setState within effect" warning.
        const timer = setTimeout(() => {
            setSocket(socketInstance);
        }, 0);

        return () => {
            clearTimeout(timer);
            socketInstance.disconnect();
            setSocket(null);
        };
    }, [user]);

    return (
        <AdminSocketContext.Provider value={{ socket, isConnected, unreadCount }}>
            {children}
        </AdminSocketContext.Provider>
    );
}

export const useAdminSocket = () => {
    const context = useContext(AdminSocketContext);
    if (context === undefined) {
        throw new Error('useAdminSocket must be used within an AdminSocketProvider');
    }
    return context;
};
