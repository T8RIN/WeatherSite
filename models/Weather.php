<?php
require_once __DIR__ . '/../config/database.php';

class Weather {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    public function getLocationByName($name) {
        $query = "SELECT * FROM locations WHERE name LIKE :name";
        $stmt = $this->db->prepare($query);
        $stmt->execute(['name' => "%$name%"]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getForecast($locationId, $date) {
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
    }

    public function getTemperatureRecords($locationId) {
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
    }

    public function getNearbyWeatherStations($locationId) {
        $query = "SELECT * FROM weather_stations WHERE location_id = :location_id";
        $stmt = $this->db->prepare($query);
        $stmt->execute(['location_id' => $locationId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
?> 