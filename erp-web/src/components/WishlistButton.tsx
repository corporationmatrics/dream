'use client';

import { useWishlist } from '@/wishlist/WishlistContext';
import { useState } from 'react';

interface WishlistButtonProps {
  productId: string;
  variant?: 'icon' | 'button';
  className?: string;
}

export default function WishlistButton({
  productId,
  variant = 'icon',
  className = '',
}: WishlistButtonProps) {
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const [isLoading, setIsLoading] = useState(false);

  const inWishlist = isInWishlist(productId);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsLoading(true);
    try {
      if (inWishlist) {
        await removeFromWishlist(productId);
      } else {
        await addToWishlist(productId);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (variant === 'icon') {
    return (
      <button
        onClick={handleToggle}
        disabled={isLoading}
        className={`text-2xl transition-transform hover:scale-110 disabled:opacity-50 ${className}`}
        title={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
      >
        {inWishlist ? '❤️' : '🤍'}
      </button>
    );
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      className={`px-4 py-2 rounded-lg font-medium transition ${
        inWishlist
          ? 'bg-red-100 text-red-700 hover:bg-red-200'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      } disabled:opacity-50 ${className}`}
    >
      {isLoading ? (
        <>⏳ Loading...</>
      ) : inWishlist ? (
        <>❤️ In Wishlist</>
      ) : (
        <>🤍 Add to Wishlist</>
      )}
    </button>
  );
}
