// const messageDiv = document.querySelector('#message')
const noti = document.querySelector('#noti')
const notiCouunt = document.querySelector('.notifications-count')

async function fetchResponse(path, leave_read) {
    try {
        let url;

        if (path == 'attendance') {
            url = `${apiBaseUrl}/api/attendance?read=false&`

            // for admin and employer to only get their data, instead of get all worker only
            if(role === "E" || role === "A") {  
                url += `manager=true&`

            } else {
                url += `employee_id=${employee_id}`
            }

        }else if (path === 'leave') {

            url = `${apiBaseUrl}/api/leave?`

            if (role =='E' || role == 'A') {
                if(leave_read == 'read_withdraw') {
                    // send which worker withdraw their leave to employer if they have not read
                    url +=  `read_withdraw=false&`

                } else if (leave_read == 'read') {
                    url += `read=false&manager=true`

                }
            } else {
                url += `read=false&employee_id=${employee_id}`

            } // for employee only can read the leave response
        }
console.log(url)

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
            return responseBody

        } else {
            return null
        }

    } catch (error) {
        console.error(error)
        const errMsg = parseError(responseBody);
        // messageDiv.innerHTML = `${errMsg}`;
        // messageDiv.style.color = "red";
        return null; // Indicate that fetching failed
    }
}

(async () => {
    let totalMsg = 0;

    const attendanceRespose = await fetchResponse('attendance', 'attendance');
    if (attendanceRespose) {
        console.log('attendanceeeee')
        console.log(attendanceRespose , '\n')
        totalMsg += attendanceRespose.total;
    }

    const leaveResponse = await fetchResponse('leave', 'read');
    if (leaveResponse) {
        console.log('readdddddddd')
        console.log(leaveResponse, '\n')
        totalMsg += leaveResponse.total;
    }

    if (role === 'A' || role === 'E') {
        const leaveResponseWithdaw = await fetchResponse('leave', 'read_withdraw');
        if (leaveResponseWithdaw) {
            console.log('leaveResponseeeeeee')
            console.log(leaveResponse, '\n')
            totalMsg += leaveResponseWithdaw.total;
        }
    }
    

    // Now, after both fetches are complete, update the UI
    if (totalMsg > 0) {
        notiCouunt.style.display = 'inline-block';
        notiCouunt.innerHTML = totalMsg;
    } else {

        notiCouunt.style.display = 'none';
        notiCouunt.innerHTML = '';
    }
    
    console.log("Total messages:", totalMsg);
})();

