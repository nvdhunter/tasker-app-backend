import { EntityResponseDTO } from '../../../shared/dto';
import { TaskUpdateDTO } from './task-update.dto';
import { Type } from 'class-transformer';

export class TaskUpdateListEntityDTO extends EntityResponseDTO<TaskUpdateDTO> {
  @Type(() => TaskUpdateDTO)
  data: TaskUpdateDTO;
}
