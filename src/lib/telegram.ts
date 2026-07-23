import Settings from '@/models/Settings';
import dbConnect from '@/lib/db';

export async function sendTelegramNotification(message: string) {
    try {
        await dbConnect();
        const settings = await Settings.findOne({}, 'telegramBotToken telegramChatId');
        
        if (!settings || !settings.telegramBotToken || !settings.telegramChatId) {
            // Notifications not configured, fail silently so order creation doesn't break
            return false;
        }

        const botToken = settings.telegramBotToken;
        const chatId = settings.telegramChatId;

        const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'HTML',
                disable_web_page_preview: true
            }),
        });

        if (!response.ok) {
            console.error('Telegram notification failed:', await response.text());
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error sending Telegram notification:', error);
        return false;
    }
}
