const notiMsg = document.querySelector('#notification-message');

async function initializeNotifications() {
    // Show a loading message while we wait for fetches to complete
    notiMsg.innerHTML = '<p>Loading notifications...</p>';

    // Use an array to store all the promises from your fetch calls
    const promises = [
        fetchResponse('attendance', 'attendance'),
        fetchResponse('leave', 'read'),
        
    ];

    if (role === 'A' || role === 'E') {
        promises.push(fetchResponse('leave', 'read_withdraw'))
    }
    
    // Wait for all fetch calls to complete
    const [responseAttendance, responseLeaveRead, responseLeaveReadWithdraw] = await Promise.all(promises);

    // Clear the loading message
    notiMsg.innerHTML = '';
    
    let hasNotifications = false;

    // --- Render Attendance Notifications ---
    if (responseAttendance?.attendances) {
        responseAttendance.attendances.forEach(a => {
            const attendanceElement = document.createElement("div");
            attendanceElement.classList.add("attendance-item");
            attendanceElement.setAttribute("data-attendance-id", a.attendance_id);
            
            // Build the core HTML
            let innerHtml = `
                <h2 style="color: tomato">Attendance</h2> <hr>
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
            `;

            // Add dynamic status HTML
            if (a.edit_status === 'REJECTED') {
                innerHtml += `<p>edit_status: <span class="status" style="color: red">${a.edit_status}</span></p>`;
            } else if (a.edit_status === 'APPROVED') {
                innerHtml += `<p>edit_status: <span class="status" style="color: green">${a.edit_status}</span></p>`;
            } else {
                innerHtml += `<p>edit_status: <span class="data">${a.edit_status}</span></p>`;
            }

            if (a.ot_req_status === 'REJECTED') {
                innerHtml += `<p>ot_req_status: <span style="color: red">${a.ot_req_status}</span></p>`;
            } else if (a.ot_req_status === 'APPROVED') {
                innerHtml += `<p>ot_req_status: <span style="color: green">${a.ot_req_status}</span></p>`;
            } else {
                innerHtml += `<p>ot_req_status: <span class="data">${a.ot_req_status}</span></p>`;
            }

            // Add final HTML with button
            innerHtml += `
                <p>edit_date_time: <span class="data">${a.edit_date_time}</span></p>
                <p>response_date_time: <span class="data">${a.response_date_time}</span></p>
                <p>Manager ID: <span class="data">${a.manager_id}</span></p>
                <button id="read-btn-att-${a.attendance_id}" onclick="markAsRead('attendance/markRead', ${a.attendance_id}, 'read', '#read-btn-att-${a.attendance_id}')">Mark as read</button>
            `;
            
            attendanceElement.innerHTML = innerHtml;
            notiMsg.appendChild(attendanceElement);
            hasNotifications = true;
        });
    }

    // --- Render Leave Notifications (Read) ---
    if (responseLeaveRead?.leaveHistory) {
        responseLeaveRead.leaveHistory.forEach(l => {
            renderLeave(l, 'read', 'leave/markRead');
            hasNotifications = true;
        });
    } 

    // --- Render Leave Notifications (Read Withdraw) ---
    if (responseLeaveReadWithdraw?.leaveHistory) {
        responseLeaveReadWithdraw.leaveHistory.forEach(l => {
            renderLeave(l, 'read_withdraw', 'leave/markReadWithdraw');
            hasNotifications = true;
        });
    }

    // --- Final Check ---
    if (!hasNotifications) {
        notiMsg.innerHTML = `<p>No new notifications.</p>`;
    }
}

// Function to handle fetching and marking as read
async function markAsRead(path, id, field, btnId) {
    const buttonId = document.querySelector(btnId);

    if (buttonId.innerText === "Read") {
        return;
    }

    const data = {}; // Dynamic property name
    data[field] = true

    try {
        const response = await fetch(`${apiBaseUrl}/api/${path}/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                ...(token && { "Authorization": `Bearer ${token}` })
            },
            body: JSON.stringify(data),
        });

        if (response.ok) {
            buttonId.innerText = "Read";
            // Optionally, remove the element or add a class to fade it out
        } else {
            const responseBody = await response.json();
            console.error("Failed to mark as read:", responseBody);
            // Show error message to user, e.g., on a separate message div
        }
    } catch (err) {
        console.error("Error in markAsRead:", err);
    }
}


function renderLeave(l, readField, path) {
    const leaveElement = document.createElement("div");
    leaveElement.classList.add("leave-item");
    leaveElement.setAttribute("data-leave-id", l.leave_id);

    let innerHtml = `
        <h2 style="color: rgba(22, 132, 206, 1);">Leave</h2> <hr>
        <h3>start date time: <span style="color: rgb(31, 202, 31);">${l.start_date_time}</span></h3>
        <h3>end date time: <span style="color: rgb(173, 29, 18);">${l.end_date_time}</span></h3>
        <p style="color: Blue">${l.day}</p>
        <p>Leave ID: <span class="data">${l.leave_id}</span><p>
        <p>Attendance ID: <span class="data">${l.attendance_id}</span></p>
        <p>Employee ID: <span class="data">${l.employee_id}</span><p>
        <p>Duration: <span class="data">${l.duration}</span></p>
        <p>type: <span class="data">${l.type}</span></p>
        <p>leave_remarks: <span class="data">${l.leave_remarks}</span></p>
    `;

    // Add dynamic status HTML
    if (l.status === 'REJECTED') {
        innerHtml += `<p>status: <span style="color: red">${l.status}</span></p>`;
    } else if (l.status === 'APPROVED') {
        innerHtml += `<p>status: <span style="color: green">${l.status}</span></p>`;
    } else if (l.status === 'WITHDRAWN') {
        innerHtml += `<p>status: <span style="color: magenta">${l.status}</span></p>`;
    } else {
        innerHtml += `<p>status: <span class="data">${l.status}</span></p>`;
    }

    // Add final HTML with button
    innerHtml += `
        <p>submit_date_time: <span class="data">${l.submit_date_time}</span></p>
        <p>response_date_time: <span class="data">${l.response_date_time}</span></p>
        <p>withdraw_date_time: <span class="data">${l.withdraw_date_time}</span></p>
        <p>Manager ID: <span class="data">${l.manager_id}</span></p>
        <button id="read-btn-leave-${l.leave_id}" onclick="markAsRead('${path}', ${l.leave_id}, '${readField}', '#read-btn-leave-${l.leave_id}')">Mark as read</button>
    `;

    leaveElement.innerHTML = innerHtml;
    notiMsg.appendChild(leaveElement);
}

// Ensure this runs only after the DOM is ready
window.addEventListener('DOMContentLoaded', initializeNotifications);