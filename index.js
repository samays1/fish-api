const express = require("express");
const bodyParser = require("body-parser");
const prometheus = require("prom-client");
const mysql = require("mysql2");

// Create a new Express app instance with body-parser middleware
const app = express();
app.use(bodyParser.json());

// Create a MySQL connection pool
const pool = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "password",
});

// Root endpoint
app.get("/", (req, res) => {
    const currentDate =  Math.floor(Date.now() / 1000)
    const isRunningInKubernetes = !!process.env.KUBERNETES_SERVICE_HOST
    const response = {
        version: "0.1.0",
        date: currentDate,
        kubernetes: isRunningInKubernetes,
    };
    res.json(response);
});

// Prometheus metrics endpoint
app.get("/metrics", (req, res) => {
    res.set("Content-Type", prometheus.register.contentType);
    const metrics = prometheus.register.metrics();
    res.json({ description: "OK", metrics: metrics });
    // TODO: Implement
});
  
// Health endpoint
app.get("/health", (req, res) => {
    const response = {
        status: "OK",
        uptime: process.uptime(),
    }
    res.json(response);
});

// Lookup endpoint
app.get('/v1/tools/lookup', async (req, res) => {
    const domain = req.query.domain;
    if (!domain) {
        return res.status(400).json({ message: 'Domain parameter is required' });
    }

    try {
        const dns = require('dns').promises;
        const addresses = await dns.resolve4(domain);
        const response = {
            addresses: addresses.map((address) => ({ ip: address })),
            client_ip: req.ip,
            created_at: new Date(),
            domain: domain, 
        }
        res.json(response);
    } catch (error) {
        console.error(error);
        res.status(404).json({ message: 'Not found' });
    }
})

// Validate endpoint
app.post("/v1/tools/validate", (req, res) => {
    const ip = req.body.ip;
    const regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!regex.test(ip)) {
     return res.status(400).json({ message: 'Invalid IP address format' });
    }
    res.json({ status: true });
});

// Run server
const port = 3000;
app.listen(port, () => {
  console.log(`App is running on port: http://localhost:${port}`);
});