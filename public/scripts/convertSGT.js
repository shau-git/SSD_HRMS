// function to convert datetime to SGT
function convertToSGT(date) {
    const now = new Date(date)

    const timezoneOffset = now.getTimezoneOffset() * 60000; // Offset in milliseconds

    const localISOTime = new Date(now - timezoneOffset)//.toISOString();

    return localISOTime// Still ends with "Z" (UTC)
}


// get current time in SGT
function getCurrentTimeSGT() {
    return convertToSGT(new Date())
}