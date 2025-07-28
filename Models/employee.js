const {DataTypes, Model} = require("sequelize")
const sequelize = require("../db/dbConnect")
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {notEmpty, notNull, len, isNumber, minNum} = require("./utils/validationUtils")



class Employee extends Model {
    // hased the password before saving
    static async hashPassword(employee) {
        // check if the hashed_password field modified before
        const salt = await bcrypt.genSalt(10);
        employee.hashed_password = await bcrypt.hash(employee.hashed_password, salt);
        return employee
    }

    // Instance method to create JWT (equivalent to Mongoose methods)
    createJWT() {
        return jwt.sign(
        { employee_id: this.employee_id, role: this.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_LIFETIME }
        );
    }

    // Instance method to compare passwords
    async comparePassword(candidatePassword) {
        return await bcrypt.compare(candidatePassword, this.hashed_password);
    }

    // Instance method to format employee name
    static formatName(name) {
        // remove extra spaces and capitalize the first letter.
        // Ex: Convert 'uchiha    maDara ' => 'Uchiha Madara'
        return name.replace(/\s+/g, ' ').replace(/\b\w/g, char => char.toUpperCase())
                                
    }

}


Employee.init({
    employee_id: {
        type: DataTypes.SMALLINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false, 
        validate: {
            notNull: notNull("Employee ID"),
            isInt: isNumber("Employee ID"),
            min: minNum(0, "Employee ID")
        }
    },
    first_name: {
        type: DataTypes.STRING(30),
        allowNull: false,  
        set(value) {
            this.setDataValue('first_name', value.trimEnd());
        },
        validate: {
            notNull: notNull("First Name"),
            notEmpty: notEmpty("First Name"),
            len: len(1,30,"First Name")
        }
    }, 
    last_name: {
        type: DataTypes.STRING(30),
        allowNull: false,
        set(value) {
            this.setDataValue('last_name', value.trimEnd());
        },
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
        set(value) {
            this.setDataValue('email', value.trimEnd());
        },
        validate: {
            isEmail: {
                notNull: notNull("Email"),
                args: true,
                msg: "Please enter a valid email address."
            },
            notEmpty: notEmpty("Email"),
            len: len(10,80,"Email")
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
    role: {
        type: DataTypes.STRING(1),
        allowNull: false,
        set(value) {
            if (typeof value === 'string') {
                this.setDataValue('role', value.trim().toUpperCase());
            }
        },
        validate: {
            notNull: notNull("Role"),
            isIn: {
                args: [['A', 'E', 'W']],  // Note the array of arrays
                msg: "Role must be one of: 'A (for Admin)', 'E (for Employer)' or 'W (for Worker)' "
            },
        }
    },
    medical_leave: {
        type: DataTypes.FLOAT,
        allowNull: false,
        validate: {
            notNull: notNull("Medical Leave"),
            isFloat: isNumber("Medical Leave"),
            min: minNum(0, "Medical Leave")
        }
    }, 
    annual_leave: {
        type: DataTypes.FLOAT,
        allowNull: false,
        validate: {
            notNull: notNull("Annual Leave"),
            isFloat: isNumber("Annual Leave"),
            min: minNum(0, "Annual Leave")
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
    is_new: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        validate: {
            notNull: notNull("is_new"),
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
    }
},{
    sequelize,
    modelName: 'employees',
    timestamps: false,
    defaultScope: {
      where: {
        is_active: true
      }
    },

    // hooks: {
    //     beforeSave: Employee.beforeSave
    // }
})


module.exports = Employee