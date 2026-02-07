<?php
/**
 * SanctumEMHR EMHR
 * Reports API - Provides aggregate reporting data
 *
 * Author: Kenneth J. Nelan
 * License: Proprietary and Confidential
 * Version: ALPHA
 *
 * Copyright © 2026 Sacred Wandering
 * Proprietary and Confidential
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
        http_response_code(401);
        echo json_encode(['error' => 'Not authenticated']);
        exit;
    }

    $db = Database::getInstance();
    $action = $_GET['action'] ?? 'all';

    // Date range parameters (default to last 30 days)
    $startDate = $_GET['start_date'] ?? date('Y-m-d', strtotime('-30 days'));
    $endDate = $_GET['end_date'] ?? date('Y-m-d');

    $response = [];

    // Get appointment statistics
    if ($action === 'all' || $action === 'appointments') {
        $response['appointments'] = getAppointmentStats($db, $startDate, $endDate);
    }

    // Get clinical notes statistics
    if ($action === 'all' || $action === 'notes') {
        $response['notes'] = getNoteStats($db, $startDate, $endDate);
    }

    // Get provider productivity
    if ($action === 'all' || $action === 'productivity') {
        $response['productivity'] = getProviderProductivity($db, $startDate, $endDate);
    }

    // Get client flow statistics
    if ($action === 'all' || $action === 'clientFlow') {
        $response['clientFlow'] = getClientFlowStats($db, $startDate, $endDate);
    }

    $response['dateRange'] = [
        'startDate' => $startDate,
        'endDate' => $endDate
    ];

    http_response_code(200);
    echo json_encode($response);

} catch (Exception $e) {
    error_log("Reports API Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Failed to generate reports', 'message' => $e->getMessage()]);
}

/**
 * Get appointment statistics
 */
function getAppointmentStats($db, $startDate, $endDate) {
    $stats = [
        'byStatus' => [],
        'byCategory' => [],
        'byProvider' => [],
        'totals' => [
            'scheduled' => 0,
            'completed' => 0,
            'noShow' => 0,
            'cancelled' => 0
        ]
    ];

    // Check if openemr_postcalendar_events table exists
    try {
        $tableCheck = $db->query("SHOW TABLES LIKE 'openemr_postcalendar_events'");
        if (empty($tableCheck)) {
            return $stats;
        }
    } catch (Exception $e) {
        return $stats;
    }

    // Appointments by status
    $statusSql = "SELECT
        pc_apptstatus AS status,
        COUNT(*) AS count
    FROM openemr_postcalendar_events
    WHERE pc_eventDate BETWEEN ? AND ?
      AND pc_pid > 0
    GROUP BY pc_apptstatus
    ORDER BY count DESC";

    $statusRows = $db->queryAll($statusSql, [$startDate, $endDate]);

    $statusLabels = [
        '-' => 'Scheduled',
        '@' => 'Arrived',
        '>' => 'Checked Out',
        'x' => 'Cancelled',
        '?' => 'No Show',
        '#' => 'In Progress',
        '<' => 'Pending',
        '%' => 'Completed',
        '^' => 'Confirmed'
    ];

    foreach ($statusRows as $row) {
        $statusCode = $row['status'] ?: '-';
        $label = $statusLabels[$statusCode] ?? $statusCode;
        $stats['byStatus'][] = [
            'status' => $statusCode,
            'label' => $label,
            'count' => (int)$row['count']
        ];

        // Update totals
        if (in_array($statusCode, ['-', '^', '<'])) {
            $stats['totals']['scheduled'] += (int)$row['count'];
        } elseif (in_array($statusCode, ['>', '%'])) {
            $stats['totals']['completed'] += (int)$row['count'];
        } elseif ($statusCode === '?') {
            $stats['totals']['noShow'] += (int)$row['count'];
        } elseif ($statusCode === 'x') {
            $stats['totals']['cancelled'] += (int)$row['count'];
        }
    }

    // Appointments by category/type
    $categorySql = "SELECT
        COALESCE(cat.pc_catname, 'Uncategorized') AS category,
        COUNT(*) AS count
    FROM openemr_postcalendar_events e
    LEFT JOIN openemr_postcalendar_categories cat ON cat.pc_catid = e.pc_catid
    WHERE e.pc_eventDate BETWEEN ? AND ?
      AND e.pc_pid > 0
    GROUP BY cat.pc_catname
    ORDER BY count DESC
    LIMIT 10";

    $categoryRows = $db->queryAll($categorySql, [$startDate, $endDate]);
    foreach ($categoryRows as $row) {
        $stats['byCategory'][] = [
            'category' => $row['category'],
            'count' => (int)$row['count']
        ];
    }

    // Appointments by provider
    $providerSql = "SELECT
        CONCAT(u.first_name, ' ', u.last_name) AS provider,
        u.id AS provider_id,
        COUNT(*) AS count
    FROM openemr_postcalendar_events e
    JOIN users u ON u.id = e.pc_aid
    WHERE e.pc_eventDate BETWEEN ? AND ?
      AND e.pc_pid > 0
    GROUP BY u.id, u.first_name, u.last_name
    ORDER BY count DESC
    LIMIT 10";

    $providerRows = $db->queryAll($providerSql, [$startDate, $endDate]);
    foreach ($providerRows as $row) {
        $stats['byProvider'][] = [
            'provider' => $row['provider'],
            'providerId' => (int)$row['provider_id'],
            'count' => (int)$row['count']
        ];
    }

    return $stats;
}

/**
 * Get clinical notes statistics
 */
function getNoteStats($db, $startDate, $endDate) {
    $stats = [
        'byType' => [],
        'byStatus' => [],
        'byProvider' => [],
        'totals' => [
            'total' => 0,
            'signed' => 0,
            'unsigned' => 0,
            'pendingReview' => 0
        ]
    ];

    // Check if clinical_notes table exists
    try {
        $tableCheck = $db->query("SHOW TABLES LIKE 'clinical_notes'");
        if (empty($tableCheck)) {
            return $stats;
        }
    } catch (Exception $e) {
        return $stats;
    }

    // Notes by type
    $typeSql = "SELECT
        note_type,
        COUNT(*) AS count
    FROM clinical_notes
    WHERE service_date BETWEEN ? AND ?
    GROUP BY note_type
    ORDER BY count DESC";

    $typeRows = $db->queryAll($typeSql, [$startDate, $endDate]);

    $typeLabels = [
        'progress' => 'Progress Note',
        'intake' => 'Intake Assessment',
        'treatment_plan' => 'Treatment Plan',
        'discharge' => 'Discharge Summary',
        'case_management' => 'Case Management',
        'group' => 'Group Note',
        'phone' => 'Phone Contact',
        'crisis' => 'Crisis Note'
    ];

    foreach ($typeRows as $row) {
        $type = $row['note_type'];
        $label = $typeLabels[$type] ?? ucwords(str_replace('_', ' ', $type));
        $stats['byType'][] = [
            'type' => $type,
            'label' => $label,
            'count' => (int)$row['count']
        ];
        $stats['totals']['total'] += (int)$row['count'];
    }

    // Notes by signed status
    $statusSql = "SELECT
        CASE
            WHEN signed_at IS NOT NULL THEN 'signed'
            WHEN supervisor_review_required = 1 AND supervisor_reviewed_at IS NULL THEN 'pending_review'
            ELSE 'unsigned'
        END AS status,
        COUNT(*) AS count
    FROM clinical_notes
    WHERE service_date BETWEEN ? AND ?
    GROUP BY status
    ORDER BY count DESC";

    try {
        $statusRows = $db->queryAll($statusSql, [$startDate, $endDate]);
        foreach ($statusRows as $row) {
            $label = match($row['status']) {
                'signed' => 'Signed',
                'unsigned' => 'Unsigned',
                'pending_review' => 'Pending Review',
                default => $row['status']
            };
            $stats['byStatus'][] = [
                'status' => $row['status'],
                'label' => $label,
                'count' => (int)$row['count']
            ];

            // Update totals
            if ($row['status'] === 'signed') {
                $stats['totals']['signed'] = (int)$row['count'];
            } elseif ($row['status'] === 'unsigned') {
                $stats['totals']['unsigned'] = (int)$row['count'];
            } elseif ($row['status'] === 'pending_review') {
                $stats['totals']['pendingReview'] = (int)$row['count'];
            }
        }
    } catch (Exception $e) {
        // Fallback if supervisor columns don't exist
        $fallbackSql = "SELECT
            IF(signed_at IS NOT NULL, 'signed', 'unsigned') AS status,
            COUNT(*) AS count
        FROM clinical_notes
        WHERE service_date BETWEEN ? AND ?
        GROUP BY status";

        $statusRows = $db->queryAll($fallbackSql, [$startDate, $endDate]);
        foreach ($statusRows as $row) {
            $label = $row['status'] === 'signed' ? 'Signed' : 'Unsigned';
            $stats['byStatus'][] = [
                'status' => $row['status'],
                'label' => $label,
                'count' => (int)$row['count']
            ];

            if ($row['status'] === 'signed') {
                $stats['totals']['signed'] = (int)$row['count'];
            } else {
                $stats['totals']['unsigned'] = (int)$row['count'];
            }
        }
    }

    // Notes by provider
    $providerSql = "SELECT
        CONCAT(u.first_name, ' ', u.last_name) AS provider,
        u.id AS provider_id,
        COUNT(*) AS count
    FROM clinical_notes n
    JOIN users u ON u.id = n.created_by
    WHERE n.service_date BETWEEN ? AND ?
    GROUP BY u.id, u.first_name, u.last_name
    ORDER BY count DESC
    LIMIT 10";

    $providerRows = $db->queryAll($providerSql, [$startDate, $endDate]);
    foreach ($providerRows as $row) {
        $stats['byProvider'][] = [
            'provider' => $row['provider'],
            'providerId' => (int)$row['provider_id'],
            'count' => (int)$row['count']
        ];
    }

    return $stats;
}

/**
 * Get provider productivity statistics
 */
function getProviderProductivity($db, $startDate, $endDate) {
    $stats = [];

    // Get providers with their appointment and note counts
    $sql = "SELECT
        u.id AS provider_id,
        CONCAT(u.first_name, ' ', u.last_name) AS provider,
        u.title,
        (
            SELECT COUNT(*)
            FROM openemr_postcalendar_events e
            WHERE e.pc_aid = u.id
              AND e.pc_eventDate BETWEEN ? AND ?
              AND e.pc_pid > 0
        ) AS appointment_count,
        (
            SELECT COUNT(*)
            FROM openemr_postcalendar_events e
            WHERE e.pc_aid = u.id
              AND e.pc_eventDate BETWEEN ? AND ?
              AND e.pc_pid > 0
              AND e.pc_apptstatus IN ('>', '%')
        ) AS completed_appointments,
        (
            SELECT COUNT(*)
            FROM clinical_notes n
            WHERE n.created_by = u.id
              AND n.service_date BETWEEN ? AND ?
        ) AS notes_count,
        (
            SELECT COUNT(*)
            FROM clinical_notes n
            WHERE n.created_by = u.id
              AND n.service_date BETWEEN ? AND ?
              AND n.signed_at IS NOT NULL
        ) AS signed_notes_count
    FROM users u
    WHERE u.is_active = 1
      AND (u.is_provider = 1 OR u.authorized = 1)
    ORDER BY appointment_count DESC
    LIMIT 20";

    try {
        $rows = $db->queryAll($sql, [
            $startDate, $endDate,  // For appointment_count
            $startDate, $endDate,  // For completed_appointments
            $startDate, $endDate,  // For notes_count
            $startDate, $endDate   // For signed_notes_count
        ]);

        foreach ($rows as $row) {
            // Only include providers who have some activity
            if ($row['appointment_count'] > 0 || $row['notes_count'] > 0) {
                $stats[] = [
                    'providerId' => (int)$row['provider_id'],
                    'provider' => $row['provider'],
                    'title' => $row['title'],
                    'appointments' => (int)$row['appointment_count'],
                    'completedAppointments' => (int)$row['completed_appointments'],
                    'notes' => (int)$row['notes_count'],
                    'signedNotes' => (int)$row['signed_notes_count'],
                    'unsignedNotes' => (int)$row['notes_count'] - (int)$row['signed_notes_count']
                ];
            }
        }
    } catch (Exception $e) {
        error_log("Provider productivity query failed: " . $e->getMessage());
    }

    return $stats;
}

/**
 * Get client flow statistics (new clients, discharged, etc.)
 */
function getClientFlowStats($db, $startDate, $endDate) {
    $stats = [
        'newClients' => 0,
        'activeClients' => 0,
        'dischargedClients' => 0,
        'byMonth' => []
    ];

    // Check if patients table exists
    try {
        $tableCheck = $db->query("SHOW TABLES LIKE 'patients'");
        if (empty($tableCheck)) {
            return $stats;
        }
    } catch (Exception $e) {
        return $stats;
    }

    // New clients in date range
    try {
        $newSql = "SELECT COUNT(*) AS count FROM patients WHERE created_at BETWEEN ? AND ?";
        $result = $db->query($newSql, [$startDate, $endDate . ' 23:59:59']);
        $stats['newClients'] = (int)($result['count'] ?? 0);
    } catch (Exception $e) {
        // Try alternative column name
        try {
            $newSql = "SELECT COUNT(*) AS count FROM patients WHERE DATE(created_at) BETWEEN ? AND ?";
            $result = $db->query($newSql, [$startDate, $endDate]);
            $stats['newClients'] = (int)($result['count'] ?? 0);
        } catch (Exception $e2) {
            // Skip this metric
        }
    }

    // Active clients (any appointment or note in date range)
    try {
        $activeSql = "SELECT COUNT(DISTINCT client_id) AS count
            FROM (
                SELECT pc_pid AS client_id FROM openemr_postcalendar_events
                WHERE pc_eventDate BETWEEN ? AND ? AND pc_pid > 0
                UNION
                SELECT patient_id AS client_id FROM clinical_notes
                WHERE service_date BETWEEN ? AND ?
            ) AS active_clients";
        $result = $db->query($activeSql, [$startDate, $endDate, $startDate, $endDate]);
        $stats['activeClients'] = (int)($result['count'] ?? 0);
    } catch (Exception $e) {
        // Skip this metric
    }

    // New clients by month
    try {
        $monthSql = "SELECT
            DATE_FORMAT(created_at, '%Y-%m') AS month,
            COUNT(*) AS count
        FROM patients
        WHERE created_at BETWEEN ? AND ?
        GROUP BY DATE_FORMAT(created_at, '%Y-%m')
        ORDER BY month";
        $monthRows = $db->queryAll($monthSql, [$startDate, $endDate . ' 23:59:59']);
        foreach ($monthRows as $row) {
            $stats['byMonth'][] = [
                'month' => $row['month'],
                'count' => (int)$row['count']
            ];
        }
    } catch (Exception $e) {
        // Skip this metric
    }

    return $stats;
}
