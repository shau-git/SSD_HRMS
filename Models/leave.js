const {DataTypes} = require("sequelize")
const sequelize = require("../db/dbConnect")
const {notEmpty, notNull, len, isNumber, minNum} = require("../Middlewares/validation/validationAdHoc")

const Leave = sequelize.define('leave', {
    leave_id: {
        type: DataTypes.SMALLINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false, 
        validate: {
            notNull: notNull("Leave ID"),
            isInt: isNumber("Leave ID"),
            min: minNum(0, "Leave ID")
        }
    },
    employee_id: {
        type: DataTypes.SMALLINT,
        allowNull: false,
        references: {
            model: "employees",
            key: "employee_id",
        },
        validate: {
            notNull: notNull("Employee ID"),
            isInt: isNumber("Employee ID"),
            min: minNum(0, "Employee ID")
        }
    },
    attendance_id: {
        type: DataTypes.SMALLINT,
        allowNull: false,
        references: {
            model: "attendance",
            key: "attendance_id",
        },
        validate: {
            notNull: notNull("Attendance ID"),
            isInt: isNumber("Attendance ID"),
            min: minNum(0, "Attendance ID")
        }
    },
    status: {
        type: DataTypes.STRING(8),
        allowNull: false,
        validate: {
            notNull: notNull("Status"),
            isIn: {
                args: [['PENDING', 'APPROVED', 'REJECTED']],  // Note the array of arrays
                msg: "Status must be one of: 'PENDING', 'APPROVED', or 'REJECTED'"
            }
        }
    },
    type: {
        type: DataTypes.CHAR(2),
        allowNull: false,      
        validate: {
            notNull: notNull("Type"),
            notEmpty: notEmpty("Type"),
            isIn: {
                args: [['AL', 'ML']],  // Note the array of arrays
                msg: "Leave type must be one of: 'AL' (for Annual Leave) or 'ML' (for Medical Leave)"
            },
        }  
    },
    start_date_time: {
        type: DataTypes.DATE, 
        allowNull: false,
        validate: {
            notNull: notNull("Start date/time")
        }
    },
    end_date_time: {
        type: DataTypes.DATE, 
        allowNull: false,
        validate: {
            notNull: notNull("End date/time"),
            isAfterStart(value) {
                if (value <= this.start_date_time) {
                    throw new Error('End date/time must be after start date/time');
                }
            }
        }
    },
    submit_date_time: {
        type: DataTypes.DATE, 
        allowNull: false,
        defaultValue: sequelize.literal("CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Singapore'"),
        validate: {
            notNull: notNull("Submit date/time"),
            isAfterSubmit(value) {
                if (value && value < this.submit_date_time) {
                    throw new Error('Response time must be after submission time');
                }
            }
        },
    },
    response_time: {
        type: DataTypes.DATE, 
        allowNull: true,
        validate: {
            isAfterSubmit(value) {
                if (value && value < this.submit_date_time) {
                    throw new Error('Response time must be after submission time');
                }
            }
        }
    },
    withdraw_time: {
        type: DataTypes.DATE, 
        allowNull: true,
        validate: {
            isAfterSubmit(value) {
                if (value && value < this.submit_date_time) {
                    throw new Error('Withdraw time must be after submission time');
                }
            }
        }
    },
    manager_id: {
        type: DataTypes.SMALLINT,
        allowNull: false,
        references: {
            model: "employees",
            key: "employee_id",
        },
        validate: {
            notNull: notNull("Manager ID"),
            isInt: isNumber("Attendance ID"),
            min: minNum(0, "Attendance ID")
        }
    },
    remarks: {
        type: DataTypes.STRING(40),
        allowNull: false,
        defaultValue: null,
        validate: {
            notNull: notNull("Remarks"),
            notEmpty: notEmpty("Remarks"),
            len: len(1,40,"Remarks")
        }
    }
},{
    timestamps: false,
})


module.exports = Leave