import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Supplier } from './entities/supplier.entity';
import { CreateSupplierDto } from './dto/create-supplier.dto';

@Injectable()
export class SuppliersService {
  constructor(
    @InjectRepository(Supplier)
    private supplierRepository: Repository<Supplier>,
  ) {}

  async create(companyId: number, createSupplierDto: CreateSupplierDto) {
    const supplier = this.supplierRepository.create({
      ...createSupplierDto,
      company_id: companyId,
    });
    return this.supplierRepository.save(supplier);
  }

  async findAll(companyId: number, search?: string) {
    const query = this.supplierRepository
      .createQueryBuilder('supplier')
      .where('supplier.company_id = :companyId', { companyId });

    if (search) {
      query.andWhere(
        '(supplier.name ILIKE :search OR supplier.phone ILIKE :search OR supplier.email ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    return query.getMany();
  }

  async findOne(id: number, companyId: number) {
    const supplier = await this.supplierRepository.findOne({
      where: { id, company_id: companyId },
    });

    if (!supplier) {
      throw new NotFoundException('Supplier not found');
    }

    return supplier;
  }

  async update(id: number, companyId: number, updateSupplierDto: CreateSupplierDto) {
    const supplier = await this.findOne(id, companyId);
    Object.assign(supplier, updateSupplierDto);
    return this.supplierRepository.save(supplier);
  }

  async remove(id: number, companyId: number) {
    const supplier = await this.findOne(id, companyId);
    await this.supplierRepository.remove(supplier);
    return { message: 'Supplier deleted successfully' };
  }
}


