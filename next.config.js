/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable App Router (default in Next.js 13+)
  experimental: {
    // Enable server components and app directory
    appDir: true,
    // Enable server actions for form handling
    serverActions: true,
    // Enable optimized package imports
    optimizePackageImports: ['@radix-ui/react-icons', 'lucide-react'],
    // Enable turbo mode for faster builds
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },

  // TypeScript configuration
  typescript: {
    // Type checking during build
    ignoreBuildErrors: false,
  },

  // ESLint configuration
  eslint: {
    // Run ESLint during build
    ignoreDuringBuilds: false,
  },

  // PWA Configuration
  pwa: {
    dest: 'public',
    register: true,
    skipWaiting: true,
    runtimeCaching: [
      {
        urlPattern: /^https?.*/,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'offlineCache',
          expiration: {
            maxEntries: 200,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
          },
        },
      },
    ],
  },

  // Internationalization
  i18n: {
    locales: ['en', 'es', 'fr', 'de', 'zh'],
    defaultLocale: 'en',
    localeDetection: true,
  },

  // Image optimization
  images: {
    domains: ['localhost', 'example.com'],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Webpack configuration for WebRTC and PDF libraries
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Handle WebRTC libraries
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
    };

    // Configure externals for server-side rendering
    if (isServer) {
      config.externals.push({
        'simple-peer': 'commonjs simple-peer',
        'socket.io-client': 'commonjs socket.io-client',
      });
    }

    // Handle PDF libraries
    config.module.rules.push({
      test: /\.pdf$/,
      use: {
        loader: 'file-loader',
        options: {
          publicPath: '/_next/static/files/',
          outputPath: 'static/files/',
        },
      },
    });

    // Handle WebRTC native modules
    config.module.rules.push({
      test: /\.node$/,
      use: 'node-loader',
    });

    // Optimize bundle splitting
    config.optimization.splitChunks = {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
        webrtc: {
          test: /[\\/]node_modules[\\/](simple-peer|socket\.io-client)[\\/]/,
          name: 'webrtc',
          chunks: 'all',
        },
        pdf: {
          test: /[\\/]node_modules[\\/](jspdf|pdf-lib)[\\/]/,
          name: 'pdf',
          chunks: 'all',
        },
      },
    };

    // Add webpack plugins for better performance
    config.plugins.push(
      new webpack.DefinePlugin({
        'process.env.CUSTOM_KEY': JSON.stringify(process.env.CUSTOM_KEY),
      })
    );

    return config;
  },

  // Headers for security and performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=*, microphone=*, display-capture=*',
          },
        ],
      },
    ];
  },

  // Redirects for better UX
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
      {
        source: '/login',
        destination: '/auth/login',
        permanent: true,
      },
      {
        source: '/register',
        destination: '/auth/register',
        permanent: true,
      },
    ];
  },

  // Rewrites for API routes
  async rewrites() {
    return [
      {
        source: '/api/stripe/:path*',
        destination: '/api/payments/:path*',
      },
    ];
  },

  // Output configuration
  output: 'standalone',

  // Compression
  compress: true,

  // Power by header
  poweredByHeader: false,

  // React strict mode
  reactStrictMode: true,

  // SWC minification
  swcMinify: true,

  // Trailing slash
  trailingSlash: false,

  // Generate build ID
  generateBuildId: async () => {
    return 'tutor-platform-' + Date.now();
  },

  // Environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // Compiler options
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production',
    // Enable styled-components if needed
    styledComponents: false,
  },

  // Logging
  logging: {
    fetches: {
      fullUrl: true,
    },
  },

  // Development indicators
  devIndicators: {
    buildActivity: true,
    buildActivityPosition: 'bottom-right',
  },

  // OnDemandEntries for development
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },

  // Configure page extensions
  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],

  // Asset prefix for CDN
  assetPrefix: process.env.NODE_ENV === 'production' ? process.env.CDN_URL : '',

  // Base path
  basePath: '',

  // Cross Origin
  crossOrigin: 'anonymous',
};

module.exports = nextConfig;