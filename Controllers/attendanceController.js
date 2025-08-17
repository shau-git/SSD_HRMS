const {StatusCodes} = require("http-status-codes")
const { Sequelize, Op } = require("sequelize")
const Employee = require("../models/employee")
const Attendance = require("../models/attendance")
const AttendanceEditRequest = require("../models/attendance_edit_request")
const {NotFoundError, BadRequestError,  ForbiddenError} = require("../errors/errors")
const asyncWrapper = require("./utils/async")
const { getDataWithSGT, getCurrentTimeSGT, convertToSGT, isValidFullISO }= require("./utils/convertToSGT")
const { calculateTotalMinWork, calculateTotalAdjustMin }= require("./utils/calculateTotalMin")
const createDateFilter = require("./utils/createDateQuery")


// get the date only from ex: "2025-08-06T00:00:00.000Z" => '2025-08-06'
const todayDate = getCurrentTimeSGT().toISOString().split('T')[0]
console.log('today date', todayDate)



// GET ALL Attendance  (manager = true in req.query means admin or employer want to get their own data)
const getAllAttendance = asyncWrapper(async(req, res) => {

    const payload = req.employee

    //?year=2025&month=8
    let {year, month, day, manager, ot_req_status, edit_status, read, attendance_id, employee_id} = req.query


    let filter = {};

    // only let worker get all of their own attendance data
    if (payload.role === 'W') {
        
        filter.employee_id = payload.employee_id

    } else if (payload.role === 'E') {  //if manager/employer want to get attendance data

        if(Boolean(manager) === true ) {

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

    if(attendance_id) { filter.attendance_id = attendance_id }


    if(year || month || day) {
        filter.start_date_time = createDateFilter({year, month, day})
    }


    // finding with ot_req_status
    if( ot_req_status && ['PENDING', 'APPROVED', 'REJECTED'].includes(ot_req_status.toUpperCase())) {
        filter.ot_req_status = ot_req_status
    }

    // finding with edit_status
    if( edit_status && ['PENDING', 'APPROVED', 'REJECTED'].includes(edit_status.toUpperCase())) {
        filter.edit_status = edit_status
    }

    // query those have or have not read after employers have response to a request
    if (read) {
        filter.read = read
    }

    console.log(filter)

    const attendances = await Attendance.findAll({
        where: filter,
        order: [['start_date_time', 'DESC'], ['attendance_id', 'DESC'], ['employee_id', 'ASC']]
    })

    console.log('here', attendances)
    if (attendances.length < 1) {
        throw new NotFoundError(`Attendance not found!`)
    } 

    // if someone want to filter the attendance id but the role is not admin
    if(attendance_id && payload.role !== 'A') {
        // if the person's employee_id is not same as the manager_id (other manager trying to get other worker's attendance)
        if(payload.employee_id !== attendances[0].dataValues.manager_id) {
            if(payload.employee_id !== attendances[0].dataValues.employee_id) {
                throw new ForbiddenError("This side is forbidden")
            }
        }
    }

    // format all the datetime field to sgt
    const attendanceWithSGT = getDataWithSGT(attendances)

    return res.status(StatusCodes.OK).json({total: attendanceWithSGT.length, attendances: attendanceWithSGT})
})



// GET Last 3 Attendance Records for the logged-in employee
const getRecentAttendance = asyncWrapper(async(req, res) => {
    const payload = req.employee;
    const employee_id = payload.employee_id;

    
    const recentAttendances = await Attendance.findAll({
        where: { 
            employee_id , 
            start_date_time: { [Op.ne]: null },
            edit_status: { 
                [Op.or]: [
                    { [Op.eq]: 'APPROVED' },
                    { [Op.eq]: null }
                ] 
            },
        },
        order: [['start_date_time', 'DESC']],
        limit: 3,
    });

    if (!recentAttendances || recentAttendances.length === 0) {
        throw new NotFoundError(`No attendance records found for this employee.`);
    }

    const attendanceWithSGT = getDataWithSGT(recentAttendances);
    return res.status(StatusCodes.OK).json({total: attendanceWithSGT.length, attendances: attendanceWithSGT})
});




// PUT employer response to ot_req_status and edit_status("APPROVED" or "REJECTED")
// admin also can change manager_id in the attendance table here
const updateAttendanceRecord = asyncWrapper(async(req, res) => {

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
        throw new NotFoundError(`Attendance not found`)
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
            toUpdate.total_min_adjusted = calculateTotalAdjustMin(attendance.total_min_work, true, attendance.hours_of_ot, {}).total_min_adjusted

        } else if (ot_req_status.toUpperCase() === "REJECTED") {

            toUpdate.ot_req_status = "REJECTED",

            // Recalculate total_min_adjusted by subtracting the OT hours.
            toUpdate.total_min_adjusted = calculateTotalAdjustMin(attendance.total_min_work, false, 0, {}).total_min_adjusted
        } 

        toUpdate.response_date_time = getCurrentTimeSGT()
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



// PUT  
const markAsRead = asyncWrapper(async(req,res) => {
    // get attendance_id in the request parameters
    const {attendance_id} = req.params

    // getting payload from the token
    const payload = req.employee

    const { read } = req.body

    // check if the employee_id exist and also get the is_new data
    let attendance = await Attendance.findByPk(attendance_id)

    if (!attendance) {
        throw new NotFoundError(`Attendance id not found`)
    }

    if (attendance.employee_id !== payload.employee_id ) {
        throw new ForbiddenError(`This side is forbidden`)
    }

    attendance = await Attendance.update(
        { read },
       { where: {attendance_id}, returning: true }
    )

console.log('att', attendance)
    //attendance = await Attendance.findByPk(attendance_id)

    // convert all the datetime field to SGT for view
    const responseWithSGT = getDataWithSGT(attendance[1])

    return res.status(StatusCodes.OK).json({total: responseWithSGT.length, attendance: responseWithSGT})

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
 

    // get the start_date_time 
    let { start_date_time } = req.body

    // if no start_date_time is provided, default as current datetime
    if (!start_date_time) {
        // get current datetime in SGT
        start_date_time = getCurrentTimeSGT()
    } else {
        if (isValidFullISO(start_date_time)) {
            start_date_time = start_date_time
        } else {
            start_date_time = convertToSGT(new Date(start_date_time))
        }
    }

    // get all where the date in start_date_time  is today's date or the remarks has today's date (once leave approved, attendance record will be created and the remarks will be marked as: 2025-08-01 AM AL)
    let isEmpClockIn = await Attendance.findAll({
        where: {
            employee_id: payload.employee_id,
            [Op.or]: [
            Sequelize.where(
                Sequelize.fn('DATE', Sequelize.col('start_date_time')),
                '=',
                todayDate
            ),
            { start_date_time: null },
            ],
            edit_status: { //because employee might recreate an attendance that might has start_date_time = todayDate, but is rejected by employer
                [Op.or]: [
                    { [Op.ne]: 'REJECTED' },
                    { [Op.is]: null }
                ] 
            },
        }
    })

      
    if (isEmpClockIn.length > 1) {
        isEmpClockIn = getDataWithSGT(isEmpClockIn)

        for (const attendance of isEmpClockIn) {
            // start_date_time can be "2025-08-06T23:07:48.181Z" or null, if employee's leave is approved will create an attendance, but start_date_time & end_date_time will be null
            const startDate = attendance.start_date_time? attendance.start_date_time.toISOString().split('T')[0] : null

            if(startDate == todayDate) {

                throw new BadRequestError("You cannot clock in again today")

            } else if (startDate == null) {  // once leave is approved, an attendance will be created , and the start_date_time & end_date_time will be set to null, but will remarks as taking leave

                if (attendance.leave_remarks.slice(0,10) == todayDate) {  // the leave_remarks we want to find is (2025-08-06 PM AL)

                    // update the start_date_time to current dateTime, the start_date_time variable here is the one extract from req.body
                    const updateAttendance = await Attendance.update({start_date_time}, { where: {attendance_id: attendance.attendance_id}, returning: true })
                    // const updateAttendance = await Attendance.findOne({where: {attendance_id: attendance.attendance_id} })

                    // format all the datetime field to sgt
                    const attendanceWithSGT = getDataWithSGT(updateAttendance[1])
                    return res.status(StatusCodes.OK).json({total:attendanceWithSGT.length ,attendance: attendanceWithSGT})
                }
            }
        }
    }
    


    // only get the necessary field, the other fills are either forbidden or having default value in the model
    const attendanceRecord = {
        employee_id: payload.employee_id,
        start_date_time,
        manager_id: employee.dataValues.manager_id,
        day: start_date_time.toDateString().slice(0,3)
    }

    // start creating the attendance record in the DB, there will have a default value to be set for end_date_time in the Attendance Model 
    const createAttendance = await Attendance.create(attendanceRecord)
    console.log(createAttendance)

    // format all the datetime field to sgt
    const attendanceWithSGT = getDataWithSGT(createAttendance)

    return res.status(StatusCodes.CREATED).json({total:attendanceWithSGT.length ,attendance: attendanceWithSGT[0]})
})


// clock out // note that after complete make sure it only update for today only
const clockOut = asyncWrapper(async(req, res) => {
    const payload = req.employee

    let {end_date_time, is_ot, hours_of_ot} = req.body

    if (!end_date_time) {
        end_date_time = getCurrentTimeSGT()
    } else {
        if (isValidFullISO(end_date_time)) {
            end_date_time = new Date(end_date_time)
        } else {
            end_date_time = convertToSGT(new Date(end_date_time))
        }
    }
    

    //get the today's clock in attendance
    const attdendanceToClockOut = await Attendance.findOne({
        where: {
            employee_id: payload.employee_id, 
            //end_date_time: null,
            [Op.and]: [
                Sequelize.where(
                    Sequelize.fn('DATE', Sequelize.col('start_date_time')),
                    '=',
                    todayDate
                ),
                { end_date_time: null }
            ]
        },
        order: [['start_date_time','DESC']],
        //attributes: ["attendance_id", "start_date_time"]
    })

    /*
     sample output for console.log(attendanceToClockOut)
     
        attendance {
            dataValues: { attendance_id: 6, start_date_time: 2025-08-10T11:04:12.491Z },
            _previousDataValues: { attendance_id: 6, start_date_time: 2025-08-10T11:04:12.491Z },
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
        }
    
    */

    // if no attdendanceToClockOut, means the employee has not clock in today
    if(!attdendanceToClockOut) {
        throw new BadRequestError("Clock out fail. You did not clock in today.")
    }

    // get the attendance_id from the attendace to clock out
    const { attendance_id, start_date_time } = attdendanceToClockOut.dataValues

    // this is to check if user input end_date_time beofre the start_date_time
    if (end_date_time <= convertToSGT(start_date_time )) { 
        throw new BadRequestError("Cannot clock out before or same as clock in time ")
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

    // get all the data include the total adjust min, this function return an obj
    data = calculateTotalAdjustMin(total_min_work, is_ot, hours_of_ot, data)

    if(is_ot === true) {
        data.ot_req_status = 'PENDING'
    }
    console.log(data)
    // start executing the clock out
    const updateAttendance = await Attendance.update( 
        data,
        { where: {attendance_id}, returning: true }
    )

    // to get to the newly clocked out attendace by attendance_id
    //const attendance = await Attendance.findByPk(attendance_id)

    // create the copy of the attendance and convert all the datetime field to SGT for view
    const attendanceWithSGT = getDataWithSGT(updateAttendance[1])
    
    return res.status(StatusCodes.OK).json({total: attendanceWithSGT.length , attendance: attendanceWithSGT[0]})

})



// GET attendance edit request  (admin will get every data, worker will only get their own, employer can choose)
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

    return res.status(StatusCodes.OK).json({total: responseWithSGT.length, request: responseWithSGT})
    
})


// POST for those employee who forgot to clock in/out, they can recreate the attendance and pending for approval
const recreateAttendance = asyncWrapper(async(req, res) => { 

    // getting payload from the token
    const payload = req.employee

    const manager_id = await Employee.findOne({
        where: {employee_id: payload.employee_id},
        attributes: ['manager_id']
    })

    let {start_date_time, end_date_time, remarks, is_ot, hours_of_ot} = req.body


    if (isValidFullISO(start_date_time)) {
            start_date_time = new Date(start_date_time)
    } else {
        start_date_time = convertToSGT(new Date(start_date_time))
    }


    if (isValidFullISO(end_date_time)) {
        end_date_time = new Date(end_date_time)
    } else {
        end_date_time = convertToSGT(new Date(end_date_time))
    }


    console.log('recreate', start_date_time, end_date_time)

    let toUpdate = {
        employee_id: payload.employee_id,
        start_date_time,
        end_date_time,
        day: start_date_time.toDateString().slice(0,3),
        is_ot,
        hours_of_ot,
        remarks,
        edit_date_time: getCurrentTimeSGT(),
        manager_id: manager_id.dataValues.manager_id,
        edit_status: 'PENDING',
        total_min_work: calculateTotalMinWork(start_date_time,end_date_time),

    }

    // this will return back the same toUpdate obj plus the adjusted total min
    toUpdate = calculateTotalAdjustMin(toUpdate.total_min_work, toUpdate.is_ot, toUpdate.hours_of_ot, toUpdate)
   
    // submit the request (INSERT INTO attendance_edit_request)
    const createAttendance = await Attendance.create(toUpdate)

    // convert all the datetime with SGT
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


    if (!isValidFullISO(start_date_time)) {
        start_date_time = convertToSGT(new Date(start_date_time))
    } else {
        start_date_time = new Date(start_date_time)
    }

    if (!isValidFullISO(end_date_time)) {
        end_date_time = convertToSGT(new Date(end_date_time))
    } {
        end_date_time = new Date(end_date_time)
    }

    console.log(new Date(start_date_time))
    console.log(isValidFullISO(start_date_time))
    console.log(start_date_time.toDateString().slice(0,3))

    // submit the request (INSERT INTO attendance_edit_request)
    const submitEditReq = await AttendanceEditRequest.create({
        employee_id: payload.employee_id,
        attendance_id: Number(attendance_id),
        start_date_time,
        end_date_time,
        day: start_date_time.toDateString().slice(0,3),
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
        throw new NotFoundError(`Attendance ID not requested for editing.`)
    }

    if (payload.role !== 'A') {
        if (attendancEditReq.employee_id !== payload.employee_id) {
            throw new ForbiddenError(`This side is forbidden`)
        }
    }

    const deleteReq = await AttendanceEditRequest.destroy({
        where: {attendance_id}
    })

    console.log(deleteReq)
    if (deleteReq === 1) {

        return res.status(StatusCodes.OK).json({msg: `Attendance ID ${attendance_id} has been deleted for editing request.`})

    } else {

        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({error: 'Something went wrong, please try again.'})
    }

})


// PUT manager/employer is allowed to response to woker request, admin can change the manager id too
const responseEditAttendanceRequest_E_A = asyncWrapper(async(req, res) => {

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

    // make sure the person visit this site is the correct manager, or is admin
    if(payload.role !== 'A') {
        if (getEditRequest.dataValues.manager_id != payload.employee_id ) {
            throw new ForbiddenError(`This side is forbidden`)
        } 
    }


    const editAttendanceReq = req.body


    // if someone want to change the manager_id in the attendance, make sure is admin
    if(editAttendanceReq.manager_id) {

        if(payload.role !== 'A') {
            throw new ForbiddenError('changing manager_id is not allowed')
        } else {
            
            // update the manager_id
            await AttendanceEditRequest.update(
                {manager_id: editAttendanceReq.manager_id},
                { where: {attendance_id} }
            )

            const attendance = await AttendanceEditRequest.findOne({
                where: {attendance_id},
            })

            // convert all the datetime field to SGT for view
            const responseSGT = getDataWithSGT(attendance)

            return res.status(StatusCodes.OK).json({total: responseSGT.length, attendance: responseSGT})

        }
    }

    let responseReq;

    if (["APPROVED", "REJECTED"].includes(editAttendanceReq.edit_status)) {
            // update the edit attendance req
        responseReq = await AttendanceEditRequest.update(
            editAttendanceReq,
            {where: {attendance_id}}
        )
    }


    console.log(responseReq)

    if (!responseReq || responseReq.length === 0) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({error: "Fail to update edit attendance request"}) 
    }

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

        return res.status(StatusCodes.OK).json({total: responseWithSGT.length, attendance: responseWithSGT})

    } else {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({error: "Fail to update edit attendance request"})
    }

})



// DELETE an attendance record (only admin is allowed)
const deleteAttendance = asyncWrapper(async(req, res) => {

    const payload = req.employee

    // get the employee_id from the request parameter
    const {attendance_id} = req.params

    if (payload.role !== 'A') {
        throw new ForbiddenError("This side is forbidden")
    }

    // delete the attendance
    const deleteAttendance = await Attendance.destroy({
        where: {attendance_id}
    })

    console.log('deleteA',deleteAttendance)

    if (deleteAttendance[0] === 0) {
        throw new NotFoundError("Attendance id  not found!")
    }

    return res.status(StatusCodes.OK).json({msg: `Attendance with ID ${attendance_id} deleted!`})

})

module.exports = {
    getAllAttendance, 
    clockIn,
    clockOut,
    getEditAttendanceRequest,
    editAttendance_W,
    deleteEditAttendance_W,
    updateAttendanceRecord,
    responseEditAttendanceRequest_E_A,
    deleteAttendance,
    markAsRead,
    recreateAttendance,
    getRecentAttendance
}