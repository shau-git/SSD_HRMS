// Base URL for the API.
const apiBaseUrl = `` //"http://localhost:3013";

const token = localStorage.getItem('token')
const role = localStorage.getItem('role')
const employee_id = localStorage.getItem('employee_id')


// parsing error [object object]
function parseError(responseErr) {
    let errorHtml = "";
    
    if (typeof responseErr.error === "string") {
        // Single error message
        errorHtml = `<p style="color: red;">${responseErr.error}</p>`;
    } else if (typeof responseErr.error === "object") {
        // Multiple field errors
        Object.values(responseErr.error).forEach(messages => {
            messages.forEach(msg => {
                errorHtml += `<p style="color: red;">${msg}</p>`;
            });
        });
    }
    return errorHtml
}

