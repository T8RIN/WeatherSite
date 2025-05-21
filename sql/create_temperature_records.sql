CREATE TABLE IF NOT EXISTS max_temperatures (
    id INT AUTO_INCREMENT PRIMARY KEY,
    location_id INT NOT NULL,
    temperature DECIMAL(4,1) NOT NULL,
    record_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (location_id) REFERENCES locations(id),
    UNIQUE KEY unique_max_temp (location_id, record_date)
);

CREATE TABLE IF NOT EXISTS min_temperatures (
    id INT AUTO_INCREMENT PRIMARY KEY,
    location_id INT NOT NULL,
    temperature DECIMAL(4,1) NOT NULL,
    record_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (location_id) REFERENCES locations(id),
    UNIQUE KEY unique_min_temp (location_id, record_date)
);