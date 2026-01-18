<?php

namespace Custom\Lib\Database;

use PDO;
use PDOException;
use PDOStatement;

/**
 * Database Abstraction Class for MINDLINE
 *
 * Replaces OpenEMR's legacy database functions (sqlQuery, sqlStatement, etc.)
 * with modern PDO-based implementation.
 *
 * Usage:
 *   $db = Database::getInstance();
 *   $user = $db->query("SELECT * FROM users WHERE id = ?", [$userId]);
 *   $users = $db->queryAll("SELECT * FROM users WHERE is_active = ?", [true]);
 */
class Database
{
    private static ?Database $instance = null;
    private ?PDO $connection = null;
    private array $config = [];

    /**
     * Private constructor - use getInstance()
     */
    private function __construct()
    {
        $this->loadConfig();
        $this->connect();
    }

    /**
     * Get singleton instance
     */
    public static function getInstance(): Database
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Load database configuration
     *
     * Priority order:
     * 1. /config/database.php (MINDLINE config file)
     * 2. Environment variables
     * 3. /sqlconf.php (OpenEMR legacy fallback)
     */
    private function loadConfig(): void
    {
        // Start with defaults
        $this->config = [
            'host' => 'localhost',
            'port' => '3306',
            'database' => 'mindline',
            'username' => 'root',
            'password' => '',
            'charset' => 'utf8mb4'
        ];

        // Priority 1: Load from MINDLINE config file
        $mindlineConfigPath = dirname(__FILE__, 4) . '/config/database.php';
        if (file_exists($mindlineConfigPath)) {
            $configData = require $mindlineConfigPath;
            if (is_array($configData)) {
                $this->config = array_merge($this->config, $configData);
            }
        }
        // Priority 2: Override with environment variables if set
        elseif (getenv('DB_HOST') || getenv('DB_NAME')) {
            $this->config['host'] = getenv('DB_HOST') ?: $this->config['host'];
            $this->config['port'] = getenv('DB_PORT') ?: $this->config['port'];
            $this->config['database'] = getenv('DB_NAME') ?: $this->config['database'];
            $this->config['username'] = getenv('DB_USER') ?: $this->config['username'];
            $this->config['password'] = getenv('DB_PASS') ?: $this->config['password'];
        }
        // Priority 3: Legacy fallback to OpenEMR's sqlconf.php
        else {
            $sqlconfPath = dirname(__FILE__, 4) . '/sqlconf.php';
            if (file_exists($sqlconfPath)) {
                include $sqlconfPath;

                // OpenEMR uses $host, $port, $dbase, $login, $pass
                if (isset($host)) $this->config['host'] = $host;
                if (isset($port)) $this->config['port'] = $port;
                if (isset($dbase)) $this->config['database'] = $dbase;
                if (isset($login)) $this->config['username'] = $login;
                if (isset($pass)) $this->config['password'] = $pass;
            }
        }
    }

    /**
     * Establish database connection
     */
    private function connect(): void
    {
        try {
            $dsn = sprintf(
                'mysql:host=%s;port=%s;dbname=%s;charset=%s',
                $this->config['host'],
                $this->config['port'],
                $this->config['database'],
                $this->config['charset']
            );

            $this->connection = new PDO(
                $dsn,
                $this->config['username'],
                $this->config['password'],
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                    PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
                ]
            );
        } catch (PDOException $e) {
            error_log("Database connection failed: " . $e->getMessage());
            throw new \RuntimeException("Database connection failed: " . $e->getMessage());
        }
    }

    /**
     * Get PDO connection (for advanced usage)
     */
    public function getConnection(): PDO
    {
        return $this->connection;
    }

    /**
     * Execute a query and return single row
     * Replacement for sqlQuery()
     *
     * @param string $sql SQL query with placeholders
     * @param array $params Parameters to bind
     * @return array|null Single row as associative array, or null if no results
     */
    public function query(string $sql, array $params = []): ?array
    {
        try {
            $stmt = $this->connection->prepare($sql);
            $stmt->execute($params);
            $result = $stmt->fetch();
            return $result !== false ? $result : null;
        } catch (PDOException $e) {
            error_log("Database query error: " . $e->getMessage() . " | SQL: " . $sql);
            throw $e;
        }
    }

    /**
     * Execute a query and return all rows
     * Replacement for sqlStatement() + sqlFetchArray() loop
     *
     * @param string $sql SQL query with placeholders
     * @param array $params Parameters to bind
     * @return array Array of rows
     */
    public function queryAll(string $sql, array $params = []): array
    {
        try {
            $stmt = $this->connection->prepare($sql);
            $stmt->execute($params);
            return $stmt->fetchAll();
        } catch (PDOException $e) {
            error_log("Database queryAll error: " . $e->getMessage() . " | SQL: " . $sql);
            throw $e;
        }
    }

    /**
     * Execute a statement (INSERT, UPDATE, DELETE)
     * Replacement for sqlStatement() when no results expected
     *
     * @param string $sql SQL statement with placeholders
     * @param array $params Parameters to bind
     * @return int Number of affected rows
     */
    public function execute(string $sql, array $params = []): int
    {
        try {
            $stmt = $this->connection->prepare($sql);
            $stmt->execute($params);
            return $stmt->rowCount();
        } catch (PDOException $e) {
            error_log("Database execute error: " . $e->getMessage() . " | SQL: " . $sql);
            throw $e;
        }
    }

    /**
     * Insert a row and return the inserted ID
     * Replacement for sqlInsert()
     *
     * @param string $sql INSERT statement with placeholders
     * @param array $params Parameters to bind
     * @return int Last inserted ID
     */
    public function insert(string $sql, array $params = []): int
    {
        try {
            $stmt = $this->connection->prepare($sql);
            $stmt->execute($params);
            return (int) $this->connection->lastInsertId();
        } catch (PDOException $e) {
            error_log("Database insert error: " . $e->getMessage() . " | SQL: " . $sql);
            throw $e;
        }
    }

    /**
     * Insert a row using associative array
     * Convenience method for simple inserts
     *
     * @param string $table Table name
     * @param array $data Associative array of column => value
     * @return int Last inserted ID
     */
    public function insertArray(string $table, array $data): int
    {
        $columns = array_keys($data);
        $placeholders = array_fill(0, count($columns), '?');

        $sql = sprintf(
            "INSERT INTO %s (%s) VALUES (%s)",
            $table,
            implode(', ', $columns),
            implode(', ', $placeholders)
        );

        return $this->insert($sql, array_values($data));
    }

    /**
     * Update rows using associative array
     * Convenience method for simple updates
     *
     * @param string $table Table name
     * @param array $data Associative array of column => value to update
     * @param string $whereClause WHERE clause (without WHERE keyword)
     * @param array $whereParams Parameters for WHERE clause
     * @return int Number of affected rows
     */
    public function updateArray(string $table, array $data, string $whereClause, array $whereParams = []): int
    {
        $setClauses = [];
        $params = [];

        foreach ($data as $column => $value) {
            $setClauses[] = "$column = ?";
            $params[] = $value;
        }

        $sql = sprintf(
            "UPDATE %s SET %s WHERE %s",
            $table,
            implode(', ', $setClauses),
            $whereClause
        );

        $params = array_merge($params, $whereParams);

        return $this->execute($sql, $params);
    }

    /**
     * Get a single value from query result
     * Useful for COUNT, MAX, etc.
     *
     * @param string $sql SQL query
     * @param array $params Parameters to bind
     * @return mixed Single value or null
     */
    public function getValue(string $sql, array $params = [])
    {
        try {
            $stmt = $this->connection->prepare($sql);
            $stmt->execute($params);
            return $stmt->fetchColumn();
        } catch (PDOException $e) {
            error_log("Database getValue error: " . $e->getMessage() . " | SQL: " . $sql);
            throw $e;
        }
    }

    /**
     * Begin a transaction
     */
    public function beginTransaction(): bool
    {
        return $this->connection->beginTransaction();
    }

    /**
     * Commit a transaction
     */
    public function commit(): bool
    {
        return $this->connection->commit();
    }

    /**
     * Rollback a transaction
     */
    public function rollback(): bool
    {
        return $this->connection->rollback();
    }

    /**
     * Check if currently in a transaction
     */
    public function inTransaction(): bool
    {
        return $this->connection->inTransaction();
    }

    /**
     * Execute a callback within a transaction
     * Automatically commits on success, rolls back on exception
     *
     * @param callable $callback Function to execute
     * @return mixed Return value of callback
     * @throws \Exception
     */
    public function transaction(callable $callback)
    {
        $this->beginTransaction();

        try {
            $result = $callback($this);
            $this->commit();
            return $result;
        } catch (\Exception $e) {
            $this->rollback();
            throw $e;
        }
    }

    /**
     * Escape identifier (table/column name)
     * Use sparingly - prefer prepared statements
     */
    public function escapeIdentifier(string $identifier): string
    {
        return '`' . str_replace('`', '``', $identifier) . '`';
    }

    /**
     * Get table columns
     *
     * @param string $table Table name
     * @return array Array of column names
     */
    public function getTableColumns(string $table): array
    {
        $sql = "SHOW COLUMNS FROM " . $this->escapeIdentifier($table);
        $columns = $this->queryAll($sql);
        return array_column($columns, 'Field');
    }

    /**
     * Check if table exists
     *
     * @param string $table Table name
     * @return bool
     */
    public function tableExists(string $table): bool
    {
        $sql = "SELECT COUNT(*) as count
                FROM information_schema.tables
                WHERE table_schema = ?
                AND table_name = ?
                LIMIT 1";

        $result = $this->getValue($sql, [$this->config['database'], $table]);
        return $result > 0;
    }

    /**
     * Get row count for a query
     *
     * @param string $sql SQL query
     * @param array $params Parameters
     * @return int Row count
     */
    public function count(string $sql, array $params = []): int
    {
        return (int) $this->getValue($sql, $params);
    }

    /**
     * Prepare a statement for manual execution
     * Use when you need more control over statement execution
     *
     * @param string $sql SQL query
     * @return PDOStatement
     */
    public function prepare(string $sql): PDOStatement
    {
        return $this->connection->prepare($sql);
    }

    /**
     * Close connection
     */
    public function disconnect(): void
    {
        $this->connection = null;
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
