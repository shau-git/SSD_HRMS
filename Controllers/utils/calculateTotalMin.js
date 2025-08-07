//This file is to calculate the total min work & adjusted total min work
const { BadRequestError } = require("../../errors/errors")

function calculateTotalMinWork(start, end) {

    const startDT = new Date(start);
    const endDT = new Date(end);

    const diffMs = endDT - startDT; // difference in milliseconds
    const total_min_work = Math.floor(diffMs / 60000); // convert to minutes

    return total_min_work
}


function calculateTotalAdjustMin(total_min_work, is_ot, hours_of_ot, data) {
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
        throw new BadRequestError("Total working hours have be greater than hours of ot")
    }

        // ot is only added base on the condition below
    //convert hours ot to min and add it to total_min_adjusted, > 540 is becasue (8.00 - 17.00)
    if (is_ot === true && total_min_work > 540) {

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