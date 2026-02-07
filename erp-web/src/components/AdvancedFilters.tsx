'use client';

import { useState, useCallback, useMemo } from 'react';

interface AdvancedFiltersProps {
  onFiltersChange: (filters: FilterState) => void;
  categories: string[];
  minPriceRange: number;
  maxPriceRange: number;
  loading?: boolean;
}

export interface FilterState {
  search: string;
  category: string;
  minPrice: number;
  maxPrice: number;
  inStockOnly: boolean;
  sortBy: 'newest' | 'price-asc' | 'price-desc' | 'name-asc';
}

export default function AdvancedFilters({
  onFiltersChange,
  categories,
  minPriceRange,
  maxPriceRange,
  loading = false,
}: AdvancedFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    category: '',
    minPrice: minPriceRange,
    maxPrice: maxPriceRange,
    inStockOnly: false,
    sortBy: 'newest',
  });

  const [searchInput, setSearchInput] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  // Debounced search
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchInput(value);
      const newFilters = { ...filters, search: value };
      setFilters(newFilters);
      onFiltersChange(newFilters);
    },
    [filters, onFiltersChange]
  );

  const handleFilterChange = useCallback(
    (newFilter: Partial<FilterState>) => {
      const updatedFilters = { ...filters, ...newFilter };
      setFilters(updatedFilters);
      onFiltersChange(updatedFilters);
    },
    [filters, onFiltersChange]
  );

  const handleReset = useCallback(() => {
    const resetFilters: FilterState = {
      search: '',
      category: '',
      minPrice: minPriceRange,
      maxPrice: maxPriceRange,
      inStockOnly: false,
      sortBy: 'newest',
    };
    setFilters(resetFilters);
    setSearchInput('');
    onFiltersChange(resetFilters);
  }, [minPriceRange, maxPriceRange, onFiltersChange]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.category) count++;
    if (filters.minPrice > minPriceRange) count++;
    if (filters.maxPrice < maxPriceRange) count++;
    if (filters.inStockOnly) count++;
    if (filters.sortBy !== 'newest') count++;
    return count;
  }, [filters, minPriceRange, maxPriceRange]);

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div
        className="p-6 cursor-pointer md:cursor-default flex justify-between items-center md:block"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div>
          <h3 className="text-lg font-bold flex items-center gap-2">
            🔍 Filters
            {activeFilterCount > 0 && (
              <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                {activeFilterCount}
              </span>
            )}
          </h3>
        </div>
        <button className="md:hidden text-gray-600">
          {isExpanded ? '▼' : '▶'}
        </button>
      </div>

      {/* Filters Content */}
      <div
        className={`${isExpanded ? 'block' : 'hidden'} md:block border-t md:border-t-0`}
      >
        <div className="p-6 space-y-6">
          {/* Search */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Search
            </label>
            <input
              type="text"
              placeholder="Product name, SKU..."
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Category
            </label>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange({ category: e.target.value })}
              disabled={loading}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Price Range */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-4">
              Price Range: ${filters.minPrice} - ${filters.maxPrice}
            </label>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-600">Min Price</label>
                <input
                  type="range"
                  min={minPriceRange}
                  max={maxPriceRange}
                  value={filters.minPrice}
                  onChange={(e) =>
                    handleFilterChange({ minPrice: parseInt(e.target.value) })
                  }
                  disabled={loading}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600">Max Price</label>
                <input
                  type="range"
                  min={minPriceRange}
                  max={maxPriceRange}
                  value={filters.maxPrice}
                  onChange={(e) =>
                    handleFilterChange({ maxPrice: parseInt(e.target.value) })
                  }
                  disabled={loading}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Stock Status */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.inStockOnly}
                onChange={(e) =>
                  handleFilterChange({ inStockOnly: e.target.checked })
                }
                disabled={loading}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm font-medium text-gray-700">
                ✓ In Stock Only
              </span>
            </label>
          </div>

          {/* Sort */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Sort By
            </label>
            <select
              value={filters.sortBy}
              onChange={(e) =>
                handleFilterChange({
                  sortBy: e.target.value as FilterState['sortBy'],
                })
              }
              disabled={loading}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
            >
              <option value="newest">Newest First</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name-asc">Name: A to Z</option>
            </select>
          </div>

          {/* Reset Button */}
          {activeFilterCount > 0 && (
            <button
              onClick={handleReset}
              disabled={loading}
              className="w-full py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium disabled:opacity-50"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
