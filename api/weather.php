<?php
date_default_timezone_set('Europe/Moscow');
require_once __DIR__ . '/../models/Weather.php';
require_once __DIR__ . '/../config/database.php';

// Включаем отображение ошибок для отладки
ini_set('display_errors', 0);
error_reporting(E_ALL);

// Устанавливаем обработчик ошибок
function handleError($errno, $errstr, $errfile, $errline) {
    echo json_encode(['error' => "PHP Error: $errstr"]);
    exit;
}
set_error_handler('handleError');

// Устанавливаем обработчик исключений
function handleException($e) {
    echo json_encode(['error' => "PHP Exception: " . $e->getMessage()]);
    exit;
}
set_exception_handler('handleException');

header('Content-Type: application/json; charset=utf-8');

$API_KEY = '92b64a6d838c43918e6181715240511';
$city = $_GET['city'] ?? null;
$type = $_GET['type'] ?? 'today';
$date = date('Y-m-d');
if ($type === 'tomorrow') {
    $date = date('Y-m-d', strtotime('+1 day'));
}

if (!$city) {
    echo json_encode(['error' => 'No city specified']);
    exit;
}

try {
    $weather = new Weather();
    $locations = $weather->getLocationByName($city);
    $db = Database::getInstance()->getConnection();

    if (empty($locations)) {
        // Если города нет в базе — сразу обновляем
        updateWeather($city, $API_KEY, $db);
        $locations = $weather->getLocationByName($city);
        if (empty($locations)) {
            echo json_encode(['error' => 'City not found']);
            exit;
        }
    }

    $locationId = $locations[0]['id'];
    $forecast = $weather->getForecast($locationId, $date);

    // Если нет прогноза на нужную дату или нет почасового прогноза — обновляем
    $hourlyForecast = $weather->getHourlyForecast($locationId, $date);
    if (!$forecast || empty($hourlyForecast)) {
        updateWeather($city, $API_KEY, $db);
        $forecast = $weather->getForecast($locationId, $date);
        $hourlyForecast = $weather->getHourlyForecast($locationId, $date);
    }

    if (!$forecast) {
        echo json_encode(['error' => 'No forecast for this date', 'debug' => [
            'city' => $city,
            'date' => $date,
            'locationId' => $locationId
        ]]);
        exit;
    }

    // Добавляем почасовой прогноз в ответ
    $forecast['hourly'] = $hourlyForecast;

    echo json_encode($forecast);
} catch (Exception $e) {
    echo json_encode(['error' => 'Error: ' . $e->getMessage()]);
}

// --- Функция обновления ---
function updateWeather($city, $API_KEY, $db) {
    $url = "https://api.weatherapi.com/v1/forecast.json?key={$API_KEY}&q=" . urlencode($city) . "&days=2&lang=ru";
    $resp = fetchUrl($url, 5);
    // Логируем ответ API для отладки
    file_put_contents(__DIR__ . '/log_weatherapi.txt', "CITY: $city\nURL: $url\nRESPONSE:\n$resp\n\n", FILE_APPEND);
    if ($resp === false) {
        echo json_encode(['error' => 'Failed to fetch weather data']);
        return;
    }
    $data = json_decode($resp, true);
    if (!$data || !isset($data['location'])) {
        echo json_encode(['error' => 'Invalid API response']);
        return;
    }

    // Логируем почасовой прогноз
    file_put_contents(__DIR__ . '/log_hourly.txt', "CITY: $city\nHOURLY FORECAST:\n" . json_encode($data['forecast']['forecastday'][0]['hour'], JSON_PRETTY_PRINT) . "\n\n", FILE_APPEND);

    try {
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

        // 2. Тип погоды
        $desc = $data['current']['condition']['text'];
        $icon = $data['current']['condition']['icon'];
        $typeStmt = $db->prepare("SELECT id, icon FROM weather_types WHERE description = :desc");
        $typeStmt->execute(['desc' => $desc]);
        $type = $typeStmt->fetch(PDO::FETCH_ASSOC);
        if (!$type) {
            // Если такого типа ещё нет — добавляем
            $db->prepare("INSERT INTO weather_types (description, icon) VALUES (?, ?)")
                ->execute([$desc, $icon]);
            $weatherTypeId = $db->lastInsertId();
        } else {
            $weatherTypeId = $type['id'];
            // Если иконка изменилась — обновляем
            if ($type['icon'] !== $icon) {
                $db->prepare("UPDATE weather_types SET icon = ? WHERE id = ?")
                    ->execute([$icon, $weatherTypeId]);
            }
        }

        // 3. Прогнозы на сегодня и завтра (и любые, что отдаёт API)
        foreach ($data['forecast']['forecastday'] as $forecast) {
            $date = $forecast['date'];
            $minTemp = $forecast['day']['mintemp_c'];
            $maxTemp = $forecast['day']['maxtemp_c'];
            $check = $db->prepare("SELECT id FROM forecasts WHERE location_id = ? AND forecast_date = ?");
            $check->execute([$locationId, $date]);
            if ($row = $check->fetch(PDO::FETCH_ASSOC)) {
                // Если прогноз уже есть — обновим его
                $db->prepare("UPDATE forecasts SET weather_type_id=?, min_temp=?, max_temp=?, icon=? WHERE id=?")
                    ->execute([$weatherTypeId, $minTemp, $maxTemp, $icon, $row['id']]);
            } else {
                // Если нет — добавим
                $db->prepare("INSERT INTO forecasts (location_id, weather_type_id, forecast_date, min_temp, max_temp, icon) VALUES (?, ?, ?, ?, ?, ?)")
                    ->execute([$locationId, $weatherTypeId, $date, $minTemp, $maxTemp, $icon]);
            }

            // Сохраняем почасовой прогноз
            foreach ($forecast['hour'] as $hour) {
                $hourTime = $forecast['date'] . ' ' . substr($hour['time'], 11); // Берем только время из строки
                $hourTemp = $hour['temp_c'];
                $hourCondition = $hour['condition']['text'];
                $hourIcon = $hour['condition']['icon'];
                $hourWind = $hour['wind_kph'];
                $hourHumidity = $hour['humidity'];

                // Получаем или создаем тип погоды для часа
                $hourTypeStmt = $db->prepare("SELECT id FROM weather_types WHERE description = ?");
                $hourTypeStmt->execute([$hourCondition]);
                $hourType = $hourTypeStmt->fetch(PDO::FETCH_ASSOC);
                if (!$hourType) {
                    $db->prepare("INSERT INTO weather_types (description, icon) VALUES (?, ?)")
                        ->execute([$hourCondition, $hourIcon]);
                    $hourWeatherTypeId = $db->lastInsertId();
                } else {
                    $hourWeatherTypeId = $hourType['id'];
                }

                // Проверяем существование записи
                $hourCheck = $db->prepare("SELECT id FROM hourly_forecasts WHERE location_id = ? AND forecast_time = ?");
                $hourCheck->execute([$locationId, $hourTime]);
                if ($hourRow = $hourCheck->fetch(PDO::FETCH_ASSOC)) {
                    // Обновляем существующую запись
                    $stmt = $db->prepare("UPDATE hourly_forecasts SET weather_type_id=?, temperature=?, wind_speed=?, humidity=? WHERE id=?");
                    $stmt->execute([$hourWeatherTypeId, $hourTemp, $hourWind, $hourHumidity, $hourRow['id']]);
                } else {
                    // Создаем новую запись
                    $stmt = $db->prepare("INSERT INTO hourly_forecasts (location_id, weather_type_id, forecast_time, temperature, wind_speed, humidity) VALUES (?, ?, ?, ?, ?, ?)");
                    $stmt->execute([$locationId, $hourWeatherTypeId, $hourTime, $hourTemp, $hourWind, $hourHumidity]);
                }
            }
        }
    } catch (Exception $e) {
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
        return;
    }
}

function fetchUrl($url, $timeout = 5) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, $timeout);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, $timeout);
    $result = curl_exec($ch);
    if (curl_errno($ch)) {
        error_log('CURL error: ' . curl_error($ch));
        curl_close($ch);
        return false;
    }
    curl_close($ch);
    return $result;
} 