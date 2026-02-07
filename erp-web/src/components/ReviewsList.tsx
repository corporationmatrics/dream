'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/auth/AuthContext';

interface Review {
  id: string;
  rating: number;
  comment?: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
  };
}

interface ReviewsListProps {
  productId: string;
  onReviewsLoaded?: (averageRating: number, totalReviews: number) => void;
}

export default function ReviewsList({ productId, onReviewsLoaded }: ReviewsListProps) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchReviews();
  }, [productId, page]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `http://localhost:3002/reviews/product/${productId}?page=${page}&limit=5`,
      );

      if (!response.ok) {
        throw new Error('Failed to load reviews');
      }

      const data = await response.json();
      setReviews(data.data);
      setAverageRating(data.averageRating);
      setTotalReviews(data.totalReviews);

      if (onReviewsLoaded) {
        onReviewsLoaded(data.averageRating, data.totalReviews);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewDeleted = () => {
    fetchReviews();
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`text-lg ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  if (loading && reviews.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-bold mb-4">Customer Reviews</h3>

        <div className="flex items-center gap-8 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-4xl font-bold">{averageRating.toFixed(1)}</span>
              <div>
                {renderStars(Math.round(averageRating))}
                <p className="text-sm text-gray-600">
                  {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
                </p>
              </div>
            </div>
          </div>

          {/* Rating Distribution */}
          <div className="flex-1 space-y-2">
            {[5, 4, 3, 2, 1].map((rating) => (
              <div key={rating} className="flex items-center gap-2">
                <span className="text-sm text-gray-600 w-12">{rating}★</span>
                <div className="w-24 h-2 bg-gray-200 rounded overflow-hidden">
                  <div
                    className="h-full bg-yellow-400"
                    style={{
                      width: `${
                        totalReviews > 0
                          ? ((reviews.filter((r) => r.rating === rating).length / totalReviews) * 100)
                          : 0
                      }%`,
                    }}
                  ></div>
                </div>
                <span className="text-xs text-gray-500">
                  {reviews.filter((r) => r.rating === rating).length}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reviews List */}
      {reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-600">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <p className="font-semibold text-gray-900">{review.user.name}</p>
                    {renderStars(review.rating)}
                  </div>
                  <p className="text-xs text-gray-500">
                    {new Date(review.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>

                {/* Delete button for review owner */}
                {user && user.id === review.user.id && (
                  <button
                    onClick={async () => {
                      if (
                        window.confirm('Are you sure you want to delete this review?')
                      ) {
                        try {
                          const token = localStorage.getItem('authToken');
                          const response = await fetch(
                            `http://localhost:3002/reviews/${review.id}`,
                            {
                              method: 'DELETE',
                              headers: {
                                'Authorization': `Bearer ${token}`,
                              },
                            },
                          );

                          if (response.ok) {
                            handleReviewDeleted();
                          }
                        } catch (err) {
                          console.error('Failed to delete review:', err);
                        }
                      }
                    }}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Delete
                  </button>
                )}
              </div>

              {review.comment && (
                <p className="text-gray-700 leading-relaxed">{review.comment}</p>
              )}
            </div>
          ))}

          {/* Pagination */}
          {totalReviews > 5 && (
            <div className="flex justify-center gap-2 mt-6">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={reviews.length < 5}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-600 text-lg">🔍 No reviews yet</p>
          <p className="text-gray-500 text-sm mt-2">
            {user ? 'Be the first to share your thoughts!' : 'Sign in to leave a review'}
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}
