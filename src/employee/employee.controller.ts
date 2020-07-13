import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  HttpCode,
  Delete,
  SerializeOptions,
} from '@nestjs/common';
import { EmployeeEntity } from '../database/entity';
import { EmployeeService } from './employee.service';
import { Role } from '../database/enum';
import { CreateEmployeeDTO, UpdateEmployeeDTO } from './dto';
import { Auth } from '../core/decorator';

@Controller('employee')
@SerializeOptions({ groups: ['employee'] })
export class EmployeeController {
  constructor(private empService: EmployeeService) {}

  @Get('/')
  @Auth(Role.ADMIN)
  async getAll(): Promise<EmployeeEntity[]> {
    return this.empService.getAll();
  }

  @Post('/')
  @Auth(Role.ADMIN)
  async create(@Body() createDto: CreateEmployeeDTO): Promise<EmployeeEntity> {
    return this.empService.create(createDto);
  }

  @Put('/:id')
  @Auth(Role.ADMIN)
  @HttpCode(200)
  async update(
    @Param('id') id: number,
    @Body() employee: UpdateEmployeeDTO,
  ): Promise<EmployeeEntity> {
    return this.empService.update(id, employee);
  }

  @Delete('/:id')
  @Auth(Role.ADMIN)
  async delete(@Param('id') id: number): Promise<void> {
    return this.empService.delete(id);
  }
}
