//This file is to calculate the total min work & adjusted total min work
const { BadRequestError } = require("../../errors/errors")

function calculateTotalMinWork(start, end) {

    const startDT = new Date(start);
    const endDT = new Date(end);

    const diffMs = endDT - startDT; // difference in milliseconds
    const total_min_work = Math.floor(diffMs / 60000); // convert to minutes

    return total_min_work
}


function calculateTotalAdjustMin(total_min_work, is_ot, hours_of_ot, data, onLeave = null) {
     // to store total min adjust later
    let total_min_adjusted;

    // subtract out the lunch time, so 480 min
    if (total_min_work >= 480) {
        total_min_adjusted = 480
    } else {
        // work less than the working hours
        total_min_adjusted = total_min_work
    }

    console.log(total_min_work, is_ot, hours_of_ot, data)
    
    // check if total min of work is greater than the ot hours
    if(total_min_work < Number(hours_of_ot) * 60 ) {
        throw new BadRequestError("Hours of OT cannot be  be greater than Total working hours")
    }

    // if on leave is true means taking half day leave, if full day leave user will not clock in/out (8am to 12 am or 13am to 17am)
    if(onLeave) {
        total_min_adjusted = total_min_work > 240 ? 240 : total_min_work

    } else if (is_ot === true && total_min_work > 540) {

        // ot is only added base on the condition
        //convert hours ot to min and add it to total_min_adjusted, > 540 is becasue (8.00 - 17.00)
        total_min_adjusted += Number(hours_of_ot) * 60 
        data.ot_req_status = 'PENDING'
    } 
    

    data.total_min_adjusted = total_min_adjusted

    return data
}
module.exports = {
    calculateTotalMinWork,
    calculateTotalAdjustMin
}