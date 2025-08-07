const {DataTypes} = require("sequelize")
const sequelize = require("../db/dbConnect")
const {notNull, isNumber, minNum, len} = require("./utils/validationUtils")
const {BadRequestError} = require("../errors/errors")


const AttendanceEditRequest = sequelize.define('attendance_edit_request', {
    request_id: {
        type: DataTypes.SMALLINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false, 
        validate: {
            notNull: notNull("Request id"),
            isInt: isNumber("Request id"),
            min: minNum(0, "Request id")
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
    // leave_id: {
    //     type: DataTypes.SMALLINT,
    //     allowNull: true,
    //     defaultValue: null,
    //     references: {
    //         model: "leave",
    //         key: "leave_id",
    //     },
    //     validate: {
    //         isInt: isNumber("Leave ID"),
    //         min: minNum(0, "Leave ID")
    //     }
    // },
    start_date_time: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize.literal("CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Singapore'")
    },
    end_date_time: {
        type: DataTypes.DATE,
        allowNull: false,
        validate: {
            isAfterClockIn(value) {
                if (value && this.start_date_time && value < this.start_date_time) {
                    throw new BadRequestError('Clock out time must be after clock in time');
                }
            }
        }
    },
    is_ot: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        validate: {
            notNull: notNull("is_ot")
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
    remarks: {
        type: DataTypes.STRING(40),
        allowNull: true,
        defaultValue: null,
        validate: {
            len: len(1,40,"Remarks")
        }
    },
    edit_date_time: {
        type: DataTypes.DATE, 
        allowNull: false,
        defaultValue: sequelize.literal("CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Singapore'"),
        validate: {
            notNull: notNull("Edit date/time"),
        },
    },
    edit_status: {
        type: DataTypes.STRING(8),
        allowNull: false,
        defaultValue: 'PENDING',
        set(value) {
            if (typeof value === 'string') {
                this.setDataValue('edit_status', value.trim().toUpperCase());
            }
        },        
        validate: {
            notNull: notNull("Status"),
            isIn: {
                args: [['PENDING', 'APPROVED', 'REJECTED']],  // Note the array of arrays
                msg: "Editing status must be one of: 'PENDING', 'APPROVED', or 'REJECTED'"
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
            isInt: isNumber("Manager ID"),
            min: minNum(0, "Manager ID")
        }
    },
},{
    timestamps: false,
    tableName: 'attendance_edit_request', // Explicitly set the underscored table name
    // underscored: true // Optional: converts fieldNames to snake_case too

})

module.exports = AttendanceEditRequest