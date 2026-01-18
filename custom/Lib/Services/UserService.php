<?php

namespace Custom\Lib\Services;

use Custom\Lib\Database\Database;
use Custom\Lib\Auth\CustomAuth;

/**
 * User Service for MINDLINE
 *
 * Replaces OpenEMR\Services\UserService
 *
 * Handles user CRUD operations, queries, and user management.
 */
class UserService
{
    private Database $db;
    private CustomAuth $auth;

    public function __construct(?Database $db = null, ?CustomAuth $auth = null)
    {
        $this->db = $db ?? Database::getInstance();
        $this->auth = $auth ?? new CustomAuth();
    }

    /**
     * Get user by ID
     *
     * @param int $userId User ID
     * @param bool $includeDeleted Include soft-deleted users
     * @return array|null User data or null
     */
    public function getUser(int $userId, bool $includeDeleted = false): ?array
    {
        $sql = "SELECT * FROM users WHERE id = ?";

        if (!$includeDeleted) {
            $sql .= " AND deleted_at IS NULL";
        }

        $sql .= " LIMIT 1";

        $user = $this->db->query($sql, [$userId]);

        if ($user) {
            // Remove sensitive data
            unset($user['password_hash']);
        }

        return $user;
    }

    /**
     * Get user by username
     *
     * @param string $username Username
     * @return array|null User data or null
     */
    public function getUserByUsername(string $username): ?array
    {
        $sql = "SELECT * FROM users WHERE username = ? AND deleted_at IS NULL LIMIT 1";
        $user = $this->db->query($sql, [$username]);

        if ($user) {
            unset($user['password_hash']);
        }

        return $user;
    }

    /**
     * Get user by email
     *
     * @param string $email Email address
     * @return array|null User data or null
     */
    public function getUserByEmail(string $email): ?array
    {
        $sql = "SELECT * FROM users WHERE email = ? AND deleted_at IS NULL LIMIT 1";
        $user = $this->db->query($sql, [$email]);

        if ($user) {
            unset($user['password_hash']);
        }

        return $user;
    }

    /**
     * Get all users with optional filters
     *
     * @param array $filters Filters (user_type, is_active, is_provider)
     * @param int|null $limit Limit results
     * @param int $offset Offset for pagination
     * @return array Array of users
     */
    public function getUsers(array $filters = [], ?int $limit = null, int $offset = 0): array
    {
        $sql = "SELECT id, uuid, username, email, first_name, last_name, middle_name,
                       user_type, is_active, is_provider, npi, license_number, license_state,
                       phone, mobile, fax, last_login_at, created_at, updated_at
                FROM users
                WHERE deleted_at IS NULL";

        $params = [];

        // Apply filters
        if (!empty($filters['user_type'])) {
            $sql .= " AND user_type = ?";
            $params[] = $filters['user_type'];
        }

        if (isset($filters['is_active'])) {
            $sql .= " AND is_active = ?";
            $params[] = (bool) $filters['is_active'];
        }

        if (isset($filters['is_provider'])) {
            $sql .= " AND is_provider = ?";
            $params[] = (bool) $filters['is_provider'];
        }

        if (!empty($filters['search'])) {
            $sql .= " AND (first_name LIKE ? OR last_name LIKE ? OR username LIKE ? OR email LIKE ?)";
            $searchTerm = '%' . $filters['search'] . '%';
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $params[] = $searchTerm;
        }

        $sql .= " ORDER BY last_name, first_name";

        if ($limit !== null) {
            $sql .= " LIMIT ? OFFSET ?";
            $params[] = $limit;
            $params[] = $offset;
        }

        return $this->db->queryAll($sql, $params);
    }

    /**
     * Get all providers (users with is_provider = true)
     *
     * @param bool $activeOnly Only active providers
     * @return array Array of providers
     */
    public function getProviders(bool $activeOnly = true): array
    {
        $sql = "SELECT id, uuid, username, first_name, last_name, middle_name,
                       user_type, npi, license_number, license_state, phone, email
                FROM users
                WHERE is_provider = 1
                AND deleted_at IS NULL";

        if ($activeOnly) {
            $sql .= " AND is_active = 1";
        }

        $sql .= " ORDER BY last_name, first_name";

        return $this->db->queryAll($sql);
    }

    /**
     * Create a new user
     *
     * @param array $userData User data
     * @return array ['success' => bool, 'user_id' => int|null, 'message' => string]
     */
    public function createUser(array $userData): array
    {
        return $this->auth->createUser($userData);
    }

    /**
     * Update user
     *
     * @param int $userId User ID
     * @param array $data Data to update
     * @return array ['success' => bool, 'message' => string]
     */
    public function updateUser(int $userId, array $data): array
    {
        // Remove fields that shouldn't be updated directly
        unset($data['id'], $data['password_hash'], $data['created_at'], $data['deleted_at']);

        // Check if user exists
        $user = $this->getUser($userId);
        if (!$user) {
            return [
                'success' => false,
                'message' => 'User not found'
            ];
        }

        // If username is being changed, check for duplicates
        if (!empty($data['username']) && $data['username'] !== $user['username']) {
            $existing = $this->getUserByUsername($data['username']);
            if ($existing) {
                return [
                    'success' => false,
                    'message' => 'Username already exists'
                ];
            }
        }

        // If email is being changed, check for duplicates
        if (!empty($data['email']) && $data['email'] !== $user['email']) {
            $existing = $this->getUserByEmail($data['email']);
            if ($existing) {
                return [
                    'success' => false,
                    'message' => 'Email already exists'
                ];
            }
        }

        // Convert boolean values to integers for MySQL
        if (isset($data['is_active'])) {
            $data['is_active'] = (int) $data['is_active'];
        }
        if (isset($data['is_provider'])) {
            $data['is_provider'] = (int) $data['is_provider'];
        }

        try {
            $this->db->updateArray('users', $data, 'id = ?', [$userId]);

            // Log the update
            $this->logAudit($userId, 'user_updated', 'user', $userId, 'User information updated');

            return [
                'success' => true,
                'message' => 'User updated successfully'
            ];
        } catch (\Exception $e) {
            error_log("Error updating user: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Failed to update user'
            ];
        }
    }

    /**
     * Soft delete user
     *
     * @param int $userId User ID
     * @return array ['success' => bool, 'message' => string]
     */
    public function deleteUser(int $userId): array
    {
        // Check if user exists
        $user = $this->getUser($userId);
        if (!$user) {
            return [
                'success' => false,
                'message' => 'User not found'
            ];
        }

        try {
            // Soft delete
            $sql = "UPDATE users SET deleted_at = NOW() WHERE id = ?";
            $this->db->execute($sql, [$userId]);

            // Log the deletion
            $this->logAudit($userId, 'user_deleted', 'user', $userId, 'User soft deleted');

            return [
                'success' => true,
                'message' => 'User deleted successfully'
            ];
        } catch (\Exception $e) {
            error_log("Error deleting user: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Failed to delete user'
            ];
        }
    }

    /**
     * Restore soft-deleted user
     *
     * @param int $userId User ID
     * @return array ['success' => bool, 'message' => string]
     */
    public function restoreUser(int $userId): array
    {
        try {
            $sql = "UPDATE users SET deleted_at = NULL WHERE id = ?";
            $affected = $this->db->execute($sql, [$userId]);

            if ($affected === 0) {
                return [
                    'success' => false,
                    'message' => 'User not found or not deleted'
                ];
            }

            $this->logAudit($userId, 'user_restored', 'user', $userId, 'User restored');

            return [
                'success' => true,
                'message' => 'User restored successfully'
            ];
        } catch (\Exception $e) {
            error_log("Error restoring user: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Failed to restore user'
            ];
        }
    }

    /**
     * Change user password
     *
     * @param int $userId User ID
     * @param string $newPassword New password
     * @param string|null $oldPassword Old password for verification
     * @return array ['success' => bool, 'message' => string]
     */
    public function changePassword(int $userId, string $newPassword, ?string $oldPassword = null): array
    {
        return $this->auth->changePassword($userId, $newPassword, $oldPassword);
    }

    /**
     * Toggle user active status
     *
     * @param int $userId User ID
     * @param bool $isActive New active status
     * @return array ['success' => bool, 'message' => string]
     */
    public function setActiveStatus(int $userId, bool $isActive): array
    {
        try {
            $sql = "UPDATE users SET is_active = ? WHERE id = ?";
            $this->db->execute($sql, [(int) $isActive, $userId]);

            $status = $isActive ? 'activated' : 'deactivated';
            $this->logAudit($userId, 'user_' . $status, 'user', $userId, "User $status");

            return [
                'success' => true,
                'message' => 'User status updated successfully'
            ];
        } catch (\Exception $e) {
            error_log("Error updating user status: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Failed to update user status'
            ];
        }
    }

    /**
     * Get user's supervisors
     *
     * @param int $userId User ID
     * @return array Array of supervisors
     */
    public function getUserSupervisors(int $userId): array
    {
        $sql = "SELECT us.id, us.relationship_type, us.started_at, us.ended_at,
                       u.id as supervisor_id, u.first_name, u.last_name, u.email, u.phone
                FROM user_supervisors us
                JOIN users u ON us.supervisor_id = u.id
                WHERE us.user_id = ?
                AND (us.ended_at IS NULL OR us.ended_at > NOW())
                ORDER BY us.started_at DESC";

        return $this->db->queryAll($sql, [$userId]);
    }

    /**
     * Get user's supervisees (people they supervise)
     *
     * @param int $supervisorId Supervisor user ID
     * @return array Array of supervisees
     */
    public function getUserSupervisees(int $supervisorId): array
    {
        $sql = "SELECT us.id, us.relationship_type, us.started_at, us.ended_at,
                       u.id as user_id, u.first_name, u.last_name, u.email, u.phone
                FROM user_supervisors us
                JOIN users u ON us.user_id = u.id
                WHERE us.supervisor_id = ?
                AND (us.ended_at IS NULL OR us.ended_at > NOW())
                ORDER BY u.last_name, u.first_name";

        return $this->db->queryAll($sql, [$supervisorId]);
    }

    /**
     * Get count of users
     *
     * @param array $filters Optional filters
     * @return int User count
     */
    public function getUserCount(array $filters = []): int
    {
        $sql = "SELECT COUNT(*) FROM users WHERE deleted_at IS NULL";
        $params = [];

        if (!empty($filters['user_type'])) {
            $sql .= " AND user_type = ?";
            $params[] = $filters['user_type'];
        }

        if (isset($filters['is_active'])) {
            $sql .= " AND is_active = ?";
            $params[] = (bool) $filters['is_active'];
        }

        if (isset($filters['is_provider'])) {
            $sql .= " AND is_provider = ?";
            $params[] = (bool) $filters['is_provider'];
        }

        return $this->db->count($sql, $params);
    }

    /**
     * Search users by name or username
     *
     * @param string $searchTerm Search term
     * @param int $limit Limit results
     * @return array Array of users
     */
    public function searchUsers(string $searchTerm, int $limit = 20): array
    {
        $sql = "SELECT id, username, first_name, last_name, email, user_type, is_provider
                FROM users
                WHERE deleted_at IS NULL
                AND is_active = 1
                AND (
                    first_name LIKE ? OR
                    last_name LIKE ? OR
                    username LIKE ? OR
                    email LIKE ?
                )
                ORDER BY last_name, first_name
                LIMIT ?";

        $term = '%' . $searchTerm . '%';
        return $this->db->queryAll($sql, [$term, $term, $term, $term, $limit]);
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
     * Get user with full name formatted
     *
     * @param int $userId User ID
     * @return array|null User with formatted name
     */
    public function getUserWithFormattedName(int $userId): ?array
    {
        $user = $this->getUser($userId);

        if ($user) {
            $user['full_name'] = trim(
                ($user['first_name'] ?? '') . ' ' .
                ($user['middle_name'] ? $user['middle_name'] . ' ' : '') .
                ($user['last_name'] ?? '')
            );
            $user['display_name'] = trim(($user['first_name'] ?? '') . ' ' . ($user['last_name'] ?? ''));
        }

        return $user;
    }
}
