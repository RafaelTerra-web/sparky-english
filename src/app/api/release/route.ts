export const dynamic = 'force-dynamic';

export function GET() {
  return Response.json(
    {
      commit: process.env.VERCEL_GIT_COMMIT_SHA || process.env.SPARKY_RELEASE_SHA || null,
      deployment: process.env.VERCEL_DEPLOYMENT_ID || null,
      version: process.env.NEXT_PUBLIC_SPARKY_RELEASE_ID || null,
    },
    { headers: { 'Cache-Control': 'no-store, max-age=0, must-revalidate' } },
  );
}
