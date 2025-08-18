const errMsgDiv = document.querySelector('.err-Msg')


function updateTime() {

    // for displaying current date time on screen
    const now = new Date();

    // Array of day names (0 = Sunday, 1 = Monday, etc.)
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    // Format date as YYYY-MM-DD
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0'); // Months start at 0
    const day = now.getDate().toString().padStart(2, '0');
    const dayName = days[now.getDay()]; // Get the day name



    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';



    document.getElementById('date').textContent = `${year}-${month}-${day} (${dayName})`;
    document.getElementById('time').textContent = `${hours}:${minutes} ${ampm}`;

}

// Run once immediately
updateTime();
// Then update every 60 seconds
setInterval(updateTime, 60 * 1000);




// Function to fetch and display recent attendance data
async function displayRecentAttendance() {
    const container = document.getElementById('recent-attendance-container');
    container.innerHTML = 'Loading...'; // Show a loading message

    try {
        const token = localStorage.getItem('token');

        const response = await fetch(`${apiBaseUrl}/api/attendance/recent/`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                ...(token && { "Authorization": `Bearer ${token}` }) // Add header if token exists
            }
        });

        
        const responseBody = response.headers
            .get("content-type")
            ?.includes("application/json")
            ?await response.json()
            : {message: response.statusText};


        if(response.status === 200 || response.status === 201) {
            if (responseBody.total === 0) {
                container.innerHTML = '<p>No recent attendance records found.</p>';
  
            } else {
                container.innerHTML = ''; // Clear loading message
                console.log(responseBody)
                responseBody.attendances.forEach(attendance => {
                    const recordElement = document.createElement('div');
                    recordElement.classList.add('attendance-item');
                    
                    recordElement.innerHTML = `
                        <p><strong>Clock In:</strong> ${attendance.start_date_time}</p>
                        <p><strong>Clock Out:</strong> ${attendance.end_date_time}</p>
                        <p><strong>Total Min Work:</strong>${attendance.total_min_work}</p>
                        <p><strong>Total Min Work Adjusted:</strong> ${attendance.total_min_adjusted}</p>
                        <p><strong>OT:</strong> ${attendance.is_ot ? 'Yes' : 'No'}</p>
                        ${attendance.is_ot ? `<p><strong>OT Hours:</strong> ${attendance.hours_of_ot}</p>` : ''}
                        <hr>
                    `;
                    container.appendChild(recordElement);
                });
            }
        } else if (response.status === 404) {
                container.innerHTML = `No attendance record Found`;
                container.style.color = "black";
        } else {
                const errMsg = parseError(responseBody);
                container.innerHTML = errMsg;
                container.style.color = "red";
        }
    } catch (error) {
        console.error('Error fetching recent attendance:', error);
        container.innerHTML = '<p>Error loading attendance data.</p>';
    }
}

// Call this function when the page loads
displayRecentAttendance();



const clockInBtn = document.querySelector('.clock-in-btn');
const clockOutBtn = document.querySelector('.clock-out-btn');

// Add event listeners to the clock in/out buttons
clockInBtn.addEventListener('click', async () => {

    try {
        const response = await fetch(`${apiBaseUrl}/api/attendance/markAttendance/`, {
            method: "POST", // Or 'PUT', depending on your API
            headers: {
                "Content-Type": "application/json",
                ...(token && { "Authorization": `Bearer ${token}` }) // Add header if token exists
            },
            body: JSON.stringify({}),  // let the backend to update the start_date_time itself
        });

        const responseBody = response.headers
                    .get("content-type")
                    ?.includes("application/json")
                    ?await response.json()
                    : {message: response.statusText};

        if (response.status === 201 || response.status === 200) {
            // Call this function when the page loads
            errMsgDiv.innerHTML = ""
            displayRecentAttendance();
        } else {
            const errMsg = parseError(responseBody)
            errMsgDiv.innerHTML = errMsg
            errMsgDiv.style.color = "red";
            displayRecentAttendance();
        }


    } catch (error) {
        console.error('Error:', error);
        const errMsg = parseError(error.message)
        errMsgDiv.innerHTML = errMsg
        errMsgDiv.style.color = "red";
        displayRecentAttendance();
    }
});


// handle the checked box, if checked is_ot box then display the hours of ot input box
const isOtCheckbox = document.getElementById('is_ot_checkbox');
const otHoursContainer = document.getElementById('ot-hours-container');
const hoursOfOtInput = document.getElementById('hours_of_ot');

isOtCheckbox.addEventListener('change', (event) => {
    if (event.target.checked) {
        otHoursContainer.style.display = 'block';
        hoursOfOtInput.required = true;
    } else {
        otHoursContainer.style.display = 'none';
        hoursOfOtInput.required = false;
        hoursOfOtInput.value = ''; // Clear value when unchecked
    }
});




// Update the clockOut function to include OT data
clockOutBtn.addEventListener('click', async () => {

    const isOt = isOtCheckbox.checked;
    let hoursOfOt = 0;

    if (isOt) {
        hoursOfOt = parseFloat(hoursOfOtInput.value);
        if (isNaN(hoursOfOt) || hoursOfOt <= 0) {
            alert('Please enter a valid number of OT hours.');
            return;
        }
    }

    const clockOutData = {
        is_ot: isOt,
    };

    if(isOt) {
        clockOutData.hours_of_ot = hoursOfOt
    }

    // Your fetch call to the clockOut endpoint
    try {
        const response = await fetch(`${apiBaseUrl}/api/attendance/markAttendance`, {
            method: 'PUT',
            headers: {
                "Content-Type": "application/json",
                ...(token && { "Authorization": `Bearer ${token}` }) // Add header if token exists
            },
            body: JSON.stringify(clockOutData),  // let backend to update the end_date_time itself
        });

        const responseBody = response.headers
                    .get("content-type")
                    ?.includes("application/json")
                    ?await response.json()
                    : {message: response.statusText};

        if (response.status === 200) {
            errMsgDiv.innerHTML = ""
            displayRecentAttendance()
        } else {
            const errMsg = parseError(responseBody)
            errMsgDiv.innerHTML = errMsg
            errMsgDiv.style.color = "red";
            displayRecentAttendance();
        }

        hoursOfOtInput.value = ""
        isOtCheckbox.checked = false
        otHoursContainer.style.display = 'none';

    } catch (error) {
        errMsgDiv.innerHTML = ""
        console.error('Error clocking out:', error);
        errMsgDiv.innerHTML = error

        hoursOfOtInput.value = ""
        isOtCheckbox.checked = false
        otHoursContainer.style.display = 'none';
        displayRecentAttendance();
        alert('Error clocking out. Please try again.');
    }
});

