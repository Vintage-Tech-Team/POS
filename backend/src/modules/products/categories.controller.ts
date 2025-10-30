import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('categories')
@Controller('categories')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new category' })
  create(
    @CurrentUser() user: any,
    @Body() data: { name: string; description?: string; parent_id?: number },
  ) {
    return this.categoriesService.create(user.companyId, data);
  }

  @Get()
  @ApiOperation({ summary: 'Get all categories' })
  findAll(@CurrentUser() user: any) {
    return this.categoriesService.findAll(user.companyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get category by ID' })
  findOne(@CurrentUser() user: any, @Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.findOne(id, user.companyId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a category' })
  update(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() data: { name?: string; description?: string; parent_id?: number },
  ) {
    return this.categoriesService.update(id, user.companyId, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a category' })
  remove(@CurrentUser() user: any, @Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.remove(id, user.companyId);
  }
}

