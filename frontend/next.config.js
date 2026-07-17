/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: { ignoreBuildErrors: true },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.r2.cloudflarestorage.com' },
      { protocol: 'https', hostname: '**.r2.dev' },
      { protocol: 'https', hostname: 'midias.soconstrutoras.com.br' },
      { protocol: 'http', hostname: 'localhost' },
    ],
  },
  // Leaflet usa require() interno -- precisa ser transpilado pelo Next.js
  transpilePackages: ['leaflet', 'react-leaflet'],
};

module.exports = nextConfig;
