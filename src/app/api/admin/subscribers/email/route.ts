import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Subscriber from '@/models/Subscriber';
import { requirePermission } from '@/lib/auth';
import { sendMarketingEmail } from '@/lib/email';

export async function POST(request: Request) {
    try {
        const admin = await requirePermission('marketing');
        if (!admin) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { target, subject, message, productLink } = body;

        if (!subject || !message) {
            return NextResponse.json(
                { success: false, message: 'Subject and message are required' },
                { status: 400 }
            );
        }

        if (!target || (!Array.isArray(target) && target !== 'all')) {
            return NextResponse.json(
                { success: false, message: 'Invalid target specified; must be an array of emails or "all"' },
                { status: 400 }
            );
        }

        await dbConnect();

        let recipientEmails: string[] = [];

        if (target === 'all') {
            const subscribers = await Subscriber.find({ isActive: true }).select('email').lean();
            recipientEmails = subscribers.map((sub: any) => sub.email);
        } else {
            recipientEmails = target;
        }

        if (recipientEmails.length === 0) {
            return NextResponse.json(
                { success: false, message: 'No active subscribers found for the target' },
                { status: 404 }
            );
        }

        // --- BACKGROUND PROCESSING ---
        // Fire and forget the async processor so the API doesn't hang.
        processCampaignInBackground(recipientEmails, subject, message, productLink);

        // Immediately return 202 Accepted to the client so UI doesn't timeout
        return NextResponse.json({
            success: true,
            message: `Email campaign started for ${recipientEmails.length} subscriber(s). This will run in the background.`,
            summary: {
                totalTargeted: recipientEmails.length,
            }
        }, { status: 202 });

    } catch (error: any) {
        console.error('Bulk Email Setup Error:', error);
        return NextResponse.json(
            { success: false, message: 'Server error during email campaign setup' },
            { status: 500 }
        );
    }
}

/**
 * Processes a large list of emails iteratively in chunks, with delays to respect SMTP limits.
 */
async function processCampaignInBackground(recipientEmails: string[], subject: string, message: string, productLink: string | undefined) {
    console.log(`[Email Queue] Starting campaign for ${recipientEmails.length} recipients.`);

    let successCount = 0;
    let failCount = 0;

    // Configuration for scale
    const CHUNK_SIZE = 50;
    const DELAY_BETWEEN_CHUNKS_MS = 5000; // 5 seconds

    for (let i = 0; i < recipientEmails.length; i += CHUNK_SIZE) {
        const chunk = recipientEmails.slice(i, i + CHUNK_SIZE);

        console.log(`[Email Queue] Processing chunk ${i / CHUNK_SIZE + 1} (${chunk.length} emails)...`);

        // Process this chunk concurrently using Promise.allSettled
        const promises = chunk.map(async (email) => {
            // Extract a rudimentary name from email (e.g., john.doe@email.com -> John Doe)
            const extractedName = email.split('@')[0].split(/[._-]/).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
            return sendMarketingEmail(email, subject, message, extractedName, productLink || '');
        });

        const results = await Promise.allSettled(promises);

        results.forEach((result) => {
            if (result.status === 'fulfilled' && result.value.success) {
                successCount++;
            } else {
                failCount++;
            }
        });

        // If there are more chunks remaining, wait before processing the next one
        if (i + CHUNK_SIZE < recipientEmails.length) {
            console.log(`[Email Queue] Chunk complete. Waiting ${DELAY_BETWEEN_CHUNKS_MS / 1000}s before next chunk to avoid rate limits...`);
            await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_CHUNKS_MS));
        }
    }

    console.log(`[Email Queue] Campaign Complete! ✅`);
    console.log(`[Email Queue] Results - Successful: ${successCount} | Failed: ${failCount}`);
}
