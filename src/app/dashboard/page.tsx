'use client';

import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';

export default function DashboardPage() {
  const { user, logout, isLoading, error } = useAuth();

  useEffect(() => {
    // Direct check for authentication status
        if (!isLoading && !user) {
      console.log('Dashboard: No user found, redirecting to login...');
      window.location.href = '/login';
      }
  }, [user, isLoading]);

  const handleLogout = async () => {
    try {
      console.log('Initiating logout...');
      await logout();
      // Explicitly navigate to login after logout
      window.location.href = '/login';
    } catch (err) {
      console.error('Error during logout:', err);
      // Force redirect to login if logout fails
      window.location.href = '/login';
    }
  };

  const handleNavigation = (path: string) => {
    try {
      console.log(`Navigating to ${path}...`);
      window.location.href = path;
    } catch (err) {
      console.error(`Error navigating to ${path}:`, err);
    }
  };

  if (isLoading) {
    console.log('Loading dashboard...');
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-800 via-blue-900 to-blue-950">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  if (error) {
    console.error('Dashboard error:', error);
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-800 via-blue-900 to-blue-950">
        <Card className="w-full max-w-md bg-white/10 backdrop-blur-sm border-white/20 shadow-xl">
          <CardHeader>
            <CardTitle className="text-red-400">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-400">{error}</p>
            <Button 
              className="mt-4 bg-white/20 hover:bg-white/30 text-white border-white/20" 
              onClick={() => window.location.href = '/login'}
            >
              Return to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    console.log('No user found, rendering null...');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-800 via-blue-900 to-blue-950 text-white">
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-white drop-shadow-lg">Welcome, {user.username}!</h1>
          <Button 
            onClick={handleLogout} 
            variant="outline"
            className="bg-white/10 hover:bg-white/20 text-white border-white/20"
          >
          Logout
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 shadow-xl">
          <CardHeader>
              <CardTitle className="text-white">User Information</CardTitle>
          </CardHeader>
            <CardContent className="text-white/90">
            <p>Email: {user.email}</p>
            <p>Role: {user.role}</p>
            <p>Last Login: {user.last_login ? new Date(user.last_login).toLocaleString() : 'Never'}</p>
          </CardContent>
        </Card>

        {user.role === 'admin' && (
          <>
              <Card className="bg-white/10 backdrop-blur-sm border-white/20 shadow-xl">
              <CardHeader>
                  <CardTitle className="text-white">Admin Controls</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                    className="w-full bg-white/20 hover:bg-white/30 text-white border-white/20" 
                  onClick={() => handleNavigation('/admin/users')}
                >
                  Manage Users
                </Button>
                <Button 
                    className="w-full bg-white/10 hover:bg-white/20 text-white border-white/20" 
                  variant="outline" 
                  onClick={() => handleNavigation('/admin/roles')}
                >
                  Manage Roles
                </Button>
                <Button 
                    className="w-full bg-white/10 hover:bg-white/20 text-white border-white/20" 
                  variant="outline" 
                  onClick={() => handleNavigation('/admin/audit-logs')}
                >
                  View Audit Logs
                </Button>
                  <Button 
                    className="w-full bg-white/10 hover:bg-white/20 text-white border-white/20" 
                    variant="outline" 
                    onClick={() => handleNavigation('/documents/process')}
                  >
                    Process Documents
                  </Button>
                  <Button 
                    className="w-full bg-white/10 hover:bg-white/20 text-white border-white/20" 
                    variant="outline" 
                    onClick={() => handleNavigation('/admin/ai-training')}
                  >
                    AI Model Training
                  </Button>
              </CardContent>
            </Card>

              <Card className="bg-white/10 backdrop-blur-sm border-white/20 shadow-xl">
              <CardHeader>
                  <CardTitle className="text-white">System Status</CardTitle>
              </CardHeader>
                <CardContent className="text-white/90">
                <p>Active Users: --</p>
                <p>Total Documents: --</p>
                <p>System Health: Good</p>
              </CardContent>
            </Card>
          </>
        )}

        {user.role === 'user' && (
          <>
              <Card className="bg-white/10 backdrop-blur-sm border-white/20 shadow-xl">
              <CardHeader>
                  <CardTitle className="text-white">Recent Activity</CardTitle>
              </CardHeader>
                <CardContent className="text-white/90">
                <p>No recent activity</p>
              </CardContent>
            </Card>

              <Card className="bg-white/10 backdrop-blur-sm border-white/20 shadow-xl">
              <CardHeader>
                  <CardTitle className="text-white">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                    className="w-full bg-white/20 hover:bg-white/30 text-white border-white/20" 
                  onClick={() => handleNavigation('/documents')}
                >
                  View Documents
                </Button>
                <Button 
                    className="w-full bg-white/10 hover:bg-white/20 text-white border-white/20" 
                  variant="outline" 
                  onClick={() => handleNavigation('/profile')}
                >
                  Edit Profile
                </Button>
              </CardContent>
            </Card>
          </>
        )}
        </div>
      </div>
    </div>
  );
}
