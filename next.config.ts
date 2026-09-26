import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_SPARKY_RELEASE_ID: process.env.VERCEL_DEPLOYMENT_ID || process.env.VERCEL_GIT_COMMIT_SHA || process.env.SPARKY_RELEASE_SHA || '',
  },
  distDir: process.env.SPARKY_BUILD_CHECK === 'true' ? '.next-build-check' : '.next',
  outputFileTracingIncludes: {
    '/api/music': ['./.music-assets/**/manifest.json'],
    '/api/media-progress': ['./.music-assets/**/manifest.json'],
    '/api/music/audio': ['./.music-assets/**/*.mp3'],
    '/api/music/video': ['./.music-assets/stay-at-your-house/background.mp4', './.music-assets/buttercup-local/video.mp4'],
  },
  outputFileTracingExcludes: {
    '/*': ['./.music-lab/**/*', './.music-assets/stay-at-your-house/video.mp4'],
    '/api/music': ['./.music-assets/**/*.mp3', './.music-assets/**/*.mp4'],
    '/api/media-progress': ['./.music-assets/**/*.mp3', './.music-assets/**/*.mp4'],
    '/api/music/audio': ['./.music-assets/**/*.mp4', './.music-assets/**/manifest.json'],
    '/api/music/video': ['./.music-assets/**/*.mp3', './.music-assets/**/manifest.json'],
  },
  async headers() {
    return [
      { source: "/", headers: [{ key: "Cache-Control", value: "private, no-store, max-age=0, must-revalidate" }] },
      { source: "/audio/classes/:file", headers: [{ key: "Cache-Control", value: "public, max-age=86400" }] },
      { source: "/audio/tips/:file", headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }] },
      { source: "/lesson-images/:file", headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }] },
      { source: "/audio/exams/v2/:file", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] },
      { source: "/locales/:file", headers: [{ key: "Cache-Control", value: "public, max-age=3600" }] },
      {
        source: "/audio/mascots/:file([a-f0-9]{32}\\.mp3)",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
};

export default nextConfig;
