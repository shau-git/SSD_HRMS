const express = require("express")
const router = express.Router()
const {register, login} = require("../Controllers/authController")
const {validateCreateEmployee} = require("../Middlewares/validation/employeeJoi")
const auth = require("../Middlewares/authentication/authentication")
const is_new = require("../Middlewares/authentication/is_new")

//router.post('/register', validateCreateEmployee ,register)
router.post('/register',auth, is_new, validateCreateEmployee ,register)
router.post('/login', login)

module.exports = router