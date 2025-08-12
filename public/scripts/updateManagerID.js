// function to update manager id
async function updateManagerId(AttendanceIdToEdit, newManagerId, path, table , messageDiv) {   
    try {
        messageDiv.textContent = `Updating manager id to ${newManagerId}...`;
        messageDiv.style.color = "blue";

        const response = await fetch(`${apiBaseUrl}${path}${AttendanceIdToEdit}`, { 
        method: 'PUT', // Use PUT or PATCH for updates
        headers: {
            'Content-Type': 'application/json',
            ...(token && {
            'Authorization': `Bearer ${token}`
            })
        },
        body: JSON.stringify({
                manager_id: newManagerId
            }),
        });

        const responseBody = response.headers
        .get("content-type")
        ?.includes("application/json") ?
        await response.json() : {
            message: response.statusText
        };

        if (response.ok) {
            messageDiv.textContent = `Manager ID for ${table} id ${AttendanceIdToEdit} updated to ${newManagerId} successfully!`;
            messageDiv.style.color = "green";

            alert('Please refresh the page')

        } else {
            const errMsg = parseError(responseBody);
            messageDiv.textContent = `Failed to update manager id: ${errMsg}`;
            messageDiv.style.color = "red";
        }
        } catch (err) {
            console.error("Error updating:", err);
            messageDiv.textContent = `An error occurred while updating: ${err.message}`;
            messageDiv.style.color = "red";
        }
}