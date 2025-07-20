const { Sequelize } = require('sequelize');
require('dotenv').config()



const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL environment variable is not set!');
  console.error('Please set it in your .env file (for local development) or on Render (for deployment).');
  process.exit(1); // Exit the application if no connection string is found
}



const sequelize = new Sequelize(connectionString, {
  dialect: 'postgres', // Specify the database dialect
  // logging: console.log, // Enable logging to see SQL queries in console (useful for debugging)
  logging: false, // Disable logging for cleaner console output
  dialectOptions: {
    ssl: {
      require: true, // Neon requires SSL
      rejectUnauthorized: false // This might be needed for some environments, but use with caution
                               // In production, you'd ideally want to specify CA certs.
                               // Neon's default connections usually handle this fine.
    }
  }
});

module.exports = sequelize;
