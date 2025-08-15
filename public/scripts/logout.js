document.querySelector('.logout-btn').addEventListener('click', () => {
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    localStorage.removeItem('employee_id')
    localStorage.removeItem('is_new')
    window.location.href = `/`
})