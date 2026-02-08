<?php
/**
 * Client Demographics API - Session-based (MIGRATED TO SanctumEMHR)
 * Returns demographic breakdowns for active clients
 */

require_once(__DIR__ . '/../init.php');

use Custom\Lib\Database\Database;
use Custom\Lib\Session\SessionManager;

// Set JSON header
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

try {
    // Initialize session and check authentication
    $session = SessionManager::getInstance();
    $session->start();

    if (!$session->isAuthenticated()) {
        error_log("Client demographics: Not authenticated");
        http_response_code(401);
        echo json_encode(['error' => 'Not authenticated']);
        exit;
    }

    error_log("Client demographics: User authenticated - " . $session->getUserId());

    // Initialize database
    $db = Database::getInstance();

    $demographics = [];

    // Get age distribution for active clients
    try {
        $ageSql = "SELECT
                    CASE
                        WHEN TIMESTAMPDIFF(YEAR, date_of_birth, CURDATE()) < 18 THEN 'Under 18'
                        WHEN TIMESTAMPDIFF(YEAR, date_of_birth, CURDATE()) BETWEEN 18 AND 25 THEN '18-25'
                        WHEN TIMESTAMPDIFF(YEAR, date_of_birth, CURDATE()) BETWEEN 26 AND 35 THEN '26-35'
                        WHEN TIMESTAMPDIFF(YEAR, date_of_birth, CURDATE()) BETWEEN 36 AND 50 THEN '36-50'
                        WHEN TIMESTAMPDIFF(YEAR, date_of_birth, CURDATE()) BETWEEN 51 AND 65 THEN '51-65'
                        WHEN TIMESTAMPDIFF(YEAR, date_of_birth, CURDATE()) > 65 THEN '65+'
                        ELSE 'Unknown'
                    END as age_range,
                    COUNT(*) as count
                   FROM clients
                   WHERE status = 'active'
                   AND date_of_birth IS NOT NULL
                   GROUP BY age_range
                   ORDER BY age_range";

        $ageData = [];
        $rows = $db->queryAll($ageSql);
        foreach ($rows as $row) {
            $ageData[] = [
                'category' => $row['age_range'],
                'count' => intval($row['count'])
            ];
        }
        $demographics['age'] = $ageData;
        error_log("Age distribution: " . print_r($ageData, true));
    } catch (Exception $e) {
        error_log('Age demographics error: ' . $e->getMessage());
        $demographics['age'] = [];
    }

    // Get gender identity distribution
    try {
        // SanctumEMHR stores gender_identity as list option codes, join with settings_lists
        $genderSql = "SELECT
                        COALESCE(sl.title, 'Not Specified') as gender,
                        COUNT(*) as count
                      FROM clients c
                      LEFT JOIN settings_lists sl ON sl.option_id = c.gender_identity
                          AND sl.list_id = 'gender_identity'
                      WHERE c.status = 'active'
                      GROUP BY gender
                      ORDER BY count DESC
                      LIMIT 10";

        $genderData = [];
        $rows = $db->queryAll($genderSql);
        foreach ($rows as $row) {
            $genderData[] = [
                'category' => $row['gender'] ?: 'Not Specified',
                'count' => intval($row['count'])
            ];
        }
        $demographics['gender'] = $genderData;
        error_log("Gender distribution: " . print_r($genderData, true));
    } catch (Exception $e) {
        error_log('Gender demographics error: ' . $e->getMessage());
        $demographics['gender'] = [];
    }

    // Get race distribution
    try {
        // Race is stored as list option codes too
        $raceSql = "SELECT
                      COALESCE(sl.title, 'Not Specified') as race,
                      COUNT(*) as count
                    FROM clients c
                    LEFT JOIN settings_lists sl ON sl.option_id = c.race
                        AND sl.list_id = 'race'
                    WHERE c.status = 'active'
                    GROUP BY race
                    ORDER BY count DESC
                    LIMIT 10";

        $raceData = [];
        $rows = $db->queryAll($raceSql);
        foreach ($rows as $row) {
            $raceData[] = [
                'category' => $row['race'] ?: 'Not Specified',
                'count' => intval($row['count'])
            ];
        }
        $demographics['race'] = $raceData;
        error_log("Race distribution: " . print_r($raceData, true));
    } catch (Exception $e) {
        error_log('Race demographics error: ' . $e->getMessage());
        $demographics['race'] = [];
    }

    // Get ethnicity distribution
    try {
        // Ethnicity is also stored as list option codes
        $ethnicitySql = "SELECT
                          COALESCE(sl.title, 'Not Specified') as ethnicity,
                          COUNT(*) as count
                        FROM clients c
                        LEFT JOIN settings_lists sl ON sl.option_id = c.ethnicity
                            AND sl.list_id = 'ethnicity'
                        WHERE c.status = 'active'
                        GROUP BY ethnicity
                        ORDER BY count DESC
                        LIMIT 10";

        $ethnicityData = [];
        $rows = $db->queryAll($ethnicitySql);
        foreach ($rows as $row) {
            $ethnicityData[] = [
                'category' => $row['ethnicity'] ?: 'Not Specified',
                'count' => intval($row['count'])
            ];
        }
        $demographics['ethnicity'] = $ethnicityData;
        error_log("Ethnicity distribution: " . print_r($ethnicityData, true));
    } catch (Exception $e) {
        error_log('Ethnicity demographics error: ' . $e->getMessage());
        $demographics['ethnicity'] = [];
    }

    error_log("Final demographics: " . print_r($demographics, true));
    echo json_encode($demographics);

} catch (Exception $e) {
    error_log('Client demographics overall error: ' . $e->getMessage());
    error_log('Stack trace: ' . $e->getTraceAsString());
    http_response_code(500);
    echo json_encode(['error' => 'Failed to fetch demographics', 'message' => $e->getMessage()]);
}
