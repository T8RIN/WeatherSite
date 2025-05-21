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

$db = Database::getInstance()->getConnection();

try {
    // Проверяем наличие пользователя с таким email
    $stmt = $db->prepare("SELECT id, password FROM users WHERE email = :email");
    $stmt->execute(['email' => $email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        echo json_encode(['success' => false, 'error' => 'Пользователь не найден']);
        exit;
    }

    // Проверяем пароль
    if (!password_verify($password, $user['password'])) {
        echo json_encode(['success' => false, 'error' => 'Неверный пароль']);
        exit;
    }

    // Возвращаем информацию о пользователе
    echo json_encode(['success' => true, 'user' => ['email' => $email]]);
} catch (PDOException $e) {
    // Получаем сообщение об ошибке из триггера
    $errorMessage = $e->getMessage();
    
    // Извлекаем только сообщение об ошибке из SQLSTATE
    if (preg_match('/SQLSTATE\[45000\]:\s*(.+)/', $errorMessage, $matches)) {
        $errorMessage = trim($matches[1]);
    }
    
    echo json_encode(['success' => false, 'error' => $errorMessage]);
} 