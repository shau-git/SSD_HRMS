const attendanceListDiv = document.getElementById("attendanceList");
const fetchAttendanceBtn = document.getElementById("fetchAttendanceBtn");
const messageDiv = document.getElementById("message"); // Get reference to the message div
const filterYear = document.getElementById("year")
const filterMonth = document.getElementById("month")
const filterDay = document.getElementById("day")
const otReqStatus = document.getElementById("ot-req")

const allowedStatuses = ["PENDING", "APPROVED", "REJECTED"];


// Function to fetch attendance from the API and display them
async function fetchAttendance() {

    try {
        attendanceListDiv.innerHTML = "Loading attendance..."; // Show loading state
        messageDiv.textContent = ""; // Clear any previous messages (assuming a message div exists or add one)


        let url = `${apiBaseUrl}/api/attendance?`;

        if (filterYear.value ) {

            url += `year=${filterYear.value}&`
        }

        if (filterMonth.value) {
            url += `month=${filterMonth.value}&`
        }

        if (filterDay.value) {
            url += `day=${filterDay.value}&`
        }


        if(otReqStatus.value) {
            url += `ot_req_status=${otReqStatus.value}&`
        } else {
            url += `ot_req_status=PENDING&`
        }


        // Make a GET request to your API endpoint
        const response = await fetch(url, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            ...(token && { "Authorization": `Bearer ${token}` }) // Add header if token exists
        },
        });


        // Handle HTTP errors (e.g., 404, 500)
        // Attempt to read error body if available, otherwise use status text
        const responseBody = response.headers
            .get("content-type")
            ?.includes("application/json")
            ? await response.json()
            : { message: response.statusText };
        
        if (response.status === 200) {
            // Clear previous content and display attendance
            attendanceListDiv.innerHTML = ""; // Clear loading message
            if (responseBody.total === 0) {
                attendanceListDiv.innerHTML = "<p>No OT request found.</p>";
            } else {
                console.log(responseBody)
                responseBody.attendances.forEach((a) => {
                    const attendanceElement = document.createElement("div");
                    attendanceElement.classList.add("attendance-item");
                    // Use data attributes or similar to store ID on the element if needed later
                    attendanceElement.setAttribute("data-attendance-id", a.attendance_id); 
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
                                <p>ot_req_status: <span class="data" style="color: red">${a.ot_req_status}</span></p>
                                <p>edit_date_time: <span class="data">${a.edit_date_time}</span></p>
                                <p>response_date_time: <span class="data">${a.response_date_time}</span></p>
                                <p>manager_id: <span class="data">${a.manager_id}</span></p>
                                <div class="action-buttons" data-attendance-id="${a.attendance_id}">
                                    <button class="edit-btn">Edit</button>
                                    <button class="approve-btn">Approve</button>
                                    <button class="reject-btn">Reject</button>
                                </div>
                        `
                    
                    // Conditionally show/hide buttons based on ot_req_status
                    const actionButtonsDiv = attendanceElement.querySelector('.action-buttons');
                    const editBtn = actionButtonsDiv.querySelector('.edit-btn');
                    const approveBtn = actionButtonsDiv.querySelector('.approve-btn');
                    const rejectBtn = actionButtonsDiv.querySelector('.reject-btn');

                    if (a.ot_req_status === "PENDING") {
                        // For pending requests, show Approve and Reject buttons
                        approveBtn.style.display = 'inline-block';
                        rejectBtn.style.display = 'inline-block';
                        editBtn.style.display = 'none';
                    } else if (a.ot_req_status === "APPROVED" || a.ot_req_status === "REJECTED") {
                        // For approved or rejected requests, show the Edit button
                        approveBtn.style.display = 'none';
                        rejectBtn.style.display = 'none';
                        editBtn.style.display = 'inline-block';
                    }

                    // Add event listeners for the new buttons
                    approveBtn.addEventListener('click', () => updateOTStatus(a.attendance_id, 'APPROVED', actionButtonsDiv));
                    rejectBtn.addEventListener('click', () => updateOTStatus(a.attendance_id, 'REJECTED', actionButtonsDiv));
                    editBtn.addEventListener('click', () => {
                    // When "Edit" is clicked, show "Approve" and "Reject"
                    approveBtn.style.display = 'inline-block';
                    rejectBtn.style.display = 'inline-block';
                    editBtn.style.display = 'none';
                    });
                    
                    attendanceListDiv.appendChild(attendanceElement);
                });
                // Add event listeners for delete buttons after they are added to the DOM
                document.querySelectorAll(".delete-btn").forEach((button) => {
                        button.addEventListener("click", handleDeleteClick);
                });
            }
        } else if (response.status === 404) {
            messageDiv.innerHTML = `No OT request`;
            messageDiv.style.color = "black";
        } else {
            const errMsg = parseError(responseBody);
            messageDiv.innerHTML = errMsg;
            messageDiv.style.color = "red";
        }

    } catch (err) {
            console.error("Error fetching attendance:", err);
            attendanceListDiv.innerHTML = `<div style="color: red;">Failed to load attendance: ${err.message}</div>`;
    }
}



// Placeholder functions for other actions (to be implemented later or in other files)
async function viewAttendanceDetails(attendance_id) {
    console.log("View details for attendance ID:", attendance_id);
    // In a real app, redirect to view.html or show a modal
    window.location.href = `attendanceDetail.html?attendance_id=${attendance_id}`; 
}



// Function to update the OT request status
async function updateOTStatus(attendanceId, newStatus, actionButtonsDiv) {
    try {
        messageDiv.textContent = `Updating status to ${newStatus}...`;
        messageDiv.style.color = "blue";

        const response = await fetch(`${apiBaseUrl}/api/attendance/responseReq/${attendanceId}`, {
            method: 'PUT', // Use PUT or PATCH for updates
            headers: {
                'Content-Type': 'application/json',
                ...(token && {
                'Authorization': `Bearer ${token}`
                })
            },
            body: JSON.stringify({
                    ot_req_status: newStatus
                }),
        });

        const responseBody = response.headers
            .get("content-type")
            ?.includes("application/json") ?
            await response.json() : {
                message: response.statusText
            };

        if (response.ok) {
            messageDiv.textContent = `OT request status for attendance id ${attendanceId} updated to ${newStatus} successfully!`;
            messageDiv.style.color = "green";

            alert('Please refresh the page')
            // Update the display of the buttons
            const editBtn = actionButtonsDiv.querySelector('.edit-btn');
            const approveBtn = actionButtonsDiv.querySelector('.approve-btn');
            const rejectBtn = actionButtonsDiv.querySelector('.reject-btn');

            if (newStatus === "PENDING") {
                // If it's a new pending request (e.g., from an edit), show Approve/Reject
                approveBtn.style.display = 'inline-block';
                rejectBtn.style.display = 'inline-block';
                editBtn.style.display = 'none';
            } else {
                // For Approved or Rejected, show the Edit button and hide the others
                approveBtn.style.display = 'none';
                rejectBtn.style.display = 'none';
                editBtn.style.display = 'inline-block';
            }
        } else {
            const errMsg = parseError(responseBody);
            messageDiv.innerHTML = `Failed to update status: ${errMsg}`;
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