import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

// Setup Mongoose models
const OrderSchema = new mongoose.Schema({}, { strict: false });
const Order = mongoose.models.Order || mongoose.model('Order', OrderSchema);

const ProductSchema = new mongoose.Schema({}, { strict: false });
const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

async function backfillSoldCounts() {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('Connected.');

    console.log('Fetching all valid orders...');
    // Only count orders that are not cancelled or failed. Adjust as needed.
    const orders = await Order.find({ 
        orderStatus: { $nin: ['Cancelled'] },
        paymentStatus: { $ne: 'Failed' }
    } as any).lean();
    
    console.log(`Found ${orders.length} valid orders.`);

    // Map to aggregate sold counts
    const productCounts = new Map<string, number>();

    for (const order of orders) {
        if (order.products && Array.isArray(order.products)) {
            for (const item of order.products) {
                // Ensure there is a product reference (field is `productId` in Order schema)
                const pid = item.productId || item.product;
                if (pid) {
                    const productId = pid.toString();
                    const quantity = item.quantity || 1;
                    productCounts.set(productId, (productCounts.get(productId) || 0) + quantity);
                }
            }
        }
    }

    console.log('Aggregated product counts:');
    let totalUpdated = 0;
    
    for (const [productId, soldCount] of productCounts.entries()) {
        try {
            await Product.updateOne(
                { _id: new mongoose.Types.ObjectId(productId) },
                { $set: { soldCount } }
            );
            totalUpdated++;
            console.log(`Updated Product ${productId} -> soldCount: ${soldCount}`);
        } catch (e) {
            console.warn(`Could not update product ${productId}:`, e);
        }
    }

    console.log(`Finished updating ${totalUpdated} products.`);
    process.exit(0);
}

backfillSoldCounts().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
});
