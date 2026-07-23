import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const MIME_TYPES: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
};

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ filename: string }> }
) {
    const { filename } = await params;

    // Security: block path traversal
    if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
        return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
    }

    const filePath = path.join(process.cwd(), 'public', 'uploads', filename);

    if (!fs.existsSync(filePath)) {
        return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const stat = fs.statSync(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    const fileBuffer = fs.readFileSync(filePath);

    return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
            'Content-Type': contentType,
            'Content-Length': stat.size.toString(),
            'Cache-Control': 'public, max-age=31536000, immutable',
        },
    });
}
