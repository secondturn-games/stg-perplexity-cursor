/** @type {import('next').NextConfig} */
const nextConfig = {
  typedRoutes: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cf.geekdo-images.com',
      },
      {
        protocol: 'https',
        hostname: 'images.igdb.com',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  webpack: (config, { isServer }) => {
    // Optimize webpack cache for large data structures
    config.cache = {
      type: 'filesystem',
      buildDependencies: {
        config: [__filename],
      },
      // Use compression for large cached data
      compression: 'gzip',
    };

    // Optimize string serialization
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        ...config.optimization.splitChunks,
        cacheGroups: {
          ...config.optimization.splitChunks?.cacheGroups,
          // Separate large data into its own chunk
          largeData: {
            test: /[\\/]lib[\\/]bgg[\\/]/,
            name: 'bgg-data',
            chunks: 'all',
            priority: 10,
          },
        },
      },
    };

    return config;
  },
};

module.exports = nextConfig;
