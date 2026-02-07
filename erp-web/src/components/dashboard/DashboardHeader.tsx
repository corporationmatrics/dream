'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/auth/AuthContext';
import Link from 'next/link';

export function DashboardHeader() {
  const { user, logout } = useAuth();

  return (
    <div className="border-b bg-white sticky top-0 z-40">
      <div className="flex items-center justify-between p-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900">ERP Platform</h1>
          <Badge variant="default">Dashboard</Badge>
        </div>
        <div className="flex items-center gap-4">
          {user && (
            <>
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
              <Button variant="outline" asChild>
                <Link href="/profile">Profile</Link>
              </Button>
              <Button variant="destructive" onClick={logout}>
                Logout
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
