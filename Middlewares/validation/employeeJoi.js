const Joi = require("joi")
const {joiErrorMessage} = require("./erroMessage")

// Validation schema for Employee (used for POST/PUT)
const employeeSchema = Joi.object({
    first_name: Joi.string().min(1).max(20).required().messages({
        "string.base": "First Name must be a string",
        "string.empty": "First Name cannot be empty",
        "string.min": "First Name must be at least 1 character long",
        "string.max": "First Name cannot exceed 20 characters",
        "any.required": "First Name is required",
    }),
    last_name: Joi.string().min(1).max(20).required().messages({
        "string.base": "Last Name must be a string",
        "string.empty": "Last Name cannot be empty",
        "string.min": "Last Name must be at least 1 character long",
        "string.max": "Last Name cannot exceed 20 characters",
        "any.required": "Last Name is required",
    }),
    email: Joi.string()
        .email()
        .min(10)
        .max(80)
        .required()
        .pattern(new RegExp(/@company\.com$/)) // Only allow @company.com emails
        .messages({
            'string.base': 'Email must be a string',
            'string.empty': 'Email cannot be empty',
            'string.email': 'Please enter a valid email address',
            'string.min': 'Email must be at least 10 characters long',
            'string.max': 'Email cannot exceed 80 characters',
            'string.pattern.base': 'Only @company.com email addresses are allowed',
            'any.required': 'Email is required'
    }),
    hashed_password: Joi.string() 
        .required()
        //.pattern(/^\$2[aby]\$\d+\$[./0-9A-Za-z]{53}$/)
        .messages({
            'string.base': 'Password must be a string',
            'string.empty': 'Password cannot be empty',     
            //'string.pattern.base': 'Password invalid, make sure the password was hashed',
            'any.required': 'Password is required'
    }),
    is_active: Joi.boolean()
        .default(true)
        .messages({
            'boolean.base': 'is_active must be a boolean',
    }),
    role: Joi.string()
        .required()
        .valid('A', 'W', 'E')
        .messages({
            'string.base': 'Role must be a string',
            'string.empty': 'Role cannot be empty', 
            'any.required': 'Role is required',
            'any.only': "Role must be one of: 'A (for Admin)', 'E (for Employer)' or 'W (for Worker)'"
    }),
    medical_leave: Joi.number()
        .precision(2)
        .min(0)
        .required()
        .messages({
            'number.base': 'Medical Leave must be a number',
            'number.min': 'Medical Leave cannot be negative',
            'any.required': 'Medical Leave is required'
    }),
    annual_leave: Joi.number()
        .precision(2)
        .min(0)
        .required()
        .messages({
            'number.base': 'Annual Leave must be a number',
            'number.min': 'Annual Leave cannot be negative',
            'any.required': 'Annual Leave is required'
    }),
    created_at: Joi.date()
        .iso()
        .optional()
        .messages({
            'date.base': 'Clock in must be a valid date.',
            'date.iso': 'Clock in must be an ISO 8601 date string.'
    }),
    manager_id: Joi.number()
        .integer()
        .min(1)
        .required()
        .messages({
            'number.base': 'Manager ID must be a number',
            'number.integer': 'Manager ID must be an integer',
            'number.min': 'Manager ID must be at least 1',
            'any.required': 'Manager ID is required'
    })
})



// For validating create operations (where employee_id and created_at might be auto-generated)
const createEmployeeSchema = employeeSchema.keys({
    employee_id: Joi.forbidden(), // Not allowed in create
    created_at: Joi.forbidden() // Not allowed in create
});

// For validating update operations
const updateEmployeeSchema = employeeSchema.keys({
    employee_id: Joi.forbidden(), // Not allowed in update
    created_at: Joi.forbidden(), // Not allowed in update
    hashed_password: Joi.string().optional() // Make password optional in updates
});







// Middleware to validate empployee data (for POST)
function validateCreateEmployee(req, res, next) {
    const { error } = createEmployeeSchema.validate(req.body, { abortEarly: false })
    // console.log(Object.keys(error))
    console.log(error)
    console.log("here")
    if(error) {
        return res.status(400).json({error: joiErrorMessage(error)})
    }

    // If validation succeeds, pass control to the next middleware/route handler
    next()
}

// Middleware to validate empployee data (for POST)
function validateUpdateEmployee(req, res, next) {
    const { error } = updateEmployeeSchema.validate(req.body, { abortEarly: false })

    if(error) {
        return res.status(400).json({error: joiErrorMessage(error)})
    }

    // If validation succeeds, pass control to the next middleware/route handler
    next()
}


module.exports = {
    validateCreateEmployee, 
    validateUpdateEmployee,
}
