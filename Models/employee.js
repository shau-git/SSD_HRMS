const {DataTypes} = require("sequelize")
const sequelize = require("../db/dbConnect")
const {notEmpty, notNull, len, isFloat} = require("../validation/modelValidation")

const Employee = sequelize.define('employees', {
    employee_id: {
        type: DataTypes.SMALLINT,
        primaryKey: true,
        autoIncrement: true,
    },
    first_name: {
        type: DataTypes.STRING(30),
        allowNull: false,  
        validate: {
            notNull: notNull("First Name"),
            notEmpty: notEmpty("First Name"),
            len: len(1,30,"First Name")
        }
    }, 
    last_name: {
        type: DataTypes.STRING(30),
        allowNull: false,
        validate: {
            notNull: notNull("Last Name"),
            notEmpty: notEmpty("Last Name"),
            len: len(1,30,"Last Name")
        }

    }, 
    email: {
        type: DataTypes.STRING(80),
        allowNull: false,
        unique: true, // database will reject duplicates
        validate: {
            isEmail: {
                notNull: notNull("Email"),
                args: true,
                msg: "Please enter a valid email address."
            },
            notEmpty: notEmpty("Email"),
            len: len(1,80,"Email")
        }
    },
    hashed_password:{
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
            notNull: notNull("Password"),
            notEmpty: notEmpty("Password")
        }
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        validate: {
            notNull: notNull("is_active"),
        }
    },
    shift_type: {
        type: DataTypes.STRING,     //shift type
        allowNull: false,
        validate: {
            notNull: notNull("Shift Type"),
            notEmpty: notEmpty("Shift Type"),
        }
    },
    medical_leave: {
        type: DataTypes.FLOAT,
        allowNull: false,
        validate: {
            notNull: notNull("Medical Leave"),
            isFloat: isFloat("Medical Leave"),
            min: {
                args: [0],
                msg: "Medical Leave cannot be negative."
            }
        }
    }, 
    annual_leave: {
        type: DataTypes.FLOAT,
        allowNull: false,
        validate: {
            notNull: notNull("Annual Leave"),
            isFloat: isFloat("Annual Leave"),
            min: {
                args: [0],
                msg: "Annual Leave cannot be negative."
            }
        }
    },
    created_at: {
        type: DataTypes.DATE, 
        allowNull: false,
        defaultValue: sequelize.literal("CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Singapore'"),
        validate: {
            notNull: notNull("created_at")
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
            notNull: notNull("Manager ID")
        }
    }
}, {
  // Other model options go here
  //tableName: 'employees', // Optional: specify table name, defaults to plural 'Users'
  timestamps: false, // disable createdAt and updatedAt columns, else they will be created by sequelize
})


module.exports = Employee