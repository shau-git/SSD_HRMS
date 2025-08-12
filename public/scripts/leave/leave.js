document.querySelector('.leave-hist').addEventListener("click", () => {
    window.location.href = `leaveHist.html`
})


const leaveReq = document.querySelector('.leave-req')
const adminEmp = document.querySelector('.admin-employer')


if (role === 'A' || role === 'E') {

    // make both of them appear
    leaveReq.style.display = 'flex'
    adminEmp.style.display = 'flex'

    leaveReq.addEventListener("click", () => {
        window.location.href = `Leave_Req.html`
    })

    adminEmp.addEventListener("click", () => {
        window.location.href = `adminEmployerLeave.html`
    })

}