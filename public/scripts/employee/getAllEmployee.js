// Global variables. These should be defined once at the top.
const messageDiv = document.getElementById("message");
const fetchEmployeeBtn = document.getElementById("fetchEmployeeBtn");
const register = document.getElementById('register')
activeStatus = document.getElementById("active-status");

// Make sure `role` is defined before this runs.
if (role === 'A') {
    document.querySelector('#status-container').style.display = 'block';
    register.style.display = 'block'
}


async function renderEmployees() {

    messageDiv.innerHTML = 'Loading employee data...';
    messageDiv.style.color = "black";

    const activeStatusValue = activeStatus ? activeStatus.value : null;

    const responseBody = await fetchEmployee(null,  activeStatusValue);

    messageDiv.innerHTML = '';
    
    // the employee_id here is to check if it is passed in as an argument in the fetchEmployee()
    if (!responseBody || (responseBody.total === 0 && !employee_id)) {
        console.log(responseBody.error)
        console.log(parseError(responseBody))
        messageDiv.innerHTML =`YOYO`// parseError(responseBody)//`<p>No Employee Found</p>`;
        return;
    }

    let employeesToRender;
    if (responseBody.employees) {
        employeesToRender = responseBody.employees;
    } else if (responseBody.employee) {
        employeesToRender = [responseBody.employee];
    } else {
        messageDiv.innerHTML = `<p>Invalid employee data received from API.</p>`;
        return;
    }

    employeesToRender.forEach(async(employee) => {

            messageDiv.innerHTML = ""
            messageDiv.style.color = "black";
            // If employee data was successfully fetched, populate the form
            const employeeElement = document.createElement("div");

            // render the employee data to html
            employeeElement.innerHTML = await employeeHTMLFunc(employee)

            if(role === 'A') {
                employeeElement.innerHTML += `<button onclick="editEmployee(${employee.employee_id})">Edit</button>`
            }
            employeeElement.classList.add("employee-item");
            messageDiv.appendChild(employeeElement)
    })
    
}


function editEmployee(employee_id) {
    console.log("Edit Aemployee with ID:", employee_id);
    // In a real app, redirect to edit.html with the attendance_id
    window.location.href = `/html/employee/editEmployee.html?employee_id=${employee_id}`; 
}


// Fetch employee when the button is clicked
fetchEmployeeBtn.addEventListener("click", () => renderEmployees());
// Optionally, fetch employee when the page loads
// window.addEventListener('load', () => {
//     activeStatus = document.getElementById("active-status");
//     renderEmployees();
// });


window.addEventListener('load', renderEmployees)
