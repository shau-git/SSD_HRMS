const express = require("express")
const router = express.Router()
const {getAllEmployees, getOneEmployee, updateEmployee, deleteEmployee} = require("../Controllers/employeeController")
const validateId = require("../Middlewares/validation/utils/validateId")
const {validateUpdateEmployee} = require("../Middlewares/validation/employeeJoi")
const is_new = require("../Middlewares/authentication/is_new")  //check if user login in to account first time

router.route('/').get( is_new, getAllEmployees )

router.route('/:employee_id')
    .all( validateId )
    .get( is_new, getOneEmployee )
    .put( validateUpdateEmployee, updateEmployee )
    .delete( is_new, deleteEmployee )

module.exports = router


