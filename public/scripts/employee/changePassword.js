const password = document.querySelector('.password')
const confirmPAssword = document.querySelector('.confirm-password')
const errMsgDiv = document.querySelector('#ErrorMessage');
const passwordForm = document.querySelector('#password-form')

document.querySelectorAll('button[type="submit"]')[0].addEventListener('click', async() => {
    event.preventDefault()
    if(password.value !== confirmPAssword.value) {
        console.log(errMsgDiv)
        errMsgDiv.innerHTML = `<p>Password & confirm Password must be the same</p>`
    } else {
        console.log(errMsgDiv)
        errMsgDiv.innerHTML = ``
        await changingPassword()

    }
})


async function changingPassword() {
    const hashed_password = document.querySelector('.confirm-password')
    try {
        const response = await fetch(`${apiBaseUrl}/api/employee/${employee_id}`, {

            method: "PUT",
            // TODO: Set the 'Content-Type': 'application/json' header
            headers: {
            "Content-Type": "application/json",
                ...(token && { "Authorization": `Bearer ${token}` }) // Add header if token exists
            },
            // TODO: Include the updated data in the request body (as JSON string)
            body: JSON.stringify({hashed_password: hashed_password.value})
        });
    
        // TODO: Handle the API response (check status 200 for success, 400 for validation, 404 if attendance not found, 500 for server error)
        const responseBody = response.headers
            .get("content-type")
            ?.includes("application/json")
            ? await response.json()
            : {message: response.statusText};

        if (response.status === 200) {
            errMsgDiv.innerHTML = ""
            errMsgDiv.style.color = "black"

            // if the is_new is_changed to false in the database, means user has successfully changed the password
            const {is_new} = responseBody.employee[0]
            console.log('is_new', is_new)
            // If employee data was successfully fetched, populate the form
            if(is_new === true) {
                throw new Error(`Something wrong`)
            }
            passwordForm.reset()

            // reset the is_new value in localstorage
            localStorage.setItem('is_new', is_new)
            window.location.href = "/html/homePage.html"

        } else {
            const errMsg = parseError(responseBody);
            errMsgDiv.innerHTML = `Failed to change password: ${errMsg}`;
            errMsgDiv.style.color = "red";
        }
    } catch (err) {
            console.error(err);
            errMsgDiv.textContent = err.message;
            errMsgDiv.style.color = "red"
    }
} 