import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, HttpCode, HttpStatus, Request } from '@nestjs/common';
import { OrderService } from './order.service';
import { JwtAuthGuard } from '../auth/strategies/jwt.guard';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrderController {
  constructor(private orderService: OrderService) {}

  @Get()
  async getMyOrders(
    @Request() req: any,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    return this.orderService.findByUserId(req.user.id, parseInt(page), parseInt(limit));
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.orderService.findById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Request() req: any,
    @Body() body: { items: Array<{ productId: string; quantity: number }> },
  ) {
    return this.orderService.create(req.user.id, body.items);
  }

  @Put(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    return this.orderService.updateStatus(id, body.status);
  }

  @Put(':id/cancel')
  async cancel(@Param('id') id: string) {
    return this.orderService.cancel(id);
  }
}
