import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

let MONGO_URI = '';
try {
    const envPath = path.resolve(process.cwd(), '.env.local');
    const envFile = fs.readFileSync(envPath, 'utf8');
    const match = envFile.match(/MONGODB_URI=(.*)/);
    if (match) MONGO_URI = match[1].trim();
} catch (e) {}

if (!MONGO_URI) {
    console.error('MONGODB_URI is missing');
    process.exit(1);
}

const policies = [
    {
        title: 'Return & Refund Policy',
        slug: 'return-refund-policy',
        order: 0,
        isActive: true,
        content: `
<h2>Return &amp; Refund Policy</h2>
<p>আমাদের লক্ষ্য আপনার সম্পূর্ণ সন্তুষ্টি নিশ্চিত করা। যদি কোনো পণ্য ক্রয়ের পর আপনি সন্তুষ্ট না হন, আমরা ফেরত ও রিফান্ডের সুবিধা প্রদান করি।</p>

<h3>Return Eligibility</h3>
<ul>
  <li>পণ্য ডেলিভারির <strong>৩ দিনের মধ্যে</strong> রিটার্ন রিকোয়েস্ট করতে হবে।</li>
  <li>পণ্যটি অবশ্যই অব্যবহৃত, অক্ষত এবং মূল প্যাকেজিংসহ থাকতে হবে।</li>
  <li>ট্যাগ বা লেবেল কাটা বা সরানো থাকলে রিটার্ন গ্রহণযোগ্য হবে না।</li>
</ul>

<h3>Non-Returnable Items</h3>
<ul>
  <li>Sale বা Discount প্রাইসে কেনা পণ্য।</li>
  <li>অন্তর্বাস, স্নানের পোশাক, বা হাইজিন পণ্য।</li>
  <li>কাস্টম বা পার্সোনালাইজড অর্ডার।</li>
</ul>

<h3>Refund Process</h3>
<p>রিটার্ন অনুমোদনের পর <strong>৫-৭ কার্যদিবসের মধ্যে</strong> রিফান্ড প্রদান করা হবে। রিফান্ড bKash, Nagad বা ব্যাংক ট্রান্সফারের মাধ্যমে দেওয়া হবে।</p>

<h3>How to Return</h3>
<p>রিটার্নের জন্য আমাদের WhatsApp নম্বরে যোগাযোগ করুন অথবা Contact পেজ থেকে মেসেজ পাঠান। অর্ডার নম্বর এবং সমস্যার বিবরণ দিন।</p>
        `.trim(),
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        title: 'Privacy Policy',
        slug: 'privacy-policy',
        order: 1,
        isActive: true,
        content: `
<h2>Privacy Policy</h2>
<p>আপনার ব্যক্তিগত তথ্যের সুরক্ষা আমাদের অগ্রাধিকার। আমরা আপনার তথ্য কীভাবে সংগ্রহ ও ব্যবহার করি তা এখানে বর্ণনা করা হয়েছে।</p>

<h3>Information We Collect</h3>
<ul>
  <li><strong>Personal Info:</strong> নাম, ইমেইল, ফোন নম্বর, ডেলিভারি ঠিকানা।</li>
  <li><strong>Order Info:</strong> অর্ডার হিস্ট্রি, পণ্য পছন্দ।</li>
  <li><strong>Device Info:</strong> IP অ্যাড্রেস, ব্রাউজার টাইপ (analytics এর জন্য)।</li>
</ul>

<h3>How We Use Your Information</h3>
<ul>
  <li>অর্ডার প্রসেস ও ডেলিভারি নিশ্চিত করতে।</li>
  <li>কাস্টমার সাপোর্ট প্রদান করতে।</li>
  <li>প্রমোশনাল অফার ও নিউজলেটার পাঠাতে (আপনার সম্মতিতে)।</li>
</ul>

<h3>Data Sharing</h3>
<p>আমরা আপনার তথ্য তৃতীয় পক্ষের কাছে বিক্রি বা শেয়ার করি না, শুধুমাত্র ডেলিভারি পার্টনার (যেমন: Steadfast, Pathao, Redx) এর সাথে প্রয়োজনীয় তথ্য ভাগ করা হয়।</p>

<h3>Your Rights</h3>
<ul>
  <li>আপনার তথ্য দেখতে, সংশোধন করতে বা মুছে ফেলতে আমাদের সাথে যোগাযোগ করুন।</li>
  <li>যেকোনো সময় আমাদের মেইলিং লিস্ট থেকে unsubscribe করতে পারবেন।</li>
</ul>

<h3>Cookies</h3>
<p>আমাদের সাইট cookies ব্যবহার করে অভিজ্ঞতা উন্নত করতে। আপনি ব্রাউজার সেটিং থেকে cookies বন্ধ করতে পারবেন।</p>
        `.trim(),
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        title: 'Shipping Policy',
        slug: 'shipping-policy',
        order: 2,
        isActive: true,
        content: `
<h2>Shipping Policy</h2>
<p>আমরা সারা বাংলাদেশে ডেলিভারি প্রদান করি। নিচে আমাদের শিপিং নীতিমালা বিস্তারিত দেওয়া হলো।</p>

<h3>Delivery Areas & Charges</h3>
<ul>
  <li><strong>ঢাকার মধ্যে:</strong> ৬০-৮০ টাকা, ১-২ কার্যদিবস।</li>
  <li><strong>ঢাকার বাইরে (সারা বাংলাদেশ):</strong> ১২০-১৫০ টাকা, ২-৫ কার্যদিবস।</li>
</ul>

<h3>Processing Time</h3>
<p>অর্ডার কনফার্মেশনের পর <strong>১-২ কার্যদিবসের মধ্যে</strong> শিপমেন্ট করা হয়। শুক্রবার, শনিবার এবং সরকারি ছুটির দিন অর্ডার প্রসেস হয় না।</p>

<h3>Delivery Partners</h3>
<p>আমরা বিশ্বস্ত কুরিয়ার পার্টনারদের মাধ্যমে ডেলিভারি দিই, যেমন: <strong>Steadfast, Pathao Courier, Redx</strong>।</p>

<h3>Order Tracking</h3>
<p>শিপমেন্টের পর ট্র্যাকিং নম্বর WhatsApp বা SMS এর মাধ্যমে পাঠানো হবে।</p>

<h3>Delivery Issues</h3>
<p>ডেলিভারিতে সমস্যা হলে বা পণ্য না পেলে ডেলিভারির ৪৮ ঘন্টার মধ্যে আমাদের সাথে যোগাযোগ করুন।</p>
        `.trim(),
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        title: 'Terms of Service',
        slug: 'terms-of-service',
        order: 3,
        isActive: true,
        content: `
<h2>Terms of Service</h2>
<p>আমাদের ওয়েবসাইট ব্যবহার করে আপনি নিচের শর্তাবলী মেনে নিচ্ছেন বলে গণ্য হবে।</p>

<h3>Use of the Site</h3>
<ul>
  <li>আপনাকে অবশ্যই ১৮ বছর বা তার বেশি বয়সী হতে হবে, অথবা অভিভাবকের তত্ত্বাবধানে থাকতে হবে।</li>
  <li>মিথ্যা তথ্য দিয়ে অ্যাকাউন্ট তৈরি করা কঠোরভাবে নিষিদ্ধ।</li>
  <li>যেকোনো ধরনের স্প্যাম, ফ্রড বা অপব্যবহার করলে অ্যাকাউন্ট বন্ধ করা হবে।</li>
</ul>

<h3>Product Accuracy</h3>
<p>আমরা পণ্যের বিবরণ ও ছবি যতটা সম্ভব সঠিক রাখার চেষ্টা করি। তবে রঙ ও আকারে সামান্য পার্থক্য হতে পারে স্ক্রিন রেজোলিউশনের কারণে।</p>

<h3>Pricing</h3>
<ul>
  <li>সকল মূল্য বাংলাদেশি টাকায় (BDT/৳) এবং VAT অন্তর্ভুক্ত।</li>
  <li>অর্ডার চূড়ান্ত করার আগে দামে পরিবর্তনের অধিকার আমাদের সংরক্ষিত।</li>
</ul>

<h3>Payment</h3>
<p>আমরা Cash on Delivery (COD), bKash, Nagad এবং ব্যাংক ট্রান্সফার গ্রহণ করি।</p>

<h3>Intellectual Property</h3>
<p>এই সাইটের সকল কন্টেন্ট, লোগো ও ছবির মালিকানা আমাদের। অনুমতি ছাড়া ব্যবহার নিষিদ্ধ।</p>

<h3>Dispute Resolution</h3>
<p>যেকোনো বিরোধ বাংলাদেশের আইন অনুযায়ী ঢাকার আদালতে নিষ্পত্তি করা হবে।</p>
        `.trim(),
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        title: 'Exchange Policy',
        slug: 'exchange-policy',
        order: 4,
        isActive: true,
        content: `
<h2>Exchange Policy</h2>
<p>ভুল সাইজ বা পণ্যের ক্ষেত্রে আমরা এক্সচেঞ্জের সুবিধা প্রদান করি।</p>

<h3>Exchange Eligibility</h3>
<ul>
  <li>পণ্য ডেলিভারির <strong>৩ দিনের মধ্যে</strong> এক্সচেঞ্জের জন্য যোগাযোগ করতে হবে।</li>
  <li>পণ্যটি অবশ্যই অব্যবহৃত, অক্ষত এবং মূল প্যাকেজিংসহ থাকতে হবে।</li>
</ul>

<h3>Exchange Conditions</h3>
<ul>
  <li>শুধুমাত্র <strong>ভুল সাইজ</strong> বা <strong>ম্যানুফ্যাকচারিং ত্রুটির</strong> কারণে এক্সচেঞ্জ গ্রহণযোগ্য।</li>
  <li>রঙ বা ডিজাইনের পছন্দ পরিবর্তনের জন্য এক্সচেঞ্জ করা হবে না।</li>
  <li>এক্সচেঞ্জের ক্ষেত্রে ডেলিভারি চার্জ প্রযোজ্য হতে পারে।</li>
</ul>

<h3>How to Exchange</h3>
<ol>
  <li>আমাদের WhatsApp বা Contact পেজে মেসেজ করুন।</li>
  <li>অর্ডার নম্বর, সমস্যার বিবরণ ও ছবি পাঠান।</li>
  <li>আমাদের টিম ২৪ ঘন্টার মধ্যে যোগাযোগ করবে।</li>
  <li>পণ্য পাঠানোর পর নতুন পণ্য ডিসপ্যাচ করা হবে।</li>
</ol>
        `.trim(),
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        title: 'Size Guide',
        slug: 'size-guide',
        order: 5,
        isActive: true,
        content: `
<h2>Size Guide</h2>
<p>সঠিক মাপ নির্বাচন করতে নিচের চার্টটি অনুসরণ করুন। মাপ নেওয়ার সময় সঠিক পজিশনে দাঁড়ান এবং ইঞ্চি টেপ ব্যবহার করুন।</p>

<h3>How to Measure</h3>
<ul>
  <li><strong>বুক (Chest):</strong> বগলের নিচ দিয়ে বুকের সবচেয়ে চওড়া অংশ মাপুন।</li>
  <li><strong>কোমর (Waist):</strong> পেটের সবচেয়ে সরু অংশ মাপুন।</li>
  <li><strong>হিপ (Hip):</strong> নিতম্বের সবচেয়ে চওড়া অংশ মাপুন।</li>
</ul>

<h3>Women's Size Chart (ইঞ্চি)</h3>
<table>
  <thead>
    <tr>
      <th>সাইজ</th>
      <th>বুক</th>
      <th>কোমর</th>
      <th>হিপ</th>
    </tr>
  </thead>
  <tbody>
    <tr><td>S</td><td>34"</td><td>28"</td><td>36"</td></tr>
    <tr><td>M</td><td>36"</td><td>30"</td><td>38"</td></tr>
    <tr><td>L</td><td>38"</td><td>32"</td><td>40"</td></tr>
    <tr><td>XL</td><td>40"</td><td>34"</td><td>42"</td></tr>
    <tr><td>XXL</td><td>42"</td><td>36"</td><td>44"</td></tr>
  </tbody>
</table>

<h3>Men's Size Chart (ইঞ্চি)</h3>
<table>
  <thead>
    <tr>
      <th>সাইজ</th>
      <th>বুক</th>
      <th>কোমর</th>
      <th>কাঁধ</th>
    </tr>
  </thead>
  <tbody>
    <tr><td>S</td><td>36"</td><td>30"</td><td>17"</td></tr>
    <tr><td>M</td><td>38"</td><td>32"</td><td>18"</td></tr>
    <tr><td>L</td><td>40"</td><td>34"</td><td>18.5"</td></tr>
    <tr><td>XL</td><td>42"</td><td>36"</td><td>19"</td></tr>
    <tr><td>XXL</td><td>44"</td><td>38"</td><td>20"</td></tr>
  </tbody>
</table>

<h3>Tips</h3>
<ul>
  <li>সন্দেহ হলে বড় সাইজটি নিন।</li>
  <li>পণ্যের Description এ উল্লিখিত মাপ ফলো করুন।</li>
  <li>সাইজ সম্পর্কে কোনো প্রশ্ন থাকলে অর্ডারের আগে WhatsApp এ জিজ্ঞেস করুন।</li>
</ul>
        `.trim(),
        createdAt: new Date(),
        updatedAt: new Date(),
    },
];

async function run() {
    await mongoose.connect(MONGO_URI);
    const db = mongoose.connection.db!;
    console.log('✅ Connected to MongoDB');

    // Remove existing policies
    const deleteResult = await db.collection('policies').deleteMany({});
    console.log(`🗑️  Cleared ${deleteResult.deletedCount} existing policies`);

    // Insert new
    const result = await db.collection('policies').insertMany(policies);
    console.log(`🌱 Seeded ${result.insertedCount} policies:`);
    policies.forEach((p, i) => console.log(`   ${i + 1}. ${p.title} → /policy/${p.slug}`));

    await mongoose.disconnect();
    console.log('🔌 Disconnected. Done!');
    process.exit(0);
}

run().catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
});
