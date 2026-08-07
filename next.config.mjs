/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ['image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: 'demo.ccloudlab.com',
      },
    ],
  },
  compress: true,

  // Rewrite /uploads/* to a dynamic API route so newly uploaded files
  // are served immediately without needing a server restart.
  // Next.js caches public/ file list in memory at startup;
  // this rewrite bypasses that cache entirely.
  async redirects() {
    const redirectsList = [];
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

    if (baseUrl) {
      const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
      
      redirectsList.push({
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'www.(?<domain>.*)',
          },
        ],
        destination: `${cleanBaseUrl}/:path*`,
        permanent: true,
      });
    }

    return redirectsList;
  },

  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/uploads/:filename',
          destination: '/api/files/:filename',
        },
      ],
    };
  },
};

export default nextConfig;
