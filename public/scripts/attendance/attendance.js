document.querySelector('.attendance-hist').addEventListener("click", () => {
    window.location.href = `/html/attendance/attendanceHist.html`
})

document.querySelector('.attendance-edit-req').addEventListener("click", () => {
    window.location.href = `/html/attendance/getAttendanceEdit.html`
})


const OTReq = document.querySelector('.ot-req')
const newAttendanceRequest = document.querySelector('.new-attendance-req')
const adminEmp = document.querySelector('.admin-employer')


if (role === 'A' || role === 'E') {

    // make both of them appear
    newAttendanceRequest.style.display = 'flex'
    OTReq.style.display = 'flex'
    adminEmp.style.display = 'flex'

    newAttendanceRequest.addEventListener("click", () => {
        window.location.href = `/html/attendance/newAttendanceReq.html`
    })

    OTReq.addEventListener("click", () => {
        window.location.href = `/html/attendance/OT_Req.html`
    })

    adminEmp.addEventListener("click", () => {
        window.location.href = `/html/attendance/adminEmployerAttendance.html`
    })

}