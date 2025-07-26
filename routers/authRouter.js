const express = require("express")
const router = express.Router()
const {register, login} = require("../Controllers/authController")
const employeeValidation = require("../Middlewares/validation/employeeJoi")


router.post('/register',employeeValidation.validateCreateEmployee ,register)
router.post('/login', login)

module.exports = router