const express = require("express");
const bodyParser = require("body-parser");
const prometheus = require("prom-client");
const mysql = require("mysql2");

// Create a new Express app instance with body-parser middleware
const app = express();
app.use(bodyParser.json());

// Create a MySQL connection pool
const pool = mysql.createPool({
    host: "sqldb",
    user: "root",
    password: "password",
    database: "challengeDB",
});

// Create a counter metric to track the number of requests to our API
const counter = new prometheus.Counter({
    name: "api_queries_total",
    help: "Total number of requests to the API",
});
  
// Create a histogram metric to track the duration of requests to our API
const histogram = new prometheus.Histogram({
    name: "api_query_duration_seconds",
    help: "Duration of requests to the API",
    buckets: [0.1, 0.5, 1, 5, 10],
});

// Middleware to track query metrics
app.use((req, res, next) => {
    const start = Date.now();

    res.on("finish", () => {
      const duration = (Date.now() - start) / 1000;
      counter.inc();
      histogram.observe(duration);
    });

    next();
});

// Prometheus metrics endpoint
app.get("/metrics", async (req, res) => {
    res.set("Content-Type", prometheus.register.contentType);
    const metrics = await prometheus.register.metrics();
  res.end(metrics);
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

// Health endpoint
app.get("/health", (req, res) => {
    const response = {
        status: "OK",
        uptime: process.uptime(),
    }
    res.json(response);
});

// Lookup endpoint
app.get("/v1/tools/lookup", async (req, res) => {
    const domain = req.query.domain;
    if (!domain) {
        return res.status(400).json({ message: "Domain parameter is required" });
    }

    // Resolve IPv4 addresses
    try {
        const dns = require("dns").promises;
        const addresses = await dns.resolve4(domain);
        var response = {
            addresses: addresses.map((address) => ({ ip: address })),
            client_ip: req.ip,
            created_at: new Date(),
            domain: domain, 
        }
    } catch (error) {
        console.error(error);
        return res.status(404).json({ message: "Unable to resolve domain" });
    }

    // Log successful queries in MySQL database
    pool.query(
        "INSERT INTO queries (domain, client_ip, created_at) VALUES (?, ?, ?)",
        [domain, req.ip, new Date()],
    );
    res.json(response);
})

// Validate endpoint
app.post("/v1/tools/validate", (req, res) => {
    const ip = req.body.ip;
    const regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!regex.test(ip)) {
        return res.status(400).json({ message: "Invalid IP address format" });
    }
    res.json({ status: true });
});

// History endpoint
app.get("/v1/history", (req, res) => {
    pool.query(
        "SELECT * FROM queries ORDER BY created_at DESC LIMIT 20",
        (error, response) => {
            if (error) {
                console.error(`Error retrieving queries: ${error}`);
                return res.status(400).json({ message: "Bad request" });
            } else {
                res.json(response);
            }
        }
    );
});

// Run server
const port = 3000;
app.listen(port, () => {
    console.log("App is running on port: http://localhost:${port}");
});