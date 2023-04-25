const express = require("express");
const bodyParser = require("body-parser");
const prometheus = require("prom-client");
const mysql = require("mysql2");

// Create a new Express app instance with body-parser middleware
const app = express();
app.use(bodyParser.json());

// Root endpoint
app.get("/", (req, res) => {
    const currentDate =  Math.floor(Date.now())
    const isKubernetes = !!process.env.KUBERNETES_SERVICE_HOST
    const response = {
        version: "0.1.0",
        date: currentDate,
        kubernetes: isKubernetes,
    };
    res.json(response);
});


// Run server
const port = 3000;
app.listen(port, () => {
  console.log(`App is running on port: http://localhost:${port}`);
});