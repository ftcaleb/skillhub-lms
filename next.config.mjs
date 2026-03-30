/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/moodle/:path*',
        destination: 'http://143.110.154.83/:path*',
      },
    ];
  },
};

export default nextConfig;
