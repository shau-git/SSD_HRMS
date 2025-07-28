const Employee = require("./Models/employee")

const adminData = {
    "first_name": "shau",
    "last_name": "jie",
    "email": "worker4@company.com",
    "role": "w",
    "medical_leave": 14,
    "annual_leave": 14,
    "manager_id": 1,
    "is_new": false
}

adminData.hashed_password = Employee.hashPassword("12345")

async function createAdmin(adminData) {
    const employee = await Employee.create(adminData)
    console.log(employee)
}

createAdmin(adminData)