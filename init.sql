USE challengeDB;

CREATE TABLE IF NOT EXISTS queries (
            id INT(11) PRIMARY KEY AUTO_INCREMENT,
            domain TEXT NOT NULL,
            client_ip TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);