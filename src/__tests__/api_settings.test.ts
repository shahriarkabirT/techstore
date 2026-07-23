import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET as getSettings } from '@/app/api/settings/general/route';
import { POST as updateSettings } from '@/app/api/admin/settings/general/route';
import Settings from '@/models/Settings';
import * as authLib from '@/lib/auth';

// Mock Dependencies
vi.mock('@/lib/db', () => ({ default: vi.fn() }));
vi.mock('@/models/Settings');
vi.mock('@/lib/auth');

describe('Settings API Integration Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('GET /api/settings/general', () => {
        it('should return brand name and shipping charge', async () => {
            (Settings.findOne as any).mockResolvedValue({
                brandName: 'TestStore',
                shippingCharge: 100,
            });

            const response = await getSettings();
            const result = await response.json();

            expect(result.success).toBe(true);
            expect(result.settings.brandName).toBe('TestStore');
        });
    });

    describe('POST /api/admin/settings/general', () => {
        it('should update settings for admin', async () => {
            (authLib.getAdminFromToken as any).mockResolvedValue({ id: 'admin1', role: 'admin' });
            (Settings.findOneAndUpdate as any).mockResolvedValue({ brandName: 'NewBrand' });

            const request = new Request('http://localhost/api/admin/settings/general', {
                method: 'POST',
                body: JSON.stringify({ brandName: 'NewBrand' }),
            });

            const response = await updateSettings(request as any);
            const result = await response.json();

            expect(result.success).toBe(true);
            expect(Settings.findOneAndUpdate).toHaveBeenCalled();
        });

        it('should return 401 if not an admin', async () => {
            (authLib.getAdminFromToken as any).mockResolvedValue(null);

            const request = new Request('http://localhost/api/admin/settings/general', {
                method: 'POST',
                body: JSON.stringify({}),
            });

            const response = await updateSettings(request as any);
            expect(response.status).toBe(401);
        });
    });
});
