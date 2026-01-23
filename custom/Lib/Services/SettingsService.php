<?php

namespace Custom\Lib\Services;

use Custom\Lib\Database\Database;

/**
 * Settings Service
 * Manages system-wide configuration settings
 */
class SettingsService
{
    private Database $db;
    private static ?array $cache = null;

    public function __construct(?Database $db = null)
    {
        $this->db = $db ?? Database::getInstance();
    }

    /**
     * Get a setting value by key
     *
     * @param string $key Setting key (e.g., 'security.max_login_attempts')
     * @param mixed $default Default value if setting not found
     * @return mixed Setting value
     */
    public function get(string $key, $default = null)
    {
        if (self::$cache === null) {
            $this->loadSettings();
        }

        return self::$cache[$key] ?? $default;
    }

    /**
     * Get integer setting
     *
     * @param string $key Setting key
     * @param int $default Default value
     * @return int
     */
    public function getInt(string $key, int $default = 0): int
    {
        return (int) $this->get($key, $default);
    }

    /**
     * Get boolean setting
     *
     * @param string $key Setting key
     * @param bool $default Default value
     * @return bool
     */
    public function getBool(string $key, bool $default = false): bool
    {
        $value = $this->get($key, $default);
        return filter_var($value, FILTER_VALIDATE_BOOLEAN);
    }

    /**
     * Get all settings in a category
     *
     * @param string $category Category name
     * @return array
     */
    public function getByCategory(string $category): array
    {
        $sql = "SELECT setting_key, setting_value, setting_type, description, is_editable
                FROM system_settings
                WHERE category = ?
                ORDER BY setting_key";

        return $this->db->queryAll($sql, [$category]);
    }

    /**
     * Set a setting value
     *
     * @param string $key Setting key
     * @param mixed $value Setting value
     * @return bool Success
     */
    public function set(string $key, $value): bool
    {
        $sql = "UPDATE system_settings
                SET setting_value = ?,
                    updated_at = NOW()
                WHERE setting_key = ?
                AND is_editable = 1";

        $this->db->execute($sql, [$value, $key]);

        // Clear cache
        self::$cache = null;

        return true;
    }

    /**
     * Load all settings into cache
     */
    private function loadSettings(): void
    {
        self::$cache = [];

        $sql = "SELECT setting_key, setting_value FROM system_settings";
        $settings = $this->db->queryAll($sql);

        foreach ($settings as $setting) {
            self::$cache[$setting['setting_key']] = $setting['setting_value'];
        }
    }

    /**
     * Clear settings cache
     */
    public function clearCache(): void
    {
        self::$cache = null;
    }

    /**
     * Get all categories
     *
     * @return array
     */
    public function getCategories(): array
    {
        $sql = "SELECT DISTINCT category FROM system_settings ORDER BY category";
        $result = $this->db->queryAll($sql);
        return array_column($result, 'category');
    }
}
