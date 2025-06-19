'use client';

import { useEffect, useState } from 'react';

export default function AuthTestPage() {
  const [authStatus, setAuthStatus] = useState<string>("Checking...");
  const [token, setToken] = useState<string | null>(null);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    setLoading(true);
    // Check token
    const storedToken = localStorage.getItem('token');
    setToken(storedToken);
    
    if (!storedToken) {
      setAuthStatus("No token found");
      setTokenValid(false);
      setLoading(false);
      return;
    }

    setAuthStatus("Token found, checking validity...");
    
    try {
      // Test the token against the API
      const response = await fetch('http://localhost:8000/api/v1/auth/me', {
        headers: {
          'Authorization': `Bearer ${storedToken}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAuthStatus(`Valid token. User: ${data.username}`);
        setTokenValid(true);
        setUserData(data);
      } else {
        setAuthStatus(`Invalid token (Status: ${response.status})`);
        setTokenValid(false);
        if (response.status === 401) {
          console.log("Unauthorized token");
        }
      }
    } catch (error) {
      setAuthStatus(`Error checking token: ${error instanceof Error ? error.message : String(error)}`);
      setTokenValid(null);
    } finally {
      setLoading(false);
    }
  };

  const handleForceClearToken = () => {
    localStorage.removeItem('token');
    setToken(null);
    setTokenValid(false);
    setUserData(null);
    setAuthStatus("Token cleared");
  };

  const handleNavigation = (path: string) => {
    window.location.href = path;
  };

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <h1 className="text-3xl font-bold mb-6">Auth Test Page</h1>
      
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-2">Status</h2>
        <p className={`mb-2 ${tokenValid ? 'text-green-600' : tokenValid === false ? 'text-red-600' : 'text-orange-500'}`}>
          {loading ? 'Checking authorization...' : authStatus}
        </p>
        <p className="text-sm mb-4">Token exists: {token ? 'Yes' : 'No'}</p>
        
        {loading && (
          <div className="flex items-center">
            <div className="animate-spin h-5 w-5 border-2 border-blue-500 rounded-full border-t-transparent"></div>
            <span className="ml-2">Checking...</span>
          </div>
        )}
        
        {userData && (
          <div className="bg-white p-3 rounded border mb-4">
            <h3 className="font-medium mb-2">User Data:</h3>
            <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto">
              {JSON.stringify(userData, null, 2)}
            </pre>
          </div>
        )}
        
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={checkAuth}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Refresh Status
          </button>
          <button 
            onClick={handleForceClearToken}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Clear Token
          </button>
        </div>
      </div>
      
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-3">Navigation</h2>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => handleNavigation('/login')}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Go to Login
          </button>
          <button 
            onClick={() => handleNavigation('/dashboard')}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            Go to Dashboard
          </button>
          <button 
            onClick={() => handleNavigation('/')}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Go to Home
          </button>
        </div>
      </div>
      
      <div className="text-sm text-gray-500">
        <p>This is a debug page for troubleshooting authentication issues.</p>
        <p>If you're seeing this page as a regular user, please go to the <a href="/" className="text-blue-500 hover:underline">home page</a>.</p>
      </div>
    </div>
  );
} 