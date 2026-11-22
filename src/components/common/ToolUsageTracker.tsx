'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { recordRecentTool } from '@/lib/userPreferences';

export function ToolUsageTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;

    let slug = '';
    if (pathname.startsWith('/tools/')) {
      slug = pathname.replace('/tools/', '').split('/')[0];
    } else if (pathname === '/send') {
      slug = 'send';
    } else if (pathname === '/clip' || pathname === '/clipboard') {
      slug = 'clip';
    }

    if (slug) {
      recordRecentTool(slug);
    }
  }, [pathname]);

  return null;
}
