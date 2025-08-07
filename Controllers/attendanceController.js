const {StatusCodes} = require("http-status-codes")
const { Op } = require("sequelize")
const Employee = require("../models/employee")
const Attendance = require("../models/attendance")
const AttendanceEditRequest = require("../models/attendance_edit_request")
const {NotFoundError, BadRequestError,  ForbiddenError} = require("../errors/errors")
const {parseReqQuery} = require("./utils/controllerUtils")
const asyncWrapper = require("./utils/async")
const { getDataWithSGT, getCurrentTimeSGT, convertToSGT }= require("./utils/convertToSGT")
const { calculateTotalMinWork, calculateTotalAdjustMin }= require("./utils/calculateTotalMin")


// GET ALL Attendance
const getAllAttedance = asyncWrapper(async(req, res) => {

    const payload = req.employee
    let start = `-01T00:00:00.000Z`;
    let end ='-31T23:59:59.999Z';
    //?year=2025&month=8
    const {year, month, manager, ot_req_status, edit_status, read} = req.query
    console.log(req.query)

    let filter = {};

    if (payload.role === 'W') {
        
        filter.employee_id = payload.employee_id

    } else if (payload.role === 'E') {

        if(Boolean(manager) === true ) {

            filter.employee_id = payload.employee_id
            
        } else {

            filter.manager_id = payload.employee_id

        }

    } 

    if (year && month) {
        const yearMonth = `${year}-${month}`
        start = yearMonth + start
        end = yearMonth+ end
        filter.start_date_time = { [Op.between]: [start, end] }
    }

    if( ot_req_status && ['PENDING', 'APPROVED', 'REJECTED'].includes(ot_req_status.toUpperCase())) {
        filter.ot_req_status = ot_req_status
    }


    if( edit_status && ['PENDING', 'APPROVED', 'REJECTED'].includes(edit_status.toUpperCase())) {
        filter.edit_status = edit_status
    }

    if (read) {
        filter.read = read
    }

    const attendances = await Attendance.findAll({
        where: filter,
        order: [['attendance_id', 'DESC']]
    })

    // format all the datetime field to sgt
    const attendanceWithSGT = getDataWithSGT(attendances)

    res.json({total: attendanceWithSGT.length, attendances: attendanceWithSGT})
})


// PUT employer response to ot_req_status and edit_status("APPROVED" or "REJECTED")
// admin also can change manager_id in the attendance table here
const responseReqStatus = asyncWrapper(async(req, res) => {

    const payload = req.employee
    const {attendance_id} = req.params

    // req.body
    const {ot_req_status, edit_status, manager_id} = req.body

    // get the attendance_id that user want to update
    let attendance = await Attendance.findOne({
        where: {attendance_id},
    })

    // if attendance id not found
    if (!attendance) {
        throw new NotFoundError(`Attendance id not found`)
    }

    // if someone want to change the manager_id in the attendance, make sure is admin
    if(manager_id) {

        if(payload.role !== 'A') {
            throw new ForbiddenError('changing manager_id is not allowed')
        } else {
            
            // update the manager_id
            await Attendance.update(
                {manager_id},
                { where: {attendance_id} }
            )

            attendance = await Attendance.findOne({
                where: {attendance_id},
            })

            // convert all the datetime field to SGT for view
            const responseSGT = getDataWithSGT(attendance)

            return res.status(StatusCodes.OK).json({total: responseSGT.length, attendance: responseSGT})

        }
    }
    // if the person visit here not admin and not the manager to response to the attendance req, throw forbidden error
    if (payload.role !== 'A') {
        if(payload.employee_id !== attendance.manager_id ) {
            throw new ForbiddenError(`This side is forbidden`)
        }
    } 

    // to store all the data for updatin the attendance table
    let toUpdate = {}

    
    if (ot_req_status) {
        if(ot_req_status.toUpperCase() === "APPROVED") {

            toUpdate.ot_req_status = "APPROVED"

        } else if (ot_req_status.toUpperCase() === "REJECTED") {

            toUpdate.ot_req_status = "REJECTED",

            // Recalculate total_min_adjusted by subtracting the OT hours.
            toUpdate.total_min_adjusted = calculateTotalAdjustMin(attendance.total_min_work, false, 0, {}).total_min_adjusted
        } 
    }
    
    
    if (edit_status) {
        if (edit_status.toUpperCase() === "APPROVED") {

        toUpdate.edit_status = "APPROVED"
        toUpdate.is_amended = true

        } else if (edit_status.toUpperCase() === "REJECTED") {

            toUpdate.edit_status = "REJECTED"

        }

        toUpdate.response_date_time = getCurrentTimeSGT()

        // set read to false is like make a notification, once user read it, will mark it as true
        toUpdate.read = false
    }

    const updateAttendanceStatus = await Attendance.update(
        toUpdate,
       { where: {attendance_id} }
    )
    console.log('updated', updateAttendanceStatus)

    attendance = await Attendance.findOne({
        where: {attendance_id},
    })

    // convert all the datetime field to SGT for view
    const responseWithSGT = getDataWithSGT(attendance)

    console.log(toUpdate)
    return res.status(StatusCodes.OK).json({total: responseWithSGT.length, attendance: responseWithSGT})
})



const markAsRead = asyncWrapper(async(req,res) => {
    // get attendance_id in the request parameters
    const {attendance_id} = req.params

        // getting payload from the token
    const payload = req.employee

    // check if the employee_id exist and also get the is_new data
    let attendance = await Attendance.findByPk(attendance_id)

    if (!attendance) {
        throw new NotFoundError(`Attendance id not found`)
    }

    if (attendance.employee_id !== payload.employee_id ) {
        throw new ForbiddenError(`This side is forbidden`)
    }

    await Attendance.update(
        { read: true },
       { where: {attendance_id} }
    )


    attendance = await Attendance.findByPk(attendance_id)

    // convert all the datetime field to SGT for view
    const responseWithSGT = getDataWithSGT(attendance)

    return res.status(StatusCodes.OK).json({attendance: responseWithSGT})

})




// CREATE an attendance record
const clockIn = asyncWrapper(async(req, res) => {

    // getting payload from the token
    const payload = req.employee
    console.log(req.employee)

    // get the employee data
    const employee = await Employee.findOne({
        where: {employee_id: payload.employee_id},
    })
 
    // get the date only from ex: "2025-08-06T00:00:00.000Z"
    const todayDate = getCurrentTimeSGT().toISOString().split('T')[0]
    console.log(todayDate)
    
    const isEmpClockIn = await Attendance.findOne({
        where: {
            employee_id: payload.employee_id,
        },
        order: [['start_date_time', 'DESC']]
    })

    let latestAttendance; 

    //check is the employee clocked In at today
    if (isEmpClockIn){
        latestAttendance = isEmpClockIn.dataValues.start_date_time.toISOString().split('T')[0]
    } 

    // if employee clocked in for today, told them they are not able to clock in again
    if (latestAttendance == todayDate){
        throw new BadRequestError("You cannot clock in again today")
    }

    // only allow user to provide these field for clock in
    let { start_date_time } = req.body

    if (!start_date_time) {
        // get current datetime in SGT
        start_date_time = getCurrentTimeSGT()
    } else {
        start_date_time = new Date(start_date_time)
    }
    /*OP:
      manager_id: employees {
        dataValues: { manager_id: 1 },
        _previousDataValues: { manager_id: 1 },
        uniqno: 1,
        _changed: Set(0) {},
        _options: {
        isNewRecord: false,
        _schema: null,
        _schemaDelimiter: '',
        raw: true,
        attributes: [Array]
        },
        isNewRecord: false
    },...
    */

    // only get the necessary field, the other fills are either forbidden or having default value in the model
    const attendanceRecord = {
        employee_id: payload.employee_id,
        start_date_time,
        manager_id: employee.dataValues.manager_id,
    }

    // start creating the attendance record in the DB, there will have a default value to be set for end_date_time in the Attendance Model 
    const createAttendance = await Attendance.create(attendanceRecord)
    console.log(createAttendance)

    // format all the datetime field to sgt
    const attendanceWithSGT = getDataWithSGT(createAttendance)

    res.status(StatusCodes.CREATED).json({total:attendanceWithSGT.length ,attendance: attendanceWithSGT[0]})
})


// clock out // note that after complete make sure it only update for today only
const clockOut = asyncWrapper(async(req, res) => {
    const payload = req.employee

    let {end_date_time, is_ot, hours_of_ot} = req.body

    if (!end_date_time) {
        // get current datetime in SGT
        end_date_time = new Date(getCurrentTimeSGT())
    } else {
        end_date_time = new Date(end_date_time)
    }
    

    // to get the correct attendance record for clocking out
    const attdendanceToClockOut = await Attendance.findOne({
        where: {employee_id: payload.employee_id, end_date_time: null},
        order: [['start_date_time','DESC']],
        attributes: ["attendance_id", "start_date_time"]
    })


    // get the attendance_id from the attendace to clock out
    const { attendance_id, start_date_time } = attdendanceToClockOut.dataValues
   // console.log(attdendanceToClockOut.dataValues)

    // console.log(end_date_time) //true
    // console.log(convertToSGT(start_date_time )) //true
    // console.log("check", end_date_time <= convertToSGT(start_date_time ))
    if (end_date_time <= convertToSGT(start_date_time )) {
        throw new BadRequestError("Cannot clock out before or same as clock in time")
    }


    // calculate the total_min_work
    const total_min_work = calculateTotalMinWork(convertToSGT(start_date_time), end_date_time)
    console.log(total_min_work)

    // storing data to be update that we have for now
    let data = {
            end_date_time, 
            total_min_work, 
            is_ot: req.body.is_ot, // default : false
            hours_of_ot: req.body.hours_of_ot, // default: 0
    }

    /*
    // to store total min adjust later
    let total_min_adjusted;

    // subtract out the lunch time, so 480 min
    if (total_min_work >= 480) {
        total_min_adjusted = 480
    } else {
        // work less than the working hours
        total_min_adjusted = total_min_work
    }

    // check if total min of work is greater than the ot hours
    if(total_min_work < Number(hours_of_ot) * 60 ) {
        throw new BadRequestError("Total working hours have be greater than hours of ot")
    }



    // ot is only added base on the condition below
    //convert hours ot to min and add it to total_min_adjusted, > 540 is becasue (8.00 - 17.00)
    if (is_ot && total_min_work > 540) {
        data.total_min_adjusted += Number(hours_of_ot) * 60 
        data.ot_req_status = 'PENDING'
    } 
    */

    // get all the data include the total adjust min, this function return an obj
    data = calculateTotalAdjustMin(total_min_work, is_ot, hours_of_ot, data)

    // start executing the clock out
    const updateResult = await Attendance.update( 
        data,
        { where: {attendance_id} }
    )

    // to get to the newly clocked out attendace by attendance_id
    const attendance = await Attendance.findByPk(attendance_id)

    // create the copy of the attendance and convert all the datetime field to SGT for view
    const attendanceWithSGT = getDataWithSGT(attendance)
    
    res.status(StatusCodes.OK).json({total: updateResult[0] , attendance: attendanceWithSGT[0]})

})

// GET attendance edit request
const getEditAttendanceRequest = asyncWrapper(async(req, res) => {
    
    // getting payload from the token
    const payload = req.employee

    const queryObject = {where: {}, order: [['request_id','ASC']],}

    // parsing the query string
    const {manager} = req.query

    if (payload.role === 'E') {
        if (Boolean(manager) === true) { // if employer/manager want to query their edit attendance request

            queryObject.where.employee_id = payload.employee_id
            //getEditRequest = await AttendanceEditRequest.findAll({where: {employee_id: payload.employee_id}})

        } else {  // if employer do not provide any query str, by default just give them all of their employee's queries
            queryObject.where.manager_id = payload.employee_id
            // getEditRequest = await AttendanceEditRequest.findAll({where: {manager_id: payload.employee_id}})

        }

    } else if(payload.role === 'W') {

        queryObject.where.employee_id = payload.employee_id
        //getEditRequest = await AttendanceEditRequest.findAll()

    } 

    // start executing GET request to the DB
    const getEditRequest = await AttendanceEditRequest.findAll(queryObject)

    // if no response
    if(!getEditRequest) {
        return res.status(StatusCodes.OK).json({msg: "No edit attendance request found"})
    }

    // convert all the datetime field to SGT for view
    const responseWithSGT = getDataWithSGT(getEditRequest)
    console.log(getEditRequest)

    return res.status(StatusCodes.OK).json({request: responseWithSGT})
    
})


// POST for those employee who forgot to clock in/out, they can recreate the attendance and pending for approval
const recreateAttendance = asyncWrapper(async(req, res) => { 

        // get attendance_id in the request parameters
    const {attendance_id} = req.params

    // getting payload from the token
    const payload = req.employee

    const manager_id = await Employee.findOne({
        where: {employee_id: payload.employee_id},
        attributes: ['manager_id']
    })

    let {start_date_time, end_date_time, remarks, is_ot, hours_of_ot} = req.body

    console.log(typeof start_date_time, end_date_time)

 
    start_date_time = convertToSGT(new Date(start_date_time))

    end_date_time = convertToSGT(new Date(end_date_time))

    console.log(start_date_time, end_date_time)

    let toUpdate = {
        employee_id: payload.employee_id,
        start_date_time,
        end_date_time,
        is_ot,
        hours_of_ot,
        remarks,
        edit_date_time: getCurrentTimeSGT(),
        manager_id: manager_id.dataValues.manager_id,
        edit_status: 'PENDING',
        total_min_work: calculateTotalMinWork(start_date_time,end_date_time),

    }

    toUpdate = calculateTotalAdjustMin(toUpdate.total_min_work, toUpdate.is_ot, toUpdate.hours_of_ot, toUpdate)
    // submit the request (INSERT INTO attendance_edit_request)
    const createAttendance = await Attendance.create(toUpdate)
    const responseWithSGT = getDataWithSGT(createAttendance)

    return res.status(StatusCodes.CREATED).json({total: responseWithSGT.length, attendanceReq: responseWithSGT})

})

// POST an attendance edit request
const editAttendance_W = asyncWrapper(async(req, res) => {

    // get attendance_id in the request parameters
    const {attendance_id} = req.params

    // getting payload from the token
    const payload = req.employee

    // check if the employee_id exist and also get the is_new data
    const attendance = await Attendance.findByPk(attendance_id)

    if (!attendance) {
        throw new NotFoundError(`Attendance id not found`)
    }

    if (attendance.employee_id !== payload.employee_id ) {
        throw new ForbiddenError(`This side is forbidden`)
    }

    const manager_id = await Employee.findOne({
        where: {employee_id: payload.employee_id},
        attributes: ['manager_id']
    })

    let {start_date_time, end_date_time, remarks, is_ot, hours_of_ot} = req.body

    console.log(typeof start_date_time, end_date_time)

    // to change "2025-08-06T08:00" => "2025-08-06T08:00:00.000Z"
    start_date_time = convertToSGT(new Date(start_date_time))

    end_date_time = convertToSGT(new Date(end_date_time))

    console.log(start_date_time, end_date_time)

    // submit the request (INSERT INTO attendance_edit_request)
    const submitEditReq = await AttendanceEditRequest.create({
        employee_id: payload.employee_id,
        attendance_id,
        start_date_time,
        end_date_time,
        is_ot,
        hours_of_ot,
        remarks,
        edit_date_time: getCurrentTimeSGT(),
        manager_id: manager_id.dataValues.manager_id
    })

    // convert all the datetime field to SGT for view
    const responseWithSGT = getDataWithSGT(submitEditReq)

    return res.status(StatusCodes.CREATED).json({total: responseWithSGT.length, attendanceReq: responseWithSGT})
})



// DELETE attendance edit request worker
const deleteEditAttendance_W = asyncWrapper(async(req, res) => {
    // get attendance_id in the request parameters
    const {attendance_id} = req.params

    // getting payload from the token
    const payload = req.employee

    // check if the employee_id exist and also get the is_new data
    const attendancEditReq = await AttendanceEditRequest.findOne({where: {attendance_id}})

    if (!attendancEditReq) {
        throw new NotFoundError(`Attendance id not found`)
    }

    if (attendancEditReq.employee_id !== payload.employee_id) {
        throw new ForbiddenError(`This side is forbidden`)
    }

    const deleteReq = await AttendanceEditRequest.destroy({
        where: {attendance_id}
    })

    // convert all the datetime field to SGT for view
    const responseWithSGT = getDataWithSGT(deleteReq)
    console.log(responseWithSGT)

    return res.status(StatusCodes.OK).json({msg: "Attendance edit request deleted."})

})


// PUT manager/employer is only allowed to response to their worker, admin can change the manager id
const response_edit_request_E_A = asyncWrapper(async(req, res) => {

    // get attendance_id in the request parameters
    const {attendance_id} = req.params

    // getting payload from the token
    const payload = req.employee

    // check if the attendance_id has an edit request, if there is an edit request it will be in the attendance_edit_request table
    const getEditRequest = await AttendanceEditRequest.findOne({where: {attendance_id}})

    if (!getEditRequest) {
        throw new NotFoundError(`Attendance ID ${attendance_id} was not requested for editing.`)
    }
    console.log(getEditRequest.dataValues )

    const editAttendanceReq = req.body


    // if someone want to change the manager_id in the attendance, make sure is admin
    if(editAttendanceReq.manager_id) {

        if(payload.role !== 'A') {
            throw new ForbiddenError('changing manager_id is not allowed')
        } else {
            
            // update the manager_id
            await Attendance.update(
                {manager_id: editAttendanceReq.manager_id},
                { where: {attendance_id} }
            )

            const attendance = await Attendance.findOne({
                where: {attendance_id},
            })

            // convert all the datetime field to SGT for view
            const responseSGT = getDataWithSGT(attendance)

            return res.status(StatusCodes.OK).json({total: responseSGT.length, attendance: responseSGT})

        }
    }


    // check if the person visit this site is the correct manager, or is admin
    if (getEditRequest.dataValues.manager_id != payload.employee_id /*|| payload.role !== 'A'*/) {
        throw new ForbiddenError(`This side is forbidden`)
    } 

    // admin cannot make the status to APPROVED etc, they can only change manager id
    if(payload.role === 'A' && req.body.edit_status ) {
        throw new ForbiddenError("responding the request is forbidden")
    }


    // update the edit attendance req (response can be done at here)
    const responseReq = await AttendanceEditRequest.update(
        editAttendanceReq,
        {where: {attendance_id}}
    )

    console.log(responseReq)


    // check if the edit attendance request updated successfully, if so modifiy the actual attendance table
    if(responseReq[0] === 1) {

        // get the newly updated data
        let updateEditAttendanceReq = await AttendanceEditRequest.findOne({where: {attendance_id}});

        // pass in the response get from 'await AttendanceEditRequest.findOne({where: {attendance_id}});' into the function to get the timestamp convert to sgt
        // will get back the obj
        let updateAttendance = {...getDataWithSGT(updateEditAttendanceReq)[0]}

        // get current time as the respond time into the obj 
        updateAttendance.response_date_time = getCurrentTimeSGT()

        // if  employer approved the edit request
        if(updateAttendance.edit_status.toUpperCase() === 'APPROVED') {
            // calculate the total_min_work
            const total_min_work = calculateTotalMinWork(updateAttendance.start_date_time, updateAttendance.end_date_time)

            updateAttendance.edit_status = 'APPROVED'

            updateAttendance.is_amended = true
            updateAttendance.read = false
            updateAttendance.total_min_work = total_min_work

            if(updateAttendance.is_ot === true) {

                // get all the data include the total adjust min, this function return an obj
                updateAttendance = calculateTotalAdjustMin(total_min_work, updateAttendance.is_ot, updateAttendance.hours_of_ot, updateAttendance)
                // mark the ot_req_status to 'APPROVED'
                updateAttendance.ot_req_status = 'APPROVED'

            } else if (updateAttendance.is_ot === false) {

                // mark the ot_req_status to null, becasue calculateTotalAdjustMin() has set the ot_req_status = 'PENDING'
                updateAttendance = calculateTotalAdjustMin(total_min_work, updateAttendance.is_ot, updateAttendance.hours_of_ot, updateAttendance)
                updateAttendance.ot_req_status = null
            } 

        } else if (updateEditAttendanceReq.edit_status == 'REJECTED') {
            
            updateAttendance.edit_status = 'REJECTED'

            updateAttendance.is_amended = false

            if(updateAttendance.is_ot) {

                updateAttendance.ot_req_status = null
            }
        }

        // start modifying the actual attendance table
        await Attendance.update( updateAttendance, {where: {attendance_id}} )


        // get the newly updated data
        const response = await Attendance.findOne( {where: {attendance_id}} )

        // convert the data in sgt 
        const responseWithSGT = getDataWithSGT(response)

        // delete the edit request
        await AttendanceEditRequest.destroy({
            where: {attendance_id}
        })

        return res.status(StatusCodes.OK).json({total: response.length, attendance: responseWithSGT})

    } else {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({error: "Fail to update edit attendance request"})
    }

})



// DELETE an attendance record (on admin is allowed)
const deleteAttendance = asyncWrapper(async(req, res) => {
    // get the employee_id from the request parameter
    const {attendance_id} = req.params

    const deleted = await Attendance.destroy({
        where: {attendance_id}
    })

    if (!deleted) {
        throw new NotFoundError("Attendance id  not found!")
    }

    res.status(StatusCodes.OK).json({msg: "Attendance record deleted!"})

})

module.exports = {
    getAllAttedance, 
    clockIn,
    clockOut,
    getEditAttendanceRequest,
    editAttendance_W,
    deleteEditAttendance_W,
    responseReqStatus,
    response_edit_request_E_A,
    deleteAttendance,
    markAsRead,
    recreateAttendance
}