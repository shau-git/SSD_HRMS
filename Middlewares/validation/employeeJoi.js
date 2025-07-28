const Joi = require("joi");
const { joiErrorMessage } = require("./utils/errorMessage");

// Base schema with all common validations
const baseEmployeeSchema = Joi.object({
    first_name: Joi.string().min(1).max(20).trim().messages({
        "string.base": "First Name must be a string",
        "string.empty": "First Name cannot be empty",
        "string.min": "First Name must be at least 1 character long",
        "string.max": "First Name cannot exceed 20 characters",
    }),
    last_name: Joi.string().min(1).max(20).trim().messages({
        "string.base": "Last Name must be a string",
        "string.empty": "Last Name cannot be empty",
        "string.min": "Last Name must be at least 1 character long",
        "string.max": "Last Name cannot exceed 20 characters",
    }),
    email: Joi.string().email().min(10).max(80).trim()
        .pattern(new RegExp(/@company\.com$/))
        .messages({
            'string.email': 'Please enter a valid email address',
            'string.pattern.base': 'Only @company.com email addresses are allowed',
            'string.min': 'Email must be at least 10 characters long',
            'string.max': 'Email cannot exceed 80 characters',
        }),
    hashed_password: Joi.string().min(5).trim()
        .messages({
            'string.min': 'Password must be at least 5 characters long',
            'string.base': 'Password must be a string',
            'string.empty': 'Password cannot be empty',  
    }),
    is_active: Joi.boolean().default(true)
        .messages({
            'boolean.base': 'is_active must be a boolean (true / false)'
        }),
    is_new: Joi.boolean().default(true)
        .messages({
            'boolean.base': 'is_new must be a boolean (true / false)'
        }),
    role: Joi.string().valid('A', 'W', 'E', 'a', 'w', 'e')
        .messages({
            'any.only': "Role must be one of: 'A for Admin', 'E for Employer' or 'W for Worker'"
        }),
    medical_leave: Joi.number().precision(2).min(0)
        .messages({
            'number.base': 'Medical Leave must be a number',
            'number.min': 'Medical Leave cannot be negative',
        }),
    annual_leave: Joi.number().precision(2).min(0)
        .messages({
                'number.base': 'Annual Leave must be a number',
                'number.min': 'Annual Leave cannot be negative',
        }),
    created_at: Joi.date().iso(),
    manager_id: Joi.number().integer().min(1),
    employee_id: Joi.any().forbidden().messages({'any.unknown': 'Changing id is not allowed'}) // Always forbidden in both create/update
});


// Dynamic validation middleware
function validateEmployee(operation = 'create') {
    return (req, res, next) => {
        // Clone base schema to avoid mutation
        const schema = baseEmployeeSchema.keys({
        // Add operation-specific rules
            ...(operation === 'create' && {
                first_name: baseEmployeeSchema.extract('first_name').required()
                .messages({ 'any.required': "First Name is required" }),

                last_name: baseEmployeeSchema.extract('last_name').required()
                .messages({ 'any.required': "Last Name is required" }),

                email: baseEmployeeSchema.extract('email').required()
                .messages({ 'any.required': "Email is required"}),

                hashed_password: baseEmployeeSchema.extract('hashed_password').required()
                .messages({ 'any.required': "Password is required" }),

                role: baseEmployeeSchema.extract('role').required()
                .messages({ 'any.required': "Role is required"}),

                medical_leave: baseEmployeeSchema.extract('medical_leave').required()
                .messages({ 'any.required': "Medical Leave is required" }),

                annual_leave: baseEmployeeSchema.extract('annual_leave').required()
                .messages({ 'any.required': "Annual Leave is required"}),

                manager_id: baseEmployeeSchema.extract('manager_id').required()
                .messages({ 'any.required': "Manager ID is required"}),

                created_at: Joi.forbidden(),
                is_new: Joi.forbidden()
            }),
            ...(operation === 'update' && {
                created_at: Joi.forbidden(),   
                is_new: Joi.forbidden(),     
                hashed_password: baseEmployeeSchema.extract('hashed_password').optional()
            })
        });

        const { error } = schema.validate(req.body, { abortEarly: false });
        
        if (error) {
            return res.status(400).json({ error: joiErrorMessage(error) });
        }
        
        next();
    };
}

module.exports = {
  validateCreateEmployee: validateEmployee('create'),
  validateUpdateEmployee: validateEmployee('update')
};