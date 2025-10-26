import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './entities/customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
  ) {}

  async create(companyId: number, createCustomerDto: CreateCustomerDto) {
    const customer = this.customerRepository.create({
      ...createCustomerDto,
      company_id: companyId,
    });
    return this.customerRepository.save(customer);
  }

  async findAll(companyId: number, search?: string) {
    const query = this.customerRepository
      .createQueryBuilder('customer')
      .where('customer.company_id = :companyId', { companyId });

    if (search) {
      query.andWhere(
        '(customer.name ILIKE :search OR customer.phone ILIKE :search OR customer.email ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    return query.getMany();
  }

  async findOne(id: number, companyId: number) {
    const customer = await this.customerRepository.findOne({
      where: { id, company_id: companyId },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return customer;
  }

  async update(id: number, companyId: number, updateCustomerDto: CreateCustomerDto) {
    const customer = await this.findOne(id, companyId);
    Object.assign(customer, updateCustomerDto);
    return this.customerRepository.save(customer);
  }

  async remove(id: number, companyId: number) {
    const customer = await this.findOne(id, companyId);
    await this.customerRepository.remove(customer);
    return { message: 'Customer deleted successfully' };
  }
}


