import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { EmployeeRepository } from '../src/database/repository';
import { Role } from '../src/database/enum';
import {
  CreateEmployeeDTO,
  UpdateEmployeeDTO,
  EmployeeResponseDTO,
} from '../src/employee/dto';
import { AuthHelper, TestHelper } from './helper';

describe('EmployeeController (e2e)', () => {
  let app: INestApplication;
  let empRepo: EmployeeRepository;
  let auth: AuthHelper;
  let test: TestHelper;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    empRepo = moduleRef.get<EmployeeRepository>(EmployeeRepository);
    app = moduleRef.createNestApplication();

    auth = new AuthHelper(app);
    test = new TestHelper(app, auth);

    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('returns 401 Unauthorized when not logged in', async () =>
    test.unauthorized('GET', '/employee'));

  describe('/employee (GET)', () => {
    it('returns list of employee', async () => {
      const [token, admin] = await auth.signUp({ role: Role.ADMIN });

      const res = await request(app.getHttpServer())
        .get('/employee')
        .set({ Authorization: token })
        .expect(200);

      const expectted: EmployeeResponseDTO = {
        id: admin.id,
        role: admin.role,
        username: admin.username,
      };

      expect(res.body[0]).toEqual(expectted);
    });

    it('returns 403 Forbidden when not admin', async () =>
      test.forbidden(Role.STAFF, 'GET', '/employee'));
  });

  describe('/employee (POST)', () => {
    it('create new employee', async () => {
      const [token] = await auth.signUp({ role: Role.ADMIN });

      const createDTO: CreateEmployeeDTO = {
        username: 'John',
        password: 'Test1234',
        role: Role.STAFF,
      };
      const res = await request(app.getHttpServer())
        .post('/employee')
        .send(createDTO)
        .set({ Authorization: token })
        .expect(201);

      const expected: EmployeeResponseDTO = {
        id: res.body.id,
        username: createDTO.username,
        role: createDTO.role,
      };

      expect(res.body).toEqual(expected);

      const [employees, count] = await empRepo.findAndCount();
      expect(employees[count - 1]).toMatchObject(expected);
      expect(count).toBe(2);
    });

    it('returns 403 Forbidden when not admin', async () =>
      test.forbidden(Role.STAFF, 'POST', '/employee'));
  });

  describe('/employee/:id (PUT)', () => {
    it('updates the employee', async () => {
      const [token] = await auth.signUp({ role: Role.ADMIN });
      const createDTO: CreateEmployeeDTO = {
        username: 'John',
        password: 'Test1234',
        role: Role.STAFF,
      };
      const employee = await empRepo.save(empRepo.create(createDTO));
      const updateDto: UpdateEmployeeDTO = {
        role: Role.MANAGER,
        username: 'Jane',
      };
      await request(app.getHttpServer())
        .put('/employee/' + employee.id)
        .send(updateDto)
        .set({ Authorization: token })
        .expect(200);

      const updatedEmployee = await empRepo.findOne(employee.id);
      expect(updatedEmployee).toMatchObject(updateDto);
    });

    it('return 404 NotFound when the employee does not exist', async () =>
      test.notfound(Role.ADMIN, 'PUT', '/employee/99999', {
        username: 'Jane',
        role: Role.STAFF,
        password: 'Test1234',
      }));

    it('returns 403 Forbidden when not admin', async () =>
      test.forbidden(Role.STAFF, 'PUT', '/employee/999999'));
  });

  describe('/employee/:id (DELETE)', () => {
    it('deletes the employee', async () => {
      const [token] = await auth.signUp({ role: Role.ADMIN });

      const createDTO: CreateEmployeeDTO = {
        username: 'John',
        password: 'Test1234',
        role: Role.STAFF,
      };
      const employee = await empRepo.save(createDTO);
      await request(app.getHttpServer())
        .delete('/employee/' + employee.id)
        .set({ Authorization: token })
        .expect(200);

      const deletedEmployee = await empRepo.findOne(employee.id);
      expect(deletedEmployee).toBeUndefined();
    });

    it('return 404 NotFound when the employee does not exist', async () =>
      test.notfound(Role.ADMIN, 'DELETE', '/employee/99999'));

    it('returns 403 Forbidden when not admin', async () =>
      test.forbidden(Role.STAFF, 'DELETE', '/employee/999999'));
  });
});
