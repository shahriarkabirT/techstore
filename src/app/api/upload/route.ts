import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { cookies } from 'next/headers';
import { getUserFromRequest } from '@/lib/jwt';
import { verifyLegacyAdminToken } from '@/lib/token-verify';

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'public/uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: Request) {
    try {
        // Check authorization (Admin or any authenticated user)
        const user = await getUserFromRequest();
        let isAuthorized = !!user;

        if (!isAuthorized) {
            const cookieStore = await cookies();
            const adminToken = cookieStore.get('admin_token')?.value;
            if (adminToken) {
                const decoded = verifyLegacyAdminToken(adminToken);
                if (decoded) isAuthorized = true;
            }
        }

        if (!isAuthorized) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json(
                { success: false, message: 'No file provided' },
                { status: 400 }
            );
        }

        // Validate file type
        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json(
                { success: false, message: `Invalid file type: ${file.type}. Allowed: JPEG, PNG, GIF, WebP, SVG` },
                { status: 400 }
            );
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { success: false, message: 'File size exceeds 10MB limit' },
                { status: 400 }
            );
        }

        // Generate unique filename
        const ext = path.extname(file.name);
        const filename = `${uuidv4()}${ext}`;
        const filepath = path.join(uploadsDir, filename);

        // Save file
        const bytes = await file.arrayBuffer();
        fs.writeFileSync(filepath, Buffer.from(bytes));

        const imageUrl = `/uploads/${filename}`;

        return NextResponse.json({
            success: true,
            message: 'Image uploaded successfully',
            imageUrl,
        });
    } catch (error) {
        console.error('Upload Error:', error);
        return NextResponse.json(
            { success: false, message: 'Server error' },
            { status: 500 }
        );
    }
}
