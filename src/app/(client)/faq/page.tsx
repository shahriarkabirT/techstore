import type { Metadata } from "next";
import FaqClient from "./FaqClient";
import dbConnect from "@/lib/db";
import Settings from "@/models/Settings";

async function getSettings() {
    try {
        await dbConnect();
        return await Settings.findOne({});
    } catch (error) {
        console.error('Error fetching settings in faq:', error);
        return null;
    }
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const brandName = settings?.brandName || "ccloud";

  return {
    title: `FAQ — Frequently Asked Questions | ${brandName}`,
    description: `Find answers to common questions about ${brandName} — our products, ordering, delivery, quality, and more. Bangladesh's modern modest fashion & lifestyle brand.`,
    keywords: [`${brandName} FAQ`, `${brandName} help`, `order ${brandName}`, `${brandName} delivery`, "modest fashion Bangladesh"],
    robots: { index: true, follow: true },
    alternates: { canonical: `${process.env.NEXT_PUBLIC_BASE_URL || ''}/faq` },
    openGraph: {
      type: "website",
      url: `${process.env.NEXT_PUBLIC_BASE_URL || ''}/faq`,
      title: `FAQ | ${brandName} — Modern Modest Fashion & Lifestyle`,
      description: `Answers to everything you need to know about ${brandName}.`,
      images: [{ url: `${process.env.NEXT_PUBLIC_BASE_URL || ''}/og-faq.jpg` }],
      locale: "en_BD",
      siteName: brandName,
    },
  };
}

export default async function FaqPage() {
  const settings = await getSettings();
  const brandName = settings?.brandName || "ccloud";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      { "@type": "Question", name: `What is ${brandName}?`, acceptedAnswer: { "@type": "Answer", text: `${brandName} is a modern modest fashion & lifestyle brand offering premium quality fashion and lifestyle products for men, women, and kids.` } },
      { "@type": "Question", name: `What products are available at ${brandName}?`, acceptedAnswer: { "@type": "Answer", text: "Men's Fashion, Women's Fashion, Kids Collection, Watches, Perfumes, Fashion Accessories, and Lifestyle Essentials." } },
      { "@type": "Question", name: `Does ${brandName} provide home delivery?`, acceptedAnswer: { "@type": "Answer", text: "Yes. We provide delivery services to ensure customers receive their products safely and conveniently." } },
      { "@type": "Question", name: `Can I order online from ${brandName}?`, acceptedAnswer: { "@type": "Answer", text: "Yes. Customers can easily place orders online through our website and social media platforms." } },
      { "@type": "Question", name: `Who is the founder of ${brandName}?`, acceptedAnswer: { "@type": "Answer", text: `${brandName} is a fast-growing trusted fashion and lifestyle brand.` } },
      { "@type": "Question", name: `What is the mission of ${brandName}?`, acceptedAnswer: { "@type": "Answer", text: "To provide premium quality fashion and lifestyle products that combine elegance, comfort, modesty, and modern trends." } },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <FaqClient brandName={brandName} />
    </>
  );
}