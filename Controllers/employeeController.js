const { StatusCodes } = require("http-status-codes")
const Employee = require("../models/employee")
const { NotFoundError, BadRequestError,  ForbiddenError } = require("../errors/errors")
const { parseReqQuery } = require("./utils/controllerUtils")
const asyncWrapper = require("./utils/async")
const { getDataWithSGT }= require("./utils/convertToSGT")

// GET ALL employee
const getAllEmployees = asyncWrapper(async(req,res) => {

    console.log(req.query)

    // getting payload from the token
    const payload = req.employee;
    console.log(payload)

    let employerData;

    // prepare the queryObject variable to store parsed query string
    const queryObject = {where: {}}

    // parsing the query string, queryObject will be affected
    parseReqQuery(queryObject, req.query)
    
    let {is_active} = req.query

    // if is employer/manager visiting this route, only allow them to query all of its employee result
    // so it will the employer would not able to query their data from here
    // will append it to the employee data after query thems
    if (payload.role === 'E') {
        queryObject.where.manager_id = payload.employee_id
        employerData = await Employee.findByPk(payload.employee_id)

    } else if(payload.role === 'W') {
        // if the worker visit this page only let them query their data
        queryObject.where.employee_id= payload.employee_id

    }


    if (payload.role === 'A') {
       if ( is_active === 'false') {
            queryObject.where.is_active = false
       } else if (is_active === 'true') {
            queryObject.where.is_active = true
        }
    } 


    // start executing the GET request
    let employees = await Employee.findAll(queryObject)

    // add the employer data to the employee data array
    if(employerData) {
        employees.unshift(employerData)
    }

    // convert all the datetime field to SGT for view
    const responseWithSGT = getDataWithSGT(employees)

    return res.status(StatusCodes.OK).json({total: employees.length, employees: responseWithSGT})
})


// GET one employee
const getOneEmployee = asyncWrapper(async(req, res) => {

    // get employee_id in the req.params
    const {employee_id} = req.params

    const payload = req.employee
    // query the employee
    let employee = await Employee.findByPk(employee_id)

    // const manager = await Employee.findOne({where: {employee_id: employee.dataValues.manager_id}})

    // if no employee data is found, means the id is unavailable
    if(!employee) {throw new NotFoundError(`Employee id not found`)}

    // convert all the datetime field to SGT for view
    const responseWithSGT = getDataWithSGT(employee)

    

    return res.status(StatusCodes.OK).json({total: responseWithSGT.length, employee: responseWithSGT})
})


// PUT employee
const updateEmployee = asyncWrapper(async(req, res) => {

    // get employee_id in the request parameters
    const {employee_id} = req.params

    // store the request body in a variable called toUpdateEmployee
    let toUpdateEmployee = req.body

    // getting payload from the token
    const payload = req.employee

    // to store the employee data after updating (for admin use only)
    let updatedEmployee;
    console.log(payload.employee_id, employee_id)

    // check if the employee_id exist and also get the is_new data
    const employee = await Employee.findByPk(employee_id)

    if (!employee) {
        throw new NotFoundError(`Employee id not found`)
    }

    // if admin visit here
    if (payload.role === "A" ) { 

        // hash the password if request for changing, will return back the same obj with the password hashed
        const {hashed_password} = await Employee.hashPassword(toUpdateEmployee)

        // change the passowrd in the req.body to a hashed one before updating to the database
        toUpdateEmployee.hashed_password = hashed_password

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
            const hashingpassword = await Employee.hashPassword(toUpdateEmployee) // return hashed_password: '$2b$10$kYr3oERXnhiLSKXULY1tIuqWgNWDPGvL2SzDXDQRqX6lX.MMBytuK'

            // proceed to update
            const updatedtingPassword = await Employee.update(
                {
                    hashed_password: hashingpassword.hashed_password,
                    is_new: false   // update the is_new to false, after changing password user will not be the first time to login anymore
                }, 
                { where: {employee_id} }
            )

            console.log('updated', updatedtingPassword)

        } else {

            throw new BadRequestError("Please provide password")
        }
        
    } else {

         throw new ForbiddenError("This side is forbidden")
    }

    // get the newly updated employee data
    updatedEmployee = await Employee.findByPk(employee.employee_id) //[1]
console.log('new onnnnnn', updatedEmployee)
    // convert all the datetime field to SGT for view
    const responseWithSGT = getDataWithSGT(updatedEmployee)

    return res.status(StatusCodes.OK).json({total: responseWithSGT.length, employee: responseWithSGT})

})

 
// DELETE employee (only admin is authorized)
const deleteEmployee = asyncWrapper(async(req,res) => {

    // get the employee_id from the request parameter
    const {employee_id} = req.params

    // start executing the delete request, in this project the employee data will not be deleted entirely
    // it will just set to is_active to false in the DB
    const deleteEmployee = await Employee.update({is_active: false}, {where: {employee_id}})

    // if nothing return means the employee_id is not found
    if(!deleteEmployee) {throw new NotFoundError(`Employee id not found`)}

    // const updatedEmployee = await Employee.findByPk(employee_id)

    return res.status(StatusCodes.OK).json({msg: `Employee with id ${employee_id} deleted.`})
})

module.exports = {
    getAllEmployees,
    getOneEmployee,
    updateEmployee,
    deleteEmployee
}