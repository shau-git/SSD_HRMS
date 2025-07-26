const express = require("express")
const router = express.Router()
const {getAllEmployees} = require("../Controllers/employeeController")

router.route('/').get(getAllEmployees)

module.exports = router