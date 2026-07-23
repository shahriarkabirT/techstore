import { io, Socket } from 'socket.io-client';
import * as fs from 'fs';

const SERVER_URL = 'http://localhost:3000';
const PATH = '/api/socket/io';

const NUM_USERS = parseInt(process.argv[2] || '50', 10);
const DURATION_MS = 10000; // 10 seconds

const logFile = 'load-test.log';
fs.writeFileSync(logFile, ''); // Clear log

function log(msg: string) {
    console.log(msg);
    fs.appendFileSync(logFile, msg + '\n');
}

log(`Starting load test with ${NUM_USERS} users for ${DURATION_MS / 1000} seconds...`);

let connectedCount = 0;
let errors = 0;
let messagesSent = 0;
let messagesReceived = 0;

const sockets: Socket[] = [];

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function run() {
    for (let i = 0; i < NUM_USERS; i++) {
        const socket = io(SERVER_URL, {
            path: PATH,
            transports: ['websocket', 'polling'], // Allow upgrade
            forceNew: true,
            reconnection: false,
        });

        socket.on('connect', () => {
            connectedCount++;

            // Join chat
            socket.emit('join_chat', {
                name: `LoadUser_${i}`,
                phone: `999000${i.toString().padStart(4, '0')}`,
                email: `loaduser${i}@example.com`
            });
        });

        socket.on('connect_error', (err) => {
            // console.error(`User ${i} Connection Error:`, err.message);
            errors++;
        });

        socket.on('user_message_received', () => {
            messagesReceived++;
        });

        sockets.push(socket);

        // Stagger connections slightly
        if (i % 10 === 0) await sleep(10);
    }

    log('All users initiated. Waiting for connections...');
    await sleep(2000); // Wait for connections to stabilize

    log(`Connected: ${connectedCount}/${NUM_USERS}`);
    log(`Errors: ${errors}`);

    if (connectedCount === 0) {
        log('No connections made. Aborting message test.');
        process.exit(1);
    }

    // Send messages
    log('Sending messages...');
    for (let i = 0; i < sockets.length; i++) {
        const socket = sockets[i];
        if (socket.connected) {
            // Assume session ID is available implicitly or just send to create load
            // The current server implementation requires sessionId for send_message.
            // But 'join_chat' emits 'chat_history' which contains the session.
            // For simplicity in this load test, and because we didn't implement a listener for chat_history to capture sessionId in this script (yet),
            // we might get 'Session not found' errors if we try to send without sessionId.

            // Let's improve the script to capture sessionId first.
        }
    }

    // We need to wait for 'chat_history' to get the session ID.
    // Let's restart the loop structure.
}

// Improved implementation
async function runCorrectly() {
    console.log(`Spawning ${NUM_USERS} clients...`);

    const clients: { socket: Socket, sessionId?: string }[] = [];

    for (let i = 0; i < NUM_USERS; i++) {
        const socket = io(SERVER_URL, {
            path: PATH,
            transports: ['websocket', 'polling'],
            forceNew: true,
            reconnection: false,
        });

        const clientCtx = { socket, sessionId: undefined as string | undefined };
        clients.push(clientCtx);

        socket.on('connect', () => {
            connectedCount++;
            socket.emit('join_chat', {
                name: `LoadUser_${i}`,
                phone: `999000${i.toString().padStart(4, '0')}`,
                email: `loaduser${i}@example.com`
            });
        });

        socket.on('chat_history', (session: any) => {
            clientCtx.sessionId = session._id;
        });

        socket.on('connect_error', (err) => {
            errors++;
        });

        socket.on('user_message_received', () => {
            messagesReceived++;
        });

        if (i % 20 === 0) await sleep(100); // Stagger
    }

    log('Waiting for connections and sessions...');
    await sleep(5000);

    const activeClients = clients.filter(c => c.socket.connected && c.sessionId);
    log(`Active Clients (Connected + SessionId): ${activeClients.length}/${NUM_USERS}`);
    log(`Total Connects: ${connectedCount}`);
    log(`Total Errors: ${errors}`);

    // Send loop
    log('Starting message blast...');
    const interval = setInterval(() => {
        activeClients.forEach(client => {
            if (Math.random() > 0.7) { // 30% chance to send per tick
                client.socket.emit('send_message', {
                    sessionId: client.sessionId,
                    text: `Load test message from ${client.socket.id} at ${Date.now()}`,
                    sender: 'user'
                });
                messagesSent++;
            }
        });
    }, 1000);

    await sleep(DURATION_MS);
    clearInterval(interval);

    log('Test finished. Disconnecting...');
    clients.forEach(c => c.socket.disconnect());

    log('------------------------------------------------');
    log(`Results for ${NUM_USERS} users over ${DURATION_MS / 1000}s:`);
    log(`Connected: ${connectedCount}`);
    log(`Failed/Errors: ${errors}`);
    log(`Messages Sent: ${messagesSent}`);
    log(`Messages Received (Echo): ${messagesReceived}`);
    log(`Throughput: ${(messagesReceived / (DURATION_MS / 1000)).toFixed(2)} msg/sec`);
    log('------------------------------------------------');
}

runCorrectly().catch(console.error);
