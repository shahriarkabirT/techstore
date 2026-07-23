"use client";

import { useState } from "react";
import { useGetPublicSettingsQuery } from '@/redux/features/settings/settingsApi';

const getFaqs = (brandName: string, settings?: any) => [
  {
    q: `What is ${brandName}?`,
    a: `${brandName} is a modern modest fashion & lifestyle brand offering premium quality fashion and lifestyle products for men, women, and kids. Our collections include Panjabi, Pajama, Abaya, Women's Dress, Kids Collection, Watches, Perfumes, Accessories, and more daily lifestyle essentials.`,
  },
  {
    q: `What products are available at ${brandName}?`,
    a: null,
    list: ["Men's Fashion", "Women's Fashion", "Kids Collection", "Watches", "Perfumes", "Fashion Accessories", "Lifestyle Essentials"],
    suffix: "We are continuously expanding our collections with new and trendy products.",
  },
  {
    q: `Is ${brandName} only a fashion brand?`,
    a: `No. ${brandName} is not only a fashion brand — it is a complete lifestyle brand. Alongside fashion collections, we aim to introduce daily life essentials, premium accessories, and modern lifestyle products for individuals and families.`,
  },
  {
    q: `Does ${brandName} offer premium quality products?`,
    a: "Yes. Quality is one of our top priorities. Every product is selected carefully to ensure elegance, comfort, durability, and customer satisfaction.",
  },
  {
    q: "Do you offer products for both men and women?",
    a: `Yes. ${brandName} offers fashion and lifestyle products for:`,
    list: ["Men", "Women", "Kids"],
    suffix: "Our goal is to provide stylish collections for the entire family.",
  },
  {
    q: "Will new products be added regularly?",
    a: "Absolutely. We continuously update our collections with modern fashion trends, premium lifestyle items, watches, perfumes, accessories, and other daily essentials.",
  },
  {
    q: `Can I order online from ${brandName}?`,
    a: "Yes. Customers can easily place orders online through our website and social media platforms.",
  },
  {
    q: `Does ${brandName} provide home delivery?`,
    a: "Yes. We provide delivery services to ensure customers receive their products safely and conveniently.",
  },
  {
    q: `Who is the founder of ${brandName}?`,
    a: `${brandName} is a fast-growing trusted fashion and lifestyle brand. Our vision is to build ${brandName} into an international modest fashion & lifestyle destination.`,
  },
  {
    q: `What is the mission of ${brandName}?`,
    a: "Our mission is to provide premium quality fashion and lifestyle products that combine elegance, comfort, modesty, and modern trends.",
  },
  {
    q: `What is the vision of ${brandName}?`,
    a: `Our vision is to make ${brandName} a globally recognized fashion and lifestyle brand representing luxury, trust, and elegance.`,
  },
  {
    q: `How can I contact ${brandName}?`,
    a: "You can reach us through any of these channels:",
    list: [
      "Website",
      settings?.facebook ? <a href={settings.facebook} target="_blank" rel="noopener noreferrer" className="hover:text-white underline transition-colors">Facebook Page</a> : "Facebook Page",
      settings?.instagram ? <a href={settings.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-white underline transition-colors">Instagram</a> : "Instagram",
      "WhatsApp",
      "Customer Support Number"
    ],
    suffix: "Our support team is always ready to help you.",
  },
];

function FaqItem({ item, index, open, onToggle }: {
  item: { q: string, a: string | null, list?: React.ReactNode[], suffix?: string };
  index: number;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className={`border-b border-black/8 transition-colors duration-200 ${open ? "bg-black" : "bg-white hover:bg-neutral-50"}`}>
      <button
        onClick={onToggle}
        className="w-full flex items-start gap-5 px-8 py-6 text-left focus:outline-none group"
        aria-expanded={open}
      >
        {/* Number */}
        <span className={`font-serif text-sm font-light mt-0.5 flex-shrink-0 w-6 transition-colors duration-200 ${open ? "text-white/30" : "text-black/25"}`}>
          {String(index + 1).padStart(2, "0")}
        </span>

        {/* Question */}
        <span className={`flex-1 text-[15px] font-medium leading-snug transition-colors duration-200 ${open ? "text-white" : "text-black"}`}>
          {item.q}
        </span>

        {/* Toggle icon */}
        <span className={`flex-shrink-0 w-5 h-5 flex items-center justify-center border rounded-full transition-all duration-300 ${open ? "border-white/30 rotate-45" : "border-black/20 group-hover:border-black/40"}`}>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M5 1v8M1 5h8" stroke={open ? "white" : "black"} strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        </span>
      </button>

      {/* Answer */}
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${open ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}>
        <div className="px-8 pb-7 pl-[72px]">
          {item.a && (
            <p className="text-[14px] leading-[1.85] text-white/60 mb-3">{item.a}</p>
          )}
          {item.list && (
            <ul className="space-y-1.5 mb-3">
              {item.list.map((li, idx) => (
                <li key={idx} className="flex items-center gap-2.5 text-[14px] text-white/60">
                  <span className="w-1 h-1 rounded-full bg-white/30 flex-shrink-0" />
                  {li}
                </li>
              ))}
            </ul>
          )}
          {item.suffix && (
            <p className="text-[14px] leading-[1.85] text-white/60">{item.suffix}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function FaqClient({ brandName = 'Ccloud' }: { brandName?: string }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const { data: settingsData } = useGetPublicSettingsQuery();
  const settings = settingsData?.settings;
  const faqs = getFaqs(brandName, settings);

  return (
    <main className="bg-white min-h-screen font-sans antialiased text-black">

      {/* ── HERO ── */}
      <section className="pt-24 pb-16 px-6 text-center border-b border-black/8">
        <span className="inline-block text-[11px] tracking-[0.2em] uppercase font-medium border-b border-black pb-0.5 mb-6">
          Help Center
        </span>
        <h1 className="font-serif text-[clamp(40px,7vw,80px)] font-light leading-[1.05] tracking-tight text-black mb-5">
          Frequently Asked<br />
          <span className="italic font-light text-black/40">Questions</span>
        </h1>
        <p className="text-[15px] text-black/45 max-w-md mx-auto leading-relaxed">
          Everything you need to know about {brandName}. Can&apos;t find an answer? Reach out to our support team.
        </p>
      </section>

      {/* ── FAQ LIST ── */}
      <section className="max-w-3xl mx-auto px-6 py-16">

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-4 mb-12">
          {[
            { n: "12", label: "Questions answered" },
            { n: "6+", label: "Product categories" },
            { n: "24/7", label: "Support available" },
          ].map(({ n, label }) => (
            <div key={label} className="border border-black/8 rounded-xl p-5 text-center">
              <p className="font-serif text-3xl font-light text-black mb-1">{n}</p>
              <p className="text-[12px] text-black/35 uppercase tracking-wide">{label}</p>
            </div>
          ))}
        </div>

        {/* Accordion */}
        <div className="border border-black/8 rounded-2xl overflow-hidden">
          {faqs.map((item, i) => (
            <FaqItem
              key={i}
              item={item}
              index={i}
              open={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? null : i)}
            />
          ))}
        </div>
      </section>

      {/* ── CONTACT CTA ── */}
      <section className="bg-black py-20 px-6 text-center">
        <span className="inline-block text-[11px] tracking-[0.2em] uppercase font-medium border-b border-white pb-0.5 text-white mb-6">
          Still have questions?
        </span>
        <h2 className="font-serif text-4xl font-normal text-white mb-3">
          We&rsquo;re Here to Help
        </h2>
        <p className="text-[15px] text-white/45 mb-10 max-w-sm mx-auto leading-relaxed">
          Our support team is always ready to assist you with anything you need.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <a href={`tel:${settings?.contactPhone?.replace(/\D/g, '')}`} className="inline-block bg-white text-black px-8 py-3.5 rounded-full text-sm font-medium tracking-wide hover:bg-white/90 transition-colors duration-200">
            Contact Support
          </a>
          <a href={`https://wa.me/${settings?.whatsapp?.replace(/\D/g, '')}`} className="inline-block border border-white/20 text-white px-8 py-3.5 rounded-full text-sm font-medium tracking-wide hover:border-white/50 transition-colors duration-200">
            WhatsApp Us
          </a>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-white border-t border-black/8 py-10 px-6 text-center">
        <p className="font-serif text-2xl font-light text-black tracking-widest mb-2">{brandName}</p>
        <p className="text-xs tracking-[0.15em] uppercase text-black/30">
          Modern Modest Fashion &amp; Lifestyle — Bangladesh
        </p>
      </footer>

    </main>
  );
}