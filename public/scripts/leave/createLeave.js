// Get references to the elements
const editLeaveForm = document.getElementById("editLeaveForm");
const loadingMessageDiv = document.getElementById("loadingMessage"); // Element to show loading state
const messageDiv = document.getElementById("message"); // Element to display messages (success/error)
const date = document.getElementById("date"); 
const type = document.getElementById("type");
const duration = document.getElementById("duration");
const leave_remarks = document.getElementById("leave_remarks");


// --- Start of code for learners to complete (Form Submission / PUT Request) ---

// Add an event listener for the form submission (for the Update operation)
editLeaveForm.addEventListener("submit", async (event) => {
    event.preventDefault(); // Prevent the default browser form submission

    console.log("Edit form submitted (POST logic to be implemented)");
    console.log(date.value)
	const leaveData = {
        date: date.value,
        type: type.value,
        duration: duration.value,
        leave_remarks: leave_remarks.value
    }

	console.log(leaveData)

    try {
        const response = await fetch(`${apiBaseUrl}/api/leave/`, {

            method: "POST",
            // TODO: Set the 'Content-Type': 'application/json' header
            headers: {
            "Content-Type": "application/json",
				...(token && { "Authorization": `Bearer ${token}` }) // Add header if token exists
			},
            // TODO: Include the updated data in the request body (as JSON string)
            body: JSON.stringify(leaveData)
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
			const l = responseBody.leave[0]
            // If attendance data was successfully fetched, populate the form
            const leaveElement = document.createElement("div");

            leaveElement.classList.add("leave-item");
            leaveElement.innerHTML = `
                        <h3>start date time: <span style="color: rgb(31, 202, 31);">${l.start_date_time}</span></h3>
                        <h3>end date time: <span style="color: rgb(173, 29, 18);">${l.end_date_time}</span></h3>
                        <p style="color: Blue">${l.day}</p>
                        <p>Leave ID: <span class="data">${l.leave_id}</span><p>
                        <p>Attendance ID: <span class="data">${l.attendance_id}</span></p>
                        <p>Employee ID: <span class="data">${l.employee_id}</span><p>
                        <p>Duration: <span class="data">${l.duration}</span></p>
                        <p>type: <span class="data">${l.type}</span></p>
                        <p>leave_remarks: <span class="data">${l.leave_remarks}</span></p>
                        <p>status: <span class="data" style="color: red">${l.status}</span></p>
                        <p>submit_date_time: <span class="data">${l.submit_date_time}</span></p>
                        <p>response_date_time: <span class="data">${l.response_date_time}</span></p>
                        <p>withdraw_date_time: <span class="data">${l.withdraw_date_time}</span></p>
                        <p>manager_id: <span class="data">${l.manager_id}</span></p>
            `;

            messageDiv.appendChild(leaveElement)

        } else {
            const errMsg = parseError(responseBody);
            messageDiv.innerHTML = `Failed to update status: ${errMsg}`;
            messageDiv.style.color = "red";
        }
  } catch (err) {
    console.error("Error applying leave:", err);
    messageDiv.textContent = `Failed to apply leave request: ${err.message}`;
    messageDiv.style.color = "red"
  }

});

