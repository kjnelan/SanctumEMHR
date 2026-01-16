<?php

namespace Custom\Lib\Session;

use Custom\Lib\Database\Database;
use SessionHandlerInterface;

/**
 * Session Manager for MINDLINE
 *
 * Replaces OpenEMR\Common\Session\SessionUtil
 *
 * Handles session management with database storage for security and scalability.
 */
class SessionManager implements SessionHandlerInterface
{
    private static ?SessionManager $instance = null;
    private Database $db;
    private bool $started = false;

    // Session configuration
    private const SESSION_LIFETIME = 28800; // 8 hours
    private const SESSION_NAME = 'MINDLINE_SESSION';
    private const SESSION_COOKIE_LIFETIME = 0; // Browser session

    private function __construct()
    {
        $this->db = Database::getInstance();
    }

    /**
     * Get singleton instance
     */
    public static function getInstance(): SessionManager
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Start session with database storage
     */
    public function start(): bool
    {
        if ($this->started) {
            return true;
        }

        // Configure session
        ini_set('session.cookie_httponly', '1');
        ini_set('session.cookie_secure', '1');
        ini_set('session.use_strict_mode', '1');
        ini_set('session.cookie_samesite', 'Lax');
        ini_set('session.gc_maxlifetime', (string) self::SESSION_LIFETIME);

        // Set session name
        session_name(self::SESSION_NAME);

        // Set custom session handler (database storage) - use object implementing SessionHandlerInterface
        session_set_save_handler($this, true);

        // Start the session
        if (session_status() === PHP_SESSION_NONE) {
            $result = session_start();
            $this->started = $result;
            return $result;
        }

        $this->started = true;
        return true;
    }

    /**
     * Session open handler
     * Required by SessionHandlerInterface
     */
    public function open(string $savePath, string $sessionName): bool
    {
        return true;
    }

    /**
     * Session close handler
     * Required by SessionHandlerInterface
     */
    public function close(): bool
    {
        return true;
    }

    /**
     * Session read handler
     * Required by SessionHandlerInterface
     */
    public function read(string $sessionId): string|false
    {
        try {
            $sql = "SELECT payload FROM sessions WHERE id = ? LIMIT 1";
            $result = $this->db->query($sql, [$sessionId]);

            if ($result) {
                // Update last activity
                $this->db->execute(
                    "UPDATE sessions SET last_activity = ? WHERE id = ?",
                    [time(), $sessionId]
                );
                return $result['payload'] ?? '';
            }

            return '';
        } catch (\Exception $e) {
            error_log("Session read error: " . $e->getMessage());
            return '';
        }
    }

    /**
     * Session write handler
     * Required by SessionHandlerInterface
     */
    public function write(string $sessionId, string $data): bool
    {
        try {
            $userId = $_SESSION['user_id'] ?? null;
            $now = time();
            $ipAddress = $_SERVER['REMOTE_ADDR'] ?? null;
            $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? null;

            // Use INSERT ... ON DUPLICATE KEY UPDATE for MySQL
            $sql = "INSERT INTO sessions (id, user_id, payload, last_activity, ip_address, user_agent, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, NOW())
                    ON DUPLICATE KEY UPDATE
                        user_id = VALUES(user_id),
                        payload = VALUES(payload),
                        last_activity = VALUES(last_activity),
                        ip_address = VALUES(ip_address),
                        user_agent = VALUES(user_agent)";

            $this->db->execute($sql, [$sessionId, $userId, $data, $now, $ipAddress, $userAgent]);
            return true;
        } catch (\Exception $e) {
            error_log("Session write error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Session destroy handler
     * Required by SessionHandlerInterface
     */
    public function destroy(string $sessionId): bool
    {
        try {
            $sql = "DELETE FROM sessions WHERE id = ?";
            $this->db->execute($sql, [$sessionId]);
            return true;
        } catch (\Exception $e) {
            error_log("Session destroy error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Session garbage collection handler
     * Required by SessionHandlerInterface
     */
    public function gc(int $maxLifetime): int|false
    {
        try {
            $expiredTime = time() - $maxLifetime;
            $sql = "DELETE FROM sessions WHERE last_activity < ?";
            return $this->db->execute($sql, [$expiredTime]);
        } catch (\Exception $e) {
            error_log("Session GC error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Set session variable
     */
    public function set(string $key, $value): void
    {
        $this->start();
        $_SESSION[$key] = $value;
    }

    /**
     * Get session variable
     */
    public function get(string $key, $default = null)
    {
        $this->start();
        return $_SESSION[$key] ?? $default;
    }

    /**
     * Check if session variable exists
     */
    public function has(string $key): bool
    {
        $this->start();
        return isset($_SESSION[$key]);
    }

    /**
     * Remove session variable
     */
    public function remove(string $key): void
    {
        $this->start();
        unset($_SESSION[$key]);
    }

    /**
     * Clear all session data
     */
    public function clear(): void
    {
        $this->start();
        $_SESSION = [];
    }

    /**
     * Destroy session completely
     */
    public function destroy(): bool
    {
        $this->start();

        // Clear session data
        $_SESSION = [];

        // Delete session cookie
        if (isset($_COOKIE[session_name()])) {
            setcookie(
                session_name(),
                '',
                time() - 3600,
                '/',
                '',
                true,
                true
            );
        }

        // Destroy session
        $result = session_destroy();
        $this->started = false;

        return $result;
    }

    /**
     * Regenerate session ID (security measure)
     */
    public function regenerate(bool $deleteOldSession = true): bool
    {
        $this->start();
        return session_regenerate_id($deleteOldSession);
    }

    /**
     * Check if session is active
     */
    public function isActive(): bool
    {
        return session_status() === PHP_SESSION_ACTIVE;
    }

    /**
     * Get session ID
     */
    public function getId(): string
    {
        $this->start();
        return session_id();
    }

    /**
     * Check if user is authenticated
     */
    public function isAuthenticated(): bool
    {
        return $this->has('user_id') && $this->has('username');
    }

    /**
     * Get authenticated user ID
     */
    public function getUserId(): ?int
    {
        return $this->get('user_id');
    }

    /**
     * Get authenticated username
     */
    public function getUsername(): ?string
    {
        return $this->get('username');
    }

    /**
     * Login user - set session variables
     */
    public function login(array $user): void
    {
        $this->start();

        // Regenerate session ID for security
        $this->regenerate();

        // Set session variables
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['username'] = $user['username'];
        $_SESSION['user_type'] = $user['user_type'];
        $_SESSION['is_provider'] = $user['is_provider'] ?? false;
        $_SESSION['full_name'] = trim(($user['first_name'] ?? '') . ' ' . ($user['last_name'] ?? ''));
        $_SESSION['login_time'] = time();

        // Store minimal user data in session
        $_SESSION['user'] = [
            'id' => $user['id'],
            'username' => $user['username'],
            'first_name' => $user['first_name'] ?? '',
            'last_name' => $user['last_name'] ?? '',
            'email' => $user['email'] ?? '',
            'user_type' => $user['user_type'],
            'is_provider' => $user['is_provider'] ?? false
        ];
    }

    /**
     * Logout user - destroy session
     */
    public function logout(): bool
    {
        return $this->destroy();
    }

    /**
     * Get all active sessions for a user
     */
    public function getUserSessions(int $userId): array
    {
        $sql = "SELECT id, ip_address, user_agent, last_activity, created_at
                FROM sessions
                WHERE user_id = ?
                ORDER BY last_activity DESC";

        return $this->db->queryAll($sql, [$userId]);
    }

    /**
     * Destroy all sessions for a user (force logout everywhere)
     */
    public function destroyUserSessions(int $userId): int
    {
        $sql = "DELETE FROM sessions WHERE user_id = ?";
        return $this->db->execute($sql, [$userId]);
    }

    /**
     * Get session data as array
     */
    public function toArray(): array
    {
        $this->start();
        return $_SESSION;
    }

    /**
     * Prevent cloning
     */
    private function __clone() {}

    /**
     * Prevent unserialization
     */
    public function __wakeup()
    {
        throw new \Exception("Cannot unserialize singleton");
    }
}
