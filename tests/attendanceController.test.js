// Mock the utility functions that are called on file import
const mockDate = new Date('2025-08-17T08:00:00.000Z');
jest.mock("../Controllers/utils/convertToSGT", () => ({
    ...jest.requireActual("../Controllers/utils/convertToSGT"),
    getCurrentTimeSGT: jest.fn(() => mockDate),
    convertToSGT: jest.fn(() => mockDate),
    getDataWithSGT: jest.fn((data) => data),
    isValidFullISO: jest.fn(() => true),
}));



const {
    getDataWithSGT,
    getCurrentTimeSGT,
    convertToSGT,
    isValidFullISO
} = require("../Controllers/utils/convertToSGT");

const {
    getAllAttendance,
    clockIn,
    clockOut,
    editAttendance_W,
    responseEditAttendanceRequest_E_A,
    deleteAttendance
} = require('../Controllers/attendanceController');

const Attendance = require('../models/attendance');
const Employee = require("../models/employee")
const AttendanceEditRequest = require('../models/attendance_edit_request');
const {
    NotFoundError,
    BadRequestError,
    ForbiddenError
} = require("../errors/errors");



const {
    calculateTotalMinWork,
    calculateTotalAdjustMin
} = require('../Controllers/utils/calculateTotalMin');

const createDateFilter = require("../Controllers/utils/createDateQuery");


// Mock the dependencies
jest.mock('../models/attendance');
jest.mock('../models/attendance_edit_request');
jest.mock('../models/employee');
jest.mock("../Controllers/utils/convertToSGT");
jest.mock('../Controllers/utils/calculateTotalMin');
jest.mock("../Controllers/utils/createDateQuery");



describe('Attendance Controller Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // Helper function to create mock request and response objects
    const createMockReqRes = (body = {}, params = {}, query = {}, employee = {}) => {
        const req = {
            body,
            params,
            query,
            employee
        };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        const next = jest.fn();
        return {
            req,
            res,
            next
        };
    };

    // Mock date for predictable test results
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

    // Mock the utility functions for predictable test results
    convertToSGT.mockReturnValue(mockDate);
    getCurrentTimeSGT.mockReturnValue(mockDate);
    getDataWithSGT.mockImplementation(data => data);
    calculateTotalMinWork.mockReturnValue(480);
    calculateTotalAdjustMin.mockReturnValue(480);
    createDateFilter.mockReturnValue({});
    isValidFullISO.mockReturnValue(true);

    // --- getAllAttendance tests ---
    describe('getAllAttendance Function', () => {
        test('should return all attendance records for an admin', async () => {
            const mockAttendance = [{
                attendance_id: 1,
                start_date_time: '2025-08-17T08:00:00.000Z'
            }];
            Attendance.findAll.mockResolvedValue(mockAttendance);

            const {
                req,
                res,
                next
            } = createMockReqRes({}, {}, { }, {
                role: 'A'
            });

            await getAllAttendance(req, res, next);

            // expect(Attendance.findAll).toHaveBeenCalledWith({
            //     where: {}
            // });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                total: mockAttendance.length,
                attendances: mockAttendance
            });
            
        });

        test('should throw NotFoundError if no attendance records are found', async () => {
            Attendance.findAll.mockResolvedValue([]);
            const {
                req,
                res,
                next
            } = createMockReqRes({}, {}, {}, {
                employee_id: 1,
                role: 'A'
            });

            await getAllAttendance(req, res, next);

            expect(next).toHaveBeenCalledWith(new NotFoundError('Attendance not found!'));
        });
    });

    // --- clockIn tests ---
    describe('clockIn Function', () => {
       test('should successfully clock in an employee', async () => {
            const mockEmployee = {
                employee_id: 2,
                role: 'W'
            };

            // Mock the date string conversion
            const mockDate = new Date('2025-08-17T08:00:00.000Z');
            mockDate.toDateString = () => 'Sun Aug 17 2025';

            // Mock attendance object
            const mockAttendance = {
                dataValues: {
                    attendance_id: 1,
                    employee_id: mockEmployee.employee_id,
                    start_date_time: mockDate,
                    manager_id: 1,
                    day: 'Sun' // This matches what slice(0,3) of 'Sun Aug 17 2025' would return
                },
                toJSON: function() { return this.dataValues }
            };

            // Mock other dependencies
            Employee.findOne.mockResolvedValue({ dataValues: { manager_id: 1 } });
            Attendance.findAll.mockResolvedValue([]);
            Attendance.create.mockResolvedValue(mockAttendance);
            getDataWithSGT.mockImplementation(data => [data.dataValues]);

            const { req, res, next } = createMockReqRes({}, {}, {}, mockEmployee);

            await clockIn(req, res, next);

            // Verify day was calculated correctly
            expect(Attendance.create).toHaveBeenCalledWith(expect.objectContaining({
                day: 'Sun'
            }));
        });
    });

})