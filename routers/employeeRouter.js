const express = require("express")
const router = express.Router()
const {getAllEmployees, getOneEmployee, updateEmployee, deleteEmployee} = require("../Controllers/employeeController")
const { validateEmpId } = require("../Middlewares/validation/utils/validateId")
const {validateUpdateEmployee} = require("../Middlewares/validation/employeeJoi")
const is_new = require("../Middlewares/auth/is_new")  //check if user login in to account first time
const isAdmin = require("../Middlewares/auth/isAdmin")

router.route('/').get( is_new, getAllEmployees )

router.route('/:employee_id')
    .all( validateEmpId )
    .get( is_new, getOneEmployee )
    .put( validateUpdateEmployee, updateEmployee )
    .delete( is_new, isAdmin, deleteEmployee )

module.exports = router


