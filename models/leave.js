const {DataTypes} = require("sequelize")
const sequelize = require("../db/dbConnect")
const {notNull, len, isNumber, minNum, notEmpty} = require("./utils/validationUtils")

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
        allowNull: true,
        defaultValue: null,
        references: {
            model: "attendance",
            key: "attendance_id",
        },
        validate: {
            //notNull: notNull("Attendance ID"),
            isInt: isNumber("Attendance ID"),
            min: minNum(0, "Attendance ID")
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
    day: {
        type: DataTypes.CHAR(3),
        allowNull: false,   
        validate: {
            notNull: notNull("Day"),
            notEmpty: notEmpty("Day"),
            isIn: {
                args: [['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']],  // Note the array of arrays
                msg: "Day must be one of: 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat' "
            },
        }  
    }, 
    duration: {
        type: DataTypes.CHAR(4),
        allowNull: false,   
        validate: {
            notNull: notNull("Duration"),
            notEmpty: notEmpty("Duration"),
            isIn: {
                args: [['FULL', 'AM', 'PM']],  // Note the array of arrays
                msg: "Day must be one of: 'FULL', 'AM', 'PM' "
            },
        }  
    }, 
    type: {
        type: DataTypes.CHAR(2),
        allowNull: false,      
        set(value) {
            if (typeof value === 'string') {
                this.setDataValue('type', value.trim().toUpperCase());
            }
        },  
        validate: {
            notNull: notNull("Type"),
            notEmpty: notEmpty("Type"),
            isIn: {
                args: [['AL', 'ML']],  // Note the array of arrays
                msg: "Leave type must be one of: 'AL' (for Annual Leave) or 'ML' (for Medical Leave)"
            },
        }  
    },
    leave_remarks: {
        type: DataTypes.STRING(40),
        allowNull: false,
        validate: {
            notNull: notNull("Leave remarks"),
            notEmpty: notEmpty("Leave remarks"),
            len: len(1,40,"Leave remarks")
        }
    },
    status: {
        type: DataTypes.STRING(9),
        allowNull: false,
        set(value) {
            if (typeof value === 'string') {
                this.setDataValue('status', value.trim().toUpperCase());
            }
        },        
        validate: {
            notNull: notNull("Status"),
            isIn: {
                args: [['PENDING', 'APPROVED', 'REJECTED', 'WITHDRAWN']],  // Note the array of arrays
                msg: "Status must be one of: 'PENDING', 'APPROVED', 'REJECTED' OR 'WITHDRAWN'"
            }
        }
    },
    submit_date_time: {
        type: DataTypes.DATE, 
        allowNull: false,
        defaultValue: sequelize.literal("CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Singapore'"),
        validate: {
            notNull: notNull("Submit date/time"),
        },
    },
    response_date_time: {
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
    withdraw_date_time: {  
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
    read: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: null,      
    },
    read_withdraw: {  // to notify employer that the worker has withdrawn a leave
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: null,      
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
    }
},{
    timestamps: false,
    tableName: 'leave'
})


module.exports = Leave