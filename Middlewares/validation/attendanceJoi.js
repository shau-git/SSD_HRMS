const Joi = require('joi');
const {StatusCodes} = require("http-status-codes")
const { joiErrorMessage, forbiddenMsg } = require("./utils/errorMessage");
const { DataTypes } = require('sequelize');

// Base schema with all possible fields
const baseAttendanceSchema = {
    start_date_time: Joi.date().iso()
        .messages({
        'date.base': 'Clock in must be a valid date.',
        'date.iso': 'Clock in must be in ISO 8601 format.',
        }),

    end_date_time: Joi.date().iso()
        .messages({
        'date.base': 'Clock in must be a valid date.',
        'date.iso': 'Clock in must be in ISO 8601 format.',
        }),

    is_ot: Joi.boolean().default(false)
        .messages({
        'boolean.base': 'OT status must be true or false.'
        }),
    is_amended: Joi.boolean().default(false)
        .messages({
        'boolean.base': 'Amenment status must be true or false.'
        }),
    remarks: Joi.string().max(40).trim()
        .messages({
        'string.base': 'Remarks must be a string.',
        'string.empty': 'Remarks cannot be empty',
        'string.max': 'Remarks cannot exceed 40 characters.'
        }),
    hours_of_ot: Joi.number().integer().min(0).max(24).default(0)
        .messages({
        'number.base': 'Hours of OT must be a number.',
        'number.integer': 'Hours of OT worked must be an Integer.',
        'number.min': 'Hours of OT worked cannot be negative.',
        'number.max': 'Hours of OT worked cannot be greater than 24 hours.'
        }),
    manager_id: Joi.number().integer().min(1)
        .messages({
        'number.base': 'Manager ID must be a number.',
        'number.min': 'Manager ID cannot be negative.',
        }),

    // Always forbidden fields
    attendance_id: Joi.forbidden()
        .messages({ 'any.unknown': forbiddenMsg('attendance_id') }),
    employee_id: Joi.forbidden()
        .messages({ 'any.unknown': forbiddenMsg('employee_id') }),
    edit_date_time: Joi.forbidden()
        .messages({ 'any.unknown': forbiddenMsg('edit_date_time') }),
    response_date_time: Joi.forbidden()
        .messages({ 'any.unknown': forbiddenMsg('response_date_time') }),
    total_min_work: Joi.forbidden()
        .messages({ 'any.unknown': forbiddenMsg('total_min_work') }),
    total_min_adjusted: Joi.forbidden()
        .messages({ 'any.unknown': forbiddenMsg('total_min_adjusted') }),
    edit_status: Joi.forbidden()
        .messages({ 'any.unknown': forbiddenMsg('edit status') }),
    read: Joi.forbidden()
        .messages({ 'any.unknown': forbiddenMsg('read') }),
    leave_id: Joi.forbidden()
        .messages({ 'any.unknown': forbiddenMsg('leave_id') })
};



// Common validation rules for editing the attendance
const commonRulesEdit = {
  markAttendance: {
    is_amended: Joi.forbidden()
      .messages({ 'any.unknown': forbiddenMsg('ammendment status') }),

    manager_id: Joi.forbidden()
      .messages({ 'any.unknown': forbiddenMsg('manager id') }),

    remarks: Joi.forbidden()
      .messages({ 'any.unknown': forbiddenMsg('remarks') }),

    manager_id: Joi.forbidden()
      .messages({ 'any.unknown': forbiddenMsg('manager id') }),

    ot_req_status: Joi.forbidden()
      .messages({ 'any.unknown': forbiddenMsg('ot_req_status') }),
      
  },

  clockIn: {
    is_ot: Joi.forbidden()
      .messages({ 'any.unknown': forbiddenMsg('OT status') }),
    hours_of_ot: Joi.forbidden()
      .messages({ 'any.unknown': forbiddenMsg('hours of OT') }),
  },

  editAttendance: {

    hours_of_ot: Joi.when('is_ot', {
      is: true,
      then: Joi.number().integer().min(1).max(24).required()
        .messages({
          'number.min': 'OT hours must be at least 1 when OT is true',
          'any.required': 'OT hours are required when OT is true'
        }),
      otherwise: Joi.forbidden()
        .messages({ 'any.unknown': 'OT hours cannot be provided when is_ot is false' })
    }),

    remarks: Joi.required()
      .messages({ 
        'any.required': 'Remarks are required for updates'
       }),

    edit_status : Joi.string().valid( 'APPROVED', 'REJECTED')
        .messages({
            'any.only': "Edit status must be one of: 'APPROVED', 'REJECTED' "
        }),
    ot_req_status : Joi.string().valid( 'APPROVED', 'REJECTED')
        .messages({
            'any.only': "OT request status must be one of: 'APPROVED', 'REJECTED' "
        }),
  }

};



// Operation-specific rules
const operationRules = {
  // POST req
  clockIn: { 
    end_date_time: Joi.forbidden()
      .messages({ 'any.unknown': forbiddenMsg('end_date_time') }),

    is_ot: commonRulesEdit.clockIn.is_ot , //forbidden

    is_amended: commonRulesEdit.markAttendance.is_amended, //forbidden 

    hours_of_ot: commonRulesEdit.clockIn.hours_of_ot, //forbidden

    manager_id: commonRulesEdit.markAttendance.manager_id, //forbidden

    remarks: commonRulesEdit.markAttendance.remarks, //forbidden
    
    ot_req_status: commonRulesEdit.markAttendance.ot_req_status //forbidden
  },
  
  // PUT req
  clockOut: {
    //is_ot is optinal here

    start_date_time: Joi.forbidden()
      .messages({ 'any.unknown': forbiddenMsg('start_date_time') }),

    is_amended: commonRulesEdit.markAttendance.is_amended, //forbidden
    
    hours_of_ot: commonRulesEdit.editAttendance.hours_of_ot,  // depend on ot

    manager_id: commonRulesEdit.markAttendance.manager_id, //forbidden

    remarks: commonRulesEdit.markAttendance.remarks, //forbidden

    ot_req_status: commonRulesEdit.markAttendance.ot_req_status //forbidden
  },
  
  // PUT req for worker (edit attendance)
  editAttendance_W: {

    start_date_time: baseAttendanceSchema.start_date_time.required()
      .messages({ 'any.required': "start_date_time is required" }),

    end_date_time: baseAttendanceSchema.end_date_time.required()
      .messages({ 'any.required': "end_date_time  is required" }),

    //is_ot is optinal here

    hours_of_ot: commonRulesEdit.editAttendance.hours_of_ot, //depend on ot

    remarks: commonRulesEdit.editAttendance.remarks, // required

    is_amended: commonRulesEdit.markAttendance.is_amended, //forbidden

    manager_id: commonRulesEdit.markAttendance.manager_id, //forbidden

    ot_req_status: commonRulesEdit.markAttendance.ot_req_status //forbidden
  },



  // PUT req for Admin (edit attendance)
  editAttendance_E_A: {
    end_date_time: Joi.forbidden()
      .messages({ 'any.unknown': forbiddenMsg('end_date_time') }),

    start_date_time: Joi.forbidden()
      .messages({ 'any.unknown': forbiddenMsg('start_date_time') }),

    is_ot: commonRulesEdit.clockIn.is_ot , //forbidden

    is_amended: commonRulesEdit.markAttendance.is_amended, //forbidden 

    edit_status: commonRulesEdit.editAttendance.edit_status,
    // remarks is optional here

    // manager_id is optional here , but will only works if the role is admin, controller will check

    ot_req_status: commonRulesEdit.markAttendance.ot_req_status //forbidden
  },

  markAsRead: { //16 fir
    read: Joi.boolean().required()
      .messages({
        'boolean.base': 'read status must be true or false.',
        'any.required': 'read status  are required for updates'
    }),

    start_date_time: Joi.forbidden()
      .messages({ 'any.unknown': forbiddenMsg('start_date_time') }),

    end_date_time: Joi.forbidden()
      .messages({ 'any.unknown': forbiddenMsg('end_date_time') }),

    is_ot: commonRulesEdit.clockIn.is_ot , //forbidden

    is_amended: commonRulesEdit.markAttendance.is_amended, //forbidden 

    hours_of_ot: commonRulesEdit.clockIn.hours_of_ot, //forbidden

    manager_id: commonRulesEdit.markAttendance.manager_id, //forbidden

    remarks: commonRulesEdit.markAttendance.remarks, //forbidden
    
    ot_req_status: commonRulesEdit.markAttendance.ot_req_status //forbidden
  },

  responseReqStatus: {

    start_date_time: Joi.forbidden()
      .messages({ 'any.unknown': forbiddenMsg('start_date_time') }),
    end_date_time: Joi.forbidden()
      .messages({ 'any.unknown': forbiddenMsg('end_date_time') }),

    is_ot: commonRulesEdit.clockIn.is_ot , //forbidden

    is_amended: commonRulesEdit.markAttendance.is_amended, //forbidden 

    hours_of_ot: commonRulesEdit.clockIn.hours_of_ot, //forbidden

    remarks: commonRulesEdit.markAttendance.remarks, //forbidden
    
    edit_status: commonRulesEdit.editAttendance.edit_status, //optional

    ot_req_status: commonRulesEdit.editAttendance.ot_req_status, // optional
  }

};


const getAttendanceQuery = Joi.object({
    attendance_id: Joi.number().min(1)
            .messages({
                'number.base': 'attendance_id must be a number',
                'number.min': 'attendance_id cannot be negative',
            }),
    employee_id: Joi.number().min(1)
            .messages({
                'number.base': 'employee_id must be a number',
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
    ot_req_status: Joi.string().valid( 'PENDING', 'APPROVED', 'REJECTED' )
            .messages({
                'any.only': "ot_req_status must be one of: 'PENDING', 'APPROVED', 'REJECTED' "
            }),
    
    edit_status:  Joi.string().valid( 'PENDING', 'APPROVED', 'REJECTED' )
            .messages({
                'any.only': "edit_status must be one of: 'PENDING', 'APPROVED', 'REJECTED' "
            }),
    
    read: Joi.boolean()
      .messages({
        'boolean.base': 'read status must be true or false.',
    })
})


const getEditAttendanceReqQuery = Joi.object({
    manager: Joi.boolean()
        .messages({
            'boolean.base': 'manager must be true or false.',
        }),
})





function validateAttendance(operation = 'create') {
  return (req, res, next) => {

    // Create base schema with all possible attendance fields and default validations
    const baseSchema = Joi.object(baseAttendanceSchema);

    // Get operation-specific validation rules (clockIn, clockOut, or update)
    // Uses empty object if no specific rules exist for the operation
    const operationSchema = operationRules[operation] || {};
    
    // Combine base schema with operation-specific rules:
    //  - For clockIn: make manager_id, total_min_work, and remarks forbidden to change
    //  - For clockOut: makes start_date_time, is_ot, total_min_work, and manager_id forbidden to change
    //  - For update: makes remarks required   
    //    etc
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


const validateGetEditReqQuery = (req, res, next) => {
    const { error } = getEditAttendanceReqQuery.validate(req.query, {
      abortEarly: false,
      allowUnknown: false
    });

    if (error) return res.status(StatusCodes.BAD_REQUEST).json({ error: joiErrorMessage(error) });

    // Pass control to the next middleware or route handler.
    next();
};


module.exports = {
  validateClockInAttendance: validateAttendance('clockIn'),
  validateClockOutAttendance: validateAttendance('clockOut'),
  validateEditAttendance_W: validateAttendance('editAttendance_W'),
  validateEditAttendanceResponse: validateAttendance('responseReqStatus'),
  validateEditAttendance_E_A: validateAttendance('editAttendance_E_A'),
  validateMarkRead: validateAttendance('markAsRead'),
  validateQueryMiddleware,
  validateGetEditReqQuery
};