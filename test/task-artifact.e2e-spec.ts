import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { ArtifactRepository } from '../src/database/repository';
import { Role } from '../src/database/enum';
import { AuthHelper, TestHelper, RepoHelper } from './helper';
import {
  CreateArtifactDTO,
  UpdateArtifactDTO,
  AssignUpdateDTO,
  TaskArtifactListDTO,
  TaskArtifactListEntityDTO,
  ArtifactUpdateEntityDTO,
} from '../src/task-artifact/dto';

describe('ProjectTaskController (e2e)', () => {
  let app: INestApplication;
  let artifactRepo: ArtifactRepository;
  let auth: AuthHelper;
  let test: TestHelper;
  let repo: RepoHelper;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    artifactRepo = moduleRef.get<ArtifactRepository>(ArtifactRepository);
    app = moduleRef.createNestApplication();

    auth = new AuthHelper(app);
    test = new TestHelper(app, auth);
    repo = new RepoHelper(app, auth);

    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('test /project/:projectid/task/:taskId/artifact (GET) specs', async () => {
    const [mgtok, manager] = await auth.signUp({ role: Role.MANAGER });

    const project = await repo.createAProject(manager);
    const task = await repo.createATask(project);
    const artifact = await repo.createAnArtifact(task);

    const endpoint = `/project/${project.id}/task/${task.id}/artifact`;

    const res = await request(app.getHttpServer())
      .get(endpoint)
      .set({ Authorization: mgtok });

    // A.1. Return 200 OK on correct getall artifacts request
    expect(res.status).toEqual(200);

    const expected: TaskArtifactListDTO = {
      permission: { create: true },
      data: [
        {
          id: artifact.id,
          description: artifact.description,
          update: null,
        },
      ],
    };

    // A.2. Return the list of artifacts
    expect(res.body.data.length).toBe(1);
    expect(res.body).toEqual(expected);
  });

  it('test /project/:projectid/task/:taskId/artifact (POST) specs', async () => {
    const [mgtok, manager] = await auth.signUp({ role: Role.MANAGER });
    const [mgtok2] = await auth.signUp({ role: Role.MANAGER });
    const [, staff] = await auth.signUp({ role: Role.STAFF });

    const project = await repo.createAProject(manager);
    const task = await repo.createATask(project, staff);

    const endpoint = `/project/${project.id}/task/${task.id}/artifact`;

    const createDto: CreateArtifactDTO = {
      description: 'New Artifact',
    };

    const res = await request(app.getHttpServer())
      .post(endpoint)
      .send(createDto)
      .set({ Authorization: mgtok });

    // A.1. Return 201 Created on correct create an artifact request
    expect(res.status).toEqual(201);

    const expected: TaskArtifactListEntityDTO = {
      data: {
        id: res.body.data.id,
        description: createDto.description,
        update: null,
      },
    };

    // A.2. Return the newly created artifact, and the artifact can be found in db
    expect(res.body).toEqual(expected);
    expect(await artifactRepo.findOne(res.body.data.id)).toMatchObject(
      expected.data,
    );

    const message = "Forbidden when it's not the project manager";
    await test.should(403, message, mgtok2, 'POST', endpoint, createDto);
  });

  it('test /project/:projectid/task/:taskId/artifact/:artifactId (PUT) specs', async () => {
    const [mgtok, manager] = await auth.signUp({ role: Role.MANAGER });
    const [mgtok2] = await auth.signUp({ role: Role.MANAGER });
    const [, staff] = await auth.signUp({ role: Role.STAFF });

    const project = await repo.createAProject(manager);
    const task = await repo.createATask(project, staff);
    const artifact = await repo.createAnArtifact(task);

    const endpoint = `/project/${project.id}/task/${task.id}/artifact/${artifact.id}`;

    const updateDto: UpdateArtifactDTO = {
      description: 'Updated Artifact',
    };

    const res = await request(app.getHttpServer())
      .put(endpoint)
      .send(updateDto)
      .set({ Authorization: mgtok });

    // A.1. Return 200 OK on correct update an artifact request
    expect(res.status).toEqual(200);

    const expected: TaskArtifactListEntityDTO = {
      data: {
        id: artifact.id,
        description: updateDto.description,
        update: null,
      },
    };

    // A.2. Return the updated artifact, and the update can be found in db
    expect(res.body).toEqual(expected);
    expect(await artifactRepo.findOne(artifact.id)).toMatchObject(
      expected.data,
    );

    const message = "Forbidden when it's not the project manager";
    await test.should(403, message, mgtok2, 'PUT', endpoint, updateDto);
  });

  it('test /project/:projectid/task/:taskId/artifact/:artifactId (DELETE) specs', async () => {
    const [mgtok, manager] = await auth.signUp({ role: Role.MANAGER });
    const [mgtok2] = await auth.signUp({ role: Role.MANAGER });
    const [, staff] = await auth.signUp({ role: Role.STAFF });

    const project = await repo.createAProject(manager);
    const task = await repo.createATask(project, staff);
    const artifact = await repo.createAnArtifact(task);

    const endpoint = `/project/${project.id}/task/${task.id}/artifact/${artifact.id}`;

    const message = "Forbidden when it's not the project manager";
    await test.should(403, message, mgtok2, 'DELETE', endpoint);

    const res = await request(app.getHttpServer())
      .delete(endpoint)
      .set({ Authorization: mgtok });

    // A.1. Return 200 OK on correct delete an artifact request
    expect(res.status).toEqual(200);

    // A.2. Deleted artifact should NOT exist in database
    expect(await artifactRepo.findOne(artifact.id)).toBeUndefined();
  });

  it('test /project/:projectid/task/:taskId/artifact/:artifactId/update (PUT) specs', async () => {
    const [mgtok, manager] = await auth.signUp({ role: Role.MANAGER });
    const [mgtok2] = await auth.signUp({ role: Role.MANAGER });
    const [, staff] = await auth.signUp({ role: Role.STAFF });

    const project = await repo.createAProject(manager);
    const task = await repo.createATask(project, staff);
    const artifact = await repo.createAnArtifact(task);
    const update = await repo.createAnUpdate(task);

    const endpoint = `/project/${project.id}/task/${task.id}/artifact/${artifact.id}/update`;

    const assignDto: AssignUpdateDTO = { updateId: update.id };

    const message = "Forbidden when it's not the project manager";
    await test.should(403, message, mgtok2, 'PUT', endpoint, assignDto);

    const res = await request(app.getHttpServer())
      .put(endpoint)
      .send(assignDto)
      .set({ Authorization: mgtok });

    // A.1. Return 200 OK on correct assign update request
    expect(res.status).toEqual(200);

    const expected: ArtifactUpdateEntityDTO = {
      data: {
        id: artifact.id,
        title: update.title,
      },
    };

    // A.2. Return the assigned update, and the assigned update can be found in db
    expect(res.body).toEqual(expected);
    const artifactDB = await artifactRepo.findOne(artifact.id);
    expect(artifactDB.update).toMatchObject(expected.data);
  });

  it('test /project/:projectid/task/:taskId/artifact/:artifactId/update (DELETE) specs', async () => {
    const [mgtok, manager] = await auth.signUp({ role: Role.MANAGER });
    const [mgtok2] = await auth.signUp({ role: Role.MANAGER });
    const [, staff] = await auth.signUp({ role: Role.STAFF });

    const project = await repo.createAProject(manager);
    const task = await repo.createATask(project, staff);
    const artifact = await repo.createAnArtifact(task);
    const update = await repo.createAnUpdate(task);

    await repo.assignUpdate(artifact, update);

    const endpoint = `/project/${project.id}/task/${task.id}/artifact/${artifact.id}/update`;

    const message = "Forbidden when it's not the project manager";
    await test.should(403, message, mgtok2, 'DELETE', endpoint);

    const res = await request(app.getHttpServer())
      .delete(endpoint)
      .set({ Authorization: mgtok });

    // A.1. Return 200 OK on correct remove assigned update request
    expect(res.status).toEqual(200);

    // A.2. Removed asssigned update should NOT exist in database
    const artifactDB = await artifactRepo.findOne(artifact.id);
    expect(artifactDB.update).toBeNull();
  });
});
