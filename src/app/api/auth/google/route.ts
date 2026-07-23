import env from '@/lib/env';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Settings from '@/models/Settings';

export async function GET() {
    await dbConnect();
    const settings = await Settings.findOne({}, 'googleClientId');
    
    const clientId = settings?.googleClientId || env.GOOGLE_CLIENT_ID;
    const redirectUri = env.NEXT_PUBLIC_APP_URL ? `${env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback` : 'http://localhost:3000/api/auth/google/callback';

    if (!clientId) {
        return NextResponse.json({ success: false, message: 'Google Client ID is missing' }, { status: 500 });
    }

    const scope = 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email';
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`;

    return NextResponse.redirect(authUrl);
}
