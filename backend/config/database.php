<?php
class Database {
    private $host;
    private $db_name;
    private $username;
    private $password;
    public $conn;
    
    public function __construct() {
        // Use XAMPP MySQL (port 3306)
        $this->host = 'localhost';
        $this->db_name = '4seasons';
        $this->username = 'root';
        $this->password = '';
    }

    public function getConnection() {
        $this->conn = null;

        try {
            $this->conn = new PDO(
                "mysql:host=" . $this->host . ";dbname=" . $this->db_name,
                $this->username,
                $this->password
            );
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->conn->exec("set names utf8mb4");
        } catch(PDOException $exception) {
            echo "Connection error: " . $exception->getMessage();
        }

        return $this->conn;
    }
    
    public function getConfig() {
        return [
            'host' => $this->host,
            'dbname' => $this->db_name,
            'username' => $this->username,
            'password' => $this->password
        ];
    }
}
?>
