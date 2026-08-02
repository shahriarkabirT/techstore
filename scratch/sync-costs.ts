import dbConnect from '../src/lib/db';
import Order from '../src/models/Order';
import Product from '../src/models/Product';
import { snapshotUnitProductCost } from '../src/lib/orderUnitCost';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function syncCosts() {
    await dbConnect();
    console.log('Connected to DB');

    const orders = await Order.find({
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });

    let updatedCount = 0;

    for (const order of orders) {
        let changed = false;

        for (let i = 0; i < order.products.length; i++) {
            const item = order.products[i];

            if (item.unitProductCost === undefined || item.unitProductCost === null) {
                const product = await Product.findById(item.productId);
                if (product) {
                    let matchedVariant = null;
                    if (item.variant && item.variant._id) {
                        matchedVariant = product.variants.find((v: any) => v._id.toString() === item.variant._id.toString());
                    }
                    
                    const cost = snapshotUnitProductCost(product, matchedVariant);
                    if (cost !== undefined) {
                        item.unitProductCost = cost;
                        changed = true;
                    }
                }
            }
        }

        if (changed) {
            order.markModified('products');
            await order.save();
            updatedCount++;
            console.log(`Updated costs for Order ${order.orderId}`);
        }
    }

    console.log(`Done. Updated ${updatedCount} orders.`);
    process.exit(0);
}

syncCosts().catch(console.error);
