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
