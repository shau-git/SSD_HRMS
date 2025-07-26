const express = require('express');
const sequelize = require('./db/dbConnect');
// const userRoutes = require('./routes/users');
require('dotenv').config(); 
const PORT = process.env.PORT || 3012; 

const app = express();
app.use(express.json());
// app.use('/users', userRoutes);

// middleware
// validation

// errorHandling
const errorHandlerMiddleware = require("./Middlewares/errorHandler/errorHandler")

// routers
const authRouter = require("./routers/authRouter")
const employeesRouter = require("./routers/employeeRouter")

// routes
app.use('/api/auth',authRouter)
app.use('/api/employee', employeesRouter)


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
