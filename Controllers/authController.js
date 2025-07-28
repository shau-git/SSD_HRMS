const Employee = require("../Models/employee")
const {StatusCodes} = require("http-status-codes")
const {BadRequestError, UnauthenticatedError, ForbiddenError} = require("../errors/errors")

// POST employee
const register = async(req, res) => {
    console.log(req.body)

    // get the token payload
    const payload = req.employee
    console.log(payload)

    // only Admin can register an account
    if(payload.role !== 'A') {
        throw new ForbiddenError("This side is forbidden")
    }
    // get the email from the req.body
    let newEmployee = req.body

    // Checking if an email already exists in the database
    const duplicateEmail = await Employee.findOne({
        where: { email:  newEmployee.email }
    });
    if (duplicateEmail) {
        throw new BadRequestError(`${newEmployee.email} already exist`)
    }

    // format the first_name & last_name
    newEmployee.first_name = Employee.formatName(newEmployee.first_name)
    newEmployee.last_name = Employee.formatName(newEmployee.last_name)

    // hashing the password, and get the new req.body
    newEmployee  = await Employee.hashPassword(newEmployee)
    console.log('hereeeee', newEmployee)

    // insert employee data to DB
    const employee = await Employee.create(newEmployee)

    // Genrenate JWT token
    const token = employee.createJWT()

    res.status(StatusCodes.CREATED).json({employee, token })

}


const login = async(req, res) => {
    const {email, hashed_password} = req.body
    if(!email || !hashed_password) {
        throw new BadRequestError("Please provide email and password")
    }
    // Validate user credentials
    const employee = await Employee.findOne({
        where: {email}
    })

    if(!employee) {
         throw new BadRequestError("Invalid Credentials")
    }

    // Compare password with hash
    const isPasswordCorrect = await employee.comparePassword(hashed_password)

    if(!isPasswordCorrect) {
         throw new UnauthenticatedError("Password incorrect")
    }

    // Genrenate JWT token
    const token = employee.createJWT()
    const response = {
        employee_id: employee.employee_id, 
        email: employee.email, 
        name: `${employee.last_name}, ${employee.first_name}`,
        role: employee.role
    }

    // if the login in user is a newly ceated account, inform employee to change the password
    if(employee.is_new === true) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
            msg: "Please change your password",
            employee: response ,
            token
        })
    }

    return res.status(StatusCodes.OK).json({employee: response, token})
}
module.exports = {register, login}