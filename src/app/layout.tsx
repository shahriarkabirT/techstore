import { Open_Sans } from 'next/font/google';
import './globals.css';
import { ReactNode } from 'react';
import { Metadata } from 'next';
import Script from 'next/script';
import NextTopLoader from 'nextjs-toploader';
import ReduxProvider from '@/components/providers/ReduxProvider';
import AuthProvider from '@/components/providers/AuthProvider';
import { Toaster } from 'react-hot-toast';

import LazyChatWidget from '@/components/chat/LazyChatWidget';
import { Suspense } from 'react';
import dbConnect from '@/lib/db';
import Settings from '@/models/Settings';


const openSans = Open_Sans({
    subsets: ['latin'],
    weight: ['400', '600', '700', '800'],
    variable: '--font-open-sans',
    display: 'swap',
    preload: true,
});

async function getSettings() {
    try {
        await dbConnect();
        return await Settings.findOne({});
    } catch (error) {
        console.error('Error fetching settings in layout:', error);
        return null;
    }
}

export const viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5, // Allow user to zoom
};

export async function generateMetadata(): Promise<Metadata> {
    const settings = await getSettings();
    const logoUrl = settings?.logoUrl;
    const faviconUrl = settings?.faviconUrl;
    const activeIcon = faviconUrl || logoUrl || '/favicon.ico';
    const brandName = settings?.brandName || 'Store';

    return {
        metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),
        alternates: {
            canonical: '/',
        },
        title: {
            template: `%s | ${brandName}`,
            default: `${brandName} - Girls Phone Covers Bangladesh | Cute Cases for iPhone, Samsung | BDGirls`,
        },
        description: `${brandName}: Your trusted online shopping destination. Girls Phone Covers Bangladesh | Cute Cases for iPhone, Samsung | BDGirls`,
        keywords: 'ecommerce, online shopping, products, store',
        authors: [{ name: 'Collaborative Cloud', url: 'https://ccloudlab.com' }],
        creator: 'Collaborative Cloud',
        appleWebApp: {
            capable: true,
            statusBarStyle: 'default',
            title: brandName,
        },
        icons: {
            icon: activeIcon,
            apple: activeIcon,
            shortcut: activeIcon,
        },
    };
}

interface RootLayoutProps {
    children: ReactNode;
}

export default async function RootLayout({ children }: RootLayoutProps) {
    const settings = await getSettings();
    const gtmId = settings?.googleTagManagerId;
    const pixelId = settings?.facebookPixelId;
    const tiktokPixelId = (settings as any)?.tiktokPixelId;

    return (
        <html lang="en">
            <head>
                {/* Google Tag Manager - Head Script */}
                {gtmId && (
                    <Script id="gtm-script" strategy="afterInteractive">
                        {`
                            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                            })(window,document,'script','dataLayer','${gtmId}');
                        `}
                    </Script>
                )}

                {/* Facebook Pixel - Removed as tracking is now handled via GTM and CAPI */}

                {/* TikTok Pixel - Head Script */}
                {tiktokPixelId && (
                    <Script id="tiktok-pixel-script" strategy="afterInteractive">
                        {`
                            !function (w, d, t) {
                                w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];
                                ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];
                                ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};
                                for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);
                                ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};
                                ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";
                                ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};
                                var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;
                                var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
                                ttq.load('${tiktokPixelId}');
                                ttq.page();
                            }(window, document, 'ttq');
                        `}
                    </Script>
                )}
            </head>
            <body className={`${openSans.variable} font-sans antialiased`}>
                {/* Google Tag Manager (noscript) */}
                {gtmId && (
                    <noscript>
                        <iframe
                            src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
                            height="0"
                            width="0"
                            style={{ display: 'none', visibility: 'hidden' }}
                        />
                    </noscript>
                )}

                {/* Facebook Pixel (noscript) - Removed */}

                <NextTopLoader
                    color="#28292b"
                    initialPosition={0.08}
                    crawlSpeed={200}
                    height={3}
                    crawl={true}
                    showSpinner={false}
                    easing="ease"
                    speed={200}
                    shadow="0 0 10px #28292b,0 0 5px #555"
                />
                <ReduxProvider>
                    <AuthProvider>
                        <Toaster position="top-right" />
                        <Suspense fallback={null}>
                                {children}
                        </Suspense>
                        {/* <LazyChatWidget /> */}
                    </AuthProvider>
                </ReduxProvider>

            </body>
        </html>
    );
}
