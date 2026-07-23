import axios from 'axios';
import Settings from '@/models/Settings';
import dbConnect from './db';

const SMS_ENDPOINT = 'https://api.sms.net.bd/sendsms';

export const sendSMS = async (to: string, message: string) => {
    try {
        await dbConnect();
        const settings = await Settings.findOne();

        if (!settings || !settings.smsOtpEnabled || !settings.smsApiKey) {
            console.warn('SMS sending skipped: SMS not enabled or API key missing.');
            // Log for dev if no API key
            console.log(`[SMS DEV LOG] To: ${to}, Message: ${message}`);
            return { success: true, message: 'SMS logged to console (Dev Mode)' };
        }

        // Format number to 880XXXXXXXXXX if it starts with 0
        let formattedTo = to.trim();
        if (formattedTo.startsWith('0')) {
            formattedTo = '88' + formattedTo;
        } else if (!formattedTo.startsWith('880')) {
            // Assume 11 digit number without 88
            if (formattedTo.length === 11) {
                formattedTo = '88' + formattedTo;
            }
        }

        const payload: any = {
            api_key: settings.smsApiKey,
            msg: message,
            to: formattedTo,
        };

        if (settings.smsSenderId) {
            payload.sender_id = settings.smsSenderId;
        }

        const response = await axios.post(SMS_ENDPOINT, payload);

        if (response.data && response.data.error === 0) {
            console.log('SMS sent successfully:', response.data.msg);
            return { success: true, data: response.data };
        } else {
            console.error('SMS API Error:', response.data?.msg || 'Unknown error');
            return { success: false, message: response.data?.msg || 'SMS API Error' };
        }
    } catch (error: any) {
        console.error('SMS Sending Exception:', error.response?.data || error.message);
        return { success: false, message: error.message };
    }
};
