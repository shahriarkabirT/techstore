import dbConnect from "@/lib/db";
import Settings from "@/models/Settings";
import type { Metadata } from "next";
import AboutClient from "./AboutClient";


async function getSettings() {
    try {
        await dbConnect();
        return await Settings.findOne({});
    } catch (error) {
        console.error('Error fetching settings in about:', error);
        return null;
    }
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const brandName = settings?.brandName || "CCloudLab";

  return {
    title: `About ${brandName} — Modern Modest Fashion & Lifestyle Brand Bangladesh`,
    description:
      `${brandName} is Bangladesh's premium modest fashion & lifestyle brand. Discover our story, mission, and vision — elegant Panjabi, Abaya, Watches, Perfumes & more.`,
    keywords: [brandName, "modest fashion Bangladesh", "Islamic fashion", "Panjabi", "Abaya", "lifestyle brand"],
    robots: { index: true, follow: true },
    alternates: { canonical: `${process.env.NEXT_PUBLIC_BASE_URL || ''}/about` },
    openGraph: {
      type: "website",
      url: `${process.env.NEXT_PUBLIC_BASE_URL || ''}/about`,
      title: `About ${brandName} — Modern Modest Fashion & Lifestyle Brand`,
      description: "Premium fashion, Islamic elegance, and modern lifestyle — all in one place.",
      images: [{ url: `${process.env.NEXT_PUBLIC_BASE_URL || ''}/og-about.jpg` }],
      locale: "en_BD",
      siteName: brandName,
    },
    twitter: {
      card: "summary_large_image",
      title: `About ${brandName} — Modern Modest Fashion & Lifestyle Brand`,
      description: "Premium fashion, Islamic elegance, and modern lifestyle — all in one place.",
      images: [`${process.env.NEXT_PUBLIC_BASE_URL || ''}/og-about.jpg`],
    },
  };
}

export default async function AboutPage() {
  const settings = await getSettings();
  const brandName = settings?.brandName || "Ccloud";
  const logoUrl = settings?.logoUrl || "/images/about_logo.png";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: brandName,
    url: process.env.NEXT_PUBLIC_BASE_URL || '',
    description: "Modern modest fashion & lifestyle brand from Bangladesh",
    foundingLocation: { "@type": "Place", name: "Bangladesh" },
    sameAs: [
      settings?.facebook || "https://facebook.com/",
      settings?.instagram || "https://instagram.com/"
    ].filter(Boolean),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <AboutClient brandName={brandName} logoUrl={logoUrl} />
    </>
  );
}