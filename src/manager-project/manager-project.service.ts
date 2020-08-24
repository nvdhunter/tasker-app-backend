import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ProjectRepository, EmployeeRepository } from '../database/repository';
import {
  CreateProjectDTO,
  UpdateProjectDTO,
  ManagerProjectStatusDTO,
  ManagerProjectListEntityResponseDTO,
  ManagerProjectListResponseDTO,
  ManagerProjectEntityResponseDTO,
} from './dto';
import { ProjectStatus, Role } from '../database/enum';
import { EmployeeEntity, ProjectEntity } from '../database/entity';
import { AppService } from '../core/app.service';
import { ProjectParamDTO, ManagerParamDTO } from '../shared/dto';
import { ProjectPermission } from '../shared/permission';

@Injectable()
export class ManagerProjectService extends AppService {
  constructor(
    @InjectRepository(EmployeeRepository)
    private empRepo: EmployeeRepository,
    @InjectRepository(ProjectRepository)
    private proRepo: ProjectRepository,
    private projectPermission: ProjectPermission,
  ) {
    super();
  }

  async getAll(
    param: ManagerParamDTO,
    employee: EmployeeEntity,
  ): Promise<ManagerProjectListResponseDTO> {
    const managerWhere = { id: param.managerId, role: Role.MANAGER };
    const manager = await this.empRepo.findOneOrException(managerWhere);

    const can = this.projectPermission.readAll(manager, employee);
    this.canView(can, "Manager's Project");

    const projects = await this.proRepo.find({ where: { manager } });

    return this.transform(ManagerProjectListResponseDTO, {
      data: projects,
      permission: this.projectPermission.getList(manager, employee),
    });
  }

  async create(
    param: ManagerParamDTO,
    createDto: CreateProjectDTO,
    employee: EmployeeEntity,
  ): Promise<ManagerProjectListEntityResponseDTO> {
    const managerWhere = { id: param.managerId, role: Role.MANAGER };
    const manager = await this.empRepo.findOneOrException(managerWhere);

    const can = this.projectPermission.create(manager, employee);
    this.canManage(can, "Manager's Project");

    const project = new ProjectEntity();
    project.title = createDto.title;
    project.body = createDto.body;
    project.status = ProjectStatus.IN_PROGRESS;
    project.manager = manager;

    await this.proRepo.save(project);

    return this.transform(ManagerProjectListEntityResponseDTO, {
      data: project,
    });
  }

  async get(
    param: ProjectParamDTO,
    employee: EmployeeEntity,
  ): Promise<ManagerProjectEntityResponseDTO> {
    const where = { id: param.projectId, manager: { id: param.managerId } };
    const project = await this.proRepo.findOneOrException(where);

    return this.transform(ManagerProjectEntityResponseDTO, {
      data: project,
      permission: this.projectPermission.getEntity(project, employee),
    });
  }

  async update(
    param: ProjectParamDTO,
    updateDto: UpdateProjectDTO,
  ): Promise<ManagerProjectListEntityResponseDTO> {
    const where = { id: param.projectId, manager: { id: param.managerId } };
    const project = await this.proRepo.findOneOrException(where);

    project.title = updateDto.title;
    project.body = updateDto.body;

    await this.proRepo.save(project);

    return this.transform(ManagerProjectListEntityResponseDTO, {
      data: project,
    });
  }

  async updateStatus(
    param: ProjectParamDTO,
    statusDto: ManagerProjectStatusDTO,
  ): Promise<ManagerProjectListEntityResponseDTO> {
    const where = { id: param.projectId, manager: { id: param.managerId } };
    const project = await this.proRepo.findOneOrException(where);
    project.status = statusDto.status;

    await this.proRepo.save(project);

    return this.transform(ManagerProjectListEntityResponseDTO, {
      data: project,
    });
  }

  async delete(param: ProjectParamDTO): Promise<void> {
    const where = { id: param.projectId, manager: { id: param.managerId } };
    const project = await this.proRepo.findOneOrException(where);

    await this.proRepo.remove(project);
  }
}
