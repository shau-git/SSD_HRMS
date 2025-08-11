const Employee = require("../../models/employee")
const { BadRequestError } = require("../../errors/errors")

async function updateLeave(employee_id, type, medical_leave, annual_leave, usage) {

    if (type === 'ML') {

        if(medical_leave + usage < 0) {
            throw new BadRequestError("You do not have enough medical leave")
        } 
       
        let updatedML = medical_leave + usage
        await Employee.update({medical_leave: updatedML}, { where: {employee_id} })

    } else if (type === 'AL') {

        if(annual_leave + usage < 0) {
            throw new BadRequestError("You do not have enough annual leave")
        } 

        let updatedAL = annual_leave + usage
        console.log('updatedAL', updatedAL, typeof updatedAL)
        await Employee.update({annual_leave: Number(updatedAL)}, { where: {employee_id} })

    }
}


module.exports = updateLeave