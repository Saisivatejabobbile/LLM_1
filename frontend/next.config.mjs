/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', 'huggingface.co', 'avatars.githubusercontent.com'],
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'localhost:4000'],
    },
  },
}

export default nextConfig;
