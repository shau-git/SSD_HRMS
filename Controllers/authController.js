const Employee = require("../Models/employee")
const {StatusCodes} = require("http-status-codes")
const {BadRequestError, UnauthenticatedError} = require("../errors/errors")

const register = async(req, res) => {
    console.log(req.body)

    // get the email from the req.body
    const newEmployee = req.body

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
    console.log(req.body.first_name)

    // insert employee data to DB
    const employee = await Employee.create(newEmployee)
    console.log(employee)

    // creating a payload for token
    const employeeReponse = {
        employee_id: employee.employee_id, 
        email: employee.email, 
        name: `${employee.last_name}, ${employee.first_name}`
    }

    // Genrenate JWT token
    const token = employee.createJWT()

    res.status(StatusCodes.CREATED).json({employee: employeeReponse, token })
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
    const isPasswordCorrect = employee.comparePassword(hashed_password)
    if(!isPasswordCorrect) {
        throw new UnauthenticatedError("Invalid Crendentials")
    }

    // Genrenate JWT token
    const token = employee.createJWT()

    return res.status(StatusCodes.OK).json({employee:{email: employee.email}, token})
}
module.exports = {register, login}