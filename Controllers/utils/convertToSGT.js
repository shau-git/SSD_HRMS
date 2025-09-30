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
    
    // this line can only works in development
    // const now = new Date(date)
    // const timezoneOffset = now.getTimezoneOffset() * 60000; // Offset in milliseconds
    // const localISOTime = new Date(now - timezoneOffset)

    // this line can only works in production (render.com)
    const localISOTime = new Date(date.setMinutes(date.getHours() + 8));
    console.log('_+_+_+_+_+_+', localISOTime)

    return localISOTime// Still ends with "Z" (UTC)
}


// get current time in SGT
function getCurrentTimeSGT() {
    return convertToSGT(new Date())
}



function isValidFullISO(dateString) {
  // Check if the input is a string
  if (typeof dateString !== 'string') {
    return false;
  }
  
  // Regex to check for 'YYYY-MM-DDTHH:mm:ssZ'
  const fullIsoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/;

  // Test the string against the regex
  return fullIsoRegex.test(dateString);
}

module.exports = { 
    getDataWithSGT,
    convertToSGT,
    getCurrentTimeSGT,
    isValidFullISO
}
// (YYYY-MM-DDTHH:mm:ss.sssZ) 