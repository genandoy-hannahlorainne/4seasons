<?php
/**
 * Authentication & Authorization Middleware
 * Validates user authentication and role-based access control
 */

class Auth {
    private $database;
    private $user_id;
    private $user_role;
    private $user_data;

    // Role hierarchy (higher number = higher privilege)
    private $role_hierarchy = [
        'Admin' => 5,
        'Clinic Staff' => 3,
        'Adviser' => 4,
        'Student' => 2,
        'Parent' => 1
    ];

    public function __construct($database) {
        $this->database = $database;
        $this->validateAuthentication();
    }

    /**
     * Validate that user is authenticated
     * Checks for user_id header
     */
    private function validateAuthentication() {
        // Get user_id from header
        $this->user_id = isset($_SERVER['HTTP_USER_ID']) ? intval($_SERVER['HTTP_USER_ID']) : null;

        error_log("=== AUTH VALIDATION ===");
        error_log("User ID from header: " . ($this->user_id ? $this->user_id : 'MISSING'));
        error_log("All headers: " . json_encode(getallheaders()));

        if (!$this->user_id) {
            error_log("❌ Missing user_id header");
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Unauthorized: Missing user_id']);
            exit();
        }

        // Fetch user data from database
        $db = $this->database->getConnection();
        
        if (!$db) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Database connection error']);
            exit();
        }
        
        $query = "SELECT u.user_id, u.username, u.email, u.full_name, u.is_active, 
                         r.role_id, r.role_name
                  FROM users u
                  LEFT JOIN roles r ON u.role_id = r.role_id
                  WHERE u.user_id = :user_id AND u.is_active = 1 AND u.deleted_at IS NULL";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(':user_id', $this->user_id, PDO::PARAM_INT);
        $stmt->execute();
        
        $this->user_data = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$this->user_data) {
            error_log("❌ User not found or inactive: " . $this->user_id);
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Unauthorized: User not found or inactive']);
            exit();
        }

        $this->user_role = $this->user_data['role_name'];
        error_log("✅ User authenticated: " . $this->user_data['username'] . " (" . $this->user_role . ")");
    }

    /**
     * Get current user data
     */
    public function user() {
        return $this->user_data;
    }

    /**
     * Get current user ID
     */
    public function userId() {
        return $this->user_id;
    }

    /**
     * Get current user role
     */
    public function role() {
        return $this->user_role;
    }

    /**
     * Check if user has specific role
     */
    public function hasRole($role) {
        return strtolower($this->user_role) === strtolower($role);
    }

    /**
     * Check if user has any of the specified roles
     */
    public function hasAnyRole($roles) {
        $roles = is_array($roles) ? $roles : [$roles];
        foreach ($roles as $role) {
            if (strtolower($this->user_role) === strtolower($role)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Check if user has at least the specified role level
     */
    public function hasRoleLevel($role) {
        $user_level = $this->role_hierarchy[$this->user_role] ?? 0;
        $required_level = $this->role_hierarchy[$role] ?? 0;
        return $user_level >= $required_level;
    }

    /**
     * Require specific role(s)
     */
    public function requireRole($roles) {
        $roles = is_array($roles) ? $roles : [$roles];
        if (!$this->hasAnyRole($roles)) {
            http_response_code(403);
            echo json_encode([
                'success' => false,
                'message' => 'Forbidden: Insufficient permissions',
                'required_roles' => $roles,
                'user_role' => $this->user_role
            ]);
            exit();
        }
    }

    /**
     * Require at least the specified role level
     */
    public function requireRoleLevel($role) {
        if (!$this->hasRoleLevel($role)) {
            http_response_code(403);
            echo json_encode([
                'success' => false,
                'message' => 'Forbidden: Insufficient permissions',
                'required_level' => $role,
                'user_role' => $this->user_role
            ]);
            exit();
        }
    }

    /**
     * Check if user owns the resource (for student profiles, etc.)
     */
    public function isResourceOwner($resource_user_id) {
        return $this->user_id === intval($resource_user_id);
    }

    /**
     * Verify user owns the resource or is admin
     */
    public function verifyOwnershipOrAdmin($resource_user_id) {
        if ($this->hasRole('Admin')) {
            return true;
        }

        if ($this->isResourceOwner($resource_user_id)) {
            return true;
        }

        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Forbidden: Access denied']);
        exit();
    }

    /**
     * Verify user owns the resource or is clinic staff/admin
     */
    public function verifyOwnershipOrClinicStaff($resource_user_id) {
        if ($this->hasAnyRole(['Admin', 'Clinic Staff'])) {
            return true;
        }

        if ($this->isResourceOwner($resource_user_id)) {
            return true;
        }

        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Forbidden: Access denied']);
        exit();
    }

    /**
     * Log activity
     */
    public function logActivity($action, $details = null, $targetUserId = null) {
        try {
            $db = $this->database->getConnection();
            $ip_address = $_SERVER['REMOTE_ADDR'] ?? 'Unknown';
            
            $query = "INSERT INTO activity_logs (user_id, action, details, ip_address, created_at)
                      VALUES (:user_id, :action, :details, :ip_address, NOW())";
            
            $stmt = $db->prepare($query);
            $stmt->bindParam(':user_id', $this->user_id, PDO::PARAM_INT);
            $stmt->bindParam(':action', $action, PDO::PARAM_STR);
            $stmt->bindParam(':details', $details, PDO::PARAM_STR);
            $stmt->bindParam(':ip_address', $ip_address, PDO::PARAM_STR);
            $stmt->execute();
        } catch (Exception $e) {
            error_log('Activity logging failed: ' . $e->getMessage());
        }
    }
}
?>
