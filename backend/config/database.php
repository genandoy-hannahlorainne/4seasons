<?php
class Database {
    private $host;
    private $port;
    private $db_name;
    private $username;
    private $password;
    public $conn;
    
    public function __construct() {
        // Support both local XAMPP defaults and Docker environment variables.
        $this->host = getenv('DB_HOST') ?: 'localhost';
        $this->port = getenv('DB_PORT') ?: '3306';
        $this->db_name = getenv('DB_DATABASE') ?: '4seasons';
        $this->username = getenv('DB_USERNAME') ?: 'root';
        $this->password = getenv('DB_PASSWORD') !== false ? getenv('DB_PASSWORD') : '';

        // Force TCP on Linux when host is localhost to avoid Unix socket fallback issues.
        if (PHP_OS_FAMILY === 'Linux' && $this->host === 'localhost') {
            $this->host = '127.0.0.1';
        }
    }

    public function getConnection() {
        $this->conn = null;

        try {
            $dsn = "mysql:host={$this->host};port={$this->port};dbname={$this->db_name};charset=utf8mb4";
            $this->conn = new PDO(
                $dsn,
                $this->username,
                $this->password,
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                ]
            );
        } catch(PDOException $exception) {
            error_log("Database connection error: " . $exception->getMessage());
        }

        return $this->conn;
    }
    
    public function getConfig() {
        return [
            'host' => $this->host,
            'port' => $this->port,
            'dbname' => $this->db_name,
            'username' => $this->username,
            'password' => $this->password
        ];
    }
}
?>
