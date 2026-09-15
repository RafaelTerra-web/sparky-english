import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.SPARKY_BUILD_CHECK === 'true' ? '.next-build-check' : '.next',
  outputFileTracingIncludes: {
    '/api/music': ['./.music-assets/manifest.json', './.music-assets/heartless/manifest.json'],
    '/api/media-progress': ['./.music-assets/manifest.json', './.music-assets/heartless/manifest.json'],
    '/api/music/audio': ['./.music-assets/audio.mp3', './.music-assets/heartless/audio.mp3'],
  },
  outputFileTracingExcludes: { '/*': ['./.music-lab/**/*'] },
  async headers() {
    return [
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
