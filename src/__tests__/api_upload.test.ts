import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as uploadPost } from '@/app/api/upload/route';
import * as jwtLib from '@/lib/jwt';
import fs from 'fs';

// Mock Dependencies
vi.mock('fs');
vi.mock('@/lib/jwt');
vi.mock('@/lib/token-verify');
vi.mock('next/headers', () => ({
    cookies: vi.fn().mockResolvedValue({
        get: vi.fn().mockReturnValue(null),
    }),
}));

describe('Upload API Integration Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('POST /api/upload', () => {
        it('should upload a valid image for authenticated user', async () => {
            (jwtLib.getUserFromRequest as any).mockResolvedValue({ id: 'user1' });
            (fs.existsSync as any).mockReturnValue(true);
            (fs.writeFileSync as any).mockReturnValue(undefined);

            const formData = new FormData();
            const mockFile = new File(['test content'], 'test.png', { type: 'image/png' });
            formData.append('file', mockFile);

            const request = new Request('http://localhost/api/upload', {
                method: 'POST',
                body: formData,
            });

            const response = await uploadPost(request as any);
            const result = await response.json();

            expect(result.success).toBe(true);
            expect(result.imageUrl).toContain('/uploads/');
            expect(fs.writeFileSync).toHaveBeenCalled();
        });

        it('should return 400 for invalid file type', async () => {
            (jwtLib.getUserFromRequest as any).mockResolvedValue({ id: 'user1' });

            const formData = new FormData();
            const mockFile = new File(['test'], 'test.txt', { type: 'text/plain' });
            formData.append('file', mockFile);

            const request = new Request('http://localhost/api/upload', {
                method: 'POST',
                body: formData,
            });

            const response = await uploadPost(request as any);
            const result = await response.json();

            expect(response.status).toBe(400);
            expect(result.message).toContain('Invalid file type');
        });

        it('should return 401 if unauthorized', async () => {
            (jwtLib.getUserFromRequest as any).mockResolvedValue(null);

            const request = new Request('http://localhost/api/upload', {
                method: 'POST',
                body: new FormData(),
            });

            const response = await uploadPost(request as any);
            expect(response.status).toBe(401);
        });
    });
});
