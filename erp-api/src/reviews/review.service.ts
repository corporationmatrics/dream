import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './review.entity';
import { ProductService } from '../products/product.service';

@Injectable()
export class ReviewService {
  constructor(
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>,
    private productService: ProductService,
  ) {}

  async create(
    productId: string,
    userId: string,
    rating: number,
    comment?: string,
  ): Promise<Review> {
    // Validate product exists
    const product = await this.productService.findById(productId);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Validate rating
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new BadRequestException('Rating must be a number between 1 and 5');
    }

    // Check if user already reviewed this product
    const existingReview = await this.reviewRepository.findOne({
      where: { productId, userId },
    });

    if (existingReview) {
      // Update existing review
      existingReview.rating = rating;
      existingReview.comment = comment || '';
      return await this.reviewRepository.save(existingReview);
    }

    // Create new review
    const review = this.reviewRepository.create({
      productId,
      userId,
      rating,
      comment: comment || '',
    });

    return await this.reviewRepository.save(review);
  }

  async findByProductId(productId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [data, total] = await this.reviewRepository.findAndCount({
      where: { productId },
      relations: ['user'],
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
        user: {
          id: true,
          name: true,
        },
      },
    });

    // Calculate average rating for this product
    const allReviews = await this.reviewRepository.find({
      where: { productId },
    });

    const averageRating =
      allReviews.length > 0
        ? (allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length)
        : 0;

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
      averageRating: parseFloat(averageRating.toFixed(2)),
      totalReviews: allReviews.length,
    };
  }

  async delete(id: string): Promise<{ message: string }> {
    const review = await this.reviewRepository.findOne({ where: { id } });
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    await this.reviewRepository.remove(review);
    return { message: 'Review deleted successfully' };
  }
}
