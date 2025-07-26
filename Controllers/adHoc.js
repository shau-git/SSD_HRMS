// There file contains all the function use for each controller.

const { Op } = require('sequelize');

function queryField(queryObject, queryStringObj) {
    for(let field of Object.entries(queryStringObj)) {
        console.log(field)
        console.log(field[0], field[1])
        const column = field[0]
        let data = field[1] 

        if(data == 'true') {
            data = true
        } else if (data == 'false') {
            data = false
        }

        if(column == 'status' || column == 'type' || column == 'role') { data.toUpperCase() }
            
        if(column == 'employee_id') { data = parseInt(data)}


        // employee?numericFilter=employee_id>10&last_name_ne=kok
        if(column == 'numericFilters') {
           const where =  JSON.parse(data)
           for(let [field, condition] of Object.entries(where)) {

               for (const [operator, val] of Object.entries(condition)) {
                        queryObject.where[field] = {
                            [Op[operator]]: val
                        };
                }
           }
           console.log("here",where["employee_id"])
        }
        console.log(typeof data)
        //queryObject.where[field[0]] = data
        //console.log(queryObject.where[field[0]])
    }
}


module.exports = {
    queryField
}