'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';
import { useCart } from '@/cart/CartContext';
import { useAuth } from '@/auth/AuthContext';
import { useWishlist } from '@/wishlist/WishlistContext';

export default function Navigation() {
  const router = useRouter();
  const pathname = usePathname();
  const { itemCount } = useCart();
  const { user, logout } = useAuth();
  const { wishlistIds } = useWishlist();
  const [isOpen, setIsOpen] = useState(false);

  const isActive = (path: string) => pathname === path;

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="text-2xl font-bold text-blue-600">
            ERP Platform
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/products"
              className={`px-3 py-2 rounded-md ${
                isActive('/products')
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Products
            </Link>
            <Link
              href="/orders"
              className={`px-3 py-2 rounded-md ${
                isActive('/orders')
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              My Orders
            </Link>
            <Link
              href="/profile"
              className={`px-3 py-2 rounded-md ${
                isActive('/profile')
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Profile
            </Link>
            {user?.role === 'admin' && (
              <Link
                href="/admin"
                className={`px-3 py-2 rounded-md ${
                  isActive('/admin')
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Admin
              </Link>
            )}
            <Link
              href="/ocr"
              className={`px-3 py-2 rounded-md ${
                isActive('/ocr') || pathname.startsWith('/ocr/')
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              OCR
            </Link>
            <Link
              href="/wishlist"
              className={`px-3 py-2 rounded-md relative ${
                isActive('/wishlist')
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Wishlist
              {wishlistIds.size > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-pink-600 rounded-full">
                  {wishlistIds.size}
                </span>
              )}
            </Link>
            <Link
              href="/cart"
              className={`px-3 py-2 rounded-md relative ${
                isActive('/cart')
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Cart
              {itemCount > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                  {itemCount}
                </span>
              )}
            </Link>
            {user ? (
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
              >
                Logout
              </button>
            ) : (
              <Link
                href="/auth/login"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:bg-gray-100"
            >
              <span className="sr-only">Open main menu</span>
              <svg
                className="h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              href="/products"
              className={`block px-3 py-2 rounded-md ${
                isActive('/products')
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Products
            </Link>
            <Link
              href="/orders"
              className={`block px-3 py-2 rounded-md ${
                isActive('/orders')
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              My Orders
            </Link>
            <Link
              href="/profile"
              className={`block px-3 py-2 rounded-md ${
                isActive('/profile')
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Profile
            </Link>
            {user?.role === 'admin' && (
              <Link
                href="/admin"
                className={`block px-3 py-2 rounded-md ${
                  isActive('/admin')
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Admin Dashboard
              </Link>
            )}
            <Link
              href="/ocr"
              className={`block px-3 py-2 rounded-md ${
                isActive('/ocr') || pathname.startsWith('/ocr/')
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              OCR Services
            </Link>
            <Link
              href="/wishlist"
              className={`block px-3 py-2 rounded-md relative ${
                isActive('/wishlist')
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Wishlist
              {wishlistIds.size > 0 && (
                <span className="inline-flex items-center justify-center px-2 py-1 ml-2 text-xs font-bold text-white bg-pink-600 rounded-full">
                  {wishlistIds.size}
                </span>
              )}
            </Link>
            <Link
              href="/cart"
              className={`block px-3 py-2 rounded-md relative ${
                isActive('/cart')
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Cart
              {itemCount > 0 && (
                <span className="inline-flex items-center justify-center px-2 py-1 ml-2 text-xs font-bold text-white bg-red-600 rounded-full">
                  {itemCount}
                </span>
              )}
            </Link>
            {user ? (
              <button
                onClick={handleLogout}
                className="block w-full text-left px-3 py-2 rounded-md text-red-600 hover:bg-red-50"
              >
                Logout
              </button>
            ) : (
              <Link
                href="/auth/login"
                className="block px-3 py-2 rounded-md text-blue-600 hover:bg-blue-50"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
