<?php

namespace Custom\Lib\Audit;

use Custom\Lib\Database\Database;
use Custom\Lib\Session\SessionManager;

/**
 * Audit Logger for SanctumEMHR - HIPAA Compliance
 *
 * Logs security-sensitive actions for compliance and security monitoring.
 *
 * Events logged:
 * - Logins (successful and failed)
 * - Chart/client access
 * - Note edits and signatures
 * - Demographic edits
 * - Exports
 * - Permission changes
 *
 * @package SanctumEMHR
 */
class AuditLogger
{
    private Database $db;
    private SessionManager $session;
    private ?int $userId = null;
    private ?string $ipAddress = null;

    public function __construct(?Database $db = null, ?SessionManager $session = null)
    {
        $this->db = $db ?? Database::getInstance();
        $this->session = $session ?? SessionManager::getInstance();
        $this->userId = $this->session->getUserId();
        $this->ipAddress = $this->getClientIp();
    }

    /**
     * Log any audit event
     *
     * @param string $action Action type (e.g., 'login_success', 'view_client', 'edit_note')
     * @param string $resourceType Resource type (e.g., 'client', 'note', 'user')
     * @param int|null $resourceId ID of the resource
     * @param array|null $details Additional details (will be JSON encoded)
     * @param int|null $userId Override user ID (for login events before session exists)
     * @return bool Success
     */
    public function log(
        string $action,
        string $resourceType,
        ?int $resourceId = null,
        ?array $details = null,
        ?int $userId = null
    ): bool {
        try {
            $sql = "INSERT INTO audit_log
                    (user_id, action, resource_type, resource_id, details, ip_address, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, NOW())";

            $params = [
                $userId ?? $this->userId,
                $action,
                $resourceType,
                $resourceId,
                $details ? json_encode($details) : null,
                $this->ipAddress
            ];

            $this->db->execute($sql, $params);
            return true;

        } catch (\Exception $e) {
            // Don't throw - audit logging should never break the application
            error_log("Audit logging failed: " . $e->getMessage());
            return false;
        }
    }

    /**
     * ========================================
     * LOGIN EVENTS
     * ========================================
     */

    /**
     * Log successful login
     */
    public function logLoginSuccess(int $userId, string $username): bool
    {
        return $this->log(
            'login_success',
            'user',
            $userId,
            ['username' => $username, 'method' => 'password'],
            $userId
        );
    }

    /**
     * Log failed login attempt
     */
    public function logLoginFailure(string $username, string $reason = 'invalid_credentials'): bool
    {
        return $this->log(
            'login_failure',
            'user',
            null,
            [
                'username' => $username,
                'reason' => $reason,
                'failed_at' => date('Y-m-d H:i:s')
            ],
            null
        );
    }

    /**
     * Log account lockout
     */
    public function logAccountLocked(int $userId, string $username): bool
    {
        return $this->log(
            'account_locked',
            'user',
            $userId,
            [
                'username' => $username,
                'reason' => 'too_many_failed_attempts'
            ],
            $userId
        );
    }

    /**
     * Log logout
     */
    public function logLogout(): bool
    {
        return $this->log('logout', 'user', $this->userId);
    }

    /**
     * ========================================
     * CLIENT/CHART ACCESS
     * ========================================
     */

    /**
     * Log client chart access
     */
    public function logViewClient(int $clientId, ?string $clientName = null): bool
    {
        return $this->log(
            'view_client',
            'client',
            $clientId,
            $clientName ? ['client_name' => $clientName] : null
        );
    }

    /**
     * Log client search
     */
    public function logSearchClients(string $searchTerm, int $resultCount): bool
    {
        return $this->log(
            'search_clients',
            'client',
            null,
            [
                'search_term' => $searchTerm,
                'result_count' => $resultCount
            ]
        );
    }

    /**
     * ========================================
     * NOTE EVENTS
     * ========================================
     */

    /**
     * Log clinical note creation
     */
    public function logCreateNote(int $noteId, int $clientId, string $noteType): bool
    {
        return $this->log(
            'create_note',
            'note',
            $noteId,
            [
                'client_id' => $clientId,
                'note_type' => $noteType
            ]
        );
    }

    /**
     * Log note edit
     */
    public function logEditNote(int $noteId, int $clientId, ?string $changeType = null): bool
    {
        return $this->log(
            'edit_note',
            'note',
            $noteId,
            [
                'client_id' => $clientId,
                'change_type' => $changeType
            ]
        );
    }

    /**
     * Log note signature
     */
    public function logSignNote(int $noteId, int $clientId, bool $isSupervisor = false): bool
    {
        return $this->log(
            $isSupervisor ? 'supervisor_sign_note' : 'sign_note',
            'note',
            $noteId,
            [
                'client_id' => $clientId,
                'signed_at' => date('Y-m-d H:i:s')
            ]
        );
    }

    /**
     * Log addendum creation
     */
    public function logCreateAddendum(int $addendumId, int $noteId, int $clientId): bool
    {
        return $this->log(
            'create_addendum',
            'addendum',
            $addendumId,
            [
                'note_id' => $noteId,
                'client_id' => $clientId
            ]
        );
    }

    /**
     * Log note deletion (soft delete)
     */
    public function logDeleteNote(int $noteId, int $clientId, string $reason): bool
    {
        return $this->log(
            'delete_note',
            'note',
            $noteId,
            [
                'client_id' => $clientId,
                'reason' => $reason
            ]
        );
    }

    /**
     * ========================================
     * DEMOGRAPHIC EDITS
     * ========================================
     */

    /**
     * Log demographics edit
     */
    public function logEditDemographics(int $clientId, array $changedFields): bool
    {
        return $this->log(
            'edit_demographics',
            'client',
            $clientId,
            [
                'changed_fields' => $changedFields,
                'field_count' => count($changedFields)
            ]
        );
    }

    /**
     * Log client creation
     */
    public function logCreateClient(int $clientId, string $clientName): bool
    {
        return $this->log(
            'create_client',
            'client',
            $clientId,
            ['client_name' => $clientName]
        );
    }

    /**
     * ========================================
     * DATA EXPORTS
     * ========================================
     */

    /**
     * Log data export
     */
    public function logExport(string $exportType, ?int $clientId = null, ?array $filters = null): bool
    {
        return $this->log(
            'export_data',
            $clientId ? 'client' : 'system',
            $clientId,
            [
                'export_type' => $exportType,
                'filters' => $filters,
                'exported_at' => date('Y-m-d H:i:s')
            ]
        );
    }

    /**
     * Log report generation
     */
    public function logGenerateReport(string $reportType, array $parameters): bool
    {
        return $this->log(
            'generate_report',
            'report',
            null,
            [
                'report_type' => $reportType,
                'parameters' => $parameters
            ]
        );
    }

    /**
     * ========================================
     * USER/PERMISSION CHANGES
     * ========================================
     */

    /**
     * Log user creation
     */
    public function logCreateUser(int $newUserId, string $username, string $userType): bool
    {
        return $this->log(
            'create_user',
            'user',
            $newUserId,
            [
                'username' => $username,
                'user_type' => $userType
            ]
        );
    }

    /**
     * Log user edit
     */
    public function logEditUser(int $targetUserId, array $changedFields): bool
    {
        return $this->log(
            'edit_user',
            'user',
            $targetUserId,
            [
                'changed_fields' => $changedFields,
                'field_count' => count($changedFields)
            ]
        );
    }

    /**
     * Log permission/role change
     */
    public function logPermissionChange(
        int $targetUserId,
        string $changeType,
        $oldValue,
        $newValue
    ): bool {
        return $this->log(
            'permission_change',
            'user',
            $targetUserId,
            [
                'change_type' => $changeType,
                'old_value' => $oldValue,
                'new_value' => $newValue
            ]
        );
    }

    /**
     * Log user deactivation
     */
    public function logDeactivateUser(int $targetUserId, string $username): bool
    {
        return $this->log(
            'deactivate_user',
            'user',
            $targetUserId,
            ['username' => $username]
        );
    }

    /**
     * Log account unlock
     */
    public function logUnlockAccount(int $targetUserId, string $username): bool
    {
        return $this->log(
            'unlock_account',
            'user',
            $targetUserId,
            ['username' => $username]
        );
    }

    /**
     * ========================================
     * MESSAGING (Future)
     * ========================================
     */

    /**
     * Log secure message sent
     */
    public function logSendMessage(int $messageId, int $recipientId, string $subject): bool
    {
        return $this->log(
            'send_message',
            'message',
            $messageId,
            [
                'recipient_id' => $recipientId,
                'subject' => $subject
            ]
        );
    }

    /**
     * Log message read
     */
    public function logReadMessage(int $messageId): bool
    {
        return $this->log(
            'read_message',
            'message',
            $messageId
        );
    }

    /**
     * ========================================
     * HELPER METHODS
     * ========================================
     */

    /**
     * Get client IP address (handles proxies)
     */
    private function getClientIp(): string
    {
        if (!empty($_SERVER['HTTP_CLIENT_IP'])) {
            $ip = $_SERVER['HTTP_CLIENT_IP'];
        } elseif (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
            $ip = $_SERVER['HTTP_X_FORWARDED_FOR'];
        } else {
            $ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
        }

        // Handle comma-separated IPs (proxy chains)
        if (strpos($ip, ',') !== false) {
            $ips = explode(',', $ip);
            $ip = trim($ips[0]);
        }

        return $ip;
    }

    /**
     * Get audit trail for a specific resource
     *
     * @param string $resourceType Resource type
     * @param int $resourceId Resource ID
     * @param int $limit Limit results
     * @return array Audit log entries
     */
    public function getAuditTrail(string $resourceType, int $resourceId, int $limit = 50): array
    {
        $sql = "SELECT
                    al.id,
                    al.user_id,
                    CONCAT(u.fname, ' ', u.lname) AS user_name,
                    al.action,
                    al.resource_type,
                    al.resource_id,
                    al.details,
                    al.ip_address,
                    al.created_at
                FROM audit_log al
                LEFT JOIN users u ON u.id = al.user_id
                WHERE al.resource_type = ?
                  AND al.resource_id = ?
                ORDER BY al.created_at DESC
                LIMIT ?";

        return $this->db->queryAll($sql, [$resourceType, $resourceId, $limit]);
    }

    /**
     * Get recent audit logs (for admin review)
     *
     * @param int $limit Limit results
     * @param string|null $actionFilter Filter by action type
     * @return array Audit log entries
     */
    public function getRecentLogs(int $limit = 100, ?string $actionFilter = null): array
    {
        $sql = "SELECT
                    al.id,
                    al.user_id,
                    CONCAT(u.fname, ' ', u.lname) AS user_name,
                    al.action,
                    al.resource_type,
                    al.resource_id,
                    al.details,
                    al.ip_address,
                    al.created_at
                FROM audit_log al
                LEFT JOIN users u ON u.id = al.user_id";

        $params = [];
        if ($actionFilter) {
            $sql .= " WHERE al.action = ?";
            $params[] = $actionFilter;
        }

        $sql .= " ORDER BY al.created_at DESC LIMIT ?";
        $params[] = $limit;

        return $this->db->queryAll($sql, $params);
    }
}
