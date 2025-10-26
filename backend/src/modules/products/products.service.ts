import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import * as bwipjs from 'bwip-js';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  async create(companyId: number, createProductDto: CreateProductDto) {
    // Check if SKU exists
    const existingSku = await this.productRepository.findOne({
      where: { sku: createProductDto.sku, company_id: companyId },
    });
    if (existingSku) {
      throw new ConflictException('SKU already exists');
    }

    // Generate barcode if not provided
    let barcode = createProductDto.barcode;
    if (!barcode) {
      barcode = this.generateBarcodeNumber();
    }

    // Check if barcode exists
    const existingBarcode = await this.productRepository.findOne({
      where: { barcode },
    });
    if (existingBarcode) {
      throw new ConflictException('Barcode already exists');
    }

    const product = this.productRepository.create({
      ...createProductDto,
      barcode,
      company_id: companyId,
    });

    return this.productRepository.save(product);
  }

  async findAll(
    companyId: number,
    search?: string,
    categoryId?: number,
    page: number = 1,
    limit: number = 50,
  ) {
    const where: any = { company_id: companyId };

    if (search) {
      const searchPattern = `%${search}%`;
      const [products, total] = await this.productRepository
        .createQueryBuilder('product')
        .where('product.company_id = :companyId', { companyId })
        .andWhere(
          '(product.name ILIKE :search OR product.sku ILIKE :search OR product.barcode ILIKE :search)',
          { search: searchPattern },
        )
        .skip((page - 1) * limit)
        .take(limit)
        .getManyAndCount();

      return {
        data: products,
        total,
        page,
        lastPage: Math.ceil(total / limit),
      };
    }

    if (categoryId) {
      where.category_id = categoryId;
    }

    const [products, total] = await this.productRepository.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      relations: ['category'],
    });

    return {
      data: products,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  async findOne(id: number, companyId: number) {
    const product = await this.productRepository.findOne({
      where: { id, company_id: companyId },
      relations: ['category'],
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async findByBarcode(barcode: string, companyId: number) {
    const product = await this.productRepository.findOne({
      where: { barcode, company_id: companyId },
      relations: ['category'],
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async update(id: number, companyId: number, updateProductDto: UpdateProductDto) {
    const product = await this.findOne(id, companyId);

    // Check if SKU exists for another product
    if (updateProductDto.sku && updateProductDto.sku !== product.sku) {
      const existingSku = await this.productRepository.findOne({
        where: { sku: updateProductDto.sku, company_id: companyId },
      });
      if (existingSku && existingSku.id !== id) {
        throw new ConflictException('SKU already exists');
      }
    }

    // Check if barcode exists for another product
    if (updateProductDto.barcode && updateProductDto.barcode !== product.barcode) {
      const existingBarcode = await this.productRepository.findOne({
        where: { barcode: updateProductDto.barcode },
      });
      if (existingBarcode && existingBarcode.id !== id) {
        throw new ConflictException('Barcode already exists');
      }
    }

    Object.assign(product, updateProductDto);
    return this.productRepository.save(product);
  }

  async remove(id: number, companyId: number) {
    const product = await this.findOne(id, companyId);
    await this.productRepository.remove(product);
    return { message: 'Product deleted successfully' };
  }

  async generateBarcodeImage(text: string, format: 'png' | 'svg' = 'png') {
    try {
      const buffer = await bwipjs.toBuffer({
        bcid: 'code128',
        text: text,
        scale: 3,
        height: 10,
        includetext: true,
        textxalign: 'center',
      });

      return {
        format,
        data: buffer.toString('base64'),
      };
    } catch (error) {
      throw new Error('Failed to generate barcode');
    }
  }

  private generateBarcodeNumber(): string {
    // Generate a random 12-digit EAN-13 compatible barcode
    const timestamp = Date.now().toString().slice(-11);
    const random = Math.floor(Math.random() * 10);
    return timestamp + random;
  }

  async getLowStockProducts(companyId: number) {
    return this.productRepository
      .createQueryBuilder('product')
      .where('product.company_id = :companyId', { companyId })
      .andWhere('product.stock_quantity <= product.reorder_level')
      .andWhere('product.reorder_level > 0')
      .getMany();
  }
}


