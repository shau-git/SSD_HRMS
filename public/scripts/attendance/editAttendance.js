// Get references to the elements
const editAttendanceForm = document.getElementById("editAttendanceForm");
const loadingMessageDiv = document.getElementById("loadingMessage"); // Element to show loading state
const messageDiv = document.getElementById("message"); // Element to display messages (success/error)
const attendanceIdInput = document.getElementById("attendance_id"); 
const editStartDateTime = document.getElementById("start_date_time"); 
const editEndDateTime = document.getElementById("end_date_time");
const editRemarks = document.getElementById("remarks");
const isOtCheckbox = document.getElementById("is_ot");
const editHoursOfOT = document.getElementById("hours_of_ot");
const hoursOTContainer = document.getElementById("hours_ot_container");



// Function to get attendance ID from URL query parameter (e.g., edit.html?id=1)
function getAttendanceIdFromUrl() {
  const params = new URLSearchParams(window.location.search); // Get URL query parameters
  return params.get("attendance_id"); // Return the value of the 'id' parameter
}

// Function to fetch existing attendance data from the API based on ID
async function fetchAttendanceData(attendance_id) {
  try {

    // Make a GET request to the API endpoint for a specific attendance
    const response = await fetch(`${apiBaseUrl}/api/attendance?attendance_id=${attendance_id}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            ...(token && { "Authorization": `Bearer ${token}` }) // Add header if token exists
        },
    });


    // Check if the HTTP response status is not OK (e.g., 404, 500)
    // Attempt to read error body if available (assuming JSON), otherwise use status text
    const responseBody = response.headers
            .get("content-type")
            ?.includes("application/json")
            ? await response.json()
            : {message: response.statusText};


    if(response.status === 200) {
        return responseBody; // Return the fetched attendance object
    } else {
            const errMsg = parseError(responseBody);
            messageDiv.innerHTML = `Failed to update status: ${errMsg}`;
            messageDiv.style.color = "red";
    }

  } catch (err) {
    // Catch any errors during the fetch or processing
    console.error("Error fetching Attendance data:", err);
    // Display an error message to the user
    messageDiv.textContent = `Failed to load attendance data: ${err.message}`;
    messageDiv.style.color = "red";
    loadingMessageDiv.textContent = ""; // Hide loading message if it was shown
    return null; // Indicate that fetching failed
  }
}

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

// Function to populate the form fields with the fetched attendance data
function populateForm(attendance) {
	attendanceIdInput.value = attendance.attendance_id; // Store the attendance ID in the hidden input
	editStartDateTime.value = attendance.start_date_time; 
	editEndDateTime.value = attendance.end_date_time; 
	editRemarks.value = attendance.remarks; 

	// if the is_ot is checked, make the hours_of_ot appear
	isOtCheckbox.checked = attendance.is_ot === true //|| attendance.is_ot === "true";
	toggleHoursField()
	editHoursOfOT.value = attendance.hours_of_ot || "";


	loadingMessageDiv.style.display = "none"; // Hide the loading message
	editAttendanceForm.style.display = "block"; // Show the edit form
}

// --- Code to run when the page loads ---

// Get the attendance ID from the URL when the page loads
const attendanceIdToEdit = getAttendanceIdFromUrl();

// Check if a attendance ID was found in the URL
if (attendanceIdToEdit) {
    // If an ID exists, fetch the attendance data and then populate the form
    fetchAttendanceData(attendanceIdToEdit).then((attendance) => {
        if (attendance) {
        // If attendance data was successfully fetched, populate the form
        populateForm(attendance.attendances[0]);
        } else {
        // Handle the case where fetchAttendanceData returned null (Attendance not found or error)
        loadingMessageDiv.textContent = "Attendance not found or failed to load.";
        messageDiv.textContent = "Could not find the attendance to edit.";
        messageDiv.style.color = "red";
        }
    });
} else {
	// Handle the case where no attendance ID was provided in the URL
	loadingMessageDiv.textContent = "No attendance ID specified for editing.";
	messageDiv.textContent =
		"Please provide an attendance ID in the URL (e.g., editAttendance.html?attendance_id=1).";
	messageDiv.style.color = "orange";
}

// --- Start of code for learners to complete (Form Submission / PUT Request) ---

// Add an event listener for the form submission (for the Update operation)
editAttendanceForm.addEventListener("submit", async (event) => {
    event.preventDefault(); // Prevent the default browser form submission

    console.log("Edit form submitted (POST logic to be implemented)");

	const attendanceData = {}
    // TODO: Collect updated data from form fields
	attendanceData.start_date_time = editStartDateTime.value;
	attendanceData.end_date_time = editEndDateTime.value;
	attendanceData.remarks = editRemarks.value;

	attendanceData.is_ot = isOtCheckbox.checked === true ? true:false;

	if(editHoursOfOT.value) {
		attendanceData.hours_of_ot = editHoursOfOT.value
	}

    // TODO: Get the attendance ID from the hidden input (attendanceIdInput.value)
    const attendance_Id = attendanceIdInput.value;


    try {
        const response = await fetch(`${apiBaseUrl}/api/attendance/editAttendanceReq/${attendance_Id}`, {

            // in my backend, to edit an attendance, will firstly create a data in attendance_edit_request table, if employer approve will only update the Attendance table
            method: "POST",
            // TODO: Set the 'Content-Type': 'application/json' header
            headers: {
            "Content-Type": "application/json",
				...(token && { "Authorization": `Bearer ${token}` }) // Add header if token exists
			},
            // TODO: Include the updated data in the request body (as JSON string)
            body: JSON.stringify(attendanceData)
        });
        
        // TODO: Handle the API response (check status 200 for success, 400 for validation, 404 if attendance not found, 500 for server error)
        const responseBody = response.headers
            .get("content-type")
            ?.includes("application/json")
            ? await response.json()
            : {message: response.statusText};

        console.log(responseBody)

        // TODO: Provide feedback to the user using the messageDiv (success or error messages)
        if (response.status === 201) {
            messageDiv.innerHTML = ""
            messageDiv.style.color = "black"

            const a = responseBody.attendanceReq[0]
            const attendanceElement = document.createElement("div");
            attendanceElement.classList.add("attendance-item");
            attendanceElement.innerHTML = `
                <h3>start date time: <span style="color: rgb(31, 202, 31);">${a.start_date_time}</span></h3>
                <h3>end date time: <span style="color: rgb(173, 29, 18);">${a.end_date_time}</span></h3>
                <p style="color: Blue">${a.day}</p>
                <p>Request ID: <span class="data">${a.request_id}</span></p>
                <p>Attendance ID: <span class="data">${a.attendance_id}</span></p>
                <p>is_ot: <span class="data">${a.is_ot}</span></p>
                <p>hours_of_ot: <span class="data">${a.hours_of_ot}</span></p> 
                <p>remarks: <span class="data">${a.remarks}</span></p>
                <p>edit_status: <span class="data" style="color: red">${a.edit_status}</span></p>
                <p>edit_date_time: <span class="data">${a.edit_date_time}</span></p>
                <p>manager_id: <span class="data">${a.manager_id}</span></p>
            `

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

