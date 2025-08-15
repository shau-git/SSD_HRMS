const express = require('express');
const sequelize = require('./db/dbConnect');
require('dotenv').config(); 
const PORT = process.env.PORT || 3012; 
const cors = require("cors")
const path = require("path");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger-output.json");


const app = express();
app.use(express.urlencoded({extended: true}))
// app.use(express.static(path.join(__dirname, "public")))
app.use(express.static("./public"))
app.use(express.json());
app.use(cors())


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
const leaveRouter = require("./routers/leaveRouter")

// routes
// Serve the Swagger UI at a specific route
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument)); //http://localhost:3013/api-docs

// #swagger.tags = ['Authentication']
app.use('/api/auth',authRouter)

// #swagger.tags = ['Employee']
app.use('/api/employee', authenticateUser, employeesRouter)

// #swagger.tags = ['Attendance']
app.use('/api/attendance', authenticateUser, is_new, attendanceRouter) 

// #swagger.tags = ['Leave']
app.use('/api/leave', authenticateUser, is_new, leaveRouter) 

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

