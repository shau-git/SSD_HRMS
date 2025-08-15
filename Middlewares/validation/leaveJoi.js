const Joi = require('joi');
const {StatusCodes} = require("http-status-codes")
const { joiErrorMessage, forbiddenMsg } = require("./utils/errorMessage");

// Base schema with all possible fields
const baseLeaveSchema = {
    date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/)
            .message('Date must be in YYYY-MM-DD format without time'),

    type: Joi.string().valid('AL', 'ML')
        .messages({
            'any.only': "Leave type must be one of: 'AL' (for Annual Leave) or 'ML' (for Medical Leave)"
        }),
    leave_remarks: Joi.string().max(40).trim()
        .messages({
            'string.empty': 'Leave remarks cannot be empty',
            'string.base': 'Leave remarks must be a string.',
            'string.max': 'Leave remarks cannot exceed 40 characters.'
        }),
    duration: Joi.string().valid('FULL', 'AM', 'PM')
        .messages({
            'any.only': "Duration must be one of: 'FULL', 'AM', 'PM' "
        }),
    manager_id: Joi.number().integer().min(1)
        .messages({
            'number.base': 'Manager ID must be a number.',
            'number.min': 'Manager ID cannot be negative.',
        }),
    status: Joi.string().valid( 'APPROVED', 'REJECTED')
        .messages({
            'any.only': "Status must be one of:  'APPROVED', 'REJECTED' "
        }),

    // Always forbidden fields
    leave_id: Joi.forbidden()
        .messages({ 'any.unknown': forbiddenMsg('leave_id') }),

    attendance_id: Joi.forbidden()
        .messages({ 'any.unknown': forbiddenMsg('attendance_id') }),

    employee_id: Joi.forbidden()
        .messages({ 'any.unknown': forbiddenMsg('employee_id') }),

    start_date_time: Joi.forbidden()
        .messages({ 'any.unknown': forbiddenMsg('start_date_time') }),

    end_date_time: Joi.forbidden()
        .messages({ 'any.unknown': forbiddenMsg('end_date_time') }),

    day: Joi.forbidden()
        .messages({ 'any.unknown': forbiddenMsg('day') }),

    submit_date_time: Joi.forbidden()
        .messages({ 'any.unknown': forbiddenMsg('submit_date_time') }),

    response_date_time: Joi.forbidden()
        .messages({ 'any.unknown': forbiddenMsg('response_date_time') }),

    withdraw_date_time: Joi.forbidden()
        .messages({ 'any.unknown': forbiddenMsg('withdraw_date_time') }),

    read: Joi.forbidden()
        .messages({ 'any.unknown': forbiddenMsg('read') }),

    read_withdraw: Joi.forbidden()
        .messages({ 'any.unknown': forbiddenMsg('read_withdraw') })
}



// Operation-specific rules
const operationRules = {
    applyLeave: {
        date: baseLeaveSchema.date.required()
            .messages({ 'any.required': "date is required" }),

        type: baseLeaveSchema.type.required()
            .messages({ 'any.required': "type is required" }),

        leave_remarks: baseLeaveSchema.leave_remarks.required()
            .messages({ 'any.required': "Leave remarks is required" }),

        duration: baseLeaveSchema.duration.required()
            .messages({ 'any.required': "duration is required" }),

        manager_id: Joi.forbidden()
            .messages({ 'any.unknown': forbiddenMsg('manager_id') }),

        status:  Joi.forbidden()
            .messages({ 'any.unknown': forbiddenMsg('status') }),

    },

    updateLeave: { ... baseLeaveSchema },

    read: {
        read: Joi.boolean().required()
            .messages({
                'boolean.base': 'Read status must be true or false',
                'any.required': "Read status is required"
            }),
        date: Joi.forbidden()
            .messages({ 'any.unknown': forbiddenMsg('date') }),

        type:Joi.forbidden()
            .messages({ 'any.unknown': forbiddenMsg('type') }),

        leave_remarks: Joi.forbidden()
            .messages({ 'any.unknown': forbiddenMsg('Leave remarks') }), 

        duration: Joi.forbidden()
            .messages({ 'any.unknown': forbiddenMsg('duration') }),

        manager_id: Joi.forbidden()
            .messages({ 'any.unknown': forbiddenMsg('manager_id') }),

        status:  Joi.forbidden()
            .messages({ 'any.unknown': forbiddenMsg('status') }),
    },

    read_withdraw: {
        read_withdraw: Joi.boolean().required()
            .messages({
                'boolean.base': 'read_withdraw status must be true or false',
                'any.required': "read_withdraw status is required"
            }),
        date: Joi.forbidden()
            .messages({ 'any.unknown': forbiddenMsg('date') }),

        type:Joi.forbidden()
            .messages({ 'any.unknown': forbiddenMsg('type') }),

        leave_remarks: Joi.forbidden()
            .messages({ 'any.unknown': forbiddenMsg('Leave remarks') }), 

        duration: Joi.forbidden()
            .messages({ 'any.unknown': forbiddenMsg('duration') }),

        manager_id: Joi.forbidden()
            .messages({ 'any.unknown': forbiddenMsg('manager_id') }),

        status:  Joi.forbidden()
            .messages({ 'any.unknown': forbiddenMsg('status') }),
    },

}



const getAttendanceQuery = Joi.object({
    leave_id: Joi.number().min(1)
            .messages({
                'number.base': 'leave_id must be a number',
                'number.min': 'leave_id cannot be negative',
            }),
    employee_id: Joi.number().min(1)
            .messages({
                'number.base': 'leaemployee_id must be a number',
                'number.min': 'employee_id cannot be negative',
            }),
    year: Joi.number().min(2000)
            .messages({
                'number.base': 'Year must be a number',
                'number.min': 'Year must be greater than 2000',
            }),
    month: Joi.number().min(1).max(12)
            .messages({
                'number.base': 'Month must be a number',
                'number.min': 'Month cannot be negative',
                'number.max': 'Month cannot be greater than 12 (December)',
            }),
    day: Joi.number().min(1).max(31)
            .messages({
                'number.base': 'Day must be a number',
                'number.min': 'Day cannot be negative',
                'number.max': 'Day cannot be greater than 31',
            }),
    manager: Joi.boolean()
            .messages({
                'boolean.base': 'manager must be true or false.',
            }),
    status: Joi.string().valid( 'PENDING', 'APPROVED', 'REJECTED', 'WITHDRAWN' )
            .messages({
                'any.only': "status must be one of: 'PENDING', 'APPROVED', 'REJECTED', 'WITHDRAWN' "
            }),
    
    read: Joi.boolean()
            .messages({
                'boolean.base': 'read status must be true or false.',
            }),

    read_withdraw: Joi.boolean()
            .messages({
                'boolean.base': 'read_withdraw status must be true or false.',
            }),

    type: Joi.string().valid('AL', 'ML')
            .messages({
                'any.only': "Leave type must be one of: 'AL' (for Annual Leave) or 'ML' (for Medical Leave)"
            })
})




function validateLeave(operation = 'applyLeave') {
  return (req, res, next) => {

    // Create base schema with all possible attendance fields and default validations
    const baseSchema = Joi.object(baseLeaveSchema);

    // Get operation-specific validation rules (clockIn, clockOut, or update)
    // Uses empty object if no specific rules exist for the operation
    const operationSchema = operationRules[operation] || {};
    
    // Combine base schema with operation-specific rules:
    //  - For applyLeave: make ( manager_id, status forbidden); (date, type, remarks, duration required)

    const schema = baseSchema.keys(operationSchema);

    const { error } = schema.validate(req.body, {
      abortEarly: false,
      allowUnknown: false
    });

    if (error) return res.status(StatusCodes.BAD_REQUEST).json({ error: joiErrorMessage(error) });
    next();
  };
}


const validateQueryMiddleware = (req, res, next) => {
    const { error } = getAttendanceQuery.validate(req.query, {
      abortEarly: false,
      allowUnknown: false
    });

    if (error) return res.status(StatusCodes.BAD_REQUEST).json({ error: joiErrorMessage(error) });

    // Pass control to the next middleware or route handler.
    next();
};


module.exports = {
    validateApplyLeave: validateLeave('applyLeave'),
    validateUpdateLeave: validateLeave('updateLeave'),
    validateReadStatus: validateLeave('read'),
    validateReadWithdrawStatus: validateLeave('read_withdraw'),
    validateQueryMiddleware
}