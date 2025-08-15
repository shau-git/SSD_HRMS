// Get references to the elements
const editAttendanceForm = document.getElementById("editAttendanceForm");
const messageDiv = document.getElementById("message"); // Element to display messages (success/error)
const attendanceIdInput = document.getElementById("attendance_id"); 
const editStartDateTime = document.getElementById("start_date_time"); 
const editEndDateTime = document.getElementById("end_date_time");
const editRemarks = document.getElementById("remarks");
const isOtCheckbox = document.getElementById("is_ot");
const editHoursOfOT = document.getElementById("hours_of_ot");
const hoursOTContainer = document.getElementById("hours_ot_container");



// Show/hide hours_of_ot depending on is_ot
function toggleHoursField() {
    if (isOtCheckbox.checked) {
        hoursOTContainer.style.display = "block";
        editHoursOfOT.required = true;
    } else {
        hoursOTContainer.style.display = "none";
        editHoursOfOT.required = false;
        editHoursOfOT.value = ""; // Clear if unchecked
    }
}
isOtCheckbox.addEventListener("change", toggleHoursField);



// --- Start of code for learners to complete (Form Submission / PUT Request) ---

// Add an event listener for the form submission (for the Update operation)
editAttendanceForm.addEventListener("submit", async (event) => {
    event.preventDefault(); // Prevent the default browser form submission

    console.log("Edit form submitted (POST logic to be implemented)");

    const attendanceData = {
        start_date_time: editStartDateTime.value,
        end_date_time: editEndDateTime.value,
        remarks: editRemarks.value,
    };

	attendanceData.is_ot = isOtCheckbox.checked === true ? true:false;

	if(editHoursOfOT.value) {
		attendanceData.hours_of_ot = editHoursOfOT.value
	}

	console.log(attendanceData)

    try {
        const response = await fetch(`${apiBaseUrl}/api/attendance/`, {

            method: "POST",
            // TODO: Set the 'Content-Type': 'application/json' header
            headers: {
            "Content-Type": "application/json",
				...(token && { "Authorization": `Bearer ${token}` }) // Add header if token exists
			},
            // TODO: Include the updated data in the request body (as JSON string)
            body: JSON.stringify(attendanceData)
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
			const a = responseBody.attendanceReq[0]
            // If attendance data was successfully fetched, populate the form
            const attendanceElement = document.createElement("div");

            attendanceElement.classList.add("attendance-item");
            attendanceElement.innerHTML = `
                        <h3>start date time: <span style="color: rgb(31, 202, 31);">${a.start_date_time}</span></h3>
                        <h3>end date time: <span style="color: rgb(173, 29, 18);">${a.end_date_time}</span></h3>
                        <p style="color: Blue">${a.day}</p>
                        <p>Attendance ID: <span class="data">${a.attendance_id}</span></p>
                        <p>Employee ID: <span class="data">${a.employee_id}</span><p>
                        <p>Leave ID: <span class="data">${a.leave_id}</span><p>
                        <p>total_min_work: <span class="data">${a.total_min_work}</span></p>
                        <p>total_min_adjusted: <span class="data">${a.total_min_adjusted}</span></p>
                        <p>is_ot: <span class="data">${a.is_ot}</span></p>

                        <p>hours_of_ot: <span class="data">${a.hours_of_ot}</span></p> 
                        <p>remarks: <span class="data">${a.remarks}</span></p>
                        <p>leave_remarks: <span class="data">${a.leave_remarks}</span></p>
                        <p>is_amended: <span class="data">${a.is_amended}</span></p>
                        <p>edit_status: <span class="data">${a.edit_status}</span></p>
                        <p>ot_req_status: <span class="data">${a.ot_req_status}</span></p>
                        <p>edit_date_time: <span class="data">${a.edit_date_time}</span></p>
                        <p>response_date_time: <span class="data">${a.response_date_time}</span></p>
                        <p>manager_id: <span class="data">${a.manager_id}</span></p>
            `;

            messageDiv.appendChild(attendanceElement)

        } else {
            const errMsg = parseError(responseBody);
            messageDiv.innerHTML = `Failed to update status: ${errMsg}`;
            messageDiv.style.color = "red";
        }
  } catch (err) {
    console.error("Error updating Attendance:", err);
    messageDiv.textContent = `Failed to submit edit attendance request: ${err.message}`;
    messageDiv.style.color = "red"
  }

});

