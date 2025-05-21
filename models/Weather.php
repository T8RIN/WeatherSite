<?php
require_once __DIR__ . '/../config/database.php';

class Weather {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    public function getLocationByName($name) {
        try {
            $query = "SELECT * FROM locations WHERE name LIKE :name";
            $stmt = $this->db->prepare($query);
            $stmt->execute(['name' => "%$name%"]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            throw new Exception("Database error in getLocationByName: " . $e->getMessage());
        }
    }

    public function getForecast($locationId, $date) {
        try {
            $query = "SELECT f.*, wt.description, wt.icon 
                      FROM forecasts f
                      JOIN weather_types wt ON f.weather_type_id = wt.id
                      WHERE f.location_id = :location_id 
                      AND f.forecast_date = :date";
            $stmt = $this->db->prepare($query);
            $stmt->execute([
                'location_id' => $locationId,
                'date' => $date
            ]);
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            throw new Exception("Database error in getForecast: " . $e->getMessage());
        }
    }

    public function getTemperatureRecords($locationId) {
        try {
            $query = "SELECT 
                        'min' as type, mt.temperature, mt.record_date
                      FROM min_temperatures mt
                      WHERE mt.location_id = :location_id
                      UNION
                      SELECT 
                        'max' as type, mt.temperature, mt.record_date
                      FROM max_temperatures mt
                      WHERE mt.location_id = :location_id
                      ORDER BY record_date DESC";
            $stmt = $this->db->prepare($query);
            $stmt->execute(['location_id' => $locationId]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            throw new Exception("Database error in getTemperatureRecords: " . $e->getMessage());
        }
    }

    public function getNearbyWeatherStations($locationId) {
        try {
            $query = "SELECT * FROM weather_stations WHERE location_id = :location_id";
            $stmt = $this->db->prepare($query);
            $stmt->execute(['location_id' => $locationId]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            throw new Exception("Database error in getNearbyWeatherStations: " . $e->getMessage());
        }
    }

    public function getHourlyForecast($locationId, $date) {
        try {
            $query = "SELECT h.*, wt.description, wt.icon 
                      FROM hourly_forecasts h
                      JOIN weather_types wt ON h.weather_type_id = wt.id
                      WHERE h.location_id = :location_id 
                      AND DATE(h.forecast_time) = :date
                      ORDER BY h.forecast_time ASC";
            $stmt = $this->db->prepare($query);
            $stmt->execute([
                'location_id' => $locationId,
                'date' => $date
            ]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            throw new Exception("Database error in getHourlyForecast: " . $e->getMessage());
        }
    }
}
?> 