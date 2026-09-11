import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
const SettingsSchema = new mongoose.Schema({}, { strict: false });
const Settings = mongoose.models.Settings || mongoose.model('Settings', SettingsSchema);
async function run() {
    await mongoose.connect(process.env.MONGODB_URI as string);
    const settings = await Settings.findOne();
    console.log(settings.logoUrl);
    process.exit(0);
}
run();
