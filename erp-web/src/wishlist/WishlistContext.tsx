'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/auth/AuthContext';

interface WishlistContextType {
  wishlistIds: Set<string>;
  isInWishlist: (productId: string) => boolean;
  addToWishlist: (productId: string) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  loadWishlist: () => Promise<void>;
  loading: boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  // Load wishlist when user logs in
  useEffect(() => {
    if (user) {
      loadWishlist();
    } else {
      setWishlistIds(new Set());
    }
  }, [user?.id]);

  const loadWishlist = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      if (!token) return;

      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      try {
        const response = await fetch('http://localhost:3002/wishlist?limit=1000', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          signal: controller.signal,
        });

        if (response.ok) {
          const data = await response.json();
          const ids = new Set<string>(data.data?.map((item: any) => item.productId) || []);
          setWishlistIds(ids);
        } else if (response.status === 404) {
          // Endpoint not yet implemented, silently ignore
          console.debug('Wishlist endpoint not available yet');
        } else {
          console.warn(`Wishlist load returned status: ${response.status}`);
        }
      } finally {
        clearTimeout(timeout);
      }
    } catch (err) {
      // Silently fail for network errors - wishlist is optional
      if (err instanceof Error && err.name === 'AbortError') {
        console.debug('Wishlist load timeout');
      } else {
        console.debug('Wishlist load failed (endpoint may not be implemented yet):', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const isInWishlist = (productId: string): boolean => {
    return wishlistIds.has(productId);
  };

  const addToWishlist = async (productId: string) => {
    if (!user) {
      window.location.href = '/auth/login';
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch(`http://localhost:3002/wishlist/${productId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setWishlistIds(prev => new Set([...prev, productId]));
      } else if (response.status === 404) {
        // Local optimization - add to state even if endpoint not available
        setWishlistIds(prev => new Set([...prev, productId]));
      }
    } catch (err) {
      console.debug('Failed to add to wishlist (endpoint may not be available):', err);
      // Local optimization - add to state anyway
      setWishlistIds(prev => new Set([...prev, productId]));
    }
  };

  const removeFromWishlist = async (productId: string) => {
    if (!user) return;

    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch(`http://localhost:3002/wishlist/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok || response.status === 404) {
        setWishlistIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(productId);
          return newSet;
        });
      }
    } catch (err) {
      console.debug('Failed to remove from wishlist (endpoint may not be available):', err);
      // Local optimization - remove from state anyway
      setWishlistIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlistIds,
        isInWishlist,
        addToWishlist,
        removeFromWishlist,
        loadWishlist,
        loading,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within WishlistProvider');
  }
  return context;
}
