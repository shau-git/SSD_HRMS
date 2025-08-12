const checkToken = localStorage.getItem('token')
if(!checkToken) {
   window.location.href = "/"
}