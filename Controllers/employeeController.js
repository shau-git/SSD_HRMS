const {StatusCodes} = require("http-status-codes")
const Employee = require("../Models/employee")
const {queryField} = require("./adHoc")

// const createEmployee
// for admin
const getAllEmployees = async(req,res) => {

    // GET /users?roleId=2&username=john&sort=username&order=asc&limit=10&offset=0

    const {
        order,
        limit,
        
    } = req.query
    console.log(req.query)
    const queryObject = {where: {}}

    queryField(queryObject, req.query)

    console.log('line 21', queryObject)

    // /employees?sort=employee_id,username&order=asc,desc
    if(order) {}

    if(limit) {queryObject.limit = parseInt(limit)}

    console.log(queryObject)
    //const {count, rows} = await Employee.findAndCountAll(queryObject)

    //return res.status(StatusCodes.OK).json({total: count, employee: rows})

    // return res.status(StatusCodes.OK).json({ employee: employee})
    return res.send("ok")
}


module.exports = {
    getAllEmployees
}