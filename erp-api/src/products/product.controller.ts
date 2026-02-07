import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ProductService } from './product.service';
import { Product } from './product.entity';
import { JwtAuthGuard } from '../auth/strategies/jwt.guard';

@Controller('products')
export class ProductController {
  constructor(private productService: ProductService) {}

  @Get()
  async getAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search?: string,
  ) {
    return this.productService.findAll(parseInt(page), parseInt(limit), search);
  }

  @Get('search/advanced')
  async searchProducts(
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('inStockOnly') inStockOnly?: string,
    @Query('sortBy') sortBy?: 'newest' | 'price-asc' | 'price-desc' | 'name-asc',
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '12',
  ) {
    return this.productService.searchProducts({
      search,
      category,
      minPrice: minPrice ? parseInt(minPrice) : 0,
      maxPrice: maxPrice ? parseInt(maxPrice) : 999999,
      inStockOnly: inStockOnly === 'true',
      sortBy: sortBy || 'newest',
      page: parseInt(page),
      limit: parseInt(limit),
    });
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.productService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() productData: Partial<Product>) {
    return this.productService.create(productData);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async update(@Param('id') id: string, @Body() productData: Partial<Product>) {
    return this.productService.update(id, productData);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string) {
    return this.productService.delete(id);
  }

  @Put(':id/stock')
  @UseGuards(JwtAuthGuard)
  async updateStock(
    @Param('id') id: string,
    @Body() body: { quantity: number },
  ) {
    return this.productService.updateStock(id, body.quantity);
  }
}
