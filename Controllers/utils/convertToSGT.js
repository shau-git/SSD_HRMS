const dateField = [
    'created_at', 
    'start_date_time', 
    'end_date_time', 
    'edit_date_time',
    'response_date_time',
    'withdraw_date_time',
    'submit_date_time' 
]


function getDataWithSGT(sequelizeQueries) {
    let formattedSGT = [];

    // more than 1 record
    if(Array.isArray(sequelizeQueries)) {
        formattedSGT = sequelizeQueries.map(query => {
            const toInsert = query.dataValues
            // console.log(toInsert)
            return {...toInsert}
        }) 
    } else {
        // only have 1 record
        formattedSGT.push({...sequelizeQueries.dataValues})
    }

    // loop throught the copied array an convert to SGT
    formattedSGT.forEach(record => {
        for( let [field, value] of Object.entries(record)) {
 
            if (dateField.includes(field) && value) {
                record[field] = convertToSGT(value)
            }
        }
    })

    return formattedSGT
}


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

module.exports = { 
    getDataWithSGT,
    convertToSGT,
    getCurrentTimeSGT
}
// (YYYY-MM-DDTHH:mm:ss.sssZ) 