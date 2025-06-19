"use client"

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isRedirecting) {
      console.log('Auth check complete on homepage, user:', user ? 'authenticated' : 'not authenticated');
      
      setIsRedirecting(true);
      const redirectTimeout = setTimeout(() => {
        if (user) {
          console.log('User authenticated, navigating to dashboard...');
          router.push('/dashboard');
        } else {
          console.log('No authenticated user, navigating to login...');
          router.push('/login');
        }
      }, 500);
      
      return () => clearTimeout(redirectTimeout);
    }
  }, [user, isLoading, isRedirecting, router]);

  // Show loading state with more information
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-blue-800 via-blue-900 to-blue-950 text-white">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white mb-4"></div>
      <h1 className="text-3xl font-bold mb-2">DomuGuard</h1>
      <p className="text-center mb-4 text-lg">
        Document Analysis and Security Platform
      </p>
      <p className="text-sm text-white/70">
        {isLoading 
          ? "Checking authentication status..." 
          : "Redirecting to the appropriate page..."}
      </p>
      
      {!isLoading && !isRedirecting && (
        <div className="mt-8">
          <p className="text-sm mb-4 text-white/70">If you are not redirected automatically:</p>
          <div className="flex gap-4">
            <button 
              onClick={() => router.push('/login')}
              className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
            >
              Go to Login
            </button>
            <button 
              onClick={() => router.push('/dashboard')}
              className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
