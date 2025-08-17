// Import the modules we need for testing
const { register, login } = require('../Controllers/authController');
const Employee = require('../models/employee');
const { getDataWithSGT } = require('../Controllers/utils/convertToSGT');

// Mock the dependencies - this means we're creating fake versions of these modules
jest.mock('../models/employee');
jest.mock('../Controllers/utils/convertToSGT');

describe('Auth Controller Tests', () => {
  // Before each test, we need to reset all mocks to start fresh
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Helper function to create mock request and response objects
  const createMockReqRes = (body = {}, employee = null) => {
    const req = {
      body,
      employee // This comes from the authentication middleware
    };
    
    const res = {
      status: jest.fn().mockReturnThis(), // mockReturnThis() allows chaining like res.status().json()
      json: jest.fn()
    };
    
    return { req, res };
  };

  describe('Register Function', () => {
    // Test case 1: Successful registration by admin
    test('should successfully register new employee when admin makes request', async () => {
      // Arrange (Setup): Prepare all the data we need for the test
      const mockEmployeeData = {
        first_name: 'john',
        last_name: 'doe',
        email: 'john.doe@company.com',
        hashed_password: 'password123',
        role: 'W',
        medical_leave: 14,
        annual_leave: 14,
        manager_id: 1
      };

      const mockAdminPayload = {
        employee_id: 1,
        role: 'A' // Admin role
      };

      const { req, res } = createMockReqRes(mockEmployeeData, mockAdminPayload);

      // Mock the database responses
      Employee.findOne.mockResolvedValue(null); // No duplicate email found
      Employee.formatName.mockImplementation(name => name.charAt(0).toUpperCase() + name.slice(1));
      Employee.hashPassword.mockResolvedValue({ ...mockEmployeeData, hashed_password: 'hashedPassword123' });
      
      const mockCreatedEmployee = {
        employee_id: 2,
        ...mockEmployeeData,
        hashed_password: 'hashedPassword123',
        //createJWT: jest.fn().mockReturnValue('fake-jwt-token')
      };
      
      Employee.create.mockResolvedValue(mockCreatedEmployee);
      getDataWithSGT.mockReturnValue(mockCreatedEmployee);

      // Act (Execute): Run the function we're testing
      await register(req, res);

      // Assert (Verify): Check that everything worked as expected
      expect(Employee.findOne).toHaveBeenCalledWith({
        where: { email: mockEmployeeData.email }
      });
      expect(Employee.formatName).toHaveBeenCalledWith('john');
      expect(Employee.formatName).toHaveBeenCalledWith('doe');
      expect(Employee.hashPassword).toHaveBeenCalled();
      expect(Employee.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        employee: mockCreatedEmployee
      });
    });

    // Test case 2: Non-admin tries to register (should fail)
    test('should throw ForbiddenError when non-admin tries to register', async () => {
      // Arrange
      const mockEmployeeData = {
        first_name: 'john',
        last_name: 'doe',
        email: 'john.doe@company.com'
      };

      const mockWorkerPayload = {
        employee_id: 2,
        role: 'W' // Worker role (not admin)
      };

      const { req, res } = createMockReqRes(mockEmployeeData, mockWorkerPayload);

      // Act & Assert
      await expect(register(req, res)).rejects.toThrow('This side is forbidden');
    });

    // Test case 3: Duplicate email (should fail)
    test('should throw BadRequestError when email already exists', async () => {
      // Arrange
      const mockEmployeeData = {
        email: 'existing@company.com'
      };

      const mockAdminPayload = {
        employee_id: 1,
        role: 'A'
      };

      const { req, res } = createMockReqRes(mockEmployeeData, mockAdminPayload);

      // Mock that email already exists
      Employee.findOne.mockResolvedValue({ email: 'existing@company.com' });

      // Act & Assert
      await expect(register(req, res)).rejects.toThrow('existing@company.com already exist');
    });
  });

  describe('Login Function', () => {
    // Test case 1: Successful login with existing user
    test('should successfully login with valid credentials', async () => {
      // Arrange
      const loginData = {
        email: 'test@company.com',
        hashed_password: 'password123'
      };

      const { req, res } = createMockReqRes(loginData);

      const mockEmployee = {
        employee_id: 1,
        email: 'test@company.com',
        first_name: 'John',
        last_name: 'Doe',
        role: 'W',
        is_new: false,
        comparePassword: jest.fn().mockResolvedValue(true),
        createJWT: jest.fn().mockReturnValue('fake-jwt-token')
      };

      Employee.findOne.mockResolvedValue(mockEmployee);

      // Act
      await login(req, res);

      // Assert
      expect(Employee.findOne).toHaveBeenCalledWith({
        where: { email: loginData.email }
      });
      expect(mockEmployee.comparePassword).toHaveBeenCalledWith(loginData.hashed_password);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        employee: {
          employee_id: 1,
          email: 'test@company.com',
          name: 'Doe, John',
          role: 'W',
          is_new: false
        },
        token: 'fake-jwt-token'
      });
    });

    // Test case 2: Missing email or password
    test('should throw BadRequestError when email or password is missing', async () => {
      // Test missing email
      const { req: reqNoEmail, res: resNoEmail } = createMockReqRes({
        hashed_password: 'password123'
      });

      await expect(login(reqNoEmail, resNoEmail)).rejects.toThrow('Please provide email and password');

      // Test missing password
      const { req: reqNoPassword, res: resNoPassword } = createMockReqRes({
        email: 'test@company.com'
      });

      await expect(login(reqNoPassword, resNoPassword)).rejects.toThrow('Please provide email and password');
    });

    // Test case 3: User not found
    test('should throw UnauthenticatedError when user is not found', async () => {
      // Arrange
      const loginData = {
        email: 'nonexistent@company.com',
        hashed_password: 'password123'
      };

      const { req, res } = createMockReqRes(loginData);
      Employee.findOne.mockResolvedValue(null); // User not found

      // Act & Assert
      await expect(login(req, res)).rejects.toThrow('Invalid Credentials');
    });

    // Test case 4: Wrong password
    test('should throw BadRequestError when password is incorrect', async () => {
      // Arrange
      const loginData = {
        email: 'test@company.com',
        hashed_password: 'wrongpassword'
      };

      const { req, res } = createMockReqRes(loginData);

      const mockEmployee = {
        comparePassword: jest.fn().mockResolvedValue(false) // Password doesn't match
      };

      Employee.findOne.mockResolvedValue(mockEmployee);

      // Act & Assert
      await expect(login(req, res)).rejects.toThrow('Password incorrect');
    });

    // Test case 5: New user needs to change password
    test('should return 401 status when user is new and needs to change password', async () => {
      // Arrange
      const loginData = {
        email: 'newuser@company.com',
        hashed_password: 'password123'
      };

      const { req, res } = createMockReqRes(loginData);

      const mockEmployee = {
        employee_id: 2,
        email: 'newuser@company.com',
        first_name: 'New',
        last_name: 'User',
        role: 'W',
        is_new: true, // This is a new user
        comparePassword: jest.fn().mockResolvedValue(true),
        createJWT: jest.fn().mockReturnValue('fake-jwt-token')
      };

      Employee.findOne.mockResolvedValue(mockEmployee);

      // Act
      await login(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401); // Unauthorized status
      expect(res.json).toHaveBeenCalledWith({
        msg: "Please change your password",
        employee: {
          employee_id: 2,
          email: 'newuser@company.com',
          name: 'User, New',
          role: 'W',
          is_new: true
        },
        token: 'fake-jwt-token'
      });
    });
  });
});