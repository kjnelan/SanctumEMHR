<?php

namespace Custom\Lib\Auth;

use Custom\Lib\Database\Database;
use Custom\Lib\Session\SessionManager;

/**
 * Custom Authentication Class for MINDLINE
 *
 * Replaces OpenEMR\Common\Auth\AuthUtils
 *
 * Handles user authentication, password verification, account locking,
 * and security features.
 */
class CustomAuth
{
    private Database $db;
    private SessionManager $session;

    // Security settings
    private const MAX_LOGIN_ATTEMPTS = 5;
    private const LOCKOUT_DURATION_MINUTES = 30;
    private const PASSWORD_MIN_LENGTH = 8;

    public function __construct(?Database $db = null, ?SessionManager $session = null)
    {
        $this->db = $db ?? Database::getInstance();
        $this->session = $session ?? SessionManager::getInstance();
    }

    /**
     * Authenticate user with username and password
     *
     * @param string $username Username
     * @param string $password Plain text password
     * @return array|false User data on success, false on failure
     */
    public function authenticate(string $username, string $password)
    {
        if (empty($username) || empty($password)) {
            return false;
        }

        // Get user from database
        $user = $this->getUserByUsername($username);

        if (!$user) {
            // Sleep to prevent timing attacks
            usleep(500000); // 0.5 seconds
            return false;
        }

        // Check if account is locked
        if ($this->isAccountLocked($user)) {
            $this->logFailedLogin($user['id'], $username, 'Account locked');
            return false;
        }

        // Verify password
        if (!$this->verifyPassword($password, $user['password_hash'])) {
            $this->handleFailedLogin($user['id'], $username);
            return false;
        }

        // Check if user is active
        if (!$user['is_active']) {
            $this->logFailedLogin($user['id'], $username, 'Account inactive');
            return false;
        }

        // Success! Reset failed attempts and update last login
        $this->handleSuccessfulLogin($user['id'], $username);

        return $user;
    }

    /**
     * Verify password against hash
     *
     * @param string $password Plain text password
     * @param string $hash Password hash
     * @return bool
     */
    public function verifyPassword(string $password, string $hash): bool
    {
        return password_verify($password, $hash);
    }

    /**
     * Hash a password
     *
     * @param string $password Plain text password
     * @return string Hashed password
     */
    public function hashPassword(string $password): string
    {
        return password_hash($password, PASSWORD_ARGON2ID);
    }

    /**
     * Check if password needs rehashing (algorithm updated)
     *
     * @param string $hash Current hash
     * @return bool
     */
    public function needsRehash(string $hash): bool
    {
        return password_needs_rehash($hash, PASSWORD_ARGON2ID);
    }

    /**
     * Validate password strength
     *
     * @param string $password Password to validate
     * @return array ['valid' => bool, 'errors' => array]
     */
    public function validatePasswordStrength(string $password): array
    {
        $errors = [];

        if (strlen($password) < self::PASSWORD_MIN_LENGTH) {
            $errors[] = "Password must be at least " . self::PASSWORD_MIN_LENGTH . " characters";
        }

        if (!preg_match('/[a-z]/', $password)) {
            $errors[] = "Password must contain at least one lowercase letter";
        }

        if (!preg_match('/[A-Z]/', $password)) {
            $errors[] = "Password must contain at least one uppercase letter";
        }

        if (!preg_match('/[0-9]/', $password)) {
            $errors[] = "Password must contain at least one number";
        }

        if (!preg_match('/[^a-zA-Z0-9]/', $password)) {
            $errors[] = "Password must contain at least one special character";
        }

        return [
            'valid' => empty($errors),
            'errors' => $errors
        ];
    }

    /**
     * Get user by username
     *
     * @param string $username Username
     * @return array|null User data or null
     */
    private function getUserByUsername(string $username): ?array
    {
        $sql = "SELECT * FROM users WHERE username = ? AND deleted_at IS NULL LIMIT 1";
        return $this->db->query($sql, [$username]);
    }

    /**
     * Get user by ID
     *
     * @param int $userId User ID
     * @return array|null User data or null
     */
    public function getUserById(int $userId): ?array
    {
        $sql = "SELECT * FROM users WHERE id = ? AND deleted_at IS NULL LIMIT 1";
        return $this->db->query($sql, [$userId]);
    }

    /**
     * Check if account is locked
     *
     * @param array $user User data
     * @return bool
     */
    private function isAccountLocked(array $user): bool
    {
        if (!$user['locked_until']) {
            return false;
        }

        $lockedUntil = strtotime($user['locked_until']);
        $now = time();

        // If still locked
        if ($lockedUntil > $now) {
            return true;
        }

        // Lockout expired, unlock account
        $this->unlockAccount($user['id']);
        return false;
    }

    /**
     * Handle failed login attempt
     *
     * @param int $userId User ID
     * @param string $username Username
     */
    private function handleFailedLogin(int $userId, string $username): void
    {
        // Increment failed attempts
        $sql = "UPDATE users SET failed_login_attempts = failed_login_attempts + 1 WHERE id = ?";
        $this->db->execute($sql, [$userId]);

        // Check if we need to lock the account
        $user = $this->getUserById($userId);
        if ($user['failed_login_attempts'] >= self::MAX_LOGIN_ATTEMPTS) {
            $this->lockAccount($userId);
            $this->logFailedLogin($userId, $username, 'Account locked due to too many failed attempts');
        } else {
            $this->logFailedLogin($userId, $username, 'Invalid password');
        }
    }

    /**
     * Handle successful login
     *
     * @param int $userId User ID
     * @param string $username Username
     */
    private function handleSuccessfulLogin(int $userId, string $username): void
    {
        // Reset failed attempts and update last login
        $sql = "UPDATE users
                SET failed_login_attempts = 0,
                    locked_until = NULL,
                    last_login_at = NOW()
                WHERE id = ?";
        $this->db->execute($sql, [$userId]);

        // Log successful login
        $this->logAudit($userId, 'login', 'user', $userId, 'Successful login');
    }

    /**
     * Lock user account
     *
     * @param int $userId User ID
     */
    private function lockAccount(int $userId): void
    {
        $lockUntil = date('Y-m-d H:i:s', strtotime('+' . self::LOCKOUT_DURATION_MINUTES . ' minutes'));
        $sql = "UPDATE users SET locked_until = ? WHERE id = ?";
        $this->db->execute($sql, [$lockUntil, $userId]);
    }

    /**
     * Unlock user account
     *
     * @param int $userId User ID
     */
    private function unlockAccount(int $userId): void
    {
        $sql = "UPDATE users SET locked_until = NULL, failed_login_attempts = 0 WHERE id = ?";
        $this->db->execute($sql, [$userId]);
    }

    /**
     * Log failed login attempt
     *
     * @param int|null $userId User ID (null if user not found)
     * @param string $username Username attempted
     * @param string $reason Failure reason
     */
    private function logFailedLogin(?int $userId, string $username, string $reason): void
    {
        $this->logAudit(
            $userId,
            'login_failed',
            'user',
            $userId,
            "Failed login for username: $username. Reason: $reason"
        );
    }

    /**
     * Log audit event
     *
     * @param int|null $userId User ID
     * @param string $eventType Event type
     * @param string|null $entityType Entity type
     * @param int|null $entityId Entity ID
     * @param string|null $description Description
     */
    private function logAudit(
        ?int $userId,
        string $eventType,
        ?string $entityType = null,
        ?int $entityId = null,
        ?string $description = null
    ): void {
        $sql = "INSERT INTO audit_logs
                (user_id, event_type, entity_type, entity_id, action_description, ip_address, user_agent, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, NOW())";

        $this->db->execute($sql, [
            $userId,
            $eventType,
            $entityType,
            $entityId,
            $description,
            $_SERVER['REMOTE_ADDR'] ?? null,
            $_SERVER['HTTP_USER_AGENT'] ?? null
        ]);
    }

    /**
     * Change user password
     *
     * @param int $userId User ID
     * @param string $newPassword New password (plain text)
     * @param string|null $oldPassword Old password for verification (optional)
     * @return array ['success' => bool, 'message' => string]
     */
    public function changePassword(int $userId, string $newPassword, ?string $oldPassword = null): array
    {
        // Validate new password
        $validation = $this->validatePasswordStrength($newPassword);
        if (!$validation['valid']) {
            return [
                'success' => false,
                'message' => implode('. ', $validation['errors'])
            ];
        }

        // If old password provided, verify it
        if ($oldPassword !== null) {
            $user = $this->getUserById($userId);
            if (!$user || !$this->verifyPassword($oldPassword, $user['password_hash'])) {
                return [
                    'success' => false,
                    'message' => 'Current password is incorrect'
                ];
            }
        }

        // Hash new password
        $hash = $this->hashPassword($newPassword);

        // Update password
        $sql = "UPDATE users SET password_hash = ?, password_changed_at = NOW() WHERE id = ?";
        $this->db->execute($sql, [$hash, $userId]);

        $this->logAudit($userId, 'password_change', 'user', $userId, 'Password changed');

        return [
            'success' => true,
            'message' => 'Password changed successfully'
        ];
    }

    /**
     * Create a new user
     *
     * @param array $userData User data
     * @return array ['success' => bool, 'user_id' => int|null, 'message' => string]
     */
    public function createUser(array $userData): array
    {
        // Validate required fields
        $required = ['username', 'email', 'password', 'first_name', 'last_name', 'user_type'];
        foreach ($required as $field) {
            if (empty($userData[$field])) {
                return [
                    'success' => false,
                    'user_id' => null,
                    'message' => "Missing required field: $field"
                ];
            }
        }

        // Validate password
        $validation = $this->validatePasswordStrength($userData['password']);
        if (!$validation['valid']) {
            return [
                'success' => false,
                'user_id' => null,
                'message' => implode('. ', $validation['errors'])
            ];
        }

        // Check if username already exists
        if ($this->getUserByUsername($userData['username'])) {
            return [
                'success' => false,
                'user_id' => null,
                'message' => 'Username already exists'
            ];
        }

        // Check if email already exists
        $existingEmail = $this->db->query("SELECT id FROM users WHERE email = ?", [$userData['email']]);
        if ($existingEmail) {
            return [
                'success' => false,
                'user_id' => null,
                'message' => 'Email already exists'
            ];
        }

        // Hash password
        $userData['password_hash'] = $this->hashPassword($userData['password']);
        unset($userData['password']);

        // Generate UUID
        $userData['uuid'] = $this->generateUuid();

        // Convert boolean values to integers for MySQL
        if (isset($userData['is_active'])) {
            $userData['is_active'] = (int) $userData['is_active'];
        }
        if (isset($userData['is_provider'])) {
            $userData['is_provider'] = (int) $userData['is_provider'];
        }

        // Insert user
        try {
            $userId = $this->db->insertArray('users', $userData);

            $this->logAudit($userId, 'user_created', 'user', $userId, 'New user created');

            return [
                'success' => true,
                'user_id' => $userId,
                'message' => 'User created successfully'
            ];
        } catch (\Exception $e) {
            error_log("Error creating user: " . $e->getMessage());
            return [
                'success' => false,
                'user_id' => null,
                'message' => 'Failed to create user'
            ];
        }
    }

    /**
     * Generate UUID v4
     *
     * @return string UUID
     */
    private function generateUuid(): string
    {
        $data = random_bytes(16);
        $data[6] = chr(ord($data[6]) & 0x0f | 0x40);
        $data[8] = chr(ord($data[8]) & 0x3f | 0x80);
        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
    }

    /**
     * Check if user has permission
     * (Placeholder - implement role-based permissions as needed)
     *
     * @param int $userId User ID
     * @param string $permission Permission name
     * @return bool
     */
    public function hasPermission(int $userId, string $permission): bool
    {
        // TODO: Implement role-based permissions
        // For now, check if user is admin
        $user = $this->getUserById($userId);
        return $user && $user['user_type'] === 'admin';
    }
}
