const express = require('express');
const sequelize = require('./db/dbConnect');
// const userRoutes = require('./routes/users');
require('dotenv').config(); 
const PORT = process.env.PORT || 3012; 

const app = express();
app.use(express.json());
// app.use('/users', userRoutes);

// middleware
// authentication
const authenticateUser = require("./Middlewares/auth/authentication")
// errorHandling
const errorHandlerMiddleware = require("./Middlewares/errorHandler/errorHandler")
// check if the user login in the first time
const is_new = require("./Middlewares/auth/is_new")

// routers
const authRouter = require("./routers/authRouter")
const employeesRouter = require("./routers/employeeRouter")
const attendanceRouter = require("./routers/attendanceRouter")

// routes
app.use('/api/auth',authRouter)
app.use('/api/employee', authenticateUser, employeesRouter)
app.use('/api/attendance', authenticateUser, is_new, attendanceRouter) //, is_new,

// handling error
app.use(errorHandlerMiddleware)


// Database connection
sequelize.authenticate()
    .then(() => {
        console.log('DB connected successfully.');
        // Optional: dbConnect.sync({ alter: true }); // Uncomment only if you need to auto-create/update tables
        app.listen(PORT, () => {
            console.log(`Server started on port ${PORT}`);
            
        });
    })
    .catch(error => {
        console.error('Unable to connect to the database:', error);
        process.exit(1); // Exit process if DB connection fails
    });

