const Joi = require('joi');
const { StatusCodes } = require("http-status-codes")
const { joiErrorMessage, forbiddenMsg } = require("./utils/errorMessage");

// 1. Base schema with essential fields and validations
const baseAttendanceSchema = Joi.object({
  start_date_time: Joi.date().iso()
    .messages({
      'date.base': 'Clock in must be a valid date',
      'date.iso': 'Clock in must be in ISO 8601 format',
      //'any.required': 'Clock in time is required'
    }),

  end_date_time: Joi.date().iso()
    .messages({
      'date.base': 'Clock in must be a valid date',
      'date.iso': 'Clock in must be in ISO 8601 format',
    }),
  is_ot: Joi.boolean().default(false)
    .messages({
      'boolean.base': 'OT status must be true or false'
    }),

  remarks: Joi.string()
      .max(40)
      .messages({
          'string.base': 'Remarks must be a string.',
          'string.max': 'Remarks cannot exceed 40 characters.'
    }),
  total_min_work: Joi.number()
      .integer()
      .min(0)
      .max(1440)
      .messages({
          'number.base': 'Total minutes worked must be a number.',
          'number.integer': 'Total minutes worked must be an Integer.',
          'number.min': 'Total minutes worked cannot be negative.',
          'number.max': 'Total minutes worked cannot be greater than 1440 (24 hours).'
      }),
  manager_id: Joi.number().integer().min(1)
      .messages({
          'number.base': 'Manager ID must be a number',
          'number.min': 'Manager ID cannot be negative',
      }),
});

// 2. Operation-specific rules
function validateAttendance(operation = 'create') {
  return (req, res, next) => {
    const schema = baseAttendanceSchema.keys({
      // Common forbidden fields
      employee_id: Joi.forbidden().messages({}),
      is_amended: Joi.forbidden(),
      edit_date_time: Joi.forbidden(),
      response_date_time: Joi.forbidden(),
      withdraw_date_time: Joi.forbidden(),
      read: Joi.forbidden(),

      // Create-specific rules (POST)
      ...(operation === 'clockIn' && {
        manager_id: Joi.forbidden().messages({}), //allow for admin  (PUT)   //here
        leave_id: Joi.forbidden().messages({}),
        total_min_work: Joi.forbidden().messages({}), 
        end_date_time: Joi.forbidden().messages({}),
        remarks: Joi.forbidden()
          .messages({ 'any.unknown': forbiddenMsg('remarks') })
      }),

      // Update-specific rules (PUT)
      ...(operation === 'update' && {
        remarks: baseAttendanceSchema.extract('remarks').required()
          .messages({ 'any.required': 'Remarks are required for updates' })
      }),

      // for clock out
      ...(operation === 'clockOut' && {
        // did not put end_date_time to required() is because there is a default value in the atrendance model
        start_date_time: Joi.forbidden()
          .messages({ 'any.unknown': forbiddenMsg('start_date_time') }), 
        is_ot: Joi.forbidden()
          .messages({ 'any.unknown': forbiddenMsg('OT') }), 
        total_min_work: Joi.forbidden()
          .messages({ 'any.unknown': forbiddenMsg('total_min_work') }),
        manager_id: Joi.forbidden(), 
      })
    });

    const { error } = schema.validate(req.body, {
      abortEarly: false,
      allowUnknown: false
    });

    if (error) {return res.status(StatusCodes.BAD_REQUEST).json({ error: joiErrorMessage(error) })};
    next();
  };
}

module.exports = {
  validateClockInAttendance: validateAttendance('clockIn'),
  validateUpdateAttendance: validateAttendance('update'),
  validateClockOutAttendance: validateAttendance('clockOut')
};