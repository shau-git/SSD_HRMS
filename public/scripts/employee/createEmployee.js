const createEmployeeForm = document.getElementById("createEmployeeForm");
const messageDiv = document.getElementById("message"); // Element to display messages (success/error)
const firstName = document.getElementById("first_name"); 
const lastName = document.getElementById("last_name");
const hashed_password = document.getElementById("hashed_password");
const email = document.getElementById("email");
const registerRole = document.getElementById("role");
const medical_leave = document.getElementById("ML");
const annual_leave = document.getElementById("AL");
const manager_id = document.getElementById("manager_id");

// --- Start of code for learners to complete (Form Submission / PUT Request) ---

// Add an event listener for the form submission (for the Update operation)
createEmployeeForm.addEventListener("submit", async (event) => {
    event.preventDefault(); // Prevent the default browser form submission

    const employeeData = {
       first_name: firstName.value,
       last_name: lastName.value,
       hashed_password: hashed_password.value,
       email: email.value,
       role: registerRole.value,
       medical_leave: medical_leave.value,
       annual_leave: annual_leave.value,
       manager_id: manager_id.value
    };


	console.log(employeeData)

    try {
        const response = await fetch(`${apiBaseUrl}/api/auth/register`, {

            method: "POST",
            // TODO: Set the 'Content-Type': 'application/json' header
            headers: {
            "Content-Type": "application/json",
				...(token && { "Authorization": `Bearer ${token}` }) // Add header if token exists
			},
            // TODO: Include the updated data in the request body (as JSON string)
            body: JSON.stringify(employeeData)
        });
        
      
        const responseBody = response.headers
            .get("content-type")
            ?.includes("application/json")
            ? await response.json()
            : {message: response.statusText};


        // TODO: Provide feedback to the user using the messageDiv (success or error messages)
        if (response.status === 201) {
            messageDiv.innerHTML = ""
            messageDiv.style.color = "black"
			const e = responseBody.employee[0]
            // If employee data was successfully fetched, populate the form
            const employeeElement = document.createElement("div");
            employeeElement.innerHTML = await employeeHTMLFunc(e)
            employeeElement.classList.add("employee-item");
            messageDiv.appendChild(employeeElement)

        } else {
            const errMsg = parseError(responseBody);
            messageDiv.innerHTML = `Failed to register employee: ${errMsg}`;
            messageDiv.style.color = "red";
        }
  } catch (err) {
    console.error("Error registering employee:", err);
    messageDiv.textContent = `Failed to register employee: ${err.message}`;
    messageDiv.style.color = "red"
  }

});


