const {StatusCodes} = require("http-status-codes")
const Employee = require("../Models/employee")
const {NotFoundError, BadRequestError, UnauthenticatedError, ForbiddenError} = require("../errors/errors")
const {parseReqQuery} = require("./utils/controllerUtils")

// GET ALL employee
const getAllEmployees = async(req,res) => {

    console.log(req.query)

    // getting payload from the token
    const payload = req.employee;
    console.log(payload)

    let employerData;

    // prepare the queryObject variable to store parsed query string
    const queryObject = {where: {}}

    // parsing the query string
    parseReqQuery(queryObject, req.query)
    console.log("yoyo", queryObject)
    // if is employer/manager visiting this route, only allow them to query all of its employee result
    // so it will the employer would not able to query their data from here, so they need to go get their data in getOneEmployee  
    if (payload.role === 'E') {
        queryObject.where.manager_id = payload.employee_id
        employerData = await Employee.findByPk(payload.employee_id)

    } else if(payload.role === 'W') {
        // if the worker visit this page only let them query their data
        queryObject.where.employee_id= payload.employee_id

    }

    console.log("lidou",Object.keys(queryObject.where.employee_id))

    // start executing the GET request
    let employees = await Employee.findAll(queryObject)

    if(employerData) {
        employees.unshift(employerData)
    }

    return res.status(StatusCodes.OK).json({total: employees.length, employees})
}


// GET one employee
const getOneEmployee = async(req, res) => {

    // get employee_id in the req.params
    const {employee_id} = req.params

    const payload = req.employee
    // query the employee
    const employee = await Employee.findByPk(employee_id)

    // if no employee data is found, means the id is unavailable
    if(!employee) {throw new NotFoundError(`Employee id not found`)}

    // if someone who query a use data is neither the correct manager/employer or an admin, throw forbidden error
    if (payload.role !== 'A') {
        if(payload.employee_id !== employee.manager_id) {
            throw new ForbiddenError("This side is forbidden")
        } 
    }

    return res.status(StatusCodes.OK).json({total: employee.length, employee})
}


// PUT employee
const updateEmployee = async(req, res) => {

    // get employee_id in the request parameters
    const {employee_id} = req.params

    // store the request body in a variable called toUpdateEmployee
    let toUpdateEmployee = req.body

    // getting payload from the token
    const payload = req.employee

    // to store the employee data after updating
    let updatedEmployee;
    console.log(payload.employee_id, employee_id)

    // check if the employee_id exist and also get the is_new data
    const employee = await Employee.findByPk(employee_id)

    if (!employee) {
        throw new NotFoundError(`Employee id not found`)
    }

    // if admin visit here
    if (payload.role === "A" ) { 

        // hash the password if request for changing
        toUpdateEmployee = await Employee.hashPassword(toUpdateEmployee)

        // update the employee data
        await Employee.update(toUpdateEmployee, {
            where: {employee_id}
        })
       
    } else if (employee_id == payload.employee_id) { // if the actual employee visit this page, only allowed them to change the password
        
        // make sure the employee provide the password
        if(toUpdateEmployee.hashed_password) {
            
            if (employee.is_new) {

                // ensure there is password provided for changing, because changing password for first time login in is essential
                const isPasswordSame = await employee.comparePassword(toUpdateEmployee.hashed_password)

                if (isPasswordSame) {  // ensure new user do not input the same password
                    throw new BadRequestError("Please provied a different password to change")
                }
                
            } 
            // hash the password before saving to DB
            toUpdateEmployee = await Employee.hashPassword(toUpdateEmployee)

            // proceed to update
            updatedEmployee = await Employee.update(
                {
                    hashed_password: toUpdateEmployee.hashed_password,
                    is_new: false   // update the is_new to false, after changing password user will not be the first time to login anymore
                }, 
                { where: {employee_id} }
            )

        } else {

            throw new BadRequestError("Please provide password")
        }
        
    } else {

         throw new ForbiddenError("This side is forbidden")
    }

    // get the newly updated employee data
    updatedEmployee = await Employee.findByPk(employee.employee_id) //[1]
    //console.log(updatedEmployee)
    return res.status(StatusCodes.OK).json({total: updatedEmployee.length, updatedEmployee})

}

 
// DELETE employee
const deleteEmployee = async(req,res) => {

    // get the payload that is attached in the req.employee
    const payload = req.employee

    console.log(payload)

    // only Admin can delete an account
    if(payload.role !== 'A') {
        throw new ForbiddenError("This side is forbidden")
    }

    // get the employee_id from the request parameter
    const {employee_id} = req.params

    // start executing the delete request, in this project the employee data will not be deleted entirely
    // it will just set to is_active to false in the DB
    const deleteEmployee = await Employee.update({is_active: false}, {where: {employee_id}})

    // if nothing return means the employee_id is not found
    if(!deleteEmployee) {throw new NotFoundError(`Employee id not found`)}

    // const updatedEmployee = await Employee.findByPk(employee_id)

    return res.status(StatusCodes.OK).json({msg: `Employee with id ${employee_id} deleted.`})
}

module.exports = {
    getAllEmployees,
    getOneEmployee,
    updateEmployee,
    deleteEmployee
}