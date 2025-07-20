const momment = require('moment-timezone')
const sgtTime = momment().tz('Asia/Singapore').format('dddd YYYY-MM-DD HH:mm:ss')

console.log(sgtTime)