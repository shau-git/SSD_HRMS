const checkToken = localStorage.getItem('token')
const is_new = localStorage.getItem('is_new')

if(!checkToken) {
   window.location.href = "/"
}


if(is_new === true || is_new == 'true') {
    window.location.href = "/"
}