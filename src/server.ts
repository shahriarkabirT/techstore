import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import mongoose from 'mongoose';
import { loadEnvConfig } from '@next/env';
import { createReadStream, existsSync, statSync } from 'fs';
import { join, extname } from 'path';
// import { initSocketIO } from './socket';



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
    // initSocketIO(server);

    server.listen(port, () => {
        console.log(`> Ready on http://${hostname}:${port}`);
        // console.log(`> Socket.IO server running on path: /api/socket/io`);
    });
});
