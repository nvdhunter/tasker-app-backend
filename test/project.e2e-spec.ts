import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { ProjectRepository } from '../src/database/repository';
import {
  CreateProjectDTO,
  UpdateProjectDTO,
  ProjectStatusDTO,
  ProjectEntityResponseDTO,
  ProjectListEntityResponseDTO,
  ProjectListResponseDTO,
} from '../src/project/dto';
import { Role, ProjectStatus } from '../src/database/enum';
import { AuthHelper, TestHelper, RepoHelper } from './helper';

describe('ProjectController (e2e)', () => {
  let app: INestApplication;
  let proRepo: ProjectRepository;
  let auth: AuthHelper;
  let test: TestHelper;
  let repo: RepoHelper;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    proRepo = moduleRef.get<ProjectRepository>(ProjectRepository);
    app = moduleRef.createNestApplication();

    auth = new AuthHelper(app);
    test = new TestHelper(app, auth);
    repo = new RepoHelper(app, auth);

    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('test /project (GET) specs', async () => {
    const [token, manager] = await auth.signUp({ role: Role.MANAGER });

    const project = await repo.createAProject(manager);

    const endpoint = '/project';

    await test.unauthorized('GET', endpoint);

    const res = await request(app.getHttpServer())
      .get(endpoint)
      .set({ Authorization: token })
      .expect(200);

    const expected: ProjectListResponseDTO = {
      data: [
        {
          id: project.id,
          title: project.title,
          body: project.body,
          status: project.status,
          manager: {
            id: project.manager.id,
            username: project.manager.username,
          },
        },
      ],
      permission: { create: true },
    };
    expect(res.body).toEqual(expected);
  });

  it('test /project (POST) specs', async () => {
    const [token, manager] = await auth.signUp({ role: Role.MANAGER });

    const endpoint = '/project';

    const createDto: CreateProjectDTO = {
      title: 'New Project',
      body: 'project body',
    };

    await test.forbidden(Role.STAFF, 'POST', endpoint);

    const res = await request(app.getHttpServer())
      .post(endpoint)
      .send(createDto)
      .set({ Authorization: token })
      .expect(201);

    const expected: ProjectListEntityResponseDTO = {
      data: {
        id: res.body.data.id,
        title: createDto.title,
        body: createDto.body,
        status: ProjectStatus.IN_PROGRESS,
        manager: {
          id: manager.id,
          username: manager.username,
        },
      },
    };

    expect(res.body).toEqual(expected);

    const [projects, count] = await proRepo.findAndCount();
    expect(projects[0]).toMatchObject(expected.data);
    expect(count).toBe(1);
  });

  it('test /project/:id (GET) specs', async () => {
    const [token] = await auth.signUp({ role: Role.STAFF });

    const project = await repo.createAProject();

    const endpoint = '/project/' + project.id;

    await test.unauthorized('GET', endpoint);
    await test.notfound(token, 'GET', endpoint + '99');

    const res = await request(app.getHttpServer())
      .get(endpoint)
      .set({ Authorization: token })
      .expect(200);

    const expected: ProjectEntityResponseDTO = {
      data: {
        id: project.id,
        title: project.title,
        body: project.body,
        status: project.status,
        manager: {
          id: project.manager.id,
          username: project.manager.username,
        },
      },
      permission: { update: false, delete: false },
    };
    expect(res.body).toEqual(expected);
  });

  it('test /project/:id (PUT) specs', async () => {
    const [token] = await auth.signUp({ role: Role.MANAGER });

    const project = await repo.createAProject();

    const endpoint = '/project/' + project.id;

    const updateDto: UpdateProjectDTO = {
      title: 'Project v2',
      body: 'updated project body',
    };

    await test.forbidden(Role.STAFF, 'PUT', endpoint);
    await test.notfound(token, 'PUT', endpoint + '99', updateDto);

    const res = await request(app.getHttpServer())
      .put(endpoint)
      .send(updateDto)
      .set({ Authorization: token })
      .expect(200);

    const expected: ProjectListEntityResponseDTO = {
      data: {
        id: project.id,
        title: updateDto.title,
        body: updateDto.body,
        status: project.status,
        manager: {
          id: project.manager.id,
          username: project.manager.username,
        },
      },
    };
    expect(res.body).toEqual(expected);
  });

  it('test /project/:id/status (PUT) specs', async () => {
    const [token] = await auth.signUp({ role: Role.MANAGER });

    const project = await repo.createAProject();

    const endpoint = '/project/' + project.id + '/status';
    const endpoint404 = '/project/' + '99' + '/status';

    const statusDto: ProjectStatusDTO = {
      status: ProjectStatus.DONE,
    };

    await test.forbidden(Role.STAFF, 'PUT', endpoint);
    await test.notfound(token, 'PUT', endpoint404, statusDto);

    const res = await request(app.getHttpServer())
      .put(endpoint)
      .send(statusDto)
      .set({ Authorization: token })
      .expect(200);

    const expected: ProjectListEntityResponseDTO = {
      data: {
        id: project.id,
        title: project.title,
        body: project.body,
        status: statusDto.status,
        manager: {
          id: project.manager.id,
          username: project.manager.username,
        },
      },
    };
    expect(res.body).toEqual(expected);
  });

  it('test /project/:id (DELETE) specs', async () => {
    const [token] = await auth.signUp({ role: Role.MANAGER });

    const project = await repo.createAProject();

    const endpoint = '/project/' + project.id;

    await test.forbidden(Role.STAFF, 'DELETE', endpoint);
    await test.notfound(token, 'DELETE', endpoint + '99');

    await request(app.getHttpServer())
      .delete(endpoint)
      .set({ Authorization: token })
      .expect(200);

    const deletedProject = await proRepo.findOne(project.id);
    expect(deletedProject).toBeUndefined();
  });
});
