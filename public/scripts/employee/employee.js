// this variable is for the getAllEmployee.js to store document.getElementById("active-status"); 
// else in the fetchEmployee will get activeStatus is not declared
let activeStatus;

async function getManager(manager_id) {
    if (!manager_id) {
        return `<p>Manager information not available.</p>`;
    }
    
    const responseBody = await fetchEmployee(manager_id);
    let managerHTML = '';
    // Handle both single employee object and an array of employees from the API
    const managers = responseBody?.employee || [responseBody?.employee].filter(Boolean);

    if (managers && managers.length > 0) {
        managers.forEach(e => {
            managerHTML += `
                <h3>Manager: <span style="color: blue">${e.last_name}, ${e.first_name}</span></h3>
                <p>Email: <span style="color: blue">${e.email}</span></p>
            `;
        });
    } else {
        managerHTML = `<p>Manager information not available.</p>`;
    }
    return managerHTML;
}


async function employeeHTMLFunc(employee) {
    const managerHtml = await getManager(employee.manager_id);
    let employeeHTML = `
            <h2>Name: <span style="color: rgb(31, 202, 31);">${employee.first_name}, ${employee.last_name}</span></h2>
            <p>Employee ID: <span class="data">${employee.employee_id}</span></p>
            <p>Email: <span class="data">${employee.email}</span></p>
            <p>Is Active: <span class="data">${employee.is_active}</span></p>
            <p>Role: <span class="data">${employee.role}</span><p>
            <p>Medical Leave: <span class="data">${employee.medical_leave}</span></p>
            <p>Annual Leave: <span class="data">${employee.annual_leave}</span></p>
            <p>Is New: <span class="data">${employee.is_new}</span></p>
            <p>Created At: <span class="data">${employee.created_at}</span></p><hr>
            <p>Manager ID: <span style="color: blue">${employee.manager_id}</span></p>
            <div>${managerHtml}</div>
        `
    return employeeHTML
}


async function fetchEmployee(employee_id, activeStatus) {
    let link = `${apiBaseUrl}/api/employee`;

    if (employee_id) {
        link += `/${employee_id}`;
    }

    if(activeStatus) {
        if (activeStatus === 'true' || activeStatus === 'false') {
            link += `?is_active=${activeStatus}`;
        }
    }


console.log(link)
    try {
        const response = await fetch(link, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                ...(token && { "Authorization": `Bearer ${token}` })
            },
        });

        if (response.ok) {
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                return await response.json();
            } else {
                return {};
            }
        } else {
            const errorText = await response.text();
            throw new Error(`API returned status ${response.status}: ${errorText}`);
        }
    } catch (error) {
        console.error("Error fetching employee:", error);
        messageDiv.innerHTML = `<p style="color: red;">Failed to fetch employee data. Please try again.</p>`;
        return null;
    }
}