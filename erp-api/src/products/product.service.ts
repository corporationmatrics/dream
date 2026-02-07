import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Product } from './product.entity';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  async create(productData: Partial<Product>): Promise<Product> {
    const existingSku = await this.productRepository.findOne({
      where: { sku: productData.sku },
    });

    if (existingSku) {
      throw new BadRequestException('Product with this SKU already exists');
    }

    const product = this.productRepository.create(productData);
    return await this.productRepository.save(product);
  }

  async findAll(page: number = 1, limit: number = 10, search?: string) {
    const skip = (page - 1) * limit;
    const query = this.productRepository.createQueryBuilder('product');

    if (search) {
      query.where(
        '(product.name ILIKE :search OR product.sku ILIKE :search OR product.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const [data, total] = await query
      .skip(skip)
      .take(limit)
      .orderBy('product.createdAt', 'DESC')
      .getManyAndCount();

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

  async searchProducts(filters: {
    search?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    inStockOnly?: boolean;
    sortBy?: 'newest' | 'price-asc' | 'price-desc' | 'name-asc';
    page?: number;
    limit?: number;
  }) {
    const {
      search = '',
      category = '',
      minPrice = 0,
      maxPrice = 999999,
      inStockOnly = false,
      sortBy = 'newest',
      page = 1,
      limit = 12,
    } = filters;

    const skip = (page - 1) * limit;
    const query = this.productRepository.createQueryBuilder('product');

    // Text search
    if (search && search.trim()) {
      query.andWhere(
        '(product.name ILIKE :search OR product.sku ILIKE :search OR product.description ILIKE :search)',
        { search: `%${search.trim()}%` },
      );
    }

    // Category filter
    if (category && category.trim()) {
      query.andWhere('product.category = :category', { category: category.trim() });
    }

    // Price range filter
    if (minPrice > 0 || maxPrice < 999999) {
      query.andWhere('CAST(product.price AS NUMERIC) BETWEEN :minPrice AND :maxPrice', {
        minPrice,
        maxPrice,
      });
    }

    // Stock availability
    if (inStockOnly) {
      query.andWhere('product.stock > 0');
    }

    // Sorting
    switch (sortBy) {
      case 'price-asc':
        query.orderBy('CAST(product.price AS NUMERIC)', 'ASC');
        break;
      case 'price-desc':
        query.orderBy('CAST(product.price AS NUMERIC)', 'DESC');
        break;
      case 'name-asc':
        query.orderBy('product.name', 'ASC');
        break;
      case 'newest':
      default:
        query.orderBy('product.createdAt', 'DESC');
    }

    const [data, total] = await query
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
      filters: {
        search,
        category,
        minPrice,
        maxPrice,
        inStockOnly,
        sortBy,
      },
    };
  }

  async findById(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return product;
  }

  async update(id: string, productData: Partial<Product>): Promise<Product> {
    const product = await this.findById(id);

    if (productData.sku && productData.sku !== product.sku) {
      const existingSku = await this.productRepository.findOne({
        where: { sku: productData.sku },
      });
      if (existingSku) {
        throw new BadRequestException('SKU already in use');
      }
    }

    Object.assign(product, productData);
    return await this.productRepository.save(product);
  }

  async delete(id: string): Promise<void> {
    const product = await this.findById(id);
    await this.productRepository.remove(product);
  }

  async updateStock(id: string, quantity: number): Promise<Product> {
    const product = await this.findById(id);
    const newQuantity = product.stock + quantity;

    if (newQuantity < 0) {
      throw new BadRequestException('Insufficient stock');
    }

    product.stock = newQuantity;
    return await this.productRepository.save(product);
  }
}
