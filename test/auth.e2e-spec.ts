import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SignInDTO } from '../src/auth/auth.dto';
import { AppModule } from '../src/app.module';
import { EmployeeRepository } from '../src/employee/employee.repository';
import { CreateEmployeeDTO } from '../src/employee/employee.dto';
import { Role } from '../src/employee/role.enum';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let empRepo: EmployeeRepository;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    empRepo = moduleRef.get<EmployeeRepository>(EmployeeRepository);
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/auth/signin (POST)', async () => {
    const signInDto: SignInDTO = { username: 'test', password: 'Test1234' };
    const createEmployeeDto: CreateEmployeeDTO = {
      ...signInDto,
      role: Role.STAFF,
    };

    await empRepo.createAndSave(createEmployeeDto);
    const loginRes = await request(app.getHttpServer())
      .post('/auth/signin')
      .send(signInDto)
      .expect(200);

    expect(loginRes.body.accessToken).toBeDefined();

    await request(app.getHttpServer())
      .get('/auth/current')
      .set('Authorization', `Bearer ${loginRes.body.accessToken}`)
      .expect(200);
  });

  it('/auth/current (GET)', async () => {
    await request(app.getHttpServer())
      .get('/auth/current')
      .expect(401);
  });
});