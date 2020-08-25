import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Put,
  Delete,
} from '@nestjs/common';
import { ProjectTaskService } from './project-task.service';
import { Auth, CurrentEmployee } from '../core/decorator';
import { Role } from '../database/enum';
import {
  CreateTaskDTO,
  UpdateTaskDTO,
  ProjectTaskListDTO,
  ProjectTaskEntityDTO,
  ProjectTaskListEntityDTO,
} from './dto';
import { EmployeeEntity } from '../database/entity';
import { ProjectTaskParamDTO, ProjectTaskListParamDTO } from '../shared/dto';
import { ApiTags } from '@nestjs/swagger';

@Controller('project/:projectId/task')
@ApiTags('Project.Task')
export class ProjectTaskController {
  constructor(private proTaskService: ProjectTaskService) {}

  @Get('/')
  @Auth()
  async getAll(
    @Param() param: ProjectTaskListParamDTO,
    @CurrentEmployee() employee: EmployeeEntity,
  ): Promise<ProjectTaskListDTO> {
    return this.proTaskService.getAll(param, employee);
  }

  @Post('/')
  @Auth(Role.MANAGER)
  async create(
    @Param() param: ProjectTaskListParamDTO,
    @Body() taskDto: CreateTaskDTO,
    @CurrentEmployee() employee: EmployeeEntity,
  ): Promise<ProjectTaskListEntityDTO> {
    return this.proTaskService.create(param, taskDto, employee);
  }

  @Get('/:taskId')
  @Auth()
  async get(
    @Param() param: ProjectTaskParamDTO,
    @CurrentEmployee() employee: EmployeeEntity,
  ): Promise<ProjectTaskEntityDTO> {
    return this.proTaskService.get(param, employee);
  }

  @Put('/:taskId')
  @Auth(Role.MANAGER)
  async update(
    @Param() param: ProjectTaskParamDTO,
    @Body() taskDto: UpdateTaskDTO,
    @CurrentEmployee() employee: EmployeeEntity,
  ): Promise<ProjectTaskListEntityDTO> {
    return this.proTaskService.update(param, taskDto, employee);
  }

  @Delete('/:taskId')
  @Auth(Role.MANAGER)
  async delete(
    @Param() param: ProjectTaskParamDTO,
    @CurrentEmployee() employee: EmployeeEntity,
  ): Promise<void> {
    return this.proTaskService.delete(param, employee);
  }
}
