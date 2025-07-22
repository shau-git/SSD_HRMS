function lenMsg(start, end, field) {
    return `length of ${field} must be beteen ${start} and ${end}`
}

function isNumberMsg(field) {
    return `${field} must be a number`
}

function minNumMsg(field) {
    return  `${field} cannot be negative`
}


module.exports = {
    lenMsg,
    isNumberMsg,
    minNumMsg
}