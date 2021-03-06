import { Module } from '@nestjs/common';
import { ProjectTaskController } from './project-task.controller';
import { ProjectTaskService } from './project-task.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import {
  EmployeeRepository,
  ProjectRepository,
  TaskRepository,
} from '../database/repository';
import { TaskPermission } from '../shared/permission';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProjectRepository]),
    TypeOrmModule.forFeature([TaskRepository]),
    TypeOrmModule.forFeature([EmployeeRepository]),
    AuthModule,
  ],
  controllers: [ProjectTaskController],
  providers: [TaskPermission, ProjectTaskService],
})
export class ProjectTaskModule {}
