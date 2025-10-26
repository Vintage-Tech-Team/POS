import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Warehouse } from './entities/warehouse.entity';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';

@Injectable()
export class WarehousesService {
  constructor(
    @InjectRepository(Warehouse)
    private warehouseRepository: Repository<Warehouse>,
  ) {}

  async create(companyId: number, createWarehouseDto: CreateWarehouseDto) {
    const warehouse = this.warehouseRepository.create({
      ...createWarehouseDto,
      company_id: companyId,
    });
    return this.warehouseRepository.save(warehouse);
  }

  async findAll(companyId: number) {
    return this.warehouseRepository.find({
      where: { company_id: companyId },
    });
  }

  async findOne(id: number, companyId: number) {
    const warehouse = await this.warehouseRepository.findOne({
      where: { id, company_id: companyId },
    });

    if (!warehouse) {
      throw new NotFoundException('Warehouse not found');
    }

    return warehouse;
  }

  async update(id: number, companyId: number, updateWarehouseDto: CreateWarehouseDto) {
    const warehouse = await this.findOne(id, companyId);
    Object.assign(warehouse, updateWarehouseDto);
    return this.warehouseRepository.save(warehouse);
  }

  async remove(id: number, companyId: number) {
    const warehouse = await this.findOne(id, companyId);
    await this.warehouseRepository.remove(warehouse);
    return { message: 'Warehouse deleted successfully' };
  }
}


