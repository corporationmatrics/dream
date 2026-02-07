import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './order.entity';
import { OrderItem } from './order-item.entity';
import { ProductService } from '../products/product.service';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
    private productService: ProductService,
  ) {}

  async create(userId: string, items: Array<{ productId: string; quantity: number }>): Promise<Order> {
    if (!items || items.length === 0) {
      throw new BadRequestException('Order must contain at least one item');
    }

    // Generate order number
    const orderNumber = `ORD-${Date.now()}`;

    // Create order
    const order = this.orderRepository.create({
      orderNumber,
      userId,
      status: 'pending',
    });

    // Add order items
    let subtotal = 0;
    const orderItems: OrderItem[] = [];

    for (const item of items) {
      const product = await this.productService.findById(item.productId);

      if (product.stock < item.quantity) {
        throw new BadRequestException(`Insufficient stock for product ${product.name}`);
      }

      const lineTotal = product.price * item.quantity;
      subtotal += lineTotal;

      const orderItem = this.orderItemRepository.create({
        orderId: order.id,
        productId: product.id,
        quantity: item.quantity,
        unitPrice: product.price,
      });

      orderItems.push(orderItem);
    }

    // Calculate totals
    const taxRate = 0.1; // 10% tax
    const taxAmount = subtotal * taxRate;
    const totalAmount = subtotal + taxAmount;

    order.subtotal = subtotal;
    order.taxAmount = taxAmount;
    order.totalAmount = totalAmount;
    order.items = orderItems;

    // Save order and items
    const savedOrder = await this.orderRepository.save(order);

    // Update product stock
    for (const item of items) {
      await this.productService.updateStock(item.productId, -item.quantity);
    }

    return savedOrder;
  }

  async findById(id: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['items', 'user'],
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return order;
  }

  async findByUserId(userId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [data, total] = await this.orderRepository.findAndCount({
      where: { userId },
      relations: ['items'],
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
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

  async updateStatus(id: string, status: string): Promise<Order> {
    const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

    if (!validStatuses.includes(status)) {
      throw new BadRequestException('Invalid order status');
    }

    const order = await this.findById(id);
    order.status = status;

    return await this.orderRepository.save(order);
  }

  async cancel(id: string): Promise<Order> {
    const order = await this.findById(id);

    if (['shipped', 'delivered', 'cancelled'].includes(order.status)) {
      throw new BadRequestException('Cannot cancel order with current status');
    }

    // Restore stock
    for (const item of order.items) {
      await this.productService.updateStock(item.productId, item.quantity);
    }

    order.status = 'cancelled';
    return await this.orderRepository.save(order);
  }
}
