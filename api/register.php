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

// Проверяем, существует ли пользователь с таким email
$stmt = $db->prepare("SELECT id FROM users WHERE email = :email");
$stmt->execute(['email' => $email]);
if ($stmt->fetch()) {
    echo json_encode(['success' => false, 'error' => 'Пользователь с таким email уже существует']);
    exit;
}

// Хешируем пароль
$hashedPassword = password_hash($password, PASSWORD_DEFAULT);

// Добавляем нового пользователя
$stmt = $db->prepare("INSERT INTO users (email, password, created_at) VALUES (:email, :password, NOW())");
$stmt->execute(['email' => $email, 'password' => $hashedPassword]);

echo json_encode(['success' => true]); 