'use client';

import { AuthProvider } from "@/auth/AuthContext";
import { CartProvider } from "@/cart/CartContext";
import { WishlistProvider } from "@/wishlist/WishlistContext";
import { ErrorNotificationProvider } from "@/components/ErrorNotificationProvider";
import { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          <ErrorNotificationProvider>
            {children}
          </ErrorNotificationProvider>
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  );
}
