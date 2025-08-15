const {StatusCodes} = require("http-status-codes")
const Employee = require("../../models/employee")
const {NotFoundError} = require("../../errors/errors")

// Check if the user login to the account first time
const is_new = async(req, res, next) => {

    const payload = req.employee

    const employee = await Employee.findByPk(payload.employee_id)

    if(!employee) {
        throw new NotFoundError(`Employee ID not Found`)
    }
    //console.log(employee)

    const response = {
        employee_id: employee.employee_id, 
        email: employee.email, 
        name: `${employee.last_name}, ${employee.first_name}`,
        role: employee.role
    }
    // if user/employee login to account first time, inform them to change password
    if(employee.is_new === true) {
        return res.status(StatusCodes.FORBIDDEN).json({
            error: "Please change your password",
            employee: response ,
        })
    }

    next()

}


module.exports = is_new
