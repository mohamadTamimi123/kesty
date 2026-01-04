import type { NextConfig } from "next";
import path from "path";

// Get the absolute path to the Next.js project root (where this config file is located)
// Using absolute path to ensure Next.js correctly identifies the project root
const projectRoot = path.resolve(__dirname);

const nextConfig: NextConfig = {
  // Set output file tracing root to the Next.js project root
  // This tells Next.js to use the current directory (where next.config.ts is located) as the tracing root
  // This prevents Next.js from detecting multiple lockfiles and showing warnings
  // Note: This only affects production builds (next build), not development mode
  outputFileTracingRoot: projectRoot,
  
  // Exclude unnecessary files from tracing to speed up compilation
  // Patterns are resolved relative to the project root (where next.config.ts is located)
  // This prevents Next.js from tracing lockfiles outside the project root and other unnecessary files
  outputFileTracingExcludes: {
    '/*': [
      // Exclude lockfiles from parent directories (relative to project root)
      '../../pnpm-lock.yaml',
      '../../../pnpm-lock.yaml',
      // Exclude backend directory entirely
      '../../../backend/**/*',
      // Exclude build artifacts from parent directories
      '../../.next/**/*',
      '../../dist/**/*',
      // Exclude git files
      '../../.git/**/*',
      '../../../.git/**/*',
    ],
  },
  // Image optimization - using remotePatterns instead of deprecated domains
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'localhost',
        port: '',
        pathname: '/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  
  // Compression
  compress: true,
  
  // Performance optimizations
  reactStrictMode: true,
  
  // Experimental features for better performance
  experimental: {
    optimizeCss: true,
    optimizePackageImports: [
      '@heroicons/react',
      'react-hot-toast',
      'framer-motion',
    ],
  },
  
  // Server external packages (moved from experimental)
  serverExternalPackages: [],
  
  // Disable Turbopack due to CPU compatibility issues (popcnt instruction not supported)
  // Using webpack instead which is more compatible with older CPUs
  // To use Turbopack, run: next dev --turbopack
  // To use webpack (default), run: next dev --webpack or just next dev
  
  // Empty turbopack config to silence Next.js 16 warning about webpack config
  // We explicitly use --webpack flag in build/dev scripts
  turbopack: {},
  
  // Allowed dev origins for cross-origin requests (format: hostname or hostname:port)
  allowedDevOrigins: [
    '103.75.197.95',
    '103.75.197.95:3000',
    'localhost',
    'localhost:3000',
  ],
  
  // Webpack optimizations (default bundler)
  webpack: (config, { isServer, dev }) => {
    // Optimize for faster compilation in development
    if (dev) {
      // Enable filesystem cache for faster rebuilds with better error handling
      config.cache = {
        type: 'filesystem',
        buildDependencies: {
          config: [__filename],
        },
        cacheDirectory: path.resolve(projectRoot, '.next/cache/webpack'),
        compression: 'gzip',
      };
      
      config.watchOptions = {
        ...config.watchOptions,
        ignored: [
          '**/node_modules/**',
          '**/.git/**',
          '**/.next/**',
          '../../backend/**',
          '../../**/node_modules/**',
          '**/next.config.compiled.js',
        ],
        aggregateTimeout: 500, // Increase delay to reduce rebuilds
        poll: false, // Disable polling, use native events for better performance
      };
      
      // Disable optimization in development for faster compilation
      config.optimization = {
        ...config.optimization,
        removeAvailableModules: false,
        removeEmptyChunks: false,
        splitChunks: false, // Disable splitChunks in dev for faster compilation
      };
      
      // Ignore next.config.compiled.js resolution errors
      // This file is sometimes referenced by Next.js cache but doesn't always exist
      // Add alias to prevent webpack from trying to resolve it
      config.resolve = {
        ...config.resolve,
        alias: {
          ...config.resolve?.alias,
        },
        fallback: {
          ...config.resolve?.fallback,
        },
      };
      
      // Suppress warnings about next.config.compiled.js
      config.ignoreWarnings = [
        ...(config.ignoreWarnings || []),
        {
          module: /next\.config\.compiled\.js$/,
        },
        {
          message: /Can't resolve.*next\.config\.compiled\.js/,
        },
      ];
    }
    
    // Only use splitChunks in production
    if (!isServer && !dev) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          maxInitialRequests: 15, // Reduced from 25 for better performance
          minSize: 20000,
          cacheGroups: {
            default: false,
            vendors: false,
            // Framework chunk (React, Next.js)
            framework: {
              name: 'framework',
              chunks: 'all',
              test: /[\\/]node_modules[\\/](react|react-dom|scheduler|next)[\\/]/,
              priority: 40,
              enforce: true,
            },
            // UI library chunk (Heroicons, Framer Motion)
            ui: {
              name: 'ui',
              chunks: 'all',
              test: /[\\/]node_modules[\\/](@heroicons|framer-motion)[\\/]/,
              priority: 30,
            },
            // Editor chunk (ReactQuill, Quill)
            editor: {
              name: 'editor',
              chunks: 'all',
              test: /[\\/]node_modules[\\/](react-quill|quill)[\\/]/,
              priority: 30,
            },
            // Vendor chunk (other node_modules)
            vendor: {
              name: 'vendor',
              chunks: 'all',
              test: /[\\/]node_modules[\\/]/,
              priority: 20,
              minChunks: 2,
            },
            // Common chunk (shared code)
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 10,
              reuseExistingChunk: true,
              enforce: true,
            },
          },
        },
      };
    }
    return config;
  },
};

export default nextConfig;
