// __tests__/employeeController.test.js

const { 
  getAllEmployees, 
  getOneEmployee, 
  updateEmployee, 
  deleteEmployee 
} = require('../Controllers/employeeController');
const Employee = require('../models/employee');
const { getDataWithSGT } = require('../Controllers/utils/convertToSGT');
const { NotFoundError, BadRequestError, ForbiddenError } = require("../errors/errors")

// Mock the dependencies
jest.mock('../models/employee');
jest.mock('../Controllers/utils/convertToSGT');

describe('Employee Controller Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Helper function to create mock request and response objects
  const createMockReqRes = (body = {}, params = {}, query = {}, employee = null) => {
    const req = {
      body,
      params,
      query,
      employee // This comes from authentication middleware
    };
    
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    return { req, res };
  };

  const next = jest.fn();

  describe('getAllEmployees Function', () => {
    // Test case 1: Admin gets all employees
    test('should return all employees when admin makes request', async () => {
      // Arrange
      const mockAdminPayload = {
        employee_id: 1,
        role: 'A'
      };

      const { req, res } = createMockReqRes({}, {}, { is_active: 'true' }, mockAdminPayload);

      const mockEmployees = [
        { employee_id: 1, first_name: 'John', last_name: 'Doe', role: 'A' },
        { employee_id: 2, first_name: 'Jane', last_name: 'Smith', role: 'W' }
      ];

      Employee.findAll.mockResolvedValue(mockEmployees);
      getDataWithSGT.mockReturnValue(mockEmployees);

      // Act
      await getAllEmployees(req, res);

      // Assert
      expect(Employee.findAll).toHaveBeenCalledWith({
        where: { is_active: true },
        is_active: true
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        total: mockEmployees.length,
        employees: mockEmployees
      });
    });

    // Test case 2: Employer gets their employees + themselves
    test('should return employer and their managed employees when employer makes request', async () => {
      // Arrange
      const mockEmployerPayload = {
        employee_id: 2,
        role: 'E'
      };

      const { req, res } = createMockReqRes({}, {}, {}, mockEmployerPayload);

      const mockManagedEmployees = [
        { employee_id: 3, first_name: 'Alice', last_name: 'Johnson', manager_id: 2 }
      ];

      const mockEmployerData = {
        employee_id: 2, 
        first_name: 'Bob', 
        last_name: 'Manager', 
        role: 'E'
      };

      Employee.findAll.mockResolvedValue(mockManagedEmployees);
      Employee.findByPk.mockResolvedValue(mockEmployerData);
      
      // The expected result should have employer data first, then managed employees
      const expectedEmployees = [mockEmployerData, ...mockManagedEmployees];
      getDataWithSGT.mockReturnValue(expectedEmployees);

      // Act
      await getAllEmployees(req, res);

      // Assert
      expect(Employee.findAll).toHaveBeenCalledWith({
        where: { manager_id: 2 },
        is_active: true
      });
      expect(Employee.findByPk).toHaveBeenCalledWith(2);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        total: expectedEmployees.length,
        employees: expectedEmployees
      });
    });

    // Test case 3: Worker gets only their own data
    test('should return only worker data when worker makes request', async () => {
      // Arrange
      const mockWorkerPayload = {
        employee_id: 3,
        role: 'W'
      };

      const { req, res } = createMockReqRes({}, {}, {}, mockWorkerPayload);

      const mockWorkerData = [
        { employee_id: 3, first_name: 'Alice', last_name: 'Johnson', role: 'W' }
      ];

      Employee.findAll.mockResolvedValue(mockWorkerData);
      getDataWithSGT.mockReturnValue(mockWorkerData);

      // Act
      await getAllEmployees(req, res);

      // Assert
      expect(Employee.findAll).toHaveBeenCalledWith({
        where: { employee_id: 3 },
        is_active: true
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        total: mockWorkerData.length,
        employees: mockWorkerData
      });
    });
  });

  describe('getOneEmployee Function', () => {
    // Test case 1: Successfully get one employee
    test('should return employee data when valid ID is provided', async () => {
      // Arrange
      const mockEmployee = {
        employee_id: 1,
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@company.com'
      };

      const mockPayload = {
        employee_id: 1,
        role: 'A'
      };

      const { req, res } = createMockReqRes({}, { employee_id: '1' }, {}, mockPayload);

      Employee.findByPk.mockResolvedValue(mockEmployee);
      getDataWithSGT.mockReturnValue(mockEmployee);

      // Act
      await getOneEmployee(req, res);

      // Assert
      expect(Employee.findByPk).toHaveBeenCalledWith('1');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        total: mockEmployee.length,
        employee: mockEmployee
      });
    });

    // Test case 2: Employee not found
    test('should throw NotFoundError when employee ID does not exist', async () => {
      // Arrange
      const mockPayload = {
        employee_id: 1,
        role: 'A'
      };

      const { req, res } = createMockReqRes({}, { employee_id: '999' }, {}, mockPayload);

      Employee.findByPk.mockResolvedValue(null); // Employee not found

      // Act
      await getOneEmployee(req, res, next); // Call getOneEmployee  , having next is due to asyncWrapper

      // Assert
      expect(next).toHaveBeenCalledWith(new NotFoundError('Employee id not found'));
    });
  });

  describe('updateEmployee Function', () => {
    // Test case 1: Admin updates employee successfully
    test('should successfully update employee when admin makes request', async () => {
      // Arrange
      const updateData = {
        first_name: 'UpdatedName',
        hashed_password: 'newpassword'
      };

      const mockAdminPayload = {
        employee_id: 1,
        role: 'A'
      };

      const { req, res } = createMockReqRes(updateData, { employee_id: '2' }, {}, mockAdminPayload);

      const mockExistingEmployee = {
        employee_id: 2,
        first_name: 'OldName',
        is_new: false
      };

      const mockUpdatedEmployee = {
        employee_id: 2,
        first_name: 'UpdatedName',
        is_new: false
      };

      Employee.findByPk
        .mockResolvedValueOnce(mockExistingEmployee) // First call to check if employee exists
        .mockResolvedValueOnce(mockUpdatedEmployee); // Second call to get updated employee

      Employee.hashPassword.mockResolvedValue({
        hashed_password: 'hashedNewPassword'
      });

      Employee.update.mockResolvedValue([1]); // Indicates one row was updated
      getDataWithSGT.mockReturnValue(mockUpdatedEmployee);

      // Act
      await updateEmployee(req, res);

      // Assert
      expect(Employee.findByPk).toHaveBeenCalledWith('2');
      expect(Employee.hashPassword).toHaveBeenCalledWith(updateData);
      expect(Employee.update).toHaveBeenCalledWith(
        { ...updateData, hashed_password: 'hashedNewPassword' },
        { where: { employee_id: '2' } }
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    // Test case 2: Employee updates their own password
    test('should allow employee to update their own password', async () => {
      // Arrange
      const updateData = {
        hashed_password: 'newpassword123'
      };

      const mockEmployeePayload = {
        employee_id: 2,
        role: 'W'
      };

      const { req, res } = createMockReqRes(updateData, { employee_id: '2' }, {}, mockEmployeePayload);

      const mockExistingEmployee = {
        employee_id: 2,
        is_new: false,
        comparePassword: jest.fn().mockResolvedValue(false) // Password is different
      };

      const mockUpdatedEmployee = {
        employee_id: 2,
        is_new: false
      };

      Employee.findByPk
        .mockResolvedValueOnce(mockExistingEmployee)
        .mockResolvedValueOnce(mockUpdatedEmployee);

      Employee.hashPassword.mockResolvedValue({
        hashed_password: 'hashedNewPassword123'
      });

      Employee.update.mockResolvedValue([1]);
      getDataWithSGT.mockReturnValue(mockUpdatedEmployee);

      // Act
      await updateEmployee(req, res);

      // Assert
      expect(Employee.update).toHaveBeenCalledWith(
        {
          hashed_password: 'hashedNewPassword123',
          is_new: false
        },
        { where: { employee_id: '2' } }
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    // Test case 3: New employee tries to use same password
    test('should throw BadRequestError when new employee uses same password', async () => {
      // Arrange
      const updateData = {
        hashed_password: 'samepassword'
      };

      const mockEmployeePayload = {
        employee_id: 2,
        role: 'W'
      };

      const { req, res } = createMockReqRes(updateData, { employee_id: '2' }, {}, mockEmployeePayload);

      const mockExistingEmployee = {
        employee_id: 2,
        is_new: true, // This is a new employee
        comparePassword: jest.fn().mockResolvedValue(true) // Same password
      };

      Employee.findByPk.mockResolvedValue(mockExistingEmployee);

      // Act & Assert
      await updateEmployee(req, res, next)  // asyncWrapper
      expect(next).toHaveBeenCalledWith(new BadRequestError("Please provied a different password to change"));
    });

    // Test case 4: Employee not found
    test('should throw NotFoundError when employee ID does not exist', async () => {
      // Arrange
      const updateData = { first_name: 'UpdatedName' };
      const mockAdminPayload = { employee_id: 1, role: 'A' };

      const { req, res } = createMockReqRes(updateData, { employee_id: '999' }, {}, mockAdminPayload);

      Employee.findByPk.mockResolvedValue(null);

      // Act & Assert
      await updateEmployee(req, res, next)
      await expect(next).toHaveBeenCalledWith(new NotFoundError('Employee id not found'));
    });

    // Test case 5: Forbidden access (employee trying to update another employee)
    test('should throw ForbiddenError when employee tries to update another employee', async () => {
      // Arrange
      const updateData = { first_name: 'UpdatedName' };
      const mockEmployeePayload = { employee_id: 2, role: 'W' };

      const { req, res } = createMockReqRes(updateData, { employee_id: '3' }, {}, mockEmployeePayload);

      const mockExistingEmployee = { employee_id: 3, is_new: false };
      Employee.findByPk.mockResolvedValue(mockExistingEmployee);

      // Act & Assert
      await updateEmployee(req, res, next)
      await expect(next).toHaveBeenCalledWith(new ForbiddenError("This side is forbidden"));
    });
  });

  describe('deleteEmployee Function', () => {
    // Test case 1: Successfully delete (deactivate) employee
    test('should successfully deactivate employee', async () => {
      // Arrange
      const { req, res } = createMockReqRes({}, { employee_id: '2' });

      Employee.update.mockResolvedValue([1]); // One row affected

      // Act
      await deleteEmployee(req, res);

      // Assert
      expect(Employee.update).toHaveBeenCalledWith(
        { is_active: false },
        { where: { employee_id: '2' } }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        msg: 'Employee with id 2 deleted.'
      });
    });

    // Test case 2: Employee not found
    test('should throw NotFoundError when employee ID does not exist', async () => {
      // Arrange
      const { req, res } = createMockReqRes({}, { employee_id: '999' });

      Employee.update.mockResolvedValue(null); // No rows affected

      // Act & Assert
      await deleteEmployee(req, res, next)
      expect(next).toHaveBeenCalledWith(new NotFoundError(`Employee id not found`));
    });
  });
});