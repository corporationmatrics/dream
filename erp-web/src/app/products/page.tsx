'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AdvancedFilters, { FilterState } from '@/components/AdvancedFilters';
import ProductCard from '@/components/ProductCard';

interface Product {
  id: string;
  name: string;
  price: string;
  stock: number;
  category: string;
  description: string;
  status: string;
  sku: string;
}

interface SearchResponse {
  data: Product[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
  filters: FilterState;
}

// Mock products for demo when API is unavailable
const mockProducts: Product[] = [
  { id: '1', name: 'Laptop Pro', price: '1299.99', stock: 50, category: 'Electronics', description: 'High performance laptop with 16GB RAM', status: 'active', sku: 'SKU001' },
  { id: '2', name: 'Wireless Mouse', price: '49.99', stock: 150, category: 'Accessories', description: 'Ergonomic wireless mouse with long battery life', status: 'active', sku: 'SKU002' },
  { id: '3', name: 'USB-C Hub', price: '79.99', stock: 0, category: 'Electronics', description: '7-in-1 USB-C hub with multiple ports', status: 'inactive', sku: 'SKU003' },
  { id: '4', name: 'Monitor Stand', price: '89.99', stock: 30, category: 'Accessories', description: 'Adjustable monitor stand for ergonomic setup', status: 'active', sku: 'SKU004' },
  { id: '5', name: 'Mechanical Keyboard', price: '159.99', stock: 20, category: 'Electronics', description: 'RGB mechanical keyboard with custom switches', status: 'active', sku: 'SKU005' },
  { id: '6', name: 'Desk Lamp', price: '59.99', stock: 100, category: 'Accessories', description: 'LED desk lamp with adjustable brightness', status: 'active', sku: 'SKU006' },
];

function ProductsContent() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 });
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pages: 1,
  });

  const [filters, setFilters] = useState<FilterState>({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    minPrice: parseInt(searchParams.get('minPrice') || '0'),
    maxPrice: parseInt(searchParams.get('maxPrice') || '1000'),
    inStockOnly: searchParams.get('inStock') === 'true',
    sortBy: (searchParams.get('sort') as FilterState['sortBy']) || 'newest',
  });

  // Fetch products with current filters
  const fetchProducts = useCallback(async (pageNum: number = 1) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: '12',
        search: filters.search,
        category: filters.category,
        minPrice: filters.minPrice.toString(),
        maxPrice: filters.maxPrice.toString(),
        inStockOnly: filters.inStockOnly.toString(),
        sortBy: filters.sortBy,
      });

      const response = await fetch(
        `http://localhost:3002/products/search/advanced?${params}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }

      const data: SearchResponse = await response.json();
      setProducts(data.data);
      setPagination({
        total: data.pagination.total,
        page: data.pagination.page,
        pages: data.pagination.pages,
      });
    } catch (err) {
      console.error('API not available, using sample data:', err);
      // Use mock data when API is not available
      const filtered = mockProducts.filter((p) => {
        const matchesSearch = p.name.toLowerCase().includes(filters.search.toLowerCase()) ||
          p.description.toLowerCase().includes(filters.search.toLowerCase());
        const matchesCategory = !filters.category || p.category === filters.category;
        const price = parseFloat(p.price);
        const matchesPrice = price >= filters.minPrice && price <= filters.maxPrice;
        const matchesStock = !filters.inStockOnly || p.stock > 0;
        return matchesSearch && matchesCategory && matchesPrice && matchesStock;
      });

      setProducts(filtered.slice(0, 12));
      setPagination({
        total: filtered.length,
        page: 1,
        pages: Math.ceil(filtered.length / 12),
      });
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Fetch all products once to get categories and price range
  const fetchMetadata = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:3002/products?limit=1000', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`API returned status ${response.status}`);
      }

      const data = await response.json();
      const productList = Array.isArray(data) ? data : data.data || [];

      // Extract unique categories
      const uniqueCategories = Array.from(
        new Set(productList.map((p: Product) => p.category))
      ) as string[];
      setCategories(uniqueCategories.sort());

      // Calculate price range
      if (productList.length > 0) {
        const prices = productList
          .map((p: Product) => parseFloat(p.price))
          .filter((p: number) => !isNaN(p));
        const minPrice = Math.floor(Math.min(...prices));
        const maxPrice = Math.ceil(Math.max(...prices));
        setPriceRange({ min: minPrice, max: maxPrice });
      }
    } catch (err) {
      console.error('API not available, using sample data:', err);
      // Use mock data when API is not available
      const uniqueCategories = Array.from(
        new Set(mockProducts.map((p: Product) => p.category))
      ) as string[];
      setCategories(uniqueCategories.sort());

      const prices = mockProducts
        .map((p: Product) => parseFloat(p.price))
        .filter((p: number) => !isNaN(p));
      const minPrice = Math.floor(Math.min(...prices));
      const maxPrice = Math.ceil(Math.max(...prices));
      setPriceRange({ min: minPrice, max: maxPrice });
    }
  }, []);

  useEffect(() => {
    fetchMetadata();
  }, [fetchMetadata]);

  useEffect(() => {
    fetchProducts(1);
  }, [filters, fetchProducts]);

  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    setPagination({ ...pagination, page: 1 });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Products</h1>
          <p className="text-gray-600">
            {loading ? 'Loading...' : `${pagination.total} products found`}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar - Filters */}
          <div className="md:col-span-1">
            <AdvancedFilters
              onFiltersChange={handleFiltersChange}
              categories={categories}
              minPriceRange={priceRange.min}
              maxPriceRange={priceRange.max}
              loading={loading}
            />
          </div>

          {/* Main Content - Products Grid */}
          <div className="md:col-span-3">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            {products.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <p className="text-gray-600 text-lg mb-2">🔍 No products found</p>
                <p className="text-gray-500">
                  Try adjusting your filters or search terms
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {products.map((product) => (
                    <ProductCard key={product.id} {...product} />
                  ))}
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className="flex justify-center items-center gap-2">
                    <button
                      onClick={() =>
                        fetchProducts(Math.max(1, pagination.page - 1))
                      }
                      disabled={pagination.page === 1 || loading}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed transition"
                    >
                      Previous
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                        .slice(
                          Math.max(0, pagination.page - 2),
                          Math.min(pagination.pages, pagination.page + 1)
                        )
                        .map((p) => (
                          <button
                            key={p}
                            onClick={() => fetchProducts(p)}
                            className={`px-3 py-2 rounded-lg transition ${
                              pagination.page === p
                                ? 'bg-blue-600 text-white'
                                : 'border border-gray-300 hover:bg-gray-50'
                            } disabled:opacity-50`}
                            disabled={loading}
                          >
                            {p}
                          </button>
                        ))}
                    </div>

                    <button
                      onClick={() =>
                        fetchProducts(
                          Math.min(pagination.pages, pagination.page + 1)
                        )
                      }
                      disabled={pagination.page === pagination.pages || loading}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed transition"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600 text-lg">Loading products...</p>
          </div>
        </div>
      }
    >
      <ProductsContent />
    </Suspense>
  );
}
