const attendanceListDiv = document.getElementById("attendanceList");
const fetchAttendanceBtn = document.getElementById("fetchAttendanceBtn");
const messageDiv = document.getElementById("message"); // Get reference to the message div

// Function to fetch attendance from the API and display them
async function fetchAttendance() {

    try {
        attendanceListDiv.innerHTML = "Loading attendance..."; // Show loading state
        messageDiv.textContent = ""; // Clear any previous messages (assuming a message div exists or add one)

        // Make a GET request to your API endpoint
        const response = await fetch(`${apiBaseUrl}/api/attendance/editAttendanceReq/`, {
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
                        <p>edit_status: <span class="data">${a.edit_status}</span></p>
                        <p>edit_date_time: <span class="data">${a.edit_date_time}</span></p>
                        <p>manager_id: <span class="data">${a.manager_id}</span></p>
                    `

                    // add delete btn for worker to delete withdraw the edit request that has not been approved
                    if(role === 'W') {
                        attendanceElement.innerHTML += `<div class="delete-container">
                                <button class="delete-btn" id="delete-id-${a.attendance_id}" data-id="${a.attendance_id}" onclick="handleDeleteClick(event)">
                                    Delete
                                </button>
                                <button class="yes-btn" id="yes-id-${a.attendance_id}" style="display:none"; onclick="yesBtnFunc(${a.attendance_id})">Yes</button>
                                <button class="cancel-btn" id="cancel-id-${a.attendance_id}" style="display:none"; onclick="cancelBtnFunc(${a.attendance_id})">Cancel</button>
                            </div>
                        `
                                        
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
        messageDiv.textContent = `Failed to delete attendance edit request: ${responseBody.error}`;
        messageDiv.style.color = "red";
        } else {
        throw new Error(
            `API error! status: ${response.status}, message: ${responseBody.error}`
            );
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



// Fetch attendance when the button is clicked
fetchAttendanceBtn.addEventListener("click", fetchAttendance);

// Optionally, fetch attendance when the page loads
window.addEventListener('load', fetchAttendance); // Or call fetchAttendance() directly