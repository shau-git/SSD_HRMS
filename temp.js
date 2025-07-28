const momment = require('moment-timezone')
const sgtTime = momment().tz('Asia/Singapore').format('dddd YYYY-MM-DD HH:mm:ss')
const Joi = require("joi")

const schema = Joi.object({
    first_name: Joi.string().min(1).max(10).required().messages({
        "string.base": "First Name must be s string",
        "string.empty": "First Name cannot be empty",
        "string.min": "First Name must be at least 1 character long",
        "string.max": "First Name cannot exceed 30 characters",
        "any.required": "First Name is required",
    })
})


const payload = {
    first_name: null
}

payload['employee_id'] = 1

console.log(Boolean("false"))


const prices = [5, 30, 10,25,15,20]

function sum(acc, el) {
    console.log(acc, el)
    return acc + el
}

console.log('here')
prices.unshift(1)

console.log(prices)