<?php
/**
 * Client Demographics API - Session-based
 * Returns demographic breakdowns for active clients
 */

// IMPORTANT: Set these BEFORE loading globals.php to prevent redirects
$ignoreAuth = true;
$ignoreAuth_onsite_portal = true;
$ignoreAuth_onsite_portal_two = true;

require_once(__DIR__ . '/../../interface/globals.php');

error_log("Client demographics called - Session ID: " . session_id());

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

// Check if user is authenticated via session
if (!isset($_SESSION['authUserID']) || empty($_SESSION['authUserID'])) {
    error_log("Client demographics: Not authenticated");
    http_response_code(401);
    echo json_encode(['error' => 'Not authenticated']);
    exit;
}

error_log("Client demographics: User authenticated - " . $_SESSION['authUserID']);

try {
    $demographics = [];

    // Get age distribution for active clients
    try {
        $ageSql = "SELECT
                    CASE
                        WHEN TIMESTAMPDIFF(YEAR, DOB, CURDATE()) < 18 THEN 'Under 18'
                        WHEN TIMESTAMPDIFF(YEAR, DOB, CURDATE()) BETWEEN 18 AND 25 THEN '18-25'
                        WHEN TIMESTAMPDIFF(YEAR, DOB, CURDATE()) BETWEEN 26 AND 35 THEN '26-35'
                        WHEN TIMESTAMPDIFF(YEAR, DOB, CURDATE()) BETWEEN 36 AND 50 THEN '36-50'
                        WHEN TIMESTAMPDIFF(YEAR, DOB, CURDATE()) BETWEEN 51 AND 65 THEN '51-65'
                        WHEN TIMESTAMPDIFF(YEAR, DOB, CURDATE()) > 65 THEN '65+'
                        ELSE 'Unknown'
                    END as age_range,
                    COUNT(*) as count
                   FROM patient_data
                   WHERE (care_team_status = 'active' OR care_team_status = 'Active')
                   AND DOB IS NOT NULL
                   GROUP BY age_range
                   ORDER BY age_range";

        $ageStmt = sqlStatement($ageSql);
        $ageData = [];
        while ($row = sqlFetchArray($ageStmt)) {
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
        // OpenEMR stores gender_identity as list option codes, need to join with list_options
        $genderSql = "SELECT
                        COALESCE(lo.title, 'Not Specified') as gender,
                        COUNT(*) as count
                      FROM patient_data pd
                      LEFT JOIN list_options lo ON lo.option_id = pd.gender_identity
                          AND lo.list_id = 'gender_identity'
                      WHERE (pd.care_team_status = 'active' OR pd.care_team_status = 'Active')
                      GROUP BY gender
                      ORDER BY count DESC
                      LIMIT 10";

        $genderStmt = sqlStatement($genderSql);
        $genderData = [];
        while ($row = sqlFetchArray($genderStmt)) {
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
                      COALESCE(lo.title, 'Not Specified') as race,
                      COUNT(*) as count
                    FROM patient_data pd
                    LEFT JOIN list_options lo ON lo.option_id = pd.race
                        AND lo.list_id = 'race'
                    WHERE (pd.care_team_status = 'active' OR pd.care_team_status = 'Active')
                    GROUP BY race
                    ORDER BY count DESC
                    LIMIT 10";

        $raceStmt = sqlStatement($raceSql);
        $raceData = [];
        while ($row = sqlFetchArray($raceStmt)) {
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
                          COALESCE(lo.title, 'Not Specified') as ethnicity,
                          COUNT(*) as count
                        FROM patient_data pd
                        LEFT JOIN list_options lo ON lo.option_id = pd.ethnicity
                            AND lo.list_id = 'ethnicity'
                        WHERE (pd.care_team_status = 'active' OR pd.care_team_status = 'Active')
                        GROUP BY ethnicity
                        ORDER BY count DESC
                        LIMIT 10";

        $ethnicityStmt = sqlStatement($ethnicitySql);
        $ethnicityData = [];
        while ($row = sqlFetchArray($ethnicityStmt)) {
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
