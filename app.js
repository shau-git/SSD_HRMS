const express = require('express');
const sequelize = require('./db/dbConnect');
// const userRoutes = require('./routes/users');
require('dotenv').config(); // Load environment variables from .env file
const PORT = process.env.PORT || 3012; // Use PORT from .env or default to 3012

const app = express();
app.use(express.json());
// app.use('/users', userRoutes);

const Employee = require("./Models/employee")
app.post('/Employee' , async (req, res) => {
    try {
      //  req.body.created_at = sequelize.literal("CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Singapore'")
        console.log(req.body)
        const employee = await Employee.create(req.body)
        console.log(employee)
        res.status(201).json({msg: "done"})
    } catch(error) {
        const errorMsg = error
        console.log(error)
        res.status(500).json({msg:error})
    }
})


app.get('/Employee', async(req, res) => {
    try {
        const employee = await Employee.findAll()
        res.status(200).json(employee)
    } catch (error) {
        //const errorMsg = error
        console.log(error)
        res.status(500).json({msg: error})
    }

})




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
