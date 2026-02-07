import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ReviewService } from './review.service';
import { JwtAuthGuard } from '../auth/strategies/jwt.guard';

@Controller('reviews')
export class ReviewController {
  constructor(private reviewService: ReviewService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Request() req: any,
    @Body() body: { productId: string; rating: number; comment?: string },
  ) {
    return this.reviewService.create(
      body.productId,
      req.user.id,
      body.rating,
      body.comment,
    );
  }

  @Get('product/:productId')
  async getByProductId(
    @Param('productId') productId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '5',
  ) {
    return this.reviewService.findByProductId(
      productId,
      parseInt(page),
      parseInt(limit),
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async delete(@Param('id') id: string) {
    return this.reviewService.delete(id);
  }
}
