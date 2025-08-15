const messageDiv = document.getElementById('message')
const leaveParentDiv = document.getElementById("leave-parent-div"); // Element to show loading state

function getLeaveIdFromUrl() {
    const params = new URLSearchParams(window.location.search) // Get URL query parameters
    return params.get("leave_id") // Return the value of the 'id' parameter
}

async function fetchLeaveData(leave_id) {
    try {

        // Make a GET request to your API endpoint
        const response = await fetch(`${apiBaseUrl}/api/leave?leave_id=${leave_id}`, {
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
            messageDiv.innerHTML = `No Leave Record`;
            messageDiv.style.color = "black";
        } else {
            const errMsg = parseError(responseBody);
            messageDiv.innerHTML = `Failed to get leave record: ${errMsg}`;
            messageDiv.style.color = "red";
        }

    } catch (error) {
        messageDiv.textContent = `Failed to load leave data: ${error.message}`;
        messageDiv.style.color = "red";
        attendanceParentDiv.textContent = ""; // Hide loading message if it was shown
        return null; // Indicate that fetching failed
    }
}



// --- Code to run when the page loads ---

// Get the leave ID from the URL when the page loads
const LeaveRecord = getLeaveIdFromUrl();


// Check if the attendance was found in the URL
if (LeaveRecord) {
    messageDiv.innerHTML = ""
    messageDiv.style.color = "black"
    // If an ID exists, fetch the attendance data and then populate the form
    fetchLeaveData(LeaveRecord).then((leave) => {
        if (leave) {
            const l = leave.leaveHistory[0]
            leaveParentDiv.innerText = ""; // Clear loading message
            // If leave data was successfully fetched, populate the form
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

            leaveParentDiv.appendChild(leaveElement);

            // adding features for admin to change manager id
            if(role === 'A' && l.status !== 'WITHDRAWN') {
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

                leaveParentDiv.appendChild(managerUpdateForm);
            }
            

            // Add event listener to the form
            document.getElementById('managerUpdateForm').addEventListener('submit', async(e) => {
                e.preventDefault();
                const newManagerId = document.getElementById('newManagerId').value;
                if (newManagerId) {
                    await updateManagerId(LeaveRecord, newManagerId, '/api/leave/', 'attendance', messageDiv);
                }
            });

        } else {
            // Handle the case where fetchLeaveeData returned null (leave not found or error)
            leaveParentDiv.textContent = "Leave record not found or failed to load.";
            messageDiv.textContent = "Could not find the leave record.";
            messageDiv.style.color = "red";
        }
    });
} else {
    // Handle the case where no leave ID was provided in the URL
    leaveParentDiv.textContent = "No leave ID specified for editing.";
    messageDiv.textContent =
        "Please provide a leave ID in the URL (e.g., leaveDetail.html?leave_id=1).";
    messageDiv.style.color = "orange";
}

