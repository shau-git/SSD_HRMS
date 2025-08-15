const leaveListDiv = document.getElementById("leaveList");
const fetchLeaveBtn = document.getElementById("fetchLeaveBtn");
const messageDiv = document.getElementById("message"); // Get reference to the message div
const filterYear = document.getElementById("year")
const filterMonth = document.getElementById("month")
const filterDay = document.getElementById("day")
const filterLeaveID = document.getElementById("leave-id")
const leaveStatus = document.getElementById("leave-status")

// Function to fetch leave from the API and display them
async function fetchLeave() {

    try {
        leaveListDiv.innerHTML = "Loading leave..."; // Show loading state
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
        }   
        
        url += 'manager=true'

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
                    ?await response.json()
                    : {message: response.statusText};


        if(response.status === 200) {
            // Clear previous content and display attendance
            leaveListDiv.innerHTML = ""; // Clear loading message
            if (responseBody.total === 0) {
                leaveListDiv.innerHTML = "<p>No leave record found.</p>";
            } else {
                responseBody.leaveHistory.forEach((leave) => {
                    const leaveElement = document.createElement("div");
                    leaveElement.classList.add("leave-item");
                    // Use data attributes or similar to store ID on the element if needed later
                    leaveElement.setAttribute("data-leave-id", leave.leave_id); 
                    leaveElement.innerHTML += `
                        <h3>start date time: <span style="color: rgb(31, 202, 31);">${leave.start_date_time}</span></h3>
                        <h3>end date time: <span style="color: rgb(173, 29, 18);">${leave.end_date_time}</span></h3>
                        <p style="color: Blue">${leave.day}</p>
                        <p>Leave ID: <span class="data">${leave.leave_id}</span><p>
                        <p>Attendance ID: <span class="data">${leave.attendance_id}</span></p>
                        <p>Employee ID: <span class="data">${leave.employee_id}</span><p>
                        <p>Duration: <span class="data">${leave.duration}</span></p>
                        <p>type: <span class="data">${leave.type}</span></p>
                        <p>leave_remarks: <span class="data">${leave.leave_remarks}</span></p>
                        <p>status: <span class="data" style="color: red">${leave.status}</span></p>
                        <p>submit_date_time: <span class="data">${leave.submit_date_time}</span></p>
                        <p>response_date_time: <span class="data">${leave.response_date_time}</span></p>
                        <p>withdraw_date_time: <span class="data">${leave.withdraw_date_time}</span></p>
                        <p>manager_id: <span class="data">${leave.manager_id}</span></p>
            `;

                    if(leave.employee_id === Number(employee_id)) {
                        leaveElement.innerHTML += `
                            <div class="delete-container">
                                <button class="delete-btn" id="delete-id-${leave.leave_id}" data-id="${leave.leave_id}">Withdraw</button>
                                <button class="yes-btn" id="yes-id-${leave.leave_id}" style="display:none";>Yes</button>
                                <button class="cancel-btn" id="cancel-id-${leave.leave_id}" style="display:none";>Cancel</button>
                            </div>
                        `
                    }
                    leaveListDiv.appendChild(leaveElement);
                });
                // Add event listeners for delete buttons after they are added to the DOM
                document.querySelectorAll(".delete-btn").forEach((button) => {
                        button.addEventListener("click", handleDeleteClick);
                });
            }

        } else if (response.status === 404) {
                messageDiv.innerHTML = `No Leave record Found`;
                messageDiv.style.color = "black";
        } else {
                const errMsg = parseError(responseBody);
                messageDiv.innerHTML = errMsg;
                messageDiv.style.color = "red";
        }
        
    } catch (err) {
            console.error("Error fetching leave:", err);
            leaveListDiv.innerHTML = `<p style="color: red;">Failed to load leave record: ${err.message}</p>`;
    }
}

// Placeholder functions for other actions (to be implemented later or in other files)
async function viewLeaveDetails(leave_id) {
    console.log("View details for leave ID:", leave_id);
    // In a real app, redirect to view.html or show a modal
    window.location.href = `leaveDetail.html?leave_id=${leave_id}`; 
}


async function handleDeleteClick(event) {
    const leave_id = event.target.getAttribute("data-id");

    const deleteBtn = document.querySelector(`#delete-id-${leave_id}`);
    const yesBtn = document.querySelector(`#yes-id-${leave_id}`);
    const cancelBtn = document.querySelector(`#cancel-id-${leave_id}`);


    // Show confirm controls
    deleteBtn.style.display = "none";
    yesBtn.style.display = "inline-block";
    cancelBtn.style.display = "inline-block";

    // YES button logic
    yesBtn.addEventListener('click', async() => {
        console.log("Attempting to withdraw leave with ID:", leave_id);

        try {
            // TODO: Implement the fetch DELETE request here
            const response = await fetch(`${apiBaseUrl}/api/leave/` + `${leave_id}`, {
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

            // document.querySelector(`[data-attendance-attendance_id = ${attendance_id}] div`).remove()
            const elements = document.getElementsByClassName('.leave-item')
            Array.from(elements).forEach(element => {
                if(element.dataset.leave_id === Number(leave_id)) {
                element.remove()
                }
            })
            alert(`${responseBody.msg}! Please refresh the page`)

            } else {
                const errMsg = parseError(responseBody);
                messageDiv.innerHTML = `Failed to update leave: ${errMsg}`;
                messageDiv.style.color = "red";
            }
        
        } catch (error) {
            console.error(error)
            messageDiv.textContent = `Failed to delete leave edit request: ${error.message}`;
            messageDiv.style.color = "red";
        }
 
    })


    // CANCEL button logic
    cancelBtn.onclick = () => {
        deleteBtn.style.display = "inline-block";
        yesBtn.style.display = "none";
        cancelBtn.style.display = "none";
    };
    
}




// Fetch attendance when the button is clicked
fetchLeaveBtn.addEventListener("click", fetchLeave);

// Optionally, fetch attendance when the page loads
window.addEventListener('load', fetchLeave); 