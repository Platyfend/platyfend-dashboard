import {withSentryConfig} from "@sentry/nextjs";
import createMDX from '@next/mdx'
import withBundleAnalyzer from '@next/bundle-analyzer'
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    ignoreDuringBuilds: false, // Enable ESLint in production builds
  },
  typescript: {
    ignoreBuildErrors: false, // Enable TypeScript checking in production builds
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'ik.imagekit.io',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
    formats: ['image/webp', 'image/avif'], // Enable modern image formats
    minimumCacheTTL: 60, // Cache images for 1 minute minimum
  },
  pageExtensions: ['js', 'jsx', 'mdx', 'ts', 'tsx'],
  compiler: {
    styledComponents: true,
    removeConsole: process.env.NODE_ENV === 'production', // Remove console.log in production
  },
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'], // Optimize package imports
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  // Enable compression
  compress: true,
  // Enable static optimization
  trailingSlash: false,
  // Security headers
  poweredByHeader: false,
};

const withMDX = createMDX({
  // Add markdown plugins here, as desired
  options: {
    remarkPlugins: [],
    rehypePlugins: [],
  },
})

// Bundle analyzer configuration
const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

// Compose all the configurations
const composedConfig = bundleAnalyzer(withMDX(nextConfig))

export default withSentryConfig(composedConfig, {
  // Sentry config remains the same
  org: "platyfend",
  project: "javascript-nextjs",
  silent: !process.env.CI,
  widenClientFileUpload: true,
  disableLogger: true,
  automaticVercelMonitors: true,
});
