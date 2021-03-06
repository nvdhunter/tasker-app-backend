import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { UpdateType } from '../enum';
import { TaskEntity, CommentEntity, ArtifactEntity } from './';
import { FileEntity } from './file.entity';

@Entity()
export class UpdateEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  body: string;

  @Column()
  type: UpdateType;

  @ManyToOne(
    () => TaskEntity,
    task => task.updates,
    { onDelete: 'CASCADE' },
  )
  task: TaskEntity;

  @OneToMany(
    () => CommentEntity,
    comment => comment.update,
  )
  comments: CommentEntity[];

  @OneToMany(
    () => FileEntity,
    file => file.update,
    { eager: true },
  )
  files: FileEntity[];

  @OneToOne(
    () => ArtifactEntity,
    artifact => artifact.update,
  )
  artifact: ArtifactEntity;
}
