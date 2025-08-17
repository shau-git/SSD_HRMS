// Mock the dependencies
jest.mock('../models/employee');
jest.mock('../models/attendance');
jest.mock('../models/leave');
jest.mock('../Controllers/utils/convertToSGT');
jest.mock('../Controllers/utils/createDateQuery');
jest.mock('../Controllers/utils/updateLeave');
jest.mock('../errors/errors');


const Leave = require('../models/leave');
const { getDataWithSGT} = require('../Controllers/utils/convertToSGT');
const createDateFilter = require('../Controllers/utils/createDateQuery');

const { NotFoundError } = require('../errors/errors');

// Import controller function
const { getAllLeaveHist } = require('../controllers/leaveController');

describe('getAllLeaveHist Tests', () => {
  let req, res;

  beforeEach(() => {
    req = {
      employee: { employee_id: 1, role: 'W' },
      query: {}
    };

    res = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis()
    };

    next = jest.fn()

    jest.clearAllMocks();
    
    NotFoundError.mockImplementation((message) => {
      const error = new Error(message);
      error.name = 'NotFoundError';
      return error;
    });

    getDataWithSGT.mockReturnValue([{ leave_id: 1 }]);
    createDateFilter.mockReturnValue({ between: ['2025-01-01', '2025-12-31'] });
  });
  

  it('should filter by status', async () => {
    req.query.status = 'PENDING';
    Leave.findAll.mockResolvedValue([{ leave_id: 1 }]);

    await getAllLeaveHist(req, res);

    expect(Leave.findAll).toHaveBeenCalledWith({
      where: { employee_id: 1, status: 'PENDING' },
      order: [['start_date_time', 'DESC'], ['leave_id', 'DESC']]
    });
  });


  it('should filter by type', async () => {
    req.query.type = 'AL';
    Leave.findAll.mockResolvedValue([{ leave_id: 1 }]);

    await getAllLeaveHist(req, res);

    expect(Leave.findAll).toHaveBeenCalledWith({
      where: { employee_id: 1, type: 'AL' },
      order: [['start_date_time', 'DESC'], ['leave_id', 'DESC']]
    });
  });


  it('should allow manager to get employee leaves', async () => {
    req.employee = { employee_id: 2, role: 'E' };
    Leave.findAll.mockResolvedValue([{ leave_id: 1 }]);

    await getAllLeaveHist(req, res);

    expect(Leave.findAll).toHaveBeenCalledWith({
      where: { manager_id: 2 },
      order: [['start_date_time', 'DESC'], ['leave_id', 'DESC']]
    });
  });


  it('should allow admin to filter by employee_id', async () => {
    req.employee = { employee_id: 1, role: 'A' };
    req.query.employee_id = '5';
    Leave.findAll.mockResolvedValue([{ leave_id: 1 }]);

    await getAllLeaveHist(req, res);

    expect(Leave.findAll).toHaveBeenCalledWith({
      where: { employee_id: '5' },
      order: [['start_date_time', 'DESC'], ['leave_id', 'DESC']]
    });
  });


  it('should throw NotFoundError when no leaves found', async () => {
    Leave.findAll.mockResolvedValue([]);

    await getAllLeaveHist(req, res, next)

    await expect(next).toHaveBeenCalledWith(new NotFoundError('Leave not found!'));
  });


  it('should ignore invalid status values', async () => {
    req.query.status = 'INVALID';
    Leave.findAll.mockResolvedValue([{ leave_id: 1 }]);

    await getAllLeaveHist(req, res);

    expect(Leave.findAll).toHaveBeenCalledWith({
      where: { employee_id: 1 }, // status not included
      order: [['start_date_time', 'DESC'], ['leave_id', 'DESC']]
    });
  });


  it('should filter by multiple parameters', async () => {
    req.query.status = 'APPROVED';
    req.query.type = 'AL';
    req.query.read = 'true';
    Leave.findAll.mockResolvedValue([{ leave_id: 1 }]);

    await getAllLeaveHist(req, res);

    expect(Leave.findAll).toHaveBeenCalledWith({
      where: { 
        employee_id: 1,
        status: 'APPROVED',
        type: 'AL',
        read: 'true'
      },
      order: [['start_date_time', 'DESC'], ['leave_id', 'DESC']]
    });
  });
});