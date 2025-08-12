const attendanceListDiv = document.getElementById("attendanceList");
const fetchAttendanceBtn = document.getElementById("fetchAttendanceBtn");
const messageDiv = document.getElementById("message"); // Get reference to the message div
const filterYear = document.getElementById("year")
const filterMonth = document.getElementById("month")
const filterDay = document.getElementById("day")
const filterAttendanceID = document.getElementById("attendance-id")


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

    if(filterAttendanceID.value) {
        url += `attendance_id=${filterAttendanceID.value}&`
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
        attendanceListDiv.innerHTML = ""; // Clear loading message
        if (responseBody.total === 0) {
            attendanceListDiv.innerHTML = "<p>No attendance found.</p>";
        } else {
            responseBody.attendances.forEach((attendance) => {
                const attendanceElement = document.createElement("div");
                attendanceElement.classList.add("attendance-item");
                // Use data attributes or similar to store ID on the element if needed later
                attendanceElement.setAttribute("data-attendance-id", attendance.attendance_id); 
                attendanceElement.innerHTML = `
                            <h3>start date time: <span style="color: rgb(31, 202, 31);">${attendance.start_date_time}</span></h3>
                            <h3>end date time: <span style="color: rgb(173, 29, 18);">${attendance.end_date_time}</span></h3>
                            <p>${attendance.day}</p>
                            <p>Attendance ID: ${attendance.attendance_id}</p>
                            <p>Employee ID: ${attendance.employee_id}</p>
                        `;

                if(attendance.leave_id !== null) {
                    const leaveRemarks = attendance.leave_remarks
                    const leaveInfo = leaveRemarks.slice(11,leaveRemarks.length)
                    attendanceElement.innerHTML += `<h4 style="color: rgb(240, 160, 11)">${leaveInfo.toUpperCase()}</h4>`
                }

                if(attendance.edit_status !== null) {
                    attendanceElement.innerHTML += `<h4>Edit status: <span style="color: rgb(189, 100, 17)">${attendance.edit_status}</span></h4>`
                }

                attendanceElement.innerHTML += `
                            <button onclick="viewAttendanceDetails(${attendance.attendance_id})">View Details</button>
                            <button onclick="editAttendance(${attendance.attendance_id})">Edit</button>

                `

                if(role === 'A') {
                    attendanceElement.innerHTML += `
                        <div class="delete-container">
                            <button class="delete-btn" id="delete-id-${attendance.attendance_id}" data-id="${attendance.attendance_id}">Delete</button>
                            <button class="yes-btn" id="yes-id-${attendance.attendance_id}" style="display:none";>Yes</button>
                            <button class="cancel-btn" id="cancel-id-${attendance.attendance_id}" style="display:none";>Cancel</button>
                        </div>
                    `
                }
                attendanceListDiv.appendChild(attendanceElement);
            });
            // Add event listeners for delete buttons after they are added to the DOM
            document.querySelectorAll(".delete-btn").forEach((button) => {
                    button.addEventListener("click", handleDeleteClick);
            });
        }

    } else if (response.status === 404) {
            messageDiv.innerHTML = `No Attendance Found`;
            messageDiv.style.color = "black";
    }else {
            const errMsg = parseError(responseBody);
            messageDiv.textContent = `Failed to update status: ${errMsg}`;
            messageDiv.style.color = "red";
    }
    

    
  } catch (err) {
        console.error("Error fetching attendance:", err);
        attendanceListDiv.innerHTML = `<p style="color: red;">Failed to load attendance: ${err.message}</p>`;
  }
}

// Placeholder functions for other actions (to be implemented later or in other files)
async function viewAttendanceDetails(attendance_id) {
    console.log("View details for attendance ID:", attendance_id);
    // In a real app, redirect to view.html or show a modal
    window.location.href = `attendanceDetail.html?attendance_id=${attendance_id}`; 
}

function editAttendance(attendance_Id) {
    console.log("Edit Attendance with ID:", attendance_Id);
    // In a real app, redirect to edit.html with the attendance_id
    window.location.href = `/html/attendance/editAttendance.html?attendance_id=${attendance_Id}`; 
}


async function handleDeleteClick(event) {
    const attendance_Id = event.target.getAttribute("data-id");

    const deleteBtn = document.querySelector(`#delete-id-${attendance_Id}`);
    const yesBtn = document.querySelector(`#yes-id-${attendance_Id}`);
    const cancelBtn = document.querySelector(`#cancel-id-${attendance_Id}`);


    // Show confirm controls
    deleteBtn.style.display = "none";
    yesBtn.style.display = "inline-block";
    cancelBtn.style.display = "inline-block";

    // YES button logic
    yesBtn.addEventListener('click', async() => {
        console.log("Attempting to delete edit attendance  with ID:", attendance_Id);

        try {
            // TODO: Implement the fetch DELETE request here
            const response = await fetch(`${apiBaseUrl}/api/attendance/deleteAttendance/` + `${attendance_Id}`, {
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

            } else {
                const errMsg = parseError(responseBody);
                messageDiv.textContent = `Failed to update status: ${errMsg}`;
                messageDiv.style.color = "red";
            }
        
        } catch (error) {
            console.error(error)
            messageDiv.textContent = `Failed to delete attendance edit request: ${error.message}`;
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
fetchAttendanceBtn.addEventListener("click", fetchAttendance);

// Optionally, fetch attendance when the page loads
window.addEventListener('load', fetchAttendance); // Or call fetchAttendance() directly