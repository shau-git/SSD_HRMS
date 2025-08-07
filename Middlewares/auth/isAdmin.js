const {ForbiddenError} = require("../../errors/errors")

// to validate is the user is an admin
const isAdmin = async(req, res, next) => {
     // get the payload that is attached in the req.employee
    const payload = req.employee

    console.log(payload)

    // only Admin can proceed 
    if(payload.role !== 'A') {
        throw new ForbiddenError("This side is forbidden")
    }

    next()
}

module.exports = isAdmin
