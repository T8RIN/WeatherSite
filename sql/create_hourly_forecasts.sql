CREATE TABLE IF NOT EXISTS hourly_forecasts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    location_id INT NOT NULL,
    weather_type_id INT NOT NULL,
    forecast_time DATETIME NOT NULL,
    temperature DECIMAL(4,1) NOT NULL,
    wind_speed DECIMAL(4,1) NOT NULL,
    humidity INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (location_id) REFERENCES locations(id),
    FOREIGN KEY (weather_type_id) REFERENCES weather_types(id),
    UNIQUE KEY unique_hourly_forecast (location_id, forecast_time)
); 