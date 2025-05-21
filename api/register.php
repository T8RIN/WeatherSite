<?php
require_once __DIR__ . '/../config/database.php';

header('Content-Type: application/json; charset=utf-8');

// Получаем данные из POST-запроса
$input = json_decode(file_get_contents('php://input'), true);
$email = $input['email'] ?? '';
$password = $input['password'] ?? '';

if (empty($email) || empty($password)) {
    echo json_encode(['success' => false, 'error' => 'Email и пароль обязательны']);
    exit;
}

// Проверка длины пароля
if (strlen($password) < 8) {
    echo json_encode(['success' => false, 'error' => 'Пароль должен содержать минимум 8 символов']);
    exit;
}

$db = Database::getInstance()->getConnection();

try {
    // Хешируем пароль
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

    // Добавляем нового пользователя
    $stmt = $db->prepare("INSERT INTO users (email, password, created_at) VALUES (:email, :password, NOW())");
    $stmt->execute(['email' => $email, 'password' => $hashedPassword]);

    echo json_encode(['success' => true]);
} catch (PDOException $e) {
    $errorMessage = $e->getMessage();
    // Очищаем техническую часть MySQL-ошибки
    if (preg_match('/1644 (.+)$/', $errorMessage, $matches)) {
        $errorMessage = trim($matches[1]);
    }
    echo json_encode(['success' => false, 'error' => $errorMessage]);
}