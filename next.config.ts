import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Exclude .js.map files from server build
      config.module.rules.push({
        test: /\.js\.map$/,
        use: 'ignore-loader',
      });
    }
    return config;
  },
};

export default nextConfig;
