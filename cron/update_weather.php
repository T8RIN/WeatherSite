<?php
require_once __DIR__ . '/../models/Weather.php';
require_once __DIR__ . '/../config/database.php';

// --- НАСТРОЙКИ ---
$API_KEY = '92b64a6d838c43918e6181715240511'; // ваш ключ
$cities = ['Moscow', 'Saint Petersburg', 'Kazan']; // список городов для обновления

function fetchWeather($city, $API_KEY) {
    $url = "https://api.weatherapi.com/v1/forecast.json?key={$API_KEY}&q=" . urlencode($city) . "&days=2&lang=ru";
    $resp = file_get_contents($url);
    if ($resp === false) return null;
    return json_decode($resp, true);
}

$db = Database::getInstance()->getConnection();

foreach ($cities as $city) {
    $data = fetchWeather($city, $API_KEY);
    if (!$data || !isset($data['location'])) continue;

    // 1. Локация
    $locStmt = $db->prepare("SELECT id FROM locations WHERE name = :name");
    $locStmt->execute(['name' => $data['location']['name']]);
    $loc = $locStmt->fetch(PDO::FETCH_ASSOC);
    if (!$loc) {
        $db->prepare("INSERT INTO locations (name, country, latitude, longitude) VALUES (?, ?, ?, ?)")
            ->execute([
                $data['location']['name'],
                $data['location']['country'],
                $data['location']['lat'],
                $data['location']['lon']
            ]);
        $locationId = $db->lastInsertId();
    } else {
        $locationId = $loc['id'];
    }

    // 2. Тип погоды (берём первый попавшийся)
    $desc = $data['current']['condition']['text'];
    $icon = $data['current']['condition']['icon'];
    $typeStmt = $db->prepare("SELECT id FROM weather_types WHERE description = :desc");
    $typeStmt->execute(['desc' => $desc]);
    $type = $typeStmt->fetch(PDO::FETCH_ASSOC);
    if (!$type) {
        $db->prepare("INSERT INTO weather_types (description, icon) VALUES (?, ?)")
            ->execute([$desc, $icon]);
        $weatherTypeId = $db->lastInsertId();
    } else {
        $weatherTypeId = $type['id'];
    }

    // 3. Прогнозы на сегодня и завтра
    foreach ($data['forecast']['forecastday'] as $forecast) {
        $date = $forecast['date'];
        $minTemp = $forecast['day']['mintemp_c'];
        $maxTemp = $forecast['day']['maxtemp_c'];
        // Проверим, есть ли уже прогноз
        $check = $db->prepare("SELECT id FROM forecasts WHERE location_id = ? AND forecast_date = ?");
        $check->execute([$locationId, $date]);
        if (!$check->fetch(PDO::FETCH_ASSOC)) {
            $db->prepare("INSERT INTO forecasts (location_id, weather_type_id, forecast_date, min_temp, max_temp) VALUES (?, ?, ?, ?, ?)")
                ->execute([$locationId, $weatherTypeId, $date, $minTemp, $maxTemp]);
        }
    }
} 