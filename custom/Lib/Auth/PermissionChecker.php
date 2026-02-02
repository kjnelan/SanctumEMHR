<?php

namespace Custom\Lib\Auth;

use Custom\Lib\Database\Database;
use Custom\Lib\Session\SessionManager;

/**
 * Permission Checker for SanctumEMHR RBAC
 *
 * Implements role-based access control for client and note access.
 *
 * Access Rules:
 * - Admin: Can see ALL clients
 * - Supervisor: Can see their own clients + their supervisees' clients
 * - Clinician/Provider: Can see only clients they are assigned to in client_providers
 * - Social Worker: Can see clients they are assigned to, but NO clinical notes
 *
 * @package SanctumEMHR
 */
class PermissionChecker
{
    private Database $db;
    private SessionManager $session;
    private ?array $currentUser = null;

    public function __construct(?Database $db = null, ?SessionManager $session = null)
    {
        $this->db = $db ?? Database::getInstance();
        $this->session = $session ?? SessionManager::getInstance();
    }

    /**
     * Get current user with role information
     */
    public function getCurrentUser(): ?array
    {
        if ($this->currentUser !== null) {
            return $this->currentUser;
        }

        $this->session->start();
        $userId = $this->session->getUserId();

        if (!$userId) {
            return null;
        }

        $sql = "SELECT id, username, user_type, is_provider, is_supervisor, is_social_worker
                FROM users WHERE id = ? AND deleted_at IS NULL LIMIT 1";
        $this->currentUser = $this->db->query($sql, [$userId]);

        return $this->currentUser;
    }

    /**
     * Check if current user is an admin
     */
    public function isAdmin(): bool
    {
        $user = $this->getCurrentUser();
        return $user && $user['user_type'] === 'admin';
    }

    /**
     * Check if current user is a supervisor
     */
    public function isSupervisor(): bool
    {
        $user = $this->getCurrentUser();
        return $user && (bool) $user['is_supervisor'];
    }

    /**
     * Check if current user is a social worker
     */
    public function isSocialWorker(): bool
    {
        $user = $this->getCurrentUser();
        return $user && ((bool) $user['is_social_worker'] || $user['user_type'] === 'social_worker');
    }

    /**
     * Check if current user is a provider/clinician
     */
    public function isProvider(): bool
    {
        $user = $this->getCurrentUser();
        return $user && (bool) $user['is_provider'];
    }

    /**
     * Check if current user can access a specific client
     *
     * @param int $clientId Client ID
     * @return bool True if access is allowed
     */
    public function canAccessClient(int $clientId): bool
    {
        $user = $this->getCurrentUser();
        if (!$user) {
            return false;
        }

        // Admins can access all clients
        if ($this->isAdmin()) {
            return true;
        }

        $userId = $user['id'];

        // Check if user is directly assigned to this client
        if ($this->isAssignedToClient($userId, $clientId)) {
            return true;
        }

        // If supervisor, check if any supervisee is assigned to this client
        if ($this->isSupervisor()) {
            $superviseeIds = $this->getSuperviseeIds($userId);
            foreach ($superviseeIds as $superviseeId) {
                if ($this->isAssignedToClient($superviseeId, $clientId)) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Check if a user is assigned to a client via client_providers table
     *
     * @param int $userId User ID
     * @param int $clientId Client ID
     * @return bool True if assigned
     */
    public function isAssignedToClient(int $userId, int $clientId): bool
    {
        $sql = "SELECT 1 FROM client_providers
                WHERE provider_id = ? AND client_id = ?
                AND (ended_at IS NULL OR ended_at > CURDATE())
                LIMIT 1";

        $result = $this->db->query($sql, [$userId, $clientId]);
        return $result !== null;
    }

    /**
     * Get client role for a user (primary_clinician, clinician, social_worker, etc.)
     *
     * @param int $userId User ID
     * @param int $clientId Client ID
     * @return string|null Role or null if not assigned
     */
    public function getClientRole(int $userId, int $clientId): ?string
    {
        $sql = "SELECT role FROM client_providers
                WHERE provider_id = ? AND client_id = ?
                AND (ended_at IS NULL OR ended_at > CURDATE())
                ORDER BY FIELD(role, 'primary_clinician', 'clinician', 'social_worker', 'supervisor', 'intern')
                LIMIT 1";

        $result = $this->db->query($sql, [$userId, $clientId]);
        return $result ? $result['role'] : null;
    }

    /**
     * Get all supervisee IDs for a supervisor
     *
     * @param int $supervisorId Supervisor user ID
     * @return array Array of supervisee user IDs
     */
    public function getSuperviseeIds(int $supervisorId): array
    {
        $sql = "SELECT user_id FROM user_supervisors
                WHERE supervisor_id = ?
                AND (ended_at IS NULL OR ended_at > CURDATE())";

        $results = $this->db->queryAll($sql, [$supervisorId]);
        return array_column($results, 'user_id');
    }

    /**
     * Check if current user can view clinical notes for a client
     *
     * Social workers should NOT see clinical notes from providers.
     *
     * @param int $clientId Client ID
     * @param string|null $noteType Optional note type filter
     * @return bool True if can view clinical notes
     */
    public function canViewClinicalNotes(int $clientId, ?string $noteType = null): bool
    {
        $user = $this->getCurrentUser();
        if (!$user) {
            return false;
        }

        // Admin can view all notes
        if ($this->isAdmin()) {
            return true;
        }

        // Must have access to the client first
        if (!$this->canAccessClient($clientId)) {
            return false;
        }

        // Social workers cannot view clinical notes
        if ($this->isSocialWorker() && !$this->isProvider()) {
            // Social workers can only see case management notes they created
            // or notes explicitly shared with them
            return false;
        }

        // Providers and supervisors can view clinical notes
        return true;
    }

    /**
     * Check if current user can create clinical notes for a client
     *
     * @param int $clientId Client ID
     * @return bool True if can create clinical notes
     */
    public function canCreateClinicalNotes(int $clientId): bool
    {
        $user = $this->getCurrentUser();
        if (!$user) {
            return false;
        }

        // Must have access to the client first
        if (!$this->canAccessClient($clientId)) {
            return false;
        }

        // Admin can create notes
        if ($this->isAdmin()) {
            return true;
        }

        // Social workers cannot create clinical notes (only case management notes)
        if ($this->isSocialWorker() && !$this->isProvider()) {
            return false;
        }

        // Providers can create clinical notes
        return $this->isProvider();
    }

    /**
     * Check if current user can edit demographics for a client
     *
     * @param int $clientId Client ID
     * @return bool True if can edit demographics
     */
    public function canEditDemographics(int $clientId): bool
    {
        $user = $this->getCurrentUser();
        if (!$user) {
            return false;
        }

        // Admin can edit all
        if ($this->isAdmin()) {
            return true;
        }

        // Must have access to the client
        if (!$this->canAccessClient($clientId)) {
            return false;
        }

        // Social workers CAN edit demographics
        // Providers CAN edit demographics
        return true;
    }

    /**
     * Get list of client IDs the current user can access
     *
     * @return array Array of client IDs, or null if user can access ALL (admin)
     */
    public function getAccessibleClientIds(): ?array
    {
        $user = $this->getCurrentUser();
        if (!$user) {
            return [];
        }

        // Admins can access all clients
        if ($this->isAdmin()) {
            return null; // null means "all clients"
        }

        $userId = $user['id'];
        $clientIds = [];

        // Get clients directly assigned to user
        $sql = "SELECT DISTINCT client_id FROM client_providers
                WHERE provider_id = ?
                AND (ended_at IS NULL OR ended_at > CURDATE())";
        $directClients = $this->db->queryAll($sql, [$userId]);
        foreach ($directClients as $row) {
            $clientIds[] = (int) $row['client_id'];
        }

        // If supervisor, also get clients of supervisees
        if ($this->isSupervisor()) {
            $superviseeIds = $this->getSuperviseeIds($userId);
            if (!empty($superviseeIds)) {
                $placeholders = implode(',', array_fill(0, count($superviseeIds), '?'));
                $sql = "SELECT DISTINCT client_id FROM client_providers
                        WHERE provider_id IN ($placeholders)
                        AND (ended_at IS NULL OR ended_at > CURDATE())";
                $superviseeClients = $this->db->queryAll($sql, $superviseeIds);
                foreach ($superviseeClients as $row) {
                    $clientIds[] = (int) $row['client_id'];
                }
            }
        }

        return array_unique($clientIds);
    }

    /**
     * Build SQL WHERE clause for filtering clients by access
     *
     * @param string $clientIdColumn Column name for client ID (e.g., 'c.id')
     * @return array ['sql' => string, 'params' => array]
     */
    public function buildClientAccessFilter(string $clientIdColumn = 'c.id'): array
    {
        $user = $this->getCurrentUser();
        if (!$user) {
            return ['sql' => '1=0', 'params' => []]; // No access
        }

        // Admins can access all clients
        if ($this->isAdmin()) {
            return ['sql' => '1=1', 'params' => []]; // All access
        }

        $userId = $user['id'];
        $params = [$userId];

        // Base: directly assigned clients
        $sql = "$clientIdColumn IN (
            SELECT cp.client_id FROM client_providers cp
            WHERE cp.provider_id = ?
            AND (cp.ended_at IS NULL OR cp.ended_at > CURDATE())
        )";

        // If supervisor, also include supervisees' clients
        if ($this->isSupervisor()) {
            $sql = "($sql OR $clientIdColumn IN (
                SELECT cp2.client_id FROM client_providers cp2
                INNER JOIN user_supervisors us ON cp2.provider_id = us.user_id
                WHERE us.supervisor_id = ?
                AND (us.ended_at IS NULL OR us.ended_at > CURDATE())
                AND (cp2.ended_at IS NULL OR cp2.ended_at > CURDATE())
            ))";
            $params[] = $userId;
        }

        return ['sql' => $sql, 'params' => $params];
    }

    /**
     * Get access denial message based on role
     *
     * @return string Appropriate error message
     */
    public function getAccessDeniedMessage(): string
    {
        if ($this->isSocialWorker() && !$this->isProvider()) {
            return 'You do not have access to this client. Social workers can only access clients they are assigned to.';
        }

        if ($this->isSupervisor()) {
            return 'You do not have access to this client. Supervisors can only access their own clients and their supervisees\' clients.';
        }

        return 'You do not have access to this client. You can only access clients you are assigned to.';
    }
}
