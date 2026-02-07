import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { JwtAuthGuard } from '../auth/strategies/jwt.guard';

@Controller('wishlist')
@UseGuards(JwtAuthGuard)
export class WishlistController {
  constructor(private wishlistService: WishlistService) {}

  @Post(':productId')
  @HttpCode(HttpStatus.CREATED)
  async addToWishlist(
    @Request() req: any,
    @Param('productId') productId: string,
  ) {
    return this.wishlistService.addToWishlist(req.user.id, productId);
  }

  @Delete(':productId')
  async removeFromWishlist(
    @Request() req: any,
    @Param('productId') productId: string,
  ) {
    return this.wishlistService.removeFromWishlist(req.user.id, productId);
  }

  @Get()
  async getWishlist(
    @Request() req: any,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '12',
  ) {
    return this.wishlistService.getWishlist(
      req.user.id,
      parseInt(page),
      parseInt(limit),
    );
  }

  @Get('check/:productId')
  async checkWishlist(
    @Request() req: any,
    @Param('productId') productId: string,
  ) {
    const isInWishlist = await this.wishlistService.isInWishlist(
      req.user.id,
      productId,
    );

    return { isInWishlist };
  }
}
