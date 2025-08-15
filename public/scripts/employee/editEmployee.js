// Get references to the elements
const editEmployeeForm = document.getElementById("editEmployeeForm");
const loadingMessageDiv = document.getElementById("loadingMessage"); // Element to show loading state
const messageDiv = document.getElementById("message"); // Element to display messages (success/error)
const employeeIdInput = document.getElementById("employee_id"); 
const firstName = document.getElementById("first_name"); 
const lastName = document.getElementById("last_name");
const email = document.getElementById("email");
const registerRole = document.getElementById("role");
const medical_leave = document.getElementById("ML");
const annual_leave = document.getElementById("AL");
const manager_id = document.getElementById("manager_id");
const hashed_password = document.getElementById("hashed_password")

// Function to get employee ID from URL query parameter (e.g., edit.html?id=1)
function getEmployeeIdFromUrl() {
  const params = new URLSearchParams(window.location.search); // Get URL query parameters
  return params.get("employee_id"); // Return the value of the 'id' parameter
}


// Function to populate the form fields with the fetched attendance data
function populateForm(employee) {
console.log(employee)
console.log(firstName)
    employeeIdInput.value = employee.employee_id // Store the employee ID in the hidden input
    firstName.value = employee.first_name
    lastName.value = employee.last_name
    email.value = employee.email
    registerRole.value = employee.role
    medical_leave.value = employee.medical_leave
    annual_leave.value = employee.annual_leave
    manager_id.value = employee.manager_id
}

// --- Code to run when the page loads ---

// Get the employee ID from the URL when the page loads
const employeeToEdit = getEmployeeIdFromUrl();

// Check if a employee ID was found in the URL
if (employeeToEdit) {
    console.log(employeeToEdit)
    // If an ID exists, fetch the employee data and then populate the form
    fetchEmployee(employeeToEdit).then((e) => {
        console.log(e)
        if (e) {
            // If attendance data was successfully fetched, populate the form
            populateForm(e.employee[0]);
        } else {
            // Handle the case where fetchEmployeetendanceData returned null (Attendance not found or error)
            loadingMessageDiv.textContent = "Employee not found or failed to load.";
            messageDiv.textContent = "Could not find the employee to edit.";
            messageDiv.style.color = "red";
        }
    });
} else {
	// Handle the case where no employee ID was provided in the URL
	loadingMessageDiv.textContent = "No employee ID specified for editing.";
	messageDiv.textContent =
		"Please provide an attendance ID in the URL (e.g., editEmployee.html?employee_id=1).";
	messageDiv.style.color = "orange";
}

// --- Start of code for learners to complete (Form Submission / PUT Request) ---

// Add an event listener for the form submission (for the Update operation)
editEmployeeForm.addEventListener("submit", async (event) => {
    event.preventDefault(); // Prevent the default browser form submission

    console.log("Edit form submitted (POST logic to be implemented)");

    // To  Collect updated data from form fields
    const employeeData = {
       first_name: firstName.value,
       last_name: lastName.value,
       email: email.value,
       role: registerRole.value,
       medical_leave: medical_leave.value,
       annual_leave: annual_leave.value,
       manager_id: manager_id.value
    };
    
    if(hashed_password.value) {
        employeeData.hashed_password = hashed_password.value
    }

    // TODO: Get the employee ID from the hidden input (employeeIdInput.value)
    const employee_id = employeeIdInput.value;

	console.log('to change', employeeData)
    // TODO: Implement the fetch PUT request to the API endpoint 
    try {
        const response = await fetch(`${apiBaseUrl}/api/employee/${employee_id}`, {

            method: "PUT",
            // TODO: Set the 'Content-Type': 'application/json' header
            headers: {
            "Content-Type": "application/json",
				...(token && { "Authorization": `Bearer ${token}` }) // Add header if token exists
			},
            // TODO: Include the updated data in the request body (as JSON string)
            body: JSON.stringify(employeeData)
        });
        
        // TODO: Handle the API response (check status 200 for success, 400 for validation, 404 if attendance not found, 500 for server error)
        const responseBody = response.headers
            .get("content-type")
            ?.includes("application/json")
            ? await response.json()
            : {message: response.statusText};

        console.log(responseBody)

        // TODO: Provide feedback to the user using the messageDiv (success or error messages)
        if (response.status === 200) {
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
            messageDiv.innerHTML = `Failed to update employee data: ${errMsg}`;
            messageDiv.style.color = "red";
        }

  } catch (err) {
    console.error("Error updating employee data:", err);
    messageDiv.textContent = `Failed to update employee data: ${err.message}`;
    messageDiv.style.color = "red"
  }

});

