'use client';

import { ConnectionFallback } from '@/components/connection-fallback';

export default function GlobalError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <html lang="pt-BR"><head><title>Uma pausa na conexão · Sparky English</title></head><body style={{ margin: 0 }}><ConnectionFallback onRetry={retry} /></body></html>;
}
