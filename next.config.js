/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  turbopack: {},
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || []
      config.externals.push({
        '@eshaz/web-worker': 'commonjs @eshaz/web-worker',
      })
    }
    return config
  },
}

export default nextConfig
