const {StatusCodes} = require("http-status-codes")
const Employee = require("../models/employee")
const Attendance = require("../models/attendance")
const Leave = require("../models/leave")
const {NotFoundError, BadRequestError,  ForbiddenError} = require("../errors/errors")
const asyncWrapper = require("./utils/async")
const { getDataWithSGT, getCurrentTimeSGT, convertToSGT }= require("./utils/convertToSGT")
const createDateFilter = require("./utils/createDateQuery")
const updateLeave = require("./utils/updateLeave")

// GET
const getAllLeaveHist = asyncWrapper(async(req, res) => {
    const payload = req.employee
    
        //?year=2025&month=8
        let {year, month, day, manager, status, read, type, leave_id, employee_id, read_withdraw} = req.query
    
        // variable to store all the things for filtering the query
        let filter = {};
    
        // only let worker get all of their own attendance data
        if (payload.role === 'W') {
            
            filter.employee_id = payload.employee_id
    
        } else if (payload.role === 'E') {  //if manager/employer want to get attendance data
    
            if(manager === 'true' ) {
    
                // if in the url (/api/attendance?manager=true) query all the attendance data of that manager
                filter.employee_id = payload.employee_id
                
            } else {
    
                // if no specify ?manager=true, query all of their employee's/worker's attendance data
                filter.manager_id = payload.employee_id
    
            }
    
        } 

        // admin want to get his on attendance data
        if (payload.role === 'A' && Boolean(manager) === true) {
            filter.employee_id = payload.employee_id
        }
    
        // only admin can filter out employee_id
        if (employee_id && payload.role === 'A') {
            filter.employee_id = employee_id
        }

        if(year || month || day) {
    
            filter.start_date_time = createDateFilter({year, month, day})
        }
    
    
        // finding with ot_req_status
        if( status && ['PENDING', 'APPROVED', 'REJECTED', 'WITHDRAWN'].includes(status.toUpperCase())) {
            filter.status = status
        }
    

        // query those have or have not read after employers have response to a request
        if (read) {
            filter.read = read
        }

        if(read_withdraw && (payload.role === 'A' || payload.role === 'E')) {
            filter.read_withdraw = read_withdraw
        }

        if (type && ['AL', 'ML'].includes(type.toUpperCase())) {
            filter.type = type
        }

        if (leave_id) {
            filter.leave_id = leave_id
        }
        console.log(filter )


    const leaveHistory = await Leave.findAll({
        where: filter,
        order: [['start_date_time', 'DESC'], ['leave_id', 'DESC']]
    })

    if (leaveHistory.length < 1) {
        throw new NotFoundError(`Leave not found!`)
    } 

    // format all the datetime field to sgt
    const leaveHistoryWithSGT = getDataWithSGT(leaveHistory)
    console.log(leaveHistoryWithSGT)
    return res.json({total: leaveHistoryWithSGT.length, leaveHistory: leaveHistoryWithSGT}) 
    
    
})


// POST
const applyLeave = asyncWrapper(async(req, res) => { 

    // getting payload from the token
    const payload = req.employee

    let {type, date, leave_remarks, duration} = req.body

    // find the employee data
    const employee = await Employee.findOne({
        where: {employee_id: payload.employee_id},
    })

    // storing all the informations for creating leave data
    const applyLeaveData = {
        type: type.toUpperCase(),
        status: 'PENDING',
        submit_date_time: getCurrentTimeSGT(),
        leave_remarks,
        employee_id: employee.employee_id,
        manager_id: employee.manager_id,
        duration,
    }    

    if(duration.toUpperCase() === 'FULL') {
        // check if employee has enough leave 
        await updateLeave(payload.employee_id, type, employee.dataValues.medical_leave, employee.dataValues.annual_leave, -1)

        applyLeaveData.start_date_time = `${date}T08:00:00Z` 
        applyLeaveData.end_date_time = `${date}T17:00:00Z` 

    } else if (duration.toUpperCase() === 'AM') {

        // check if employee has enough leave 
        await updateLeave(payload.employee_id, type, employee.dataValues.medical_leave, employee.dataValues.annual_leave, -0.5)
        applyLeaveData.start_date_time = `${date}T08:00:00Z` 
        applyLeaveData.end_date_time = `${date}T12:00:00Z` 

    } else if (duration.toUpperCase() === 'PM') {

        // check if employee has enough leave 
        await updateLeave(payload.employee_id, type, employee.dataValues.medical_leave, employee.dataValues.annual_leave, -0.5)
        applyLeaveData.start_date_time = `${date}T13:00:00Z` 
        applyLeaveData.end_date_time = `${date}T17:00:00Z` 
    }
    
    applyLeaveData.day = convertToSGT(new Date(date)).toDateString().slice(0,3)

    console.log(applyLeaveData)

    const applyLeave = await Leave.create(applyLeaveData)

    // convert all the datetime field to SGT for view
    const responseWithSGT = getDataWithSGT(applyLeave)

    res.status(StatusCodes.CREATED).json({total: responseWithSGT.length, leave: responseWithSGT})
})


// PUT
const markAsRead = asyncWrapper(async(req,res) => {
    // get attendance_id in the request parameters
    const {leave_id} = req.params

    // getting payload from the token
    const payload = req.employee

    const {read, read_withdraw} = req.body

    // check if the employee_id exist and also get the is_new data
    let leave = await Leave.findByPk(leave_id)

    if (!leave) {
        throw new NotFoundError(`Leave id not found`)
    }

    // check if someone want to mark the leave notification as read
    if(read) {

        // only employee can mark their notification as read
        if (leave.employee_id !== payload.employee_id ) {
            throw new ForbiddenError(`This side is forbidden`)
        }

        leave = await Leave.update( { read: true }, { where: {leave_id}, returning: true } )
            
    } else if (read_withdraw) {

        // only employer/manager can mark their notification as read, if their employee has withdrawn a leave
        if (leave.manager_id !== payload.employee_id ) {
            throw new ForbiddenError(`This side is forbidden`)
        }

        leave = await Leave.update( { read_withdraw: true }, { where: {leave_id}, returning: true } )

    }
    
    //leave = await Leave.findByPk(leave_id)

    // convert all the datetime field to SGT for view
    const responseWithSGT = getDataWithSGT(leave[1])

    return res.status(StatusCodes.OK).json({total: responseWithSGT.length , leave: responseWithSGT})
})


// PUT employer response to a leave request, admin can change manager_id here also
const updateLeaveRecord = asyncWrapper(async(req,res) => {

    // get leave_id in the request parameters
    const {leave_id} = req.params

    // getting payload from the token
    const payload = req.employee

    // check if the leave_id exist
    let getLeaveRequest = await Leave.findOne({where: {leave_id}})

    if (!getLeaveRequest) {
        throw new NotFoundError(`Leave ID ${leave_id} not found!`)
    }


    getLeaveRequest = getLeaveRequest.dataValues


    console.log(getLeaveRequest )

    if (payload.role !== 'A') {
        // if other employer or worker visit this leave_id, make it forbidden
        if(payload.employee_id !== getLeaveRequest.manager_id) {
            throw new ForbiddenError(`This side is forbidden`)
        }
    } 
    
    const reqBodyUpdateLeave = req.body

    // if someone want to change the manager_id in the leave table, make sure is admin
    if (reqBodyUpdateLeave.manager_id) {
        if(payload.role !== 'A') {

            throw new ForbiddenError(`Changing manager id is forbidden!`)

        } else {

            // update the manager_id
            await Leave.update(
                {manager_id: reqBodyUpdateLeave.manager_id},
                { where: {leave_id} }
            )

            const leave = await Leave.findOne({
                where: {leave_id},
            })

            // convert all the datetime field to SGT for view
            const responseSGT = getDataWithSGT(leave)

            return res.status(StatusCodes.OK).json({total: responseSGT.length, leave: responseSGT})
        }
    }


    // to store the newly created attendance data , if employee's leave is approved
    let createAttendance;

    // if employer provide the status ('APPROVED', 'REJECTED')
    if (reqBodyUpdateLeave.status) {
         // if the leave is approved, create a new attendance for that date
        if(reqBodyUpdateLeave.status.toUpperCase() === 'APPROVED') {

             createAttendance = await Attendance.create({
                employee_id: getLeaveRequest.employee_id,
                start_date_time: null,
                end_date_time: null,
                leave_id,
                day: getLeaveRequest.day,
                total_min_work: 0, // initialize the total_min_work work &  total_min_adjusted total to 0, if half day leave, they will be adjusted
                total_min_adjusted: 0, //
                leave_remarks: `${getLeaveRequest.start_date_time.toISOString().slice(0,10)} ${getLeaveRequest.duration} ${getLeaveRequest.type}`,
                read: false,
                manager_id: payload.employee_id
            })


            reqBodyUpdateLeave.attendance_id = Number(createAttendance.dataValues.attendance_id)

        } else if (reqBodyUpdateLeave.status.toUpperCase() === 'REJECTED') {

            await Attendance.destroy({where: {leave_id}})
        }

        // append response_date_time to the obj for updating the leave
        reqBodyUpdateLeave.response_date_time = getCurrentTimeSGT()
        // set false for notification, once read will set it to true
        reqBodyUpdateLeave.read = false

    } 


    // update the leave data in the Leave table
    await Leave.update(
            //{status: reqBody.status, response_date_time : getCurrentTimeSGT()},
            reqBodyUpdateLeave,
            {where: {leave_id}}
    )

    // query the newly updated leave
    const getLeave  = await Leave.findOne({
        where: {leave_id },
    })

    // create the copy of the Leave data and convert all the datetime field to SGT for view
    const responseLeaveSGT = getDataWithSGT(getLeave)

    // if an attendance is created, send it to user
    if (createAttendance) {
        return res.status(StatusCodes.OK).json({total: responseLeaveSGT.length, leave: responseLeaveSGT, attendance: getDataWithSGT(createAttendance)})
    }

    // reach here means leave is rejected
    return res.status(StatusCodes.OK).json({total: responseLeaveSGT.length, leave: responseLeaveSGT})
 })



// DELETE (withdraw leave) for worker, admin are allow to withdraw also
const withdrawLeave = asyncWrapper(async(req,res) => {

    // get leave_id in the request parameters
    const {leave_id} = req.params

    // getting payload from the token
    const payload = req.employee

    // check if the leave_id exist
    let getLeaveData = await Leave.findOne({where: {leave_id}})
   

    if (getLeaveData.dataValues.length < 1) {
        throw new NotFoundError(`Leave Not Found.`)
    }
    

    getLeaveData = getLeaveData.dataValues
    console.log(getLeaveData )

    if (payload.role !== 'A') {
        if(payload.employee_id !== getLeaveData.employee_id) {
            throw new ForbiddenError(`This side is forbidden`)
        }
    }

    if (getLeaveData.withdraw_date_time || getLeaveData.status === 'WITHDRAWN') {
        throw new BadRequestError(`Leave ID ${leave_id} has been withdrawn`)
    }

    // update and get the withdraw date time and the status to withdraw,
    const withdrawLeave = await Leave.update(
        {withdraw_date_time: getCurrentTimeSGT(), read_withdraw: false, attendance_id: null, status: 'WITHDRAWN'}, 
        {where: {leave_id}, returning: true}
    )

    /*
    sample output for console.log(withdrawLeave)
    [
        1,
        [
            leave {
            dataValues: [Object],
            _previousDataValues: [Object],
            uniqno: 1,
            _changed: Set(0) {},
            _options: [Object],
            isNewRecord: false
            }
        ]
    ]
    */
    // delete the attendance record for that day
    await Attendance.destroy({where: {leave_id}})

    // calulate how many days to add back
    const usage = getLeaveData.type.toUpperCase() === 'FULL'? 1 : 0.5


    const employee = await Employee.findOne({where: {employee_id: getLeaveData.employee_id}})

    // add the leave back to the employee table
    await updateLeave(payload.employee_id, getLeaveData.type, employee.dataValues.medical_leave, employee.dataValues.annual_leave, usage) 

    // create the copy of the Leave data and convert all the datetime field to SGT for view
    const updatedLeaveWithSGT = getDataWithSGT(withdrawLeave[1])

    return res.status(StatusCodes.OK).json({total:updatedLeaveWithSGT.length, msg: "Leave withdraw successfully!", leave: updatedLeaveWithSGT})
})


module.exports = {
    getAllLeaveHist, 
    applyLeave,
    markAsRead,
    updateLeaveRecord,
    withdrawLeave
}