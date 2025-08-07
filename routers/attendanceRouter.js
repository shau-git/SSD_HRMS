const express = require("express")
const router = express.Router()
const { validateAttendanceId } = require("../Middlewares/validation/utils/validateId")
const { 
        clockIn, 
        clockOut, 
        getAllAttedance,
        getEditAttendanceRequest, 
        editAttendance_W,
        deleteEditAttendance_W,
        response_edit_request_E_A,
        markAsRead,
        responseReqStatus,
        recreateAttendance
         } = require("../Controllers/attendanceController")
    
const {
        validateClockInAttendance, 
        validateClockOutAttendance, 
        validateEditAttendance_W,
        validateMarkRead,
        validateEditAttendance_E_A,
        validateEditAttendanceResponse } = require("../Middlewares/validation/attendanceJoi1")


router.route('/')
    .get(getAllAttedance) // get attendance
    .post( validateEditAttendance_W, recreateAttendance) // to recreate attendance for those forgot to clock in /out


// for clock in /out
router.route('/markAttendance')
    .post( validateClockInAttendance, clockIn ) // admin, employer, worker
    .put( validateClockOutAttendance, clockOut) // admin, employer, worker

// employer response ot_req_status or edit_status, admin can change the manager_id in the attendance table from here also & only
router.route('/responseReq/:attendance_id')
    .all( validateAttendanceId )
    .put( validateEditAttendanceResponse, responseReqStatus)  // admin, employer

// get edit attendance request
router.route('/editAttendanceReq/').get(getEditAttendanceRequest)  // admin, employer, worker

// mark as read
router.route('/markRead/:attendance_id')
    .all( validateAttendanceId )
    .put( validateMarkRead, markAsRead )  // worker

// for submitting request of editing attendance
router.route('/editAttendanceReq/:attendance_id')
    .all( validateAttendanceId )
    .post( validateEditAttendance_W, editAttendance_W ) // Worker
    // PUT employer response to the edit attendance req in edit_attendance_request table, admin can change the manager_id in the attendance_edit_request table from here also & only
    .put( validateEditAttendance_E_A, response_edit_request_E_A ) // admin, employer 
    .delete( deleteEditAttendance_W )

module.exports = router

