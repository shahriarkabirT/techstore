const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

async function test() {
  const uri = process.env.MONGODB_URI;
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db();
  const p = await db.collection('products').findOne({ slug: "nillkin-strap-case-for-samsung-s23-ultra" });
  if (p) {
    console.log("Found product:", p.slug);
    console.log("isActive field:", p.isActive);
    console.log("status field:", p.status);
  } else {
    console.log("Product not found even without isActive filter");
  }
  
  // also let's just find ANY product containing 'nillkin' in the slug
  const p2 = await db.collection('products').findOne({ slug: { $regex: 'nillkin', $options: 'i' } });
  if (p2) {
      console.log("Found similar product slug:", p2.slug, "isActive:", p2.isActive);
  } else {
      console.log("No product with 'nillkin' in slug found.");
  }
  
  await client.close();
}
test().catch(console.error);
