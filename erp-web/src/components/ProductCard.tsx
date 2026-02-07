'use client';

import Link from 'next/link';
import { memo } from 'react';
import WishlistButton from './WishlistButton';

interface ProductCardProps {
  id: string;
  name: string;
  price: string;
  stock: number;
  category: string;
  description: string;
}

const ProductCard = memo(function ProductCard({
  id,
  name,
  price,
  stock,
  category,
  description,
}: ProductCardProps) {
  return (
    <Link
      href={`/products/${id}`}
      className="bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden group h-full flex flex-col"
    >
      {/* Image Placeholder */}
      <div className="w-full h-48 bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center group-hover:from-blue-200 group-hover:to-blue-100 transition relative">
        <span className="text-gray-400 text-4xl">📦</span>
        <div className="absolute top-2 right-2">
          <WishlistButton productId={id} variant="icon" className="text-xl" />
        </div>
      </div>

      {/* Content */}
      <div className="p-6 flex-1 flex flex-col">
        {/* Category & Badge */}
        <span className="inline-block text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded mb-2 w-fit">
          {category}
        </span>

        {/* Title */}
        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600">
          {name}
        </h3>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-2 flex-grow">
          {description}
        </p>

        {/* Price & Stock */}
        <div className="flex justify-between items-center">
          <span className="text-2xl font-bold text-blue-600">
            ${parseFloat(price).toFixed(2)}
          </span>

          <span
            className={`text-xs font-semibold px-2 py-1 rounded ${
              stock > 0
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {stock > 0 ? 'In Stock' : 'Out'}
          </span>
        </div>
      </div>
    </Link>
  );
});

export default ProductCard;
