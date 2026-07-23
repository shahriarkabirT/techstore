import { NextRequest, NextResponse } from 'next/server';
import { CourierFactory } from '@/lib/couriers/factory';
import { RedXService } from '@/lib/couriers/redx/service';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ name: string }> }
) {
    const { name } = await params;
    const { searchParams } = new URL(req.url);
    const post_code = searchParams.get('post_code');
    const district_name = searchParams.get('district_name');

    const apiKey = searchParams.get('apiKey');

    // Explicitly parse the boolean string parameter
    let isSandbox = false;
    const sandboxParam = searchParams.get('isSandbox');
    if (sandboxParam === 'true') isSandbox = true;

    try {
        let courierService;

        // If an explicit API key is provided, instantiate service directly (used for Settings Modal preview)
        if (apiKey && name === 'redx') {
            courierService = new RedXService({ apiKey, isSandbox });
        } else {
            courierService = await CourierFactory.getService(name, true);
        }

        if (!courierService) {
            return NextResponse.json({ success: false, message: `Courier service '${name}' not found` }, { status: 404 });
        }

        const query: any = {};
        if (post_code) query.post_code = parseInt(post_code);
        if (district_name) query.district_name = district_name;

        const city_id = searchParams.get('city_id');
        const zone_id = searchParams.get('zone_id');
        if (city_id) query.city_id = parseInt(city_id);
        if (zone_id) query.zone_id = parseInt(zone_id);

        const areas = await courierService.getAreas(query);
        return NextResponse.json({ success: true, areas });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
