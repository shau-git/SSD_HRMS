const swaggerAutogen = require("swagger-autogen")();

const outputFile = "./swagger-output.json"; // Output file for the spec
const routes = ["./app.js"]; // Path to your API route files

const doc = {
  info: {
    title: "SSD_HRMS",
    description: "This is a website for employee for marking their attendance",
  },
  host: "localhost:3013", // Replace with your actual host if needed
};

swaggerAutogen(outputFile, routes, doc);