const leaveListDiv = document.getElementById("leaveList");
const fetchLeaveBtn = document.getElementById("fetchLeaveBtn");
const messageDiv = document.getElementById("message"); // Get reference to the message div
const filterYear = document.getElementById("year")
const filterMonth = document.getElementById("month")
const filterDay = document.getElementById("day")
const filterLeaveID = document.getElementById("leave-id")
const leaveStatus = document.getElementById("leave-status")
const managerCheckBox = document.getElementById('manager');
const managerCheckBoxContainer = document.getElementById('manager-container');


if(role === 'E' || role === 'A') {
    managerCheckBoxContainer.style.display = 'inline-block'
}



// Function to fetch leave from the API and display them
async function fetchLeave() {

    try {
        leaveListDiv.innerHTML = "Loading leave request..."; // Show loading state
        messageDiv.textContent = ""; // Clear any previous messages (assuming a message div exists or add one)


        let url = `${apiBaseUrl}/api/leave?`;

        if (filterYear.value ) {

            url += `year=${filterYear.value}&`
        }

        if (filterMonth.value) {
            url += `month=${filterMonth.value}&`
        }

        if (filterDay.value) {
            url += `day=${filterDay.value}&`
        }


        if(filterLeaveID.value) {
            url += `leave_id=${filterLeaveID.value}&`
        }


        if(["PENDING","APPROVED","REJECTED"].includes(leaveStatus.value)) {
            url += `status=${leaveStatus.value}&`
        } else {
            url += `status=PENDING&`
        }

        if(managerCheckBox.checked) {
            url += `manager=true`
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
            messageDiv.innerHTML = ""
            messageDiv.style.color = "black"
            // Clear previous content and display attendance
            leaveListDiv.innerHTML = ""; // Clear loading message
            if (responseBody.total === 0) {
                leaveListDiv.innerHTML = "<p>No leave request found.</p>";
            } else {
                responseBody.leaveHistory.forEach((l) => {
                    const leaveElement = document.createElement("div");
                    leaveElement.classList.add("attendance-item");
                    // Use data attributes or similar to store ID on the element if needed later
                    leaveElement.setAttribute("data-attendance-id", l.leave_id); 
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
                                <div class="action-buttons" data-attendance-id="${l.leave_id}">
                                    <button class="edit-btn">Edit</button>
                                    <button class="approve-btn">Approve</button>
                                    <button class="reject-btn">Reject</button>
                                </div>
                        `
                    
                    // Conditionally show/hide buttons based on ot_req_status
                    const actionButtonsDiv = leaveElement.querySelector('.action-buttons');
                    const editBtn = actionButtonsDiv.querySelector('.edit-btn');
                    const approveBtn = actionButtonsDiv.querySelector('.approve-btn');
                    const rejectBtn = actionButtonsDiv.querySelector('.reject-btn');

                    if (l.status === "PENDING") {
                        // For pending requests, show Approve and Reject buttons
                        approveBtn.style.display = 'inline-block';
                        rejectBtn.style.display = 'inline-block';
                        editBtn.style.display = 'none';
                    } else if (l.status === "APPROVED" || l.status === "REJECTED") {
                        // For approved or rejected requests, show the Edit button
                        approveBtn.style.display = 'none';
                        rejectBtn.style.display = 'none';
                        editBtn.style.display = 'inline-block';
                    }

                    // Add event listeners for the new buttons
                    approveBtn.addEventListener('click', () => updateLeaveStatus(l.leave_id, 'APPROVED', actionButtonsDiv));
                    rejectBtn.addEventListener('click', () => updateLeaveStatus(l.leave_id, 'REJECTED', actionButtonsDiv));
                    editBtn.addEventListener('click', () => {
                    // When "Edit" is clicked, show "Approve" and "Reject"
                    approveBtn.style.display = 'inline-block';
                    rejectBtn.style.display = 'inline-block';
                    editBtn.style.display = 'none';
                    });
                    
                    leaveListDiv.appendChild(leaveElement);
                });
                // Add event listeners for delete buttons after they are added to the DOM
                document.querySelectorAll(".delete-btn").forEach((button) => {
                        button.addEventListener("click", handleDeleteClick);
                });
            }
        } else if (response.status === 404) {
            messageDiv.innerHTML = `No Leave request`;
            messageDiv.style.color = "black";
        } else {
            const errMsg = parseError(responseBody);
            messageDiv.innerHTML = errMsg;
            messageDiv.style.color = "red";
        }

    } catch (err) {
            console.error("Error fetching leave request:", err);
            attendanceListDiv.innerHTML = `<div style="color: red;">Failed to load leave request: ${err.message}</div>`;
    }
}



// Placeholder functions for other actions (to be implemented later or in other files)
async function viewAttendanceDetails(attendance_id) {
    console.log("View details for attendance ID:", attendance_id);
    // In a real app, redirect to view.html or show a modal
    window.location.href = `attendanceDetail.html?attendance_id=${attendance_id}`; 
}



// Function to update the OT request status
async function updateLeaveStatus(leave_id, newStatus, actionButtonsDiv) {
    try {
        messageDiv.textContent = `Updating status to ${newStatus}...`;
        messageDiv.style.color = "blue";

        const response = await fetch(`${apiBaseUrl}/api/leave/${leave_id}`, {
        method: 'PUT', // Use PUT or PATCH for updates
        headers: {
            'Content-Type': 'application/json',
            ...(token && {
            'Authorization': `Bearer ${token}`
            })
        },
        body: JSON.stringify({
                status: newStatus
            }),
        });

        const responseBody = response.headers
        .get("content-type")
        ?.includes("application/json") ?
        await response.json() : {
            message: response.statusText
        };

        if (response.ok) {
            

            if (newStatus === 'APPROVED') {
                messageDiv.textContent = `
                    Leave request status ${leave_id} updated to ${newStatus} successfully!
                    Attendance has been created!
                `;
                messageDiv.style.color = "green";
                alert('Leave approved , an attendance has been created!! Please refresh the page')
                
            } else if (newStatus === 'REJECTED') {

                messageDiv.textContent = `
                    Leave request status ${leave_id} updated to ${newStatus} successfully!
                `;
                messageDiv.style.color = "green";
                alert('Leave rejected! Please refresh the page')
            }
            
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




// Fetch leave when the button is clicked
fetchLeaveBtn.addEventListener("click", fetchLeave);

// Optionally, fetch leave when the page loads
window.addEventListener('load', fetchLeave); // Or call fetchLeave() directly