const messageDiv = document.getElementById('message')
const attendanceParentDiv = document.getElementById("attendance-parent-div"); // Element to show loading state
// const apiBaseUrl = "http://localhost:3013";

function getAttendanceIdFromUrl() {
    const params = new URLSearchParams(window.location.search) // Get URL query parameters
    return params.get("attendance_id") // Return the value of the 'id' parameter
}

async function fetchAttendanceData(attendance_id) {
    try {

        // Make a GET request to your API endpoint
        const response = await fetch(`${apiBaseUrl}/api/attendance?attendance_id=${attendance_id}`, {
        method: "GET",
        headers: {
                "Content-Type": "application/json",
                ...(token && { "Authorization": `Bearer ${token}` }) // Add header if token exists
            },
        });


        const responseBody = response.headers
                .get("content-type")
                ?.includes("application/json")
                ?await response.json()
                : {message: response.statusText};

        if(response.status === 200) {
            return responseBody

        } else if (response.status === 404) {
            messageDiv.innerHTML = `No Attendance Record`;
            messageDiv.style.color = "black";
        } else {
            const errMsg = parseError(responseBody);
            messageDiv.innerHTML = `${errMsg}`;
            messageDiv.style.color = "red";
        }

    } catch (error) {
        messageDiv.textContent = `Failed to load attendance data: ${error.message}`;
        messageDiv.style.color = "red";
        attendanceParentDiv.textContent = ""; // Hide loading message if it was shown
        return null; // Indicate that fetching failed
    }
}



// --- Code to run when the page loads ---

// Get the attendance ID from the URL when the page loads
const AttendanceIdToEdit = getAttendanceIdFromUrl();


// Check if the attendance was found in the URL
if (AttendanceIdToEdit) {
    // If an ID exists, fetch the attendance data and then populate the form
    fetchAttendanceData(AttendanceIdToEdit).then((attendance) => {
        if (attendance) {
            const a = attendance.attendances[0]
            attendanceParentDiv.innerText = ""; // Clear loading message
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
                        <p>is_amended: <span class="data" style="color: red;">${a.is_amended}</span></p>
                        <p>edit_status: <span class="data">${a.edit_status}</span></p>
                        <p>ot_req_status: <span class="data">${a.ot_req_status}</span></p>
                        <p>edit_date_time: <span class="data">${a.edit_date_time}</span></p>
                        <p>response_date_time: <span class="data">${a.response_date_time}</span></p>
                        <p>manager_id: <span class="data">${a.manager_id}</span></p>
            `;

            attendanceParentDiv.appendChild(attendanceElement);

            // adding features for admin to change manager id
            if(role === 'A') {
                const managerUpdateForm = document.createElement("div");
                console.log('create')
                managerUpdateForm.innerHTML = `
                    <hr>
                    <h4>Admin: Update Manager ID</h4>
                    <form id="managerUpdateForm">
                        <label for="newManagerId">New Manager ID:</label>
                        <input type="number" id="newManagerId" name="newManagerId" min="1" required>
                        <button type="submit">Update</button>
                    </form>
                `;

                attendanceParentDiv.appendChild(managerUpdateForm);
            }
            

            // Add event listener to the form
            document.getElementById('managerUpdateForm').addEventListener('submit', async(e) => {
                e.preventDefault();
                const newManagerId = document.getElementById('newManagerId').value;
                if (newManagerId) {
                    await updateManagerId(AttendanceIdToEdit, newManagerId, '/api/attendance/responseReq/', 'attendance', messageDiv);
                }
            });

        } else {
            // Handle the case where fetchAttendanceData returned null (attendance not found or error)
            attendanceParentDiv.textContent = "attendance record not found or failed to load.";
            messageDiv.textContent = "Could not find the attendance record.";
            messageDiv.style.color = "red";
        }
    });
} else {
    // Handle the case where no attendance ID was provided in the URL
    attendanceParentDiv.textContent = "No Attendance ID specified for editing.";
    messageDiv.textContent =
        "Please provide a attendance ID in the URL (e.g., attendanceDetail.html?attendance_id=1).";
    messageDiv.style.color = "orange";
}

