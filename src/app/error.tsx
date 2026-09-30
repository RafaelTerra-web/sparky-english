'use client';

import { ConnectionFallback } from '@/components/connection-fallback';

export default function ErrorPage({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <ConnectionFallback onRetry={retry} />;
}
