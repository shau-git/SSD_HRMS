const jwt = require("jsonwebtoken")
const UnauthenticatedError = require("../../errors/unauthenticated")

const auth = async(req, res, next) => {

    // check if there is a token in the req.headers
    const authHeader = req.headers.authorization
    // if no token throw cutom error and proceed to errorHandlerMiddleware
    if(!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new UnauthenticatedError('Authentication invalid')
    }
           
    try {
        // getting the token only instead of 'Bearer eyJhbci...'
        const token = authHeader.split(' ')[1]
 console.log(token)
        // verifying the token
        const payload = jwt.verify(token, process.env.JWT_SECRET)
        console.log(payload)
        console.log(token)
        // attach the jwt token payload to the req
        req.employee = {employee_id: payload.employee_id, role: payload.role }

        // authentication passed, proceed to the next middleware
        next()

    } catch(error) {
        console.error(error)
        throw new UnauthenticatedError('Authentication invalid')
    }
} 

module.exports = auth