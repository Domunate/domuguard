'use client';

import { useEffect } from 'react';

export default function RedirectPage() {
  useEffect(() => {
    console.log("Redirect page - forcing hard navigation to login");
    // Use direct window location for maximum reliability
    window.location.href = '/login';
  }, []);
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary mb-4"></div>
      <h1 className="text-2xl font-bold mb-2">Redirecting...</h1>
      <p className="text-center mb-4">
        You will be redirected to the login page momentarily.
      </p>
      <a 
        href="/login"
        className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Click here if you are not redirected automatically
      </a>
    </div>
  );
} 
