/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdnwordpresstest-f0ekdgevcngegudb.z01.azurefd.net',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
