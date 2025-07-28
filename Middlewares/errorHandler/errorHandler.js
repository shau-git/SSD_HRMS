const CustomAPIError = require("../../errors/custom-error")
const {StatusCodes} = require("http-status-codes")

const errorHandlerMiddleware = (err, req, res, next) => {
    console.log(err)
    if(err instanceof CustomAPIError) {
        return res.status(err.statusCode).json({error: err.message})
    }
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({error: 'Something went wrong, please try again.'})
}

module.exports = errorHandlerMiddleware