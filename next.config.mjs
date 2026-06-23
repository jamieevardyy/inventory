/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      // BunnyCDN pull zone (configure your own hostname via env)
      { protocol: "https", hostname: "**.b-cdn.net" },
      { protocol: "https", hostname: "**.bunnycdn.com" },
    ],
  },
};

export default nextConfig;
