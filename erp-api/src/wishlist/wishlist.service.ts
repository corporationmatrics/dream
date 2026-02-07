import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WishlistItem } from './wishlist.entity';
import { ProductService } from '../products/product.service';

@Injectable()
export class WishlistService {
  constructor(
    @InjectRepository(WishlistItem)
    private wishlistRepository: Repository<WishlistItem>,
    private productService: ProductService,
  ) {}

  async addToWishlist(userId: string, productId: string): Promise<WishlistItem> {
    // Verify product exists
    const product = await this.productService.findById(productId);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Check if already in wishlist
    const existing = await this.wishlistRepository.findOne({
      where: { userId, productId },
    });

    if (existing) {
      throw new BadRequestException('Product already in wishlist');
    }

    const wishlistItem = this.wishlistRepository.create({
      userId,
      productId,
    });

    return await this.wishlistRepository.save(wishlistItem);
  }

  async removeFromWishlist(userId: string, productId: string): Promise<{ message: string }> {
    const result = await this.wishlistRepository.delete({
      userId,
      productId,
    });

    if (result.affected === 0) {
      throw new NotFoundException('Item not found in wishlist');
    }

    return { message: 'Removed from wishlist' };
  }

  async getWishlist(userId: string, page: number = 1, limit: number = 12) {
    const skip = (page - 1) * limit;

    const [data, total] = await this.wishlistRepository.findAndCount({
      where: { userId },
      relations: ['product'],
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
      select: {
        id: true,
        productId: true,
        createdAt: true,
        product: {
          id: true,
          name: true,
          price: true,
          stock: true,
          category: true,
          description: true,
          status: true,
          sku: true,
        },
      },
    });

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async isInWishlist(userId: string, productId: string): Promise<boolean> {
    const item = await this.wishlistRepository.findOne({
      where: { userId, productId },
    });

    return !!item;
  }
}
