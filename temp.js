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


// console.log(new Date().toLocaleString())
// console.log(new Date())

// Using vanilla JS (outputs local time but converts to UTC)
const now = new Date();
const timezoneOffset = now.getTimezoneOffset() * 60000; // Offset in milliseconds
console.log(timezoneOffset)
const localISOTime = new Date(now - timezoneOffset).toISOString();
console.log(localISOTime); // Still ends with "Z" (UTC)

console.log(now)
console.log('\n---------------------------------\n')


// Using libraries (for accurate timezone handling)
const moment = require('moment-timezone');
const sgTimeISO = moment().tz('Asia/Singapore').format();
console.log(sgTimeISO); // "2025-07-31T22:30:00+08:00"

console.log(new Date().getTimezoneOffset())

console.log(new Date().toUTCString())//.toLocaleString() )


console.log('\n---------------------------------\n')



const localDateString = new Date().toLocaleString('en-SG', {
  timeZone: 'Asia/Singapore'
});
console.log(localDateString); 
// "31/07/2025, 22:30:00" (Singapore time, as string)

// To convert back to Date object:
const parsedDate = new Date(localDateString);
console.log(parsedDate.toISOString()); 
// Converts back to UTC



const start = new Date("2025-08-01T08:06:35.236Z");
const end = new Date("2025-08-01T17:42:48.378Z");

console.log('hae', new Date('2025-08-03T08:06:35.236Z').getDay())

const diffMs = end - start; // difference in milliseconds
const diffMin = Math.floor(diffMs / 60000); // convert to minutes

console.log(`Total minutes: ${diffMin}`);


console.log("\n")

const {calculateTotalMinWork }= require('./Controllers/utils/calculateTotalMin')
console.log(calculateTotalMinWork(start, end))

console.log('\n---------------------------------\n')
const now1 = new Date()

const timezoneOffset1 = now.getTimezoneOffset() * 60000; // Offset in milliseconds

const localISOTime1 = new Date(now1 - timezoneOffset1)//.toISOString();

const dateOnly = new Date().toISOString().split('T')[0];
console.log(dateOnly)

const obj = {
  name: "John",
  //age: 30,
  city: "New York"
};

// Delete the 'age' property
delete obj.age;

console.log(obj); // { name: "John", city: "New York" }

const date1 = new Date('2025-08-04T12:14:54.402Z')
const date2 = new Date('2025-08-04T20:10:54.402Z')

console.log(date1, date2)
console.log(date1 <= date2)


const data = {ab: "ab", cd: "cd"}
const data1 = {... data}

a =2

if (a == 2) {
    data1.ab = '12'
} else {
    data1.ab=78
}

console.log(data1)

const {convertToSGT} = require("./Controllers/utils/convertToSGT")
console.log(convertToSGT(new Date("2025-08-06T08:00")))
console.log(convertToSGT(new Date("2025-08-06T17:00")).getDay())

console.log(new Date("2002-08-06T17:00").getFullYear())
console.log(convertToSGT(new Date()).getMonth(), '\n')
console.log(convertToSGT(new Date("2025-01-06T17:00")).getMonth())
console.log(convertToSGT(new Date("2025-02-06T17:00")).getMonth())
console.log(convertToSGT(new Date("2025-03-06T17:00")).getMonth())
console.log(convertToSGT(new Date("2025-04-06T17:00")).getMonth())
console.log(convertToSGT(new Date("2025-05-06T17:00")).getMonth())
console.log(convertToSGT(new Date("2025-06-06T17:00")).getMonth())
console.log(convertToSGT(new Date("2025-07-06T17:00")).getMonth())
console.log(convertToSGT(new Date("2025-08-06T17:00")).getMonth())
console.log(convertToSGT(new Date("2025-09-06T17:00")).getMonth())
console.log(convertToSGT(new Date("2025-10-06T17:00")).getMonth())
console.log(convertToSGT(new Date("2025-11-06T17:00")).getDate())
console.log(convertToSGT(new Date("2025-12-06")).toDateString())

console.log("\n")
const today = new Date()
today.setFullYear('2024', 0, 1)

today.setHours(0, 0, 0, 0)
console.log(today)
console.log(convertToSGT(today))

console.log(today.toISOString().slice(0,10))

