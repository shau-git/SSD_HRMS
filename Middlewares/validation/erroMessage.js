function lenMsg(start, end, field) {
    return `length of ${field} must be beteen ${start} and ${end}`
}

function isNumberMsg(field) {
    return `${field} must be a number`
}

function minNumMsg(field) {
    return  `${field} cannot be negative`
}

function joiErrorMessage(error) {
    // If validation fails, format the error messages and send a 400 response
    const errorMessage = error.details
        .map((detail) => detail.message)
        //.join(", ")
    // console.log(typeof errorMessage) string
    return errorMessage
    
}

module.exports = {
    lenMsg,
    isNumberMsg,
    minNumMsg,
    joiErrorMessage
}