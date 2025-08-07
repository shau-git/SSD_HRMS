const {DataTypes} = require("sequelize")
const sequelize = require("../db/dbConnect")
const {notNull, len, isNumber, minNum} = require("./utils/validationUtils")
const {BadRequestError} = require("../errors/errors")

const Attendance = sequelize.define('attendance', {
    attendance_id: {
        type: DataTypes.SMALLINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false, 
        validate: {
            notNull: notNull("Attendance ID"),
            isInt: isNumber("Attendance ID"),
            min: minNum(0, "Attendance ID")
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
    leave_id: {
        type: DataTypes.SMALLINT,
        allowNull: true,
        defaultValue: null,
        references: {
            model: "leave",
            key: "leave_id",
        },
        validate: {
            isInt: isNumber("Leave ID"),
            min: minNum(0, "Leave ID")
        }
    },
    is_amended: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        validate: {
            notNull: notNull("is_amended")
        }
    },
    start_date_time: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue:  sequelize.literal("CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Singapore'"),
    },
    end_date_time: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
        validate: {
            isAfterClockIn(value) {  //if clock in is !null , clock out has to > clock in
                if (value && this.start_date_time && value < this.start_date_time) {
                    throw new BadRequestError('Clock out time must be after clock in time');
                }
            }
        }
    },
    edit_date_time: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null
    },
    response_date_time: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
        validate: {
            isAfterSubmit(value) {  // response_date_time has to > edit_date_time
                if (value && value <= this.edit_date_time) {
                    throw new BadRequestError('Response time must be after submission time');
                }
            }
        }
    },
    // withdraw_date_time: {
    //     type: DataTypes.DATE,
    //     allowNull: true,
    //     defaultValue: null,
    //     validate: {
    //         isAfterSubmit(value) {  // withdraw_date_time has to > edit_date_time
    //             if (value && value >= this.edit_date_time) {
    //                 throw new BadRequestError('Withdraw time must be after submission time');
    //             }
    //         }
    //     }
    // },
    is_ot: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        validate: {
            notNull: notNull("is_ot")
        }
    },
    total_min_work: {
        type: DataTypes.SMALLINT,
        defaultValue: 0,
        validate: {
            min: minNum(0, "total_min_work"),
            // max: {
            //     args: [1440],
            //     msg: "total_min_work cannot be greater than 1440."
            // },
            isInt: isNumber("total_min_work")
        }
    },
    total_min_adjusted: {
        type: DataTypes.SMALLINT,
        defaultValue: 0,
        validate: {
            min: minNum(0, "total_min_adjusted"),
            // max: {
            //     args: [1440],
            //     msg: "total_min_work cannot be greater than 1440."
            // },
            isInt: isNumber("total_min_adjusted")
        }
    },
    hours_of_ot: {
        type: DataTypes.SMALLINT,
        defaultValue: 0,
        validate: {
            min: minNum(0, "hours_of_ot"),
            // max: {
            //     args: [1440],
            //     msg: "total_min_work cannot be greater than 1440."
            // },
            isInt: isNumber("hours_of_ot")
        }
    },
    edit_status: {
        type: DataTypes.STRING(8),
        allowNull: true,
        defaultValue: null,
        validate: {
            isIn: {
                args: [['PENDING', 'APPROVED', 'REJECTED']],  // Note the array of arrays
                msg: "Editing status must be one of: 'PENDING', 'APPROVED', or 'REJECTED'"
            }
        }
    },
    ot_req_status: {
        type: DataTypes.STRING(8),
        allowNull: true,
        defaultValue: null, 
        validate: {
            isIn: {
                args: [['PENDING', 'APPROVED', 'REJECTED', null]],  // Note the array of arrays
                msg: "OT request status must be one of: 'PENDING', 'APPROVED', 'REJECTED' or null"
            }
        }
    },
    remarks: {
        type: DataTypes.STRING(40),
        allowNull: true,
        defaultValue: null,
        validate: {
            len: len(1,40,"Remarks")
        }
    },
    read: {
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
            isInt: isNumber("Manager ID"),
            min: minNum(0, "Manager ID")
        }
    },
},{
    timestamps: false,
    tableName: 'attendance'
})


module.exports = Attendance