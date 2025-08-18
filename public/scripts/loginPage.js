const checkToken = localStorage.getItem('token')

if(checkToken) {
   window.location.href = "/html/homePage.html"
} 

async function loginUser(event) 
{
    //Prevent event bubbling if called from a form submit event
    if (event) event.preventDefault(); 
    //const apiBaseUrl = "http://localhost:3013";
    const messageDiv = document.getElementById("errMsg");
    //messageDiv.textContent = ""; // Clear previous messages
    const loginForm = document.getElementById("loginForm");
    const email = document.querySelector('.email');
    const password = document.querySelector('.password');

    const loginData = {
        email: email.value,
        hashed_password: password.value,
    };
    // console.log(loginData);

        try {
        // Make a POST request to your API endpoint
        const response = await fetch(`${apiBaseUrl}/api/auth/login`, {
            method: "POST", // Specify the HTTP method
            headers: {
                "Content-Type": "application/json", // Tell the API we are sending JSON
            },
            body: JSON.stringify(loginData), // Send the data as a JSON string in the request body
        });

        // Check for API response status (e.g., 201 Created, 400 Bad Request, 500 Internal Server Error)
        const responseBody = response.headers
            .get("content-type")
            ?.includes("application/json")
            ? await response.json()
            : { message: response.statusText };

        if (response.status === 200 || response.status === 201 ) {

            console.log("Login successful");
            messageDiv.textContent = "Login successful";
            messageDiv.style.color = "green";
            // Store JWT token in local storage
            if (responseBody.token) {
                localStorage.setItem("token", responseBody.token);
            }
            if (responseBody.employee) {
                console.log(responseBody.employee)
                localStorage.setItem("role", responseBody.employee.role);
                localStorage.setItem("employee_id", responseBody.employee.employee_id);
                localStorage.setItem("is_new", responseBody.employee.is_new);
            }
            loginForm.reset(); // Clear the form after success
            window.location.href = "/html/homePage.html"; // Redirect user to attendnace page.

        } else if (response.status === 401 && responseBody.msg === 'Please change your password') { // new user login, require them to change password
            
            if (responseBody.token) {
                localStorage.setItem("token", responseBody.token);
            }
            if (responseBody.employee) {
                console.log(responseBody.employee)
                localStorage.setItem("role", responseBody.employee.role);
                localStorage.setItem("employee_id", responseBody.employee.employee_id);
                localStorage.setItem("is_new", responseBody.employee.is_new);
            }
            window.location.href = "/html/changePassword.html"

        } else if (response.status === 401 || response.status === 400) {  // having authentication error

            messageDiv.textContent = `Authentication Error: ${responseBody.error}`;
            messageDiv.style.color = "red";
            console.log("Login failed");

        } else if (response.status === 500) {  // server error

            messageDiv.textContent = `${responseBody.error}`;
            messageDiv.style.color = "red";
            console.log("Login failed");

        } else {

            // Handle other potential API errors (e.g., 500 from error handling middleware)
            throw new Error(
                `API error! status: ${response.status}, message: ${responseBody.error}`
            );

        }
    } catch (error) {

        console.error(error)
        messageDiv.textContent = `Failed to login: ${error.message}`;
        messageDiv.style.color = "red";
    }

}