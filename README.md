## Root Endpoint
```curl -X GET http://localhost:3000/```

## Lookup Endpoint
```curl -X GET http://localhost:3000/v1/tools/lookup?domain=google.com```

## Validate Endpoint
```curl -X POST -H "Content-Type: application/json" -d '{"ip": "8.8.8.8"}' http://localhost:3000/v1/tools/validate```

## History Endpoint
```curl -X GET http://localhost:3000/v1/history```

## Metrics Endpoint
```curl -X GET http://localhost:3000/metrics```

## Health Endpoint
```curl -X GET http://localhost:3000/health```