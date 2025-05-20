<?php
require_once __DIR__ . '/../config/database.php';

class User {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    public function create($username, $email) {
        $query = "INSERT INTO users (username, email, created_at) VALUES (:username, :email, NOW())";
        $stmt = $this->db->prepare($query);
        return $stmt->execute([
            'username' => $username,
            'email' => $email
        ]);
    }

    public function getById($id) {
        $query = "SELECT * FROM users WHERE id = :id";
        $stmt = $this->db->prepare($query);
        $stmt->execute(['id' => $id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function getFavoriteLocations($userId) {
        $query = "SELECT l.* FROM locations l 
                  JOIN favorite_locations fl ON l.id = fl.location_id 
                  WHERE fl.user_id = :user_id";
        $stmt = $this->db->prepare($query);
        $stmt->execute(['user_id' => $userId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
?> 