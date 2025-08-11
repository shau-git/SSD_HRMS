const express = require("express")
const router = express.Router()
const { validateId } = require("../Middlewares/validation/utils/validateId")
const { 
        getAllLeaveHist, 
        applyLeave,
        markAsRead,
        withdrawLeave,
        updateLeaveRecord
         } = require("../Controllers/leaveController")
    
const {
        validateApplyLeave, 
        validateUpdateLeave,
        validateReadStatus,
        validateReadWithdrawStatus,
        validateQueryMiddleware} = require("../Middlewares/validation/leaveJoi")


router.route('/')
        .get( validateQueryMiddleware, getAllLeaveHist )
        .post( validateApplyLeave, applyLeave) 


router.route('/markRead/:leave_id')
    .put( validateId, validateReadStatus, markAsRead)


router.route('/markReadWithdraw/:leave_id')
    .put( validateId, validateReadWithdrawStatus, markAsRead)


router.route('/:leave_id')
        .all( validateId )
        .put( validateUpdateLeave, updateLeaveRecord )
        .delete( withdrawLeave )

module.exports = router