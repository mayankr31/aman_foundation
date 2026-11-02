/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactCompiler: true,
  // Required for Docker standalone deployment
  output: 'standalone',
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
    JWT_SECRET: process.env.JWT_SECRET,
  },
  // The service worker and manifest must always be revalidated so a new
  // deployment is picked up promptly. Traefik does not cache by default, but
  // these headers also protect against future proxies/CDNs.
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      {
        source: "/manifest.webmanifest",
        headers: [{ key: "Cache-Control", value: "no-cache" }],
      },
      {
        source: "/offline.html",
        headers: [{ key: "Cache-Control", value: "no-cache" }],
      },
    ];
  },
  // Serve runtime-uploaded files (written to public/uploads after the build)
  // through an app route. Next.js only serves files that were present in the
  // `public` folder at production server startup, so files added later would
  // otherwise 404 (they still work in dev). beforeFiles runs before that check.
  async rewrites() {
    return {
      beforeFiles: [
        { source: "/uploads/:path*", destination: "/api/uploads/:path*" },
      ],
    };
  },
};

export default nextConfig;
