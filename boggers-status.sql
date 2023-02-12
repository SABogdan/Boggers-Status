CREATE DATABASE boggers_status;

USE boggers_status;

CREATE TABLE endpoints (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  last_updated DATETIME NOT NULL
);

CREATE TABLE endpoint_updates (
  id INT PRIMARY KEY AUTO_INCREMENT,
  endpoint_id INT NOT NULL,
  ip_address VARCHAR(255) NOT NULL,
  update_timestamp DATETIME NOT NULL,
  reason TEXT,
  FOREIGN KEY (endpoint_id) REFERENCES endpoints(id)
);
