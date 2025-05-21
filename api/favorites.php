<?php
require_once __DIR__ . '/../config/database.php';
header('Content-Type: application/json; charset=utf-8');

function getUserId($db) {
    if (empty($_COOKIE['userEmail'])) return null;
    $stmt = $db->prepare('SELECT id FROM users WHERE email = :email');
    $stmt->execute(['email' => $_COOKIE['userEmail']]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    return $row ? $row['id'] : null;
}

$db = Database::getInstance()->getConnection();
$userId = getUserId($db);
if (!$userId) {
    echo json_encode(['success' => false, 'error' => 'Не авторизован']);
    exit;
}

$action = $_GET['action'] ?? '';

if ($action === 'add') {
    $locationId = intval($_POST['location_id'] ?? 0);
    if (!$locationId) {
        echo json_encode(['success' => false, 'error' => 'Нет location_id']);
        exit;
    }
    // Проверка на дубликат
    $stmt = $db->prepare('SELECT id FROM favorite_locations WHERE user_id = ? AND location_id = ?');
    $stmt->execute([$userId, $locationId]);
    if ($stmt->fetch()) {
        echo json_encode(['success' => true, 'message' => 'Уже в избранном']);
        exit;
    }
    $stmt = $db->prepare('INSERT INTO favorite_locations (user_id, location_id) VALUES (?, ?)');
    $stmt->execute([$userId, $locationId]);
    echo json_encode(['success' => true]);
    exit;
}

if ($action === 'remove') {
    $locationId = intval($_POST['location_id'] ?? 0);
    if (!$locationId) {
        echo json_encode(['success' => false, 'error' => 'Нет location_id']);
        exit;
    }
    $stmt = $db->prepare('DELETE FROM favorite_locations WHERE user_id = ? AND location_id = ?');
    $stmt->execute([$userId, $locationId]);
    echo json_encode(['success' => true]);
    exit;
}

if ($action === 'list') {
    $stmt = $db->prepare('SELECT l.id, l.name, l.country FROM favorite_locations f JOIN locations l ON f.location_id = l.id WHERE f.user_id = ?');
    $stmt->execute([$userId]);
    $list = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['success' => true, 'favorites' => $list]);
    exit;
}

echo json_encode(['success' => false, 'error' => 'Неизвестное действие']); 