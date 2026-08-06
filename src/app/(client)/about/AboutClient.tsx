"use client";
import Image from "next/image";
import Link from "next/link";

const products = [
  { icon: "📱", label: "iPhone Cases", sub: "Premium Protection" },
  { icon: "✨", label: "Charms", sub: "Cute & Elegant" },
  { icon: "⌚", label: "Smart Watches", sub: "Tech Meets Style" },
  { icon: "🎧", label: "Audio Gear", sub: "Crystal Clear Sound" },
  { icon: "🌸", label: "Personal Care", sub: "Self-care Essentials" },
  { icon: "💎", label: "Accessories", sub: "Finishing Touches" },
];

const chips = [
  "iPhone Cases", "Samsung Covers", "Phone Charms", "Smart Watches", "AirPods Cases",
  "Tech Accessories", "Personal Care", "Trendy Gadgets", "Daily Essentials",
];



function SectionTag({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <span className={`inline-block text-[11px] tracking-[0.2em] uppercase font-medium border-b pb-0.5 ${dark ? "text-white border-white" : "text-black border-black"}`}>
      {children}
    </span>
  );
}

function Divider({ dark = false }: { dark?: boolean }) {
  return (
    <div className="flex items-center gap-4 my-8">
      <div className={`flex-1 h-px ${dark ? "bg-white/20" : "bg-black/15"}`} />
      <span className={`font-serif text-lg ${dark ? "text-white/40" : "text-black/30"}`}>✦</span>
      <div className={`flex-1 h-px ${dark ? "bg-white/20" : "bg-black/15"}`} />
    </div>
  );
}

export default function AboutClient({ brandName = 'CCloudLab', logoUrl = '/images/about_logo.png' }: { brandName?: string, logoUrl?: string }) {
  return (
    <main className="bg-white min-h-screen text-black font-sans antialiased">

      {/* ── HERO ── */}
      <section className="relative overflow-hidden pt-28 pb-24 text-center bg-white">
        {/* Subtle grid pattern */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: "linear-gradient(black 1px, transparent 1px), linear-gradient(90deg, black 1px, transparent 1px)", backgroundSize: "60px 60px" }} />

        {/* Decorative ring */}
        <div className="pointer-events-none absolute -top-32 -right-32 w-[520px] h-[520px] rounded-full border border-black/5" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 w-96 h-96 rounded-full border border-black/5" />

        <div className="relative z-10 max-w-3xl mx-auto px-6">
          <SectionTag>Our Story</SectionTag>

          <h1 className="font-serif mt-5 mb-3 font-light leading-[1.0] tracking-[-0.02em] text-[clamp(64px,10vw,108px)] text-black">
            {brandName}
          </h1>

          <p className="font-serif italic font-light text-black/40 text-[clamp(17px,2.5vw,22px)] mb-8 leading-relaxed">
          Bangladesh&apos;s Leading Gadget &amp; Tech Accessories Store
          </p>

          <Divider />

          <p className="text-[15px] leading-[1.9] text-black/50 max-w-xl mx-auto">
            Welcome to {brandName} — built with passion, elegance, and trust.
            Where premium quality meets trendy designs, and every product adds a touch of charm to your daily life.
          </p>
        </div>
      </section>

      {/* ── BRAND STORY ── */}
      <section className="bg-white py-28 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-20 items-center">

          {/* Badge */}
          <div className="flex justify-center">
            <div className="relative flex flex-col items-center justify-center w-72 h-72 rounded-full border border-black/10 gap-2">
              <div className="absolute inset-[-16px] rounded-full border border-dashed border-black/10 pointer-events-none" />
              <Image 
                src={logoUrl} 
                alt={`${brandName} Logo`} 
                width={200} 
                height={200} 
                className="w-auto h-auto max-w-[180px] object-contain"
                priority
              />
            </div>
          </div>

          {/* Text */}
          <div>
            <SectionTag>Our Beginning</SectionTag>
            <h2 className="font-serif text-4xl font-normal leading-snug mt-4 mb-6 text-black">
              A Dream Woven Into Every Accessory
            </h2>
            <p className="text-[15px] leading-[1.85] text-black/60 mb-5">
              {brandName} was founded with a passion — to bring cutting-edge gadgets, premium tech accessories, and modern lifestyle essentials together in one place. Our goal is not only to sell products, but to build a brand that stands for quality, innovation, and trust for the modern individual.
            </p>
            <p className="text-[15px] leading-[1.85] text-black/60">
              At {brandName}, every product is carefully curated to meet today&apos;s tech demands while maintaining the highest standards of durability and performance — because a great gadget is not just a tool. It is an extension of your digital lifestyle.
            </p>
          </div>
        </div>
      </section>

      {/* ── PRODUCTS ── */}
      <section className="bg-white py-24 px-6">
        <div className="max-w-6xl mx-auto">

          <div className="text-center mb-14">
            <SectionTag>What We Offer</SectionTag>
            <h2 className="font-serif text-4xl font-normal mt-4 text-black">
              A Complete Lifestyle Destination
            </h2>
            <p className="text-[15px] text-black/45 mt-3 max-w-lg mx-auto leading-[1.8]">
              From everyday essentials to premium tech accessories — everything our customers need to express their style with confidence.
            </p>
          </div>

          {/* Category cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
            {products.map(({ icon, label, sub }) => (
              <div
                key={label}
                className="group border border-black/8 rounded-xl p-7 text-center transition-all duration-300 hover:-translate-y-1 hover:border-black/20 hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] cursor-default"
              >
                <div className="text-3xl mb-3">{icon}</div>
                <p className="text-sm font-medium text-black mb-1">{label}</p>
                <p className="text-xs text-black/40">{sub}</p>
              </div>
            ))}
          </div>

          {/* Chips */}
          <div className="flex flex-wrap gap-2.5 justify-center">
            {chips.map((chip) => (
              <span
                key={chip}
                className="inline-flex items-center gap-1.5 border border-black/12 rounded-full px-4 py-1.5 text-[13px] text-black/50 cursor-default transition-all duration-200 hover:bg-primary hover:text-white hover:border-primary before:content-['◆'] before:text-[7px] before:text-black/25"
              >
                {chip}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── MISSION & VISION ── */}
      <section className="py-24 px-6 bg-neutral-50">
        <div className="max-w-6xl mx-auto">

          <div className="text-center mb-14">
            <SectionTag>Purpose</SectionTag>
            <h2 className="font-serif text-4xl font-normal mt-4 text-black">
              Mission &amp; Vision
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Mission — white */}
            <div className="relative bg-white border border-black/8 rounded-2xl p-12 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(0,0,0,0.07)]">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-primary" />
              <p className="font-serif text-[80px] font-light text-black/6 leading-none mb-6 select-none">01</p>
              <SectionTag>Our Mission</SectionTag>
              <h3 className="font-serif text-2xl font-normal mt-4 mb-4 text-black leading-snug">
                Quality That Speaks for Itself
              </h3>
              <p className="text-[15px] leading-[1.85] text-black/50">
                To provide premium quality gadgets and tech accessories that combine innovation, durability, and value — empowering every customer with the best tech at the best prices.
              </p>
            </div>

            {/* Vision — black */}
            <div className="relative bg-primary border border-white/5 rounded-2xl p-12 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(255,79,135,0.3)]">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-white" />
              <p className="font-serif text-[80px] font-light text-white/6 leading-none mb-6 select-none">02</p>
              <SectionTag dark>Our Vision</SectionTag>
              <h3 className="font-serif text-2xl font-normal mt-4 mb-4 text-white leading-snug">
                A Global Name from Bangladesh
              </h3>
              <p className="text-[15px] leading-[1.85] text-white/50">
                To make {brandName} Bangladesh&apos;s most trusted gadget brand — known internationally for its curated selection of smart watches, phone cases, earbuds, and premium tech accessories.
              </p>
            </div>
          </div>
        </div>
      </section>





      {/* ── FUTURE VISION ── */}
      <section className="py-28 px-6 bg-white">
        <div className="max-w-2xl mx-auto text-center">
          <SectionTag>The Road Ahead</SectionTag>
          <h2 className="font-serif font-normal mt-4 mb-2 text-black leading-snug text-[clamp(30px,5vw,50px)]">
            Growing Into Your Complete Lifestyle Partner
          </h2>
          <Divider />
          <p className="text-[15px] leading-[1.9] text-black/50 mb-6">
            As our journey continues, {brandName} aims to introduce more modern fashion trends, tech accessories, and daily essential items that meet the needs of every stylish individual. Alongside our famous iPhone cases, charms, and smartwatches, we are continually expanding with premium tech gear, luxury fragrances, and many more everyday essentials.
          </p>
          <p className="text-[15px] leading-[1.9] text-black/60 text-center max-w-3xl mx-auto">
            We are committed to bringing innovation, elegance, and trust into every collection we launch — making {brandName} not just an accessories brand, but a complete lifestyle destination you can trust.
          </p>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-primary py-24 px-6 text-center">
        <SectionTag dark>Join the Journey</SectionTag>
        <h2 className="font-serif text-4xl font-normal mt-4 mb-3 text-white">
          Explore {brandName} Today
        </h2>
        <p className="text-[15px] text-white/45 mb-10">
          Discover our latest collections and become part of our growing family.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link
            href="/products"
            className="inline-block bg-white text-black px-9 py-3.5 rounded-full text-sm font-medium tracking-wide transition-all duration-200 hover:bg-white/90"
          >
            Shop Now
          </Link>
          <a
            href="/contact"
            className="inline-block bg-transparent text-white border border-white/25 px-9 py-3.5 rounded-full text-sm font-medium tracking-wide transition-all duration-200 hover:border-white/60"
          >
            Contact Us
          </a>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-white border-t border-black/8 py-10 px-6 text-center">
        <p className="font-serif text-2xl font-light text-black tracking-widest mb-2">{brandName}</p>
        <p className="text-xs tracking-[0.15em] uppercase text-black/30">
          Premium Gadgets &amp; Tech Accessories — Bangladesh
        </p>
      </footer>

    </main>
  );
}