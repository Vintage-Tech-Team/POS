import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async create(companyId: number, data: { name: string; description?: string; parent_id?: number }) {
    const category = this.categoryRepository.create({
      ...data,
      company_id: companyId,
    });
    return this.categoryRepository.save(category);
  }

  async findAll(companyId: number) {
    return this.categoryRepository.find({
      where: { company_id: companyId },
      relations: ['parent', 'children'],
      order: { name: 'ASC' },
    });
  }

  async findOne(id: number, companyId: number) {
    const category = await this.categoryRepository.findOne({
      where: { id, company_id: companyId },
      relations: ['parent', 'children', 'products'],
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async update(id: number, companyId: number, data: { name?: string; description?: string; parent_id?: number }) {
    const category = await this.findOne(id, companyId);
    Object.assign(category, data);
    return this.categoryRepository.save(category);
  }

  async remove(id: number, companyId: number) {
    const category = await this.findOne(id, companyId);
    
    // Check if category has products
    const productsCount = await this.categoryRepository
      .createQueryBuilder('category')
      .leftJoin('category.products', 'product')
      .where('category.id = :id', { id })
      .andWhere('category.company_id = :companyId', { companyId })
      .getCount();

    if (productsCount > 0) {
      throw new Error('Cannot delete category with existing products');
    }

    await this.categoryRepository.remove(category);
    return { message: 'Category deleted successfully' };
  }
}

