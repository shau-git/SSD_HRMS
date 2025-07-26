const {DataTypes, Model} = require("sequelize")
const sequelize = require("../db/dbConnect")
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {notEmpty, notNull, len, isNumber, minNum} = require("../Middlewares/validation/validationAdHoc")



class Employee extends Model {
    // Password hashing hook (equivalent to Mongoose pre-save)
    static async beforeSave(user) {
        if (user.changed('hashed_password')) {
        const salt = await bcrypt.genSalt(10);
        user.hashed_password = await bcrypt.hash(user.hashed_password, salt);
        }
    }

    // Instance method to create JWT (equivalent to Mongoose methods)
    createJWT() {
        return jwt.sign(
        { userId: this.employee_id, role: this.role },
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
    hooks: {
        beforeSave: Employee.beforeSave
    }
})


module.exports = Employee