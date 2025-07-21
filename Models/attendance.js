const {DataTypes} = require("sequelize")
const sequelize = require("../db/dbConnect")
const {notNull, len} = require("../validation/modelValidation")


const Attendance = sequelize.define('attendance', {
    attendance_id: {
        type: DataTypes.SMALLINT,
        primaryKey: true,
        autoIncrement: true,
    },
    employee_id: {
        type: DataTypes.SMALLINT,
        allowNull: false,
        references: {
            model: "employees",
            key: "employee_id",
        },
        validate: {
            notNull: notNull("Employee ID")
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
    },
    is_amended: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        validate: {
            notNull: notNull("is_amended")
        }
    },
    clock_in: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: sequelize.literal("CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Singapore'")
    },
    clock_out: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
        validate: {
            isAfterClockIn(value) {
                if (value && this.clock_in && value < this.clock_in) {
                    throw new Error('Clock out time must be after clock in time');
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
            isAfterSubmit(value) {
                if (value && value < this.edit_date_time) {
                    throw new Error('Response time must be after submission time');
                }
            }
        }
    },
    withdraw_date_time: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
        validate: {
            isAfterSubmit(value) {
                if (value && value < this.edit_date_time) {
                    throw new Error('Response time must be after submission time');
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
    total_min_work: {
        type: DataTypes.SMALLINT,
        validate: {
            min: {
                args: [0],
                msg: "total_min_work cannot be negative."
            },
            max: {
                args: [1440],
                msg: "total_min_work cannot be greater than 1440."
            }
        }
    },
    remarks: {
        type: DataTypes.STRING(60),
        allowNull: true,
        defaultValue: null,
        validate: {
            len: len(1,60,"Remarks")
        }
    },
    manager_id: {
        type: DataTypes.SMALLINT,
        allowNull: true,
        references: {
            model: "employees",
            key: "employee_id",
        },
        validate: {
            notNull: notNull("Manager ID")
        }
    },
},{
    timestamps: false,
})


module.exports = Attendance