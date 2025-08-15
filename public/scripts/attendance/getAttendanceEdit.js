const attendanceListDiv = document.getElementById("attendanceList");
const fetchAttendanceBtn = document.getElementById("fetchAttendanceBtn");
const messageDiv = document.getElementById("message"); // Get reference to the message div
const managerCheckBox = document.getElementById('manager');
const managerCheckBoxContainer = document.getElementById('manager-container');

if(role === 'E' || role === 'A') {
    managerCheckBoxContainer.style.display = 'inline-block'
}

// Function to fetch attendance from the API and display them
async function fetchAttendance() {

    try {

        let url = `${apiBaseUrl}/api/attendance/editAttendanceReq?`


        if(managerCheckBox.checked) {
            url += `manager=true`
        }

        attendanceListDiv.innerHTML = "Loading attendance..."; // Show loading state
        messageDiv.textContent = ""; // Clear any previous messages (assuming a message div exists or add one)

        // Make a GET request to your API endpoint
        const response = await fetch(url, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            ...(token && { "Authorization": `Bearer ${token}` }) // Add header if token exists
        },
        });


        const responseBody = response.headers
                .get("content-type")
                ?.includes("application/json")
                ? await response.json()
                : { message: response.statusText };
            
        if (response.status === 200) {
            messageDiv.innerHTML = ""
            messageDiv.style.color = "black"
            // Clear previous content and display attendance
            attendanceListDiv.innerHTML = ""; // Clear loading message
            if (responseBody.total === 0) {
                attendanceListDiv.innerHTML = "<p>No attendance Edit request found.</p>";
            } else {
                responseBody.request.forEach((a) => {
                    const attendanceElement = document.createElement("div");
                    attendanceElement.classList.add("attendance-item");
                    // Use data attributes or similar to store ID on the element if needed later
                    attendanceElement.setAttribute("data-attendance-id", a.attendance_id); 
                    attendanceElement.innerHTML = `
                        <h3>start date time: <span style="color: rgb(31, 202, 31);">${a.start_date_time}</span></h3>
                        <h3>end date time: <span style="color: rgb(173, 29, 18);">${a.end_date_time}</span></h3>
                        <p style="color: Blue">${a.day}</p>
                        <p>Request ID: <span class="data">${a.request_id}</span></p>
                        <p>Employee ID: <span class="data">${a.employee_id}</span></p>
                        <p>Attendance ID: <span class="data">${a.attendance_id}</span></p>
                        <p>is_ot: <span class="data">${a.is_ot}</span></p>
                        <p>hours_of_ot: <span class="data">${a.hours_of_ot}</span></p> 
                        <p>remarks: <span class="data">${a.remarks}</span></p>
                        <p>edit_status: <span class="data" style="color: red">${a.edit_status}</span></p>
                        <p>edit_date_time: <span class="data">${a.edit_date_time}</span></p>
                        <p>manager_id: <span class="data">${a.manager_id}</span></p>
                    `

                    // add delete btn for worker to delete withdraw the edit request that has not been approved
                    if(a.employee_id == employee_id) {
                        attendanceElement.innerHTML += `<div class="delete-container">
                                <button class="delete-btn" id="delete-id-${a.attendance_id}" data-id="${a.attendance_id}" onclick="handleDeleteClick(event)">
                                    Delete
                                </button>
                                <button class="yes-btn" 
                                        id="yes-id-${a.attendance_id}" 
                                        style="display:none;" 
                                        onclick="yesBtnFunc(${a.attendance_id})">Yes</button>
                                <button class="cancel-btn" id="cancel-id-${a.attendance_id}" style="display:none"; onclick="cancelBtnFunc(${a.attendance_id})">Cancel</button>
                            </div>
                        `
                                        
                    }

                    if (employee_id == a.manager_id) {
                        attendanceElement.innerHTML += `
                            <div class="action-buttons" data-attendance-id="${a.attendance_id}">
                                    <button class="approve-btn" 
                                            onclick="updateEditStatus(${a.attendance_id}, 'APPROVED')">Approve</button>
                                    <button class="reject-btn"
                                             onclick="updateEditStatus(${a.attendance_id}, 'REJECTED')">Reject</button>
                            </div>
                        `
                        // Add event listeners for the new buttons
                        // approveBtn.addEventListener('click', () => updateEditStatus(a.attendance_id, 'APPROVED', actionButtonsDiv));
                        // rejectBtn.addEventListener('click', () => updateEditStatus(a.attendance_id, 'REJECTED', actionButtonsDiv));
                    }
                    // add form for admin to change the manager id
                    if (role === 'A') {
                        attendanceElement.innerHTML += `
                                <hr>
                                <h4>Admin: Update Manager ID</h4>
                                <form id="managerUpdateForm" onsubmit="submit(e)">
                                    <label for="newManagerId">New Manager ID:</label>
                                    <input type="number" id="newManagerId" name="newManagerId" min="1" required>
                                    <button type="submit">Update</button>
                                </form>
                            `;
                    }

                    // finally add the attendance to the parent div
                    attendanceListDiv.appendChild(attendanceElement);
                });

            }
        } else if (response.status === 404) {
                messageDiv.innerHTML = `No request Found`;
                messageDiv.style.color = "black";
        } else {
            const errMsg = parseError(responseBody);
            messageDiv.innerHTML = errMsg;
            messageDiv.style.color = "red";
        }


    } catch (err) {
            console.error("Error fetching attendance:", err);
            attendanceListDiv.innerHTML = `<p style="color: red;">Failed to load attendance: ${err.message}</p>`;
    }
}

async function submit(e) {
    e.preventDefault();
    const newManagerId = document.getElementById('newManagerId').value;
    if (newManagerId) {
        await updateManagerId(AttendanceIdToEdit, newManagerId, '/api/attendance/editAttendanceReq/', 'attendance edit request', messageDiv);
    }
};




async function handleDeleteClick(event) {
    const attendance_Id = event.target.getAttribute("data-id");

    const deleteBtn = document.querySelector(`#delete-id-${attendance_Id}`);
    const yesBtn = document.querySelector(`#yes-id-${attendance_Id}`);
    const cancelBtn = document.querySelector(`#cancel-id-${attendance_Id}`);


    // Show confirm controls
    deleteBtn.style.display = "none";
    yesBtn.style.display = "inline-block";
    cancelBtn.style.display = "inline-block";

}

// YES button logic
async function yesBtnFunc(attendance_Id){
    console.log("Attempting to delete edit attendance  with ID:", attendance_Id);

    try {
        // TODO: Implement the fetch DELETE request here
        const response = await fetch(`${apiBaseUrl}/api/attendance/editAttendanceReq/` + `${attendance_Id}`, {
        method: "DELETE",
        headers: {
                "Content-Type": "application/json",
                ...(token && { "Authorization": `Bearer ${token}` }) // Add header if token exists
            },
        })

        // Check for API response status (e.g., 201 Created, 400 Bad Request, 500 Internal Server Error)
        const responseBody = response.headers
        .get("content-type")
        ?.includes("application/json")
        ? await response.json()
        : { message: response.statusText };


        // TODO: Handle success (204) and error responses (404, 500)
        if(response.status === 204 || response.status === 200) {
        messageDiv.textContent = responseBody.msg//`Edit Attendance request deleted successfully! ID: ${attendance_Id}`
        messageDiv.style.color = "green";

        // TODO: On successful deletion, remove the attendance element from the DOM
        // document.querySelector(`[data-attendance-attendance_id = ${attendance_id}] div`).remove()
        const elements = document.getElementsByClassName('.attendance-item')
        Array.from(elements).forEach(element => {
            if(element.dataset.attendance_id === Number(attendance_Id)) {
            element.remove()
            }
        })
        alert('Please refresh the page')

        } else if (response.status === 404) {
            messageDiv.textContent = `Attendance ID Not Found`;
            messageDiv.style.color = "red";
        } else {
            const errMsg = parseError(responseBody);
            messageDiv.innerHTML = `Failed to delete attendance: ${errMsg}`;
            messageDiv.style.color = "red";
    }
    
    } catch (error) {
        console.error(error)
        messageDiv.textContent = `Failed to delete attendance edit request: ${error.message}`;
        messageDiv.style.color = "red";
    }

}

 // CANCEL button logic
function cancelBtnFunc(attendance_Id){

    const deleteBtn = document.querySelector(`#delete-id-${attendance_Id}`);
    const yesBtn = document.querySelector(`#yes-id-${attendance_Id}`);
    const cancelBtn = document.querySelector(`#cancel-id-${attendance_Id}`);
    
    deleteBtn.style.display = "inline-block";
    yesBtn.style.display = "none";
    cancelBtn.style.display = "none";
};



// Function to update the edit request status
async function updateEditStatus(attendanceId, newStatus, actionButtonsDiv) {
    try {
        messageDiv.textContent = `Updating status to ${newStatus}...`;
        messageDiv.style.color = "blue";

        const response = await fetch(`${apiBaseUrl}/api/attendance/editAttendanceReq/${attendanceId}`, {
        method: 'PUT', // Use PUT or PATCH for updates
        headers: {
            'Content-Type': 'application/json',
            ...(token && {
            'Authorization': `Bearer ${token}`
            })
        },
        body: JSON.stringify({
            edit_status: newStatus
        }),
        });

        const responseBody = response.headers
        .get("content-type")
        ?.includes("application/json") ?
        await response.json() : {
            message: response.statusText
        };

        if (response.ok) {
            messageDiv.textContent = `Edit request for attendance id ${attendanceId}  updated to ${newStatus} successfully!`;
            messageDiv.style.color = "green";
            alert(`updated to ${newStatus} successfully! Please refresh the page!`)
        } else {
            const errMsg = parseError(responseBody);
            messageDiv.textContent = `Failed to update status: ${errMsg}`;
            messageDiv.style.color = "red";
        }
    } catch (err) {
        console.error("Error updating OT status:", err);
        messageDiv.textContent = `An error occurred while updating the status: ${err.message}`;
        messageDiv.style.color = "red";
    }
}

// Fetch attendance when the button is clicked
fetchAttendanceBtn.addEventListener("click", fetchAttendance);

// Optionally, fetch attendance when the page loads
window.addEventListener('load', fetchAttendance); // Or call fetchAttendance() directly