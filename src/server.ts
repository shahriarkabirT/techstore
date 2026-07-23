import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import { loadEnvConfig } from '@next/env';
import { createReadStream, existsSync, statSync } from 'fs';
import { join, extname } from 'path';
import ChatSession from './models/ChatSession';



// Load environment variables from .env
const dev = process.env.NODE_ENV !== 'production';
loadEnvConfig(process.cwd(), dev);

const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

// Initialize Next.js
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Database connection (ensure you have MONGODB_URI in .env)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ecom_basic';

const connectDB = async () => {
    if (mongoose.connection.readyState >= 1) return;
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('MongoDB Connected to', MONGODB_URI);
    } catch (error) {
        console.error('MongoDB Connection Error:', error);
    }
};

app.prepare().then(async () => {
    await connectDB();

    // MIME types for uploaded images
    const MIME: Record<string, string> = {
        '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
        '.png': 'image/png',  '.gif': 'image/gif',
        '.webp': 'image/webp', '.svg': 'image/svg+xml',
    };

    const server = createServer(async (req, res) => {
        try {
            const parsedUrl = parse(req.url!, true);

            // Explicitly serve /uploads/* from public/uploads/
            // This ensures next/image optimizer internal fetches always succeed
            // regardless of Nginx/Cloudflare proxy configuration
            if (parsedUrl.pathname?.startsWith('/uploads/')) {
                const filename = parsedUrl.pathname.slice('/uploads/'.length);
                // Prevent path traversal
                if (!filename || filename.includes('..') || filename.includes('/')) {
                    res.statusCode = 400;
                    res.end('Bad request');
                    return;
                }
                const filePath = join(process.cwd(), 'public', 'uploads', filename);
                if (existsSync(filePath)) {
                    const stat = statSync(filePath);
                    const ext = extname(filePath).toLowerCase();
                    res.writeHead(200, {
                        'Content-Type': MIME[ext] || 'application/octet-stream',
                        'Content-Length': stat.size,
                        'Cache-Control': 'public, max-age=31536000, immutable',
                    });
                    createReadStream(filePath).pipe(res);
                    return;
                }
            }

            await handle(req, res, parsedUrl);
        } catch (err) {
            console.error('Error occurred handling', req.url, err);
            res.statusCode = 500;
            res.end('internal server error');
        }
    });


    // Initialize Socket.IO
    const io = new Server(server, {
        path: '/api/socket/io',
        addTrailingSlash: false,
        pingTimeout: 30000,
        pingInterval: 25000,
        cors: {
            origin: '*',
            methods: ['GET', 'POST']
        }
    });

    // Helper to update unread count for admins
    const updateAdminUnreadCount = async () => {
        try {
            // Count sessions where adminRead is false AND status is active
            // Actually, we check if there are any unread messages from user
            // The schema has `adminRead` field on session which simplifies this
            const count = await ChatSession.countDocuments({
                status: 'active',
                messages: { $elemMatch: { sender: 'user', read: false } }
            });
            io.to('admin_room').emit('unread_count_update', count);
        } catch (error) {
            console.error('Error updating unread count:', error);
        }
    };

    // Periodic cleanup of inactive sessions
    //  const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes
    const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes

    setInterval(async () => {
        try {
            const now = new Date();
            const threshold = new Date(now.getTime() - INACTIVITY_TIMEOUT);

            const inactiveSessions = await ChatSession.find({
                status: 'active',
                updatedAt: { $lt: threshold }
            });

            if (inactiveSessions.length > 0) {
                console.log(`Found ${inactiveSessions.length} inactive sessions to close.`);

                for (const session of inactiveSessions) {
                    session.status = 'closed';
                    const systemMsg = {
                        sender: 'system',
                        text: 'Session ended due to inactivity.',
                        timestamp: new Date(),
                        read: true
                    };
                    session.messages.push(systemMsg as any);
                    await session.save();

                    // Notify relevant rooms
                    io.to(`chat_${session._id}`).emit('status_changed', 'closed');
                    io.to(`chat_${session._id}`).emit('user_message_received', systemMsg);
                    io.to('admin_room').emit('session_updated', session);
                }

                // Update admin counters
                await updateAdminUnreadCount();
            }
        } catch (error) {
            console.error('Error in session cleanup task:', error);
        }
    }, 60000); // Check every 1 minute

    io.on('connection', (socket) => {
        console.log('Client connected:', socket.id);

        // User joins chat
        socket.on('join_chat', async ({ name, phone, email }) => {
            try {
                // Find active session or create new one
                // We use phone as unique identifier for this simple system
                let session = await ChatSession.findOne({
                    'user.phone': phone,
                    status: 'active'
                });

                if (!session) {
                    session = await ChatSession.create({
                        user: { name, phone, email },
                        status: 'active',
                        messages: [{
                            sender: 'system',
                            text: 'Please wait for a moment, our agent will be available as soon as possible.',
                            timestamp: new Date(),
                            read: false
                        }],
                        socketId: socket.id
                    });

                    // Notify admins of new chat
                    io.to('admin_room').emit('new_chat_session', session);
                    await updateAdminUnreadCount();
                } else {
                    // Update socket ID
                    session.socketId = socket.id;

                    // If existing session has no messages, add the welcome message
                    if (session.messages.length === 0) {
                        session.messages.push({
                            sender: 'system',
                            text: 'Please wait for a moment, our agent will be available as soon as possible.',
                            timestamp: new Date(),
                            read: false
                        } as any);
                    }

                    await session.save();
                }

                socket.join(`chat_${session._id}`);
                socket.emit('chat_history', session);
            } catch (error) {
                console.error('Join chat error:', error);
                socket.emit('error', 'Failed to join chat');
            }
        });

        // Admin joins
        socket.on('admin_join', async () => {
            // In a real app, verify admin token here
            console.log('Admin joined:', socket.id);
            socket.join('admin_room');
            await updateAdminUnreadCount();
        });

        // Agent joined a specific chat
        socket.on('agent_joined', async ({ sessionId, adminName }) => {
            try {
                const session = await ChatSession.findById(sessionId);
                if (session && session.status === 'active') {
                    // Check if the last message was already this agent joining to avoid spam
                    const lastMsg = session.messages[session.messages.length - 1];
                    const msgText = `Agent ${adminName} has connected.`;

                    if (!lastMsg || lastMsg.text !== msgText) {
                        const systemMsg = {
                            sender: 'system',
                            text: msgText,
                            timestamp: new Date(),
                            read: true
                        };

                        session.messages.push(systemMsg as any);
                        await session.save();

                        io.to(`chat_${sessionId}`).emit('user_message_received', systemMsg);
                    }
                }
            } catch (error) {
                console.error('Agent joined error:', error);
            }
        });

        // User/Admin sends message
        socket.on('send_message', async ({ sessionId, text, sender }) => {
            try {
                const session = await ChatSession.findById(sessionId);
                if (!session) {
                    socket.emit('error', 'Session not found');
                    return;
                }

                if (session.status === 'closed') {
                    socket.emit('error', 'Chat is closed');
                    return;
                }

                const newMessage = {
                    sender,
                    text,
                    timestamp: new Date(),
                    read: false
                };

                session.messages.push(newMessage as any);

                if (sender === 'user') {
                    session.adminRead = false;
                    // Notify admins
                    io.to('admin_room').emit('admin_message_received', { sessionId, message: newMessage });
                    // Notify user (echo back so it shows in UI)
                    io.to(`chat_${sessionId}`).emit('user_message_received', newMessage);

                    await updateAdminUnreadCount();
                } else {
                    session.userRead = false;
                    // Notify user
                    io.to(`chat_${sessionId}`).emit('user_message_received', newMessage);
                }

                await session.save();

                // Ack to sender if needed, or just let them wait for their own message in UI optimistic update
            } catch (error) {
                console.error('Send message error:', error);
            }
        });



        // Mark session as read by admin
        socket.on('mark_session_read', async ({ sessionId }) => {
            try {
                await ChatSession.updateOne(
                    { _id: sessionId },
                    {
                        $set: { "messages.$[elem].read": true }
                    },
                    {
                        arrayFilters: [{ "elem.sender": "user", "elem.read": false }]
                    }
                );

                await updateAdminUnreadCount();
            } catch (error) {
                console.error('Mark read error:', error);
            }
        });

        // Toggle chat status (Admin only in theory)
        socket.on('toggle_chat_status', async ({ sessionId, status }) => {
            try {
                if (status === 'closed') {
                    const systemMsg = {
                        sender: 'system',
                        text: 'Agent has ended the chat',
                        timestamp: new Date(),
                        read: true
                    };
                    // Use $push to add message to array
                    const updatedSession = await ChatSession.findByIdAndUpdate(
                        sessionId,
                        {
                            status,
                            $push: { messages: systemMsg }
                        },
                        { new: true }
                    );

                    if (updatedSession) {
                        io.to(`chat_${sessionId}`).emit('status_changed', status);
                        // Emit the system message so frontend shows it immediately
                        io.to(`chat_${sessionId}`).emit('user_message_received', systemMsg);
                        io.to('admin_room').emit('session_updated', updatedSession);
                    }
                } else {
                    const session = await ChatSession.findByIdAndUpdate(
                        sessionId,
                        { status },
                        { new: true }
                    );
                    if (session) {
                        io.to(`chat_${sessionId}`).emit('status_changed', status);
                        io.to('admin_room').emit('session_updated', session);
                    }
                }
            } catch (error) {
                console.error('Toggle status error:', error);
            }
        });

        // Typing indicators
        socket.on('typing', ({ sessionId, isTyping, sender }) => {
            if (sender === 'user') {
                io.to('admin_room').emit('user_typing', { sessionId, isTyping });
            } else {
                io.to(`chat_${sessionId}`).emit('admin_typing', { isTyping });
            }
        });

        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
        });
    });

    server.listen(port, () => {
        console.log(`> Ready on http://${hostname}:${port}`);
        console.log(`> Socket.IO server running on path: /api/socket/io`);
    });
});
