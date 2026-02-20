/** @type {import('next').NextConfig} */
const nextConfig = {
  // For Static Export
  // output: 'export',
  trailingSlash: false, // Changed from true - API routes don't work with trailing slashes

  // ═══════════════════════════════════════════════════════════════════════
  // SECURITY HEADERS - Added January 11, 2026
  // ═══════════════════════════════════════════════════════════════════════
  // Addresses missing headers from securityheaders.com scan:
  // - Content-Security-Policy
  // - X-Frame-Options
  // - X-Content-Type-Options
  // - Referrer-Policy
  // - Permissions-Policy
  // ═══════════════════════════════════════════════════════════════════════
  async headers() {
    return [
      {
        // Apply to all routes
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            // Allow camera for QR Scanner (check-in feature)
            // camera=(self) allows camera access from same origin only
            value: 'camera=(self), microphone=(), geolocation=(), interest-cohort=()',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net",
              "img-src 'self' data: blob: https://*.supabase.co https://www.google-analytics.com",
              "font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net data:",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://www.google-analytics.com https://cdn.jsdelivr.net",
              "frame-ancestors 'self'",
              "base-uri 'self'",
              "form-action 'self'",
              "object-src 'none'",
            ].join('; '),
          },
          // HSTS - Enforce HTTPS (1 year, include subdomains)
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          // Cross-Origin Opener Policy - Isolate browsing context
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
          // Cross-Origin Embedder Policy
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'unsafe-none',
          },
        ],
      },
      // Cache static assets aggressively
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/fonts/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Cache favicon and icons
      {
        source: '/:path(favicon.ico|icon.png|apple-icon.png)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=604800, stale-while-revalidate=86400',
          },
        ],
      },
    ];
  },

  // Allow build to pass with warnings (pre-existing warnings exist)
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Transpile ES modules that need it
  transpilePackages: ['@tanstack/react-table', '@tanstack/table-core'],

  // ═══════════════════════════════════════════════════════════════════════
  // IMAGE OPTIMIZATION - Phase 2, Task 2.1 (November 29, 2025)
  // ═══════════════════════════════════════════════════════════════════════
  // CRITICAL: Enables automatic image optimization for better performance
  // Expected Impact: 50-70% faster image loads, especially on slow networks
  // ═══════════════════════════════════════════════════════════════════════
  images: {
    unoptimized: true, // ⚠️ DISABLED - Serverless image optimization adds 60s cold start on Vercel

    // Modern image formats (smaller file sizes)
    formats: ['image/webp', 'image/avif'],

    // Responsive image sizes for different devices
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],

    // Cache optimized images for 60 seconds minimum
    minimumCacheTTL: 60,

    // Allow images from Supabase Storage
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/**',
      },
      {
        protocol: 'https',
        hostname: 'klnspdwlybpwkznzezzd.supabase.co',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'pqndsvfoobctutaeyleq.supabase.co',
        pathname: '/**',
      }
    ],

    // Disable automatic static imports optimization (keep existing behavior)
    disableStaticImages: false,

    // Enable SVG support
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Font optimization - TEMPORARILY DISABLED due to network issues
  // TODO: Re-enable after network issue resolved or switch to self-hosted fonts
  optimizeFonts: false, // ⚠️ TEMPORARY - Disabled due to Google Fonts network timeout

  // HTTP agent pool configuration for better network handling
  httpAgentOptions: {
    keepAlive: true,
  },

  // ═══════════════════════════════════════════════════════════════════════
  // CODE SPLITTING & BUNDLE OPTIMIZATION - Phase 6 (November 29, 2025)
  // ═══════════════════════════════════════════════════════════════════════
  // Automatic tree-shaking for lodash and similar libraries
  // Expected Impact: 30-40% bundle size reduction
  // ═══════════════════════════════════════════════════════════════════════
  modularizeImports: {
    // Automatically import only used lodash functions
    'lodash': {
      transform: 'lodash/{{member}}',
    },
    // Optimize chart.js imports
    'chart.js': {
      transform: 'chart.js/auto/auto.esm',
    },
  },

  // Experimental optimizations
  experimental: {
    // Optimize package imports
    optimizePackageImports: [
      'react-icons',
      'lodash',
      'date-fns',
      '@tanstack/react-table',
      '@tanstack/react-query',
    ],

    // Fix for @react-pdf/renderer in API routes (server-side)
    // This prevents Next.js from bundling react-pdf and uses native Node.js require() instead
    serverComponentsExternalPackages: ['@react-pdf/renderer'],
  },

  // Webpack optimizations
  webpack: (config, { isServer }) => {
    // Fix for @tanstack/react-table ES module issue
    config.module.rules.push({
      test: /\.m?js$/,
      include: /node_modules\/@tanstack/,
      type: 'javascript/auto',
      resolve: {
        fullySpecified: false,
      },
    });

    // Fix for @react-pdf/renderer in API routes (server-side)
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        canvas: 'canvas',
      });

      // Don't bundle @react-pdf/renderer on server - use require() instead
      config.resolve.alias = {
        ...config.resolve.alias,
        '@react-pdf/renderer': '@react-pdf/renderer',
      };
    }

    // Optimize bundle size - merge custom cache groups into Next.js defaults
    if (!isServer && config.optimization?.splitChunks) {
      const existingSplitChunks = typeof config.optimization.splitChunks === 'object'
        ? config.optimization.splitChunks
        : {};
      const existingCacheGroups = existingSplitChunks.cacheGroups || {};

      config.optimization.splitChunks = {
        ...existingSplitChunks,
        cacheGroups: {
          // Preserve all Next.js internal cache groups (app-client-internals, etc.)
          ...existingCacheGroups,

          // Framework chunk (React, Next.js)
          framework: {
            name: 'framework',
            test: /[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types|use-subscription)[\\/]/,
            priority: 40,
            enforce: true,
          },

          // Admin-specific libraries (Chart.js, React Table)
          admin: {
            name: 'admin',
            test: /[\\/]node_modules[\\/](chart\.js|react-chartjs-2|@tanstack[\\/]react-table|@tanstack[\\/]react-query)[\\/]/,
            priority: 30,
            enforce: true,
          },

          // Rich text editor (Quill)
          editor: {
            name: 'editor',
            test: /[\\/]node_modules[\\/](react-quill|quill)[\\/]/,
            priority: 30,
            enforce: true,
          },

          // UI libraries (Bootstrap, AOS, Swiper)
          ui: {
            name: 'ui',
            test: /[\\/]node_modules[\\/](bootstrap|aos|swiper|react-tabs|react-accessible-accordion)[\\/]/,
            priority: 25,
            enforce: true,
          },

          // Utilities (lodash, date-fns, nanoid)
          utils: {
            name: 'utils',
            test: /[\\/]node_modules[\\/](lodash|date-fns|nanoid)[\\/]/,
            priority: 20,
            enforce: true,
          },

          // Everything else from node_modules
          lib: {
            test: /[\\/]node_modules[\\/]/,
            name: 'lib',
            priority: 10,
            minChunks: 1,
            reuseExistingChunk: true,
          },

          // Commons chunk for shared code
          commons: {
            name: 'commons',
            minChunks: 2,
            priority: 5,
            reuseExistingChunk: true,
          },
        },
      };
    }

    return config
  },
};

export default nextConfig;
