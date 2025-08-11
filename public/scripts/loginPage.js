async function loginUser(event) 
{
    //Prevent event bubbling if called from a form submit event
    if (event) event.preventDefault(); 
    const apiBaseUrl = "http://localhost:3013";
    const messageDiv = document.getElementById("errMsg");
    //messageDiv.textContent = ""; // Clear previous messages
    const loginForm = document.getElementById("loginForm");
    const email = document.querySelector('.email');
    const password = document.querySelector('.password');

    const loginData = {
        email: email.value,
        hashed_password: password.value,
    };
    console.log(loginData);

        try {
        // Make a POST request to your API endpoint
        const response = await fetch(`${apiBaseUrl}/api/auth/login`, {
            method: "POST", // Specify the HTTP method
            headers: {
                "Content-Type": "application/json", // Tell the API we are sending JSON
            },
            body: JSON.stringify(loginData), // Send the data as a JSON string in the request body
        });

        // const data  = await response.json()
        // console.log(data)
        // console.log(data.status)
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
            loginForm.reset(); // Clear the form after success
            window.location.href = "/html/homePage.html"; // Redirect user to books page.
        } else if (response.status === 401) {
            // Handle validation errors from the API (from Practical 04 validation middleware)
            messageDiv.textContent = `Authentication Error: ${responseBody.error}`;
            messageDiv.style.color = "red";
            console.log("Login failed");
        } else if (response.status === 500) {
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