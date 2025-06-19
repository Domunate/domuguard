'use client';

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

/**
 * A hook that combines Next.js router with window.location
 * to ensure navigation works reliably even when components
 * are caught in re-render cycles or React state issues.
 */
export function useForceRouter() {
  const router = useRouter();

  const forceNavigate = useCallback((path: string, forceHard: boolean = false) => {
    console.log(`Navigating to ${path}${forceHard ? ' (hard navigation)' : ''}`);
    
    // Try both soft and hard navigation for maximum reliability
    try {
      // First try Next.js router (soft navigation)
      router.push(path);
      
      // If force is true, also do a hard navigation after a small delay
      if (forceHard) {
        setTimeout(() => {
          window.location.href = path;
        }, 100);
      }
    } catch (err) {
      console.error('Router navigation failed, falling back to hard navigation', err);
      // Fall back to hard navigation
      window.location.href = path;
    }
  }, [router]);

  return { forceNavigate };
} 
