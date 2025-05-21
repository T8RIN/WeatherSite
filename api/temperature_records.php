<?php
require_once __DIR__ . '/../models/Weather.php';
require_once __DIR__ . '/../config/database.php';
header('Content-Type: application/json; charset=utf-8');

$city = $_GET['city'] ?? null;
if (!$city) {
    echo json_encode(['error' => 'No city specified']);
    exit;
}

try {
    $weather = new Weather();
    $locations = $weather->getLocationByName($city);
    if (empty($locations)) {
        echo json_encode(['error' => 'City not found']);
        exit;
    }
    $locationId = $locations[0]['id'];
    $db = Database::getInstance()->getConnection();

    // Получаем последние 7 дней
    $maxTemps = $db->prepare("SELECT record_date, temperature FROM max_temperatures WHERE location_id = ? ORDER BY record_date DESC LIMIT 7");
    $maxTemps->execute([$locationId]);
    $maxTemps = $maxTemps->fetchAll(PDO::FETCH_ASSOC);

    $minTemps = $db->prepare("SELECT record_date, temperature FROM min_temperatures WHERE location_id = ? ORDER BY record_date DESC LIMIT 7");
    $minTemps->execute([$locationId]);
    $minTemps = $minTemps->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'max' => $maxTemps,
        'min' => $minTemps
    ]);
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
} 