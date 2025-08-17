const express = require("express")
const router = express.Router()
const { validateAttendanceId } = require("../Middlewares/validation/utils/validateId")
const { 
        clockIn, 
        clockOut, 
        getAllAttendance,
        getEditAttendanceRequest, 
        editAttendance_W,
        deleteEditAttendance_W,
        responseEditAttendanceRequest_E_A,
        markAsRead,
        updateAttendanceRecord,
        recreateAttendance,
        deleteAttendance,
        getRecentAttendance
         } = require("../Controllers/attendanceController")
    
const {
        validateClockInAttendance, 
        validateClockOutAttendance, 
        validateEditAttendance_W,
        validateMarkRead,
        validateEditAttendance_E_A,
        validateEditAttendanceResponse,
        validateQueryMiddleware } = require("../Middlewares/validation/attendanceJoi")


router.route('/')
    .get( validateQueryMiddleware, getAllAttendance ) // get attendance
    .post( validateEditAttendance_W, recreateAttendance ) // to recreate attendance for those forgot to clock in /out


// GET Last 3 Attendance Records for the logged-in employee
router.get('/recent', getRecentAttendance);



// for clock in /out
router.route('/markAttendance')
    .post( validateClockInAttendance, clockIn ) // admin, employer, worker
    .put( validateClockOutAttendance, clockOut) // admin, employer, worker


// for admin to destroy the attendance
router.route('/deleteAttendance/:attendance_id')
    .delete( validateAttendanceId, deleteAttendance) // admin


// employer response ot_req_status or edit_status, admin can change the manager_id in the attendance table from here also & only
router.route('/responseReq/:attendance_id')
    .put( validateAttendanceId, validateEditAttendanceResponse, updateAttendanceRecord)  // admin, employer


// mark as read
router.route('/markRead/:attendance_id')
    .put( validateAttendanceId, validateMarkRead, markAsRead )  // worker


// get edit attendance request
router.route('/editAttendanceReq/').get(getEditAttendanceRequest)  // admin, employer, worker


// for submitting request of editing attendance
router.route('/editAttendanceReq/:attendance_id')
    .all( validateAttendanceId )
    .post( validateEditAttendance_W, editAttendance_W ) // Worker
    // PUT employer response to the edit attendance req in edit_attendance_request table, admin can change the manager_id in the attendance_edit_request table from here also
    .put(  responseEditAttendanceRequest_E_A ) // admin, employer  
    .delete( deleteEditAttendance_W )

module.exports = router

