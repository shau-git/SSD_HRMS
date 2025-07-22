const {lenMsg, isNumberMsg, minNumMsg} = require("./erroMessage")

function notEmpty(field) {
    // //reject empty str (" ")
    return {msg: `${field} cannot be empty`}
}

function notNull(field) {
    return { args: true, msg: `${field} cannot be null`}
}

function len(start,end,field) {
    return { args: [start, end], msg: lenMsg(start,end,field)}
}

function isNumber(field) {
    return {args:true, msg: isNumberMsg(field)}
}

function minNum(limit, field) {
    return {args: [limit], msg: minNumMsg(field)}
}

module.exports = {
    notEmpty,
    notNull,
    len,
    isNumber,
    minNum
}