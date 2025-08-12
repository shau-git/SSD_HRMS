document.querySelector('.logout-btn').addEventListener('click', () => {
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    window.location.href = `/`
})