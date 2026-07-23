import axios from 'axios';
import mongoose from 'mongoose';

(async () => {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/gadget_ecom');
        const db = mongoose.connection.db;
        const courier = await db.collection('couriers').findOne({ name: 'steadfast' });
        const { apiKey, secretKey } = courier.config;
        
        const trackingId = 'SFR260712STC23C241B0';
        const baseUrl = 'https://portal.packzy.com/api/v1';
        
        const response = await axios.get(`${baseUrl}/status_by_trackingcode/${trackingId}`, {
            headers: {
                'Api-Key': apiKey,
                'Secret-Key': secretKey,
                'Content-Type': 'application/json'
            }
        });
        
        console.log("RESPONSE DATA KEYS:");
        console.log(Object.keys(response.data));
        console.log("RESPONSE DATA:", JSON.stringify(response.data, null, 2));
    } catch (err) {
        console.error(err.message);
        if (err.response) console.error(err.response.data);
    } finally {
        mongoose.disconnect();
    }
})();
