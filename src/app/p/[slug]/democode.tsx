// <!DOCTYPE html>
// <html lang="bn">
// <head>
// <meta charset="UTF-8">
// <meta name="viewport" content="width=device-width, initial-scale=1.0">
// <title>যেকোনো ২টি পারফিউম বেছে নিন</title>
// <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
// <style>
//   *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
//   :root {
//     --red: #e31e24;
//     --red-dark: #c01a20;
//     --gold: #d4a843;
//     --black: #0a0a0a;
//     --dark: #111;
//     --gray: #6b7280;
//     --light-gray: #f5f5f5;
//     --border: #e5e7eb;
//     --white: #fff;
//   }
//   body { font-family: 'Hind Siliguri', 'Inter', sans-serif; background: #fff; color: #111; }
//   a { text-decoration: none; }

//   /* STICKY TOP BAR */
//   .top-bar {
//     background: #1a1a2e;
//     color: #fff;
//     padding: 10px 16px;
//     display: flex;
//     align-items: center;
//     justify-content: space-between;
//     position: sticky;
//     top: 0;
//     z-index: 999;
//     gap: 12px;
//     flex-wrap: wrap;
//   }
//   .top-bar-text {
//     font-size: 13px;
//     font-weight: 500;
//     flex: 1;
//     min-width: 200px;
//   }
//   .top-bar-text span { color: #f59e0b; font-weight: 700; }
//   .top-bar-timer {
//     display: flex;
//     align-items: center;
//     gap: 6px;
//     font-size: 13px;
//     font-weight: 600;
//   }
//   .timer-block {
//     background: #e31e24;
//     color: #fff;
//     padding: 4px 10px;
//     border-radius: 6px;
//     font-size: 15px;
//     font-weight: 800;
//     font-variant-numeric: tabular-nums;
//     min-width: 42px;
//     text-align: center;
//   }
//   .timer-sep { font-weight: 800; color: #f59e0b; }
//   .top-bar-btn {
//     background: #f59e0b;
//     color: #000;
//     padding: 8px 18px;
//     border-radius: 8px;
//     font-weight: 800;
//     font-size: 13px;
//     white-space: nowrap;
//     cursor: pointer;
//     border: none;
//   }

//   /* HERO */
//   .hero {
//     background: linear-gradient(135deg, #0d0d0d 0%, #1a0a0a 40%, #2d0808 100%);
//     padding: 40px 20px 50px;
//     text-align: center;
//     position: relative;
//     overflow: hidden;
//   }
//   .hero::before {
//     content: '';
//     position: absolute;
//     inset: 0;
//     background: radial-gradient(ellipse at 70% 50%, rgba(180,30,30,0.25) 0%, transparent 60%);
//     pointer-events: none;
//   }
//   .hero-inner { max-width: 900px; margin: 0 auto; position: relative; display: flex; align-items: center; gap: 40px; flex-wrap: wrap; justify-content: center; }
//   .hero-text { flex: 1; min-width: 260px; text-align: left; }
//   .hero-badge {
//     display: inline-block;
//     background: rgba(212,168,67,0.15);
//     border: 1px solid rgba(212,168,67,0.4);
//     color: #d4a843;
//     font-size: 11px;
//     font-weight: 700;
//     letter-spacing: 0.15em;
//     text-transform: uppercase;
//     padding: 5px 14px;
//     border-radius: 100px;
//     margin-bottom: 16px;
//   }
//   .hero-title {
//     font-size: clamp(28px, 5vw, 46px);
//     font-weight: 900;
//     color: #fff;
//     line-height: 1.15;
//     margin-bottom: 12px;
//   }
//   .hero-title .highlight {
//     color: #e31e24;
//     display: block;
//     font-size: clamp(32px, 6vw, 54px;)
//   }
//   .hero-sub {
//     color: rgba(255,255,255,0.65);
//     font-size: 14px;
//     line-height: 1.7;
//     margin-bottom: 24px;
//     max-width: 360px;
//   }
//   .hero-sub b { color: #d4a843; font-weight: 700; }
//   .hero-cta {
//     background: var(--red);
//     color: #fff;
//     border: none;
//     padding: 14px 32px;
//     font-size: 16px;
//     font-weight: 800;
//     border-radius: 10px;
//     cursor: pointer;
//     display: inline-flex;
//     align-items: center;
//     gap: 8px;
//     transition: transform 0.15s, background 0.15s;
//   }
//   .hero-cta:hover { background: var(--red-dark); transform: translateY(-2px); }
//   .hero-imgs { display: flex; gap: 12px; align-items: flex-end; flex-shrink: 0; }
//   .hero-img-card {
//     background: rgba(255,255,255,0.05);
//     border: 1px solid rgba(255,255,255,0.1);
//     border-radius: 14px;
//     overflow: hidden;
//     width: 90px;
//     text-align: center;
//     padding: 8px 6px 6px;
//   }
//   .hero-img-card img { width: 70px; height: 90px; object-fit: contain; }
//   .hero-img-card .name { color: rgba(255,255,255,0.7); font-size: 9px; font-weight: 600; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.05em; }
//   .hero-img-card.featured { transform: scale(1.12); border-color: rgba(212,168,67,0.4); background: rgba(212,168,67,0.08); }

//   /* FEATURES SECTION */
//   .features-section {
//     background: #fff;
//     padding: 40px 20px;
//     max-width: 900px;
//     margin: 0 auto;
//   }
//   .section-label { color: var(--red); font-size: 11px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; text-align: center; margin-bottom: 8px; }
//   .section-title { font-size: clamp(22px, 4vw, 32px); font-weight: 900; text-align: center; margin-bottom: 6px; }
//   .section-sub { color: #6b7280; font-size: 14px; text-align: center; margin-bottom: 32px; }
//   .features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 20px; }
//   .feature-card {
//     border: 1px solid #f0f0f0;
//     border-radius: 16px;
//     padding: 24px 20px;
//     display: flex;
//     gap: 14px;
//     align-items: flex-start;
//     transition: box-shadow 0.2s;
//   }
//   .feature-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
//   .feature-icon {
//     width: 40px; height: 40px; flex-shrink: 0;
//     background: #fef2f2;
//     border-radius: 10px;
//     display: flex; align-items: center; justify-content: center;
//     font-size: 20px;
//   }
//   .feature-card h4 { font-size: 14px; font-weight: 800; margin-bottom: 4px; }
//   .feature-card p { font-size: 12px; color: #6b7280; line-height: 1.6; }
//   .section-cta-wrap { text-align: center; margin-top: 28px; }
//   .btn-red {
//     background: var(--red);
//     color: #fff;
//     border: none;
//     padding: 14px 36px;
//     font-size: 15px;
//     font-weight: 800;
//     border-radius: 10px;
//     cursor: pointer;
//     transition: background 0.15s, transform 0.15s;
//     display: inline-flex;
//     align-items: center;
//     gap: 8px;
//   }
//   .btn-red:hover { background: var(--red-dark); transform: translateY(-1px); }

//   /* PRODUCTS SECTION */
//   .products-section {
//     background: #0d0d0d;
//     padding: 50px 20px;
//   }
//   .products-inner { max-width: 960px; margin: 0 auto; }
//   .products-section .section-title { color: #fff; }
//   .products-section .section-sub { color: rgba(255,255,255,0.5); }
//   .products-grid {
//     display: grid;
//     grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
//     gap: 18px;
//     margin-top: 32px;
//   }
//   .product-card {
//     background: #1a1a1a;
//     border: 1px solid #2a2a2a;
//     border-radius: 16px;
//     overflow: hidden;
//     cursor: pointer;
//     transition: border-color 0.2s, transform 0.2s;
//   }
//   .product-card:hover { border-color: rgba(212,168,67,0.5); transform: translateY(-3px); }
//   .product-card .img-wrap {
//     background: #111;
//     height: 180px;
//     display: flex;
//     align-items: center;
//     justify-content: center;
//     position: relative;
//     overflow: hidden;
//   }
//   .product-card .img-wrap img { width: 100%; height: 100%; object-fit: cover; }
//   .product-card .badge-pro {
//     position: absolute;
//     top: 10px; left: 10px;
//     background: #d4a843;
//     color: #000;
//     font-size: 9px;
//     font-weight: 800;
//     padding: 3px 8px;
//     border-radius: 100px;
//     text-transform: uppercase;
//     letter-spacing: 0.08em;
//   }
//   .product-card .card-body { padding: 14px; }
//   .product-card h4 { color: #fff; font-size: 14px; font-weight: 800; margin-bottom: 4px; }
//   .product-card p { color: rgba(255,255,255,0.5); font-size: 11px; line-height: 1.6; margin-bottom: 10px; }
//   .product-card .price { color: #d4a843; font-size: 16px; font-weight: 900; }

//   /* COMBO SECTION */
//   .combo-section {
//     background: #fff;
//     padding: 50px 20px;
//   }
//   .combo-inner { max-width: 900px; margin: 0 auto; }
//   .combo-section .section-title { text-align: left; }
//   .combo-section .section-sub { text-align: left; color: #6b7280; font-size: 14px; margin-bottom: 0; }
//   .combo-header { margin-bottom: 24px; }
//   .combo-hint {
//     background: #fff8e1;
//     border: 1px solid #fde68a;
//     border-radius: 10px;
//     padding: 12px 16px;
//     font-size: 13px;
//     color: #92400e;
//     font-weight: 600;
//     margin-bottom: 24px;
//     display: flex;
//     align-items: center;
//     gap: 8px;
//   }
//   .combo-list { display: flex; flex-direction: column; gap: 0; border: 1px solid #e5e7eb; border-radius: 14px; overflow: hidden; }
//   .combo-item {
//     display: flex;
//     align-items: center;
//     gap: 14px;
//     padding: 14px 16px;
//     border-bottom: 1px solid #f0f0f0;
//     background: #fff;
//     transition: background 0.15s;
//     cursor: pointer;
//   }
//   .combo-item:last-child { border-bottom: none; }
//   .combo-item.selected { background: #fff8f8; }
//   .combo-item.featured { background: #fff8f8; border-left: 3px solid var(--red); }
//   .combo-checkbox {
//     width: 20px; height: 20px; border-radius: 5px;
//     border: 2px solid #d1d5db;
//     background: #fff;
//     display: flex; align-items: center; justify-content: center;
//     flex-shrink: 0;
//     transition: all 0.15s;
//   }
//   .combo-item.selected .combo-checkbox,
//   .combo-item.featured .combo-checkbox {
//     background: var(--red);
//     border-color: var(--red);
//   }
//   .combo-checkbox svg { display: none; }
//   .combo-item.selected .combo-checkbox svg,
//   .combo-item.featured .combo-checkbox svg { display: block; }
//   .combo-img {
//     width: 54px; height: 54px;
//     border-radius: 10px;
//     object-fit: cover;
//     border: 1px solid #f0f0f0;
//     background: #f9f9f9;
//     flex-shrink: 0;
//   }
//   .combo-info { flex: 1; min-width: 0; }
//   .combo-info h4 { font-size: 14px; font-weight: 800; margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
//   .combo-info span { font-size: 12px; color: #9ca3af; }
//   .combo-price { font-size: 15px; font-weight: 800; color: #111; flex-shrink: 0; }
//   .combo-qty {
//     display: flex;
//     align-items: center;
//     border: 1px solid #e5e7eb;
//     border-radius: 8px;
//     overflow: hidden;
//     height: 34px;
//     flex-shrink: 0;
//   }
//   .combo-qty button {
//     width: 32px; height: 34px;
//     border: none;
//     background: #fff;
//     font-size: 18px;
//     font-weight: 700;
//     color: #6b7280;
//     cursor: pointer;
//     display: flex; align-items: center; justify-content: center;
//     transition: background 0.15s;
//   }
//   .combo-qty button:hover { background: #f5f5f5; }
//   .combo-qty .qty-val { min-width: 32px; text-align: center; font-size: 14px; font-weight: 800; }

//   /* SECTION DIVIDER */
//   .dark-bar {
//     background: #0d0d0d;
//     padding: 30px 20px;
//     display: flex;
//     gap: 40px;
//     justify-content: center;
//     flex-wrap: wrap;
//   }
//   .dark-bar-item {
//     display: flex;
//     align-items: center;
//     gap: 12px;
//     color: #fff;
//   }
//   .dark-bar-item .dbi-icon {
//     width: 42px; height: 42px;
//     background: rgba(255,255,255,0.05);
//     border-radius: 10px;
//     display: flex; align-items: center; justify-content: center;
//     font-size: 22px;
//     color: var(--red);
//     flex-shrink: 0;
//   }
//   .dark-bar-item h5 { font-size: 13px; font-weight: 700; }
//   .dark-bar-item p { font-size: 11px; color: rgba(255,255,255,0.45); font-weight: 500; letter-spacing: 0.08em; text-transform: uppercase; margin-top: 1px; }

//   /* CHECKOUT SECTION */
//   .checkout-section {
//     background: #f8f8f8;
//     padding: 50px 20px;
//   }
//   .checkout-inner { max-width: 960px; margin: 0 auto; }
//   .checkout-title {
//     background: #111;
//     color: #fff;
//     text-align: center;
//     padding: 16px 24px;
//     border-radius: 12px;
//     font-size: 18px;
//     font-weight: 800;
//     margin-bottom: 30px;
//   }
//   .checkout-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; }
//   @media(max-width: 680px) { .checkout-grid { grid-template-columns: 1fr; } }
//   .form-card {
//     background: #fff;
//     border-radius: 16px;
//     border: 1px solid #e5e7eb;
//     padding: 28px 24px;
//   }
//   .form-card h3 { font-size: 16px; font-weight: 800; margin-bottom: 20px; display: flex; align-items: center; gap: 8px; }
//   .form-group { margin-bottom: 16px; }
//   .form-label { font-size: 11px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 6px; display: block; }
//   .form-input {
//     width: 100%;
//     padding: 12px 14px;
//     border: 1.5px solid #e5e7eb;
//     border-radius: 10px;
//     font-size: 14px;
//     font-family: inherit;
//     outline: none;
//     transition: border-color 0.15s;
//     background: #fafafa;
//   }
//   .form-input:focus { border-color: var(--red); background: #fff; }
//   .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
//   .order-summary-card {
//     background: #fff;
//     border-radius: 16px;
//     border: 1px solid #e5e7eb;
//     padding: 28px 24px;
//     position: sticky;
//     top: 80px;
//   }
//   .order-summary-card h3 { font-size: 16px; font-weight: 800; margin-bottom: 20px; display: flex; align-items: center; gap: 8px; }
//   .summary-row {
//     display: flex;
//     justify-content: space-between;
//     font-size: 14px;
//     margin-bottom: 12px;
//     color: #6b7280;
//   }
//   .summary-row strong { color: #111; font-weight: 700; }
//   .summary-row.total { font-size: 18px; font-weight: 900; color: #111; padding-top: 12px; border-top: 1px dashed #e5e7eb; margin-top: 4px; }
//   .summary-row.total strong { color: var(--red); font-size: 22px; }
//   .cod-badge {
//     background: #f0fdf4;
//     border: 1px solid #bbf7d0;
//     border-radius: 10px;
//     padding: 12px 14px;
//     display: flex;
//     align-items: flex-start;
//     gap: 10px;
//     margin: 20px 0;
//     font-size: 12px;
//   }
//   .cod-badge .cod-icon { color: #16a34a; font-size: 18px; flex-shrink: 0; margin-top: 1px; }
//   .cod-badge h5 { font-size: 11px; font-weight: 800; color: #15803d; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 2px; }
//   .cod-badge p { color: #16a34a; font-size: 11px; font-weight: 600; }
//   .confirm-btn {
//     width: 100%;
//     background: var(--red);
//     color: #fff;
//     border: none;
//     padding: 16px;
//     font-size: 16px;
//     font-weight: 900;
//     letter-spacing: 0.08em;
//     text-transform: uppercase;
//     border-radius: 12px;
//     cursor: pointer;
//     display: flex;
//     align-items: center;
//     justify-content: center;
//     gap: 10px;
//     transition: background 0.15s, transform 0.1s;
//   }
//   .confirm-btn:hover { background: var(--red-dark); transform: translateY(-1px); }
//   .secure-note {
//     text-align: center;
//     font-size: 11px;
//     color: #9ca3af;
//     font-weight: 700;
//     text-transform: uppercase;
//     letter-spacing: 0.1em;
//     margin-top: 14px;
//     display: flex;
//     align-items: center;
//     justify-content: center;
//     gap: 6px;
//   }
//   .secure-note::before { content: '●'; color: #22c55e; font-size: 8px; }

//   /* FOOTER */
//   footer {
//     background: #fff;
//     border-top: 1px solid #f0f0f0;
//     padding: 32px 20px;
//     text-align: center;
//   }
//   .footer-brand { font-size: 22px; font-weight: 900; color: #111; letter-spacing: -0.5px; margin-bottom: 14px; }
//   .footer-links { display: flex; gap: 24px; justify-content: center; margin-bottom: 14px; flex-wrap: wrap; }
//   .footer-links a { color: #9ca3af; font-size: 13px; font-weight: 600; }
//   .footer-links a:hover { color: var(--red); }
//   .footer-copy { color: #d1d5db; font-size: 12px; }
//   .footer-phone { color: #111; font-weight: 800; font-size: 15px; margin-bottom: 12px; }

//   /* MOBILE CTA */
//   .mobile-cta {
//     display: none;
//     position: fixed;
//     bottom: 0; left: 0; right: 0;
//     background: rgba(255,255,255,0.95);
//     backdrop-filter: blur(12px);
//     border-top: 1px solid #e5e7eb;
//     padding: 12px 16px;
//     z-index: 900;
//   }
//   @media(max-width: 768px) { .mobile-cta { display: block; } }
//   .mobile-cta-btn {
//     width: 100%;
//     background: var(--red);
//     color: #fff;
//     border: none;
//     padding: 15px;
//     border-radius: 12px;
//     font-size: 16px;
//     font-weight: 900;
//     letter-spacing: 0.05em;
//     cursor: pointer;
//     display: flex;
//     align-items: center;
//     justify-content: center;
//     gap: 10px;
//   }

//   /* PERFUME PLACEHOLDER IMAGES */
//   .perf-img {
//     width: 100%; height: 100%;
//     display: flex; align-items: center; justify-content: center;
//     font-size: 48px;
//     background: linear-gradient(135deg, #1a1a1a, #2d1a1a);
//   }
//   .hero-perf {
//     width: 70px; height: 90px;
//     display: flex; align-items: center; justify-content: center;
//     font-size: 36px;
//   }
//   select.form-input { appearance: none; background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23cbd5e1' stroke-width='2'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e"); background-repeat: no-repeat; background-position: right 12px center; background-size: 18px; padding-right: 36px; }
// </style>
// </head>
// <body>

// <!-- STICKY TOP BAR -->
// <div class="top-bar">
//   <div class="top-bar-text">
//     🔥 সীমিত সময়ের অফার — <span>ফ্রি ডেলিভারি!</span> &nbsp; মাত্র ৯৯৯ টাকায় ২টি পারফিউম
//   </div>
//   <div class="top-bar-timer">
//     অফার শেষ হবে:
//     <div class="timer-block" id="t-h">00</div>
//     <span class="timer-sep">:</span>
//     <div class="timer-block" id="t-m">38</div>
//     <span class="timer-sep">:</span>
//     <div class="timer-block" id="t-s">47</div>
//   </div>
//   <button class="top-bar-btn" onclick="scrollTo('#checkout')">অর্ডার করুন →</button>
// </div>

// <!-- HERO -->
// <section class="hero">
//   <div class="hero-inner">
//     <div class="hero-text">
//       <div class="hero-badge">✨ প্রিমিয়াম কালেকশন</div>
//       <h1 class="hero-title">
//         যেকোনো ২টি পারফিউম বেছে নিন
//         <span class="highlight">"মাত্র ৯৯৯ টাকা!"</span>
//       </h1>
//       <p class="hero-sub">
//         🏷 <b>ক্যাশ অন ডেলিভারি</b> — পণ্য পেয়ে টাকা দিন। <b>ফ্রি শিপিং</b> সারা বাংলাদেশে।
//       </p>
//       <button class="hero-cta" onclick="scrollToCheckout()">
//         অর্ডার করতে ক্লিক করুন →
//       </button>
//     </div>
//     <div class="hero-imgs">
//       <div class="hero-img-card">
//         <div class="hero-perf">🧴</div>
//         <div class="name">Vampire Blood</div>
//       </div>
//       <div class="hero-img-card featured">
//         <div class="hero-perf">🫧</div>
//         <div class="name">Dior Sauvage</div>
//       </div>
//       <div class="hero-img-card">
//         <div class="hero-perf">🔥</div>
//         <div class="name">Hawas Fire</div>
//       </div>
//       <div class="hero-img-card">
//         <div class="hero-perf">💎</div>
//         <div class="name">Miss Dior</div>
//       </div>
//     </div>
//   </div>
// </section>

// <!-- FEATURES -->
// <section class="features-section">
//   <div class="section-label">PREMIUM COLLECTION</div>
//   <h2 class="section-title">সিগনেচার পারফিউম কম্বো</h2>
//   <p class="section-sub">আপনার পছন্দের যেকোনো ২টি পারফিউম বেছে নিন</p>
//   <div class="features-grid">
//     <div class="feature-card">
//       <div class="feature-icon">💧</div>
//       <div>
//         <h4>EDP 50 মিল. বোতল</h4>
//         <p>Eau de Parfum — দীর্ঘস্থায়ী সুগন্ধের জন্য বিশেষভাবে তৈরি</p>
//       </div>
//     </div>
//     <div class="feature-card">
//       <div class="feature-icon">⏰</div>
//       <div>
//         <h4>দীর্ঘস্থায়ী ঘ্রাণ</h4>
//         <p>৮-১২ ঘণ্টা পর্যন্ত সুগন্ধ থাকে সারা দিন</p>
//       </div>
//     </div>
//     <div class="feature-card">
//       <div class="feature-icon">📦</div>
//       <div>
//         <h4>বক্স প্যাকেজিং</h4>
//         <p>প্রিমিয়াম বক্সে সুন্দরভাবে প্যাক করে পাঠানো হয়</p>
//       </div>
//     </div>
//     <div class="feature-card">
//       <div class="feature-icon">✅</div>
//       <div>
//         <h4>১০০% গ্যারান্টি</h4>
//         <p>পণ্যে সমস্যা হলে সম্পূর্ণ টাকা ফেরত দেওয়া হবে</p>
//       </div>
//     </div>
//   </div>
//   <div class="section-cta-wrap">
//     <button class="btn-red" onclick="scrollToCheckout()">অর্ডার করতে যাই →</button>
//   </div>
// </section>

// <!-- PRODUCT GRID -->
// <section class="products-section">
//   <div class="products-inner">
//     <div class="section-label" style="color:#d4a843">EXCLUSIVE</div>
//     <h2 class="section-title">পারফিউম কালেকশন</h2>
//     <p class="section-sub">আপনার পছন্দের পারফিউম বেছে নিন</p>
//     <div class="products-grid">
//       <div class="product-card">
//         <div class="img-wrap">
//           <div class="perf-img">🧴</div>
//           <div class="badge-pro">PRO</div>
//         </div>
//         <div class="card-body">
//           <h4>Vampire Blood</h4>
//           <p>গাঢ়, রহস্যময় এবং আকর্ষণীয় সুগন্ধ</p>
//           <div class="price">৳৯৯৯</div>
//         </div>
//       </div>
//       <div class="product-card">
//         <div class="img-wrap">
//           <div class="perf-img">🫧</div>
//           <div class="badge-pro">PRO</div>
//         </div>
//         <div class="card-body">
//           <h4>Dior Sauvage</h4>
//           <p>তাজা, মনোরম এবং মাসকুলিন ঘ্রাণ</p>
//           <div class="price">৳৯৯৯</div>
//         </div>
//       </div>
//       <div class="product-card">
//         <div class="img-wrap">
//           <div class="perf-img">🔥</div>
//           <div class="badge-pro">PRO</div>
//         </div>
//         <div class="card-body">
//           <h4>Hawas Fire</h4>
//           <p>উষ্ণ, তীব্র এবং আবেদনময় সুগন্ধ</p>
//           <div class="price">৳৯৯৯</div>
//         </div>
//       </div>
//       <div class="product-card">
//         <div class="img-wrap">
//           <div class="perf-img">💎</div>
//           <div class="badge-pro">PRO</div>
//         </div>
//         <div class="card-body">
//           <h4>Miss Dior</h4>
//           <p>নারীসুলভ, ফুলের সুবাস মিশ্রিত</p>
//           <div class="price">৳৯৯৯</div>
//         </div>
//       </div>
//     </div>
//   </div>
// </section>

// <!-- TRUST BAR -->
// <div class="dark-bar">
//   <div class="dark-bar-item">
//     <div class="dbi-icon">🚚</div>
//     <div><h5>Fast Delivery</h5><p>All Over Bangladesh</p></div>
//   </div>
//   <div class="dark-bar-item">
//     <div class="dbi-icon">💵</div>
//     <div><h5>Cash on Delivery</h5><p>Payment After Receive</p></div>
//   </div>
//   <div class="dark-bar-item">
//     <div class="dbi-icon">🛡</div>
//     <div><h5>Premium Quality</h5><p>100% Authentic Products</p></div>
//   </div>
//   <div class="dark-bar-item">
//     <div class="dbi-icon">💬</div>
//     <div><h5>24/7 Support</h5><p>Dedicated WhatsApp Care</p></div>
//   </div>
// </div>

// <!-- CHECKOUT SECTION -->
// <section class="checkout-section" id="checkout">
//   <div class="checkout-inner">
//     <div class="checkout-title">অর্ডার করতে আপনার তথ্য দিয়ে নিচের ফর্মটি পূরণ করুন</div>

//     <!-- Combo Selection -->
//     <div style="background:#fff; border-radius:16px; border:1px solid #e5e7eb; padding:24px; margin-bottom:24px;">
//       <p style="font-size:13px; color:#6b7280; font-weight:600; margin-bottom:16px;">লাল চেকমার্ক দেওয়া কম্বোটি সিলেক্ট করা আছে</p>
//       <div class="combo-list" id="combo-list">
//         <!-- items injected by JS -->
//       </div>
//     </div>

//     <div class="checkout-grid">
//       <!-- Billing Form -->
//       <div>
//         <div class="form-card">
//           <h3>👤 Billing &amp; Shipping</h3>
//           <div class="form-group">
//             <label class="form-label">Full Name *</label>
//             <input class="form-input" type="text" placeholder="Md. X, Y, M">
//           </div>
//           <div class="form-group">
//             <label class="form-label">11 Digit Phone Number *</label>
//             <input class="form-input" type="tel" placeholder="01XXXXXXXXX">
//           </div>
//           <div class="form-row form-group">
//             <div>
//               <label class="form-label">City *</label>
//               <select class="form-input">
//                 <option value="">Dhaka</option>
//                 <option>Chittagong</option>
//                 <option>Sylhet</option>
//                 <option>Rajshahi</option>
//                 <option>Khulna</option>
//                 <option>Barisal</option>
//                 <option>Mymensingh</option>
//                 <option>Rangpur</option>
//               </select>
//             </div>
//             <div>
//               <label class="form-label">Thana *</label>
//               <select class="form-input">
//                 <option value="">Gazipur</option>
//                 <option>Mirpur</option>
//                 <option>Dhanmondi</option>
//                 <option>Gulshan</option>
//                 <option>Uttara</option>
//               </select>
//             </div>
//           </div>
//           <div class="form-group">
//             <label class="form-label">Thana &amp; Full Address *</label>
//             <input class="form-input" type="text" placeholder="Tonmoy Banik">
//           </div>
//           <div class="form-group">
//             <label class="form-label">Shipping</label>
//             <select class="form-input">
//               <option>Outside Dhaka</option>
//               <option>Inside Dhaka</option>
//             </select>
//           </div>
//         </div>
//       </div>

//       <!-- Order Summary -->
//       <div>
//         <div class="order-summary-card">
//           <h3>🛒 Your Order</h3>
//           <div class="summary-row"><span>Product</span><span id="s-product">—</span></div>
//           <div class="summary-row"><span>Subtotal</span><strong id="s-subtotal">৳৯৯৯</strong></div>
//           <div class="summary-row"><span>Shipping</span><strong id="s-shipping">৳১২০</strong></div>
//           <div class="summary-row total"><span>Total</span><strong id="s-total">৳১১১৯</strong></div>
//           <div class="cod-badge">
//             <div class="cod-icon">✅</div>
//             <div>
//               <h5>Cash on delivery</h5>
//               <p>Pay with cash upon delivery.</p>
//             </div>
//           </div>
//           <button class="confirm-btn" onclick="handleOrder()">
//             🛒 অর্ডার প্লেস করুন ৳<span id="btn-total">১১১৯</span>
//           </button>
//           <div class="secure-note">Secure Checkout Guaranteed</div>
//         </div>
//       </div>
//     </div>
//   </div>
// </section>

// <!-- FOOTER -->
// <footer>
//   <div class="footer-brand">🅰 AL HIBA</div>
//   <div class="footer-phone">📞 01801-003420</div>
//   <div class="footer-links">
//     <a href="#">Privacy Policy</a>
//     <a href="#">Terms of Service</a>
//     <a href="#">Refund Policy</a>
//   </div>
//   <div class="footer-copy">© 2025 AL HIBA. All rights reserved.</div>
// </footer>

// <!-- MOBILE STICKY CTA -->
// <div class="mobile-cta">
//   <button class="mobile-cta-btn" onclick="scrollToCheckout()">
//     🛒 অর্ডার করুন — ৳<span id="mob-total">১১১৯</span>
//   </button>
// </div>

// <script>
// // Timer
// (function() {
//   let secs = 38*60 + 47;
//   function pad(n) { return String(n).padStart(2,'0'); }
//   function tick() {
//     if(secs <= 0) { secs = 3600; }
//     secs--;
//     const h = Math.floor(secs/3600);
//     const m = Math.floor((secs%3600)/60);
//     const s = secs%60;
//     document.getElementById('t-h').textContent = pad(h);
//     document.getElementById('t-m').textContent = pad(m);
//     document.getElementById('t-s').textContent = pad(s);
//   }
//   tick();
//   setInterval(tick, 1000);
// })();

// // Products
// const products = [
//   { id:1, name:'Vampire Blood + Dior Sauvage', price:999, emoji:'🧴🫧' },
//   { id:2, name:'Vampire Blood + Hawas Fire', price:999, emoji:'🧴🔥' },
//   { id:3, name:'Vampire Blood + Miss Dior', price:999, emoji:'🧴💎' },
//   { id:4, name:'Dior Sauvage + Hawas Fire', price:999, emoji:'🫧🔥' },
//   { id:5, name:'Dior Sauvage + Miss Dior', price:999, emoji:'🫧💎' },
//   { id:6, name:'Hawas Fire + Miss Dior', price:999, emoji:'🔥💎' },
//   { id:7, name:'Hawas Fire + Dior Sauvage', price:999, emoji:'🔥🫧' },
//   { id:8, name:'Hawas Fire + Vampire Blood', price:999, emoji:'🔥🧴' },
// ];

// let selected = 1;
// let qty = {};
// products.forEach(p => { qty[p.id] = p.id === 1 ? 1 : 0; });

// function renderCombos() {
//   const list = document.getElementById('combo-list');
//   list.innerHTML = products.map(p => {
//     const isSel = qty[p.id] > 0;
//     const isFeat = p.id === 1;
//     return `
//     <div class="combo-item ${isFeat?'featured':''} ${isSel?'selected':''}" id="ci-${p.id}" onclick="toggleItem(${p.id})">
//       <div class="combo-checkbox">
//         <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
//           <path d="M1 5L4.5 8.5L11 1.5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
//         </svg>
//       </div>
//       <div style="width:54px;height:54px;border-radius:10px;background:#f9f9f9;border:1px solid #f0f0f0;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0">${p.emoji}</div>
//       <div class="combo-info">
//         <h4>${p.name}</h4>
//         <span>${isSel ? 'Selected' : 'Click to select'}</span>
//       </div>
//       <div class="combo-price">৳${p.price}</div>
//       <div class="combo-qty">
//         <button onclick="event.stopPropagation(); changeQty(${p.id},-1)">−</button>
//         <div class="qty-val">${qty[p.id]}</div>
//         <button onclick="event.stopPropagation(); changeQty(${p.id},1)">+</button>
//       </div>
//     </div>`;
//   }).join('');
//   updateSummary();
// }

// function toggleItem(id) {
//   if(qty[id] > 0) { qty[id] = 0; } else { qty[id] = 1; }
//   renderCombos();
// }

// function changeQty(id, delta) {
//   qty[id] = Math.max(0, qty[id] + delta);
//   renderCombos();
// }

// function updateSummary() {
//   const selected = products.filter(p => qty[p.id] > 0);
//   const subtotal = selected.reduce((s,p) => s + p.price * qty[p.id], 0);
//   const shipping = subtotal > 0 ? 120 : 0;
//   const total = subtotal + shipping;
//   const names = selected.map(p=>p.name).join(', ') || '—';
//   document.getElementById('s-product').textContent = names.length > 30 ? names.slice(0,30)+'…' : names;
//   document.getElementById('s-subtotal').textContent = '৳'+subtotal;
//   document.getElementById('s-shipping').textContent = subtotal > 0 ? '৳'+shipping : '—';
//   document.getElementById('s-total').textContent = '৳'+total;
//   document.getElementById('btn-total').textContent = total;
//   const mob = document.getElementById('mob-total');
//   if(mob) mob.textContent = total;
// }

// function scrollToCheckout() {
//   document.getElementById('checkout').scrollIntoView({ behavior:'smooth' });
// }
// function scrollTo(sel) { scrollToCheckout(); }

// function handleOrder() {
//   const sel = products.filter(p => qty[p.id] > 0);
//   if(sel.length === 0) { alert('অন্তত একটি পণ্য সিলেক্ট করুন'); return; }
//   alert('অর্ডার সফলভাবে গ্রহণ করা হয়েছে! আমরা শীঘ্রই আপনার সাথে যোগাযোগ করবো।');
// }

// renderCombos();
// </script>
// </body>
// </html>