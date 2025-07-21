function notEmpty(field) {
    // //reject empty str (" ")
    return {msg: `${field} cannot be empty`}
}

function notNull(field) {
    return { args: true, msg: `${field} cannot be null`}
}

function len(start,end,field) {
    return { args: [start, end], msg: `length of ${field} must be beteen ${start} and ${end}`}
}

function isFloat(field) {
    return {args:true, msg: `${field} must be a number.`}
}


module.exports = {
    notEmpty,
    notNull,
    len,
    isFloat
}