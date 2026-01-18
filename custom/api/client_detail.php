<?php
/**
 * Client Detail API - Session-based (MIGRATED TO MINDLINE)
 * Returns comprehensive client profile including demographics, insurance, appointments, diagnoses, notes
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
    error_log("Client detail: Invalid method - " . $_SERVER['REQUEST_METHOD']);
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

try {
    // Initialize session and check authentication
    $session = SessionManager::getInstance();
    $session->start();

    if (!$session->isAuthenticated()) {
        error_log("Client detail: Not authenticated");
        http_response_code(401);
        echo json_encode(['error' => 'Not authenticated']);
        exit;
    }

    // Initialize database
    $db = Database::getInstance();

    // Get client ID from query parameter
    $clientId = $_GET['id'] ?? null;

    if (!$clientId) {
        error_log("Client detail: No client ID provided");
        http_response_code(400);
        echo json_encode(['error' => 'Client ID is required']);
        exit;
    }

    error_log("Client detail: User authenticated - " . $session->getUserId() . ", fetching client ID: " . $clientId);

    // Fetch patient demographics
    $patientSql = "SELECT
        c.id AS pid,
        c.first_name AS fname,
        c.last_name AS lname,
        c.middle_name AS mname,
        c.date_of_birth AS DOB,
        c.sex,
        c.financial,
        c.phone_cell,
        c.phone_home,
        c.phone_work AS phone_biz,
        c.phone_contact,
        c.email,
        c.email_direct,
        c.street,
        c.street_line_2,
        c.city,
        c.state,
        c.postal_code,
        c.county,
        c.contact_relationship,
        c.status AS care_team_status,
        c.provider_id AS providerID,
        c.referring_provider_id AS ref_providerID,
        CONCAT(u_provider.first_name, ' ', u_provider.last_name) AS provider_name,
        CONCAT(u_referring.first_name, ' ', u_referring.last_name) AS referring_provider_name,
        c.ssn_encrypted AS ss,
        c.marital_status AS status,
        c.sexual_orientation,
        c.gender_identity,
        lo_gender.option_title AS gender_identity_text,
        lo_orientation.option_title AS sexual_orientation_text,
        c.birth_first_name AS birth_fname,
        c.birth_last_name AS birth_lname,
        c.birth_middle_name AS birth_mname,
        c.previous_names AS name_history,
        c.preferred_name,
        c.race,
        c.ethnicity,
        c.language,
        c.interpreter_required,
        c.hipaa_notice_received AS hipaa_notice,
        c.hipaa_allow_sms AS hipaa_allowsms,
        c.hipaa_allow_voice AS hipaa_voice,
        c.hipaa_allow_mail AS hipaa_mail,
        c.hipaa_allow_email AS hipaa_allowemail,
        c.allow_patient_portal,
        c.portal_username AS cmsportal_login,
        c.publicity_code,
        lo_publicity.option_title AS publicity_code_text,
        c.protect_indicator,
        lo_protection.option_title AS protect_indicator_text,
        c.deceased_date,
        c.deceased_reason,
        c.patient_categories AS patient_groups,
        c.payment_type AS userlist1,
        c.emergency_contact_name,
        c.emergency_contact_relationship,
        c.emergency_contact_phone,
        c.created_at,
        c.updated_at
    FROM clients c
    LEFT JOIN users u_provider ON u_provider.id = c.provider_id
    LEFT JOIN users u_referring ON u_referring.id = c.referring_provider_id
    LEFT JOIN settings_lists lo_gender ON lo_gender.list_id = 'gender_identity' AND lo_gender.option_id = c.gender_identity
    LEFT JOIN settings_lists lo_orientation ON lo_orientation.list_id = 'sexual_orientation' AND lo_orientation.option_id = c.sexual_orientation
    LEFT JOIN settings_lists lo_publicity ON lo_publicity.list_id = 'publicity_code' AND lo_publicity.option_id = c.publicity_code
    LEFT JOIN settings_lists lo_protection ON lo_protection.list_id = 'pt_protect_indica' AND lo_protection.option_id = c.protect_indicator
    WHERE c.id = ?";

    $patient = $db->query($patientSql, [$clientId]);

    if (!$patient) {
        error_log("Client detail: Client not found - " . $clientId);
        http_response_code(404);
        echo json_encode(['error' => 'Client not found']);
        exit;
    }

    error_log("Client detail: Found client " . $patient['fname'] . " " . $patient['lname']);

    // Fetch employer data
    $employerSql = "SELECT
        id,
        name,
        street,
        city,
        state,
        postal_code,
        country
    FROM client_employers
    WHERE client_id = ?
    LIMIT 1";

    try {
        $employer = $db->query($employerSql, [$clientId]);
    } catch (Exception $e) {
        error_log("Employer query failed: " . $e->getMessage());
        $employer = null;
    }

    // Fetch insurance data (primary, secondary, tertiary)
    $insuranceSql = "SELECT
        ci.id,
        ci.insurance_type AS type,
        ci.provider_id AS provider,
        ip.name AS provider_name,
        ci.plan_name,
        ci.policy_number,
        ci.group_number,
        ci.subscriber_relationship,
        ci.subscriber_first_name AS subscriber_fname,
        ci.subscriber_middle_name AS subscriber_mname,
        ci.subscriber_last_name AS subscriber_lname,
        ci.subscriber_date_of_birth AS subscriber_DOB,
        ci.subscriber_sex,
        ci.subscriber_street,
        ci.subscriber_city,
        ci.subscriber_state,
        ci.subscriber_postal_code,
        ci.subscriber_phone,
        ci.subscriber_ssn AS subscriber_ss,
        ci.subscriber_employer_name AS subscriber_employer,
        ci.effective_date AS date,
        ci.end_date AS date_end,
        ci.copay_amount AS copay,
        ci.accepts_assignment AS accept_assignment,
        ci.policy_type
    FROM client_insurance ci
    LEFT JOIN insurance_providers ip ON ci.provider_id = ip.id
    WHERE ci.client_id = ?
    ORDER BY FIELD(ci.insurance_type, 'primary', 'secondary', 'tertiary')";

    $insuranceData = $db->queryAll($insuranceSql, [$clientId]);

    // Organize insurance by type
    $insurance = [
        'primary' => null,
        'secondary' => null,
        'tertiary' => null
    ];

    foreach ($insuranceData as $ins) {
        $type = $ins['type'] ?? 'primary';
        if (isset($insurance[$type])) {
            $insurance[$type] = $ins;
        }
    }

    // Fetch upcoming appointments
    $appointmentsSql = "SELECT
        a.id AS pc_eid,
        DATE(a.start_datetime) AS pc_eventDate,
        TIME(a.start_datetime) AS pc_startTime,
        a.duration_minutes,
        a.category_id AS pc_catid,
        ac.name AS pc_catname,
        ac.color AS pc_catcolor,
        a.status AS pc_apptstatus_raw,
        CASE a.status
            WHEN 'pending' THEN '-'
            WHEN 'confirmed' THEN '~'
            WHEN 'arrived' THEN '@'
            WHEN 'checkout' THEN '^'
            WHEN 'no_show' THEN '*'
            WHEN 'cancelled' THEN '?'
            WHEN 'deleted' THEN 'x'
            ELSE '-'
        END AS pc_apptstatus,
        a.title AS pc_title,
        a.comments AS pc_hometext,
        a.provider_id AS pc_aid,
        CONCAT(u.first_name, ' ', u.last_name) AS provider_name
    FROM appointments a
    LEFT JOIN appointment_categories ac ON a.category_id = ac.id
    LEFT JOIN users u ON a.provider_id = u.id
    WHERE a.client_id = ?
    AND a.start_datetime >= NOW()
    AND a.status NOT IN ('deleted', 'cancelled')
    ORDER BY a.start_datetime ASC
    LIMIT 5";

    $upcomingAppointments = $db->queryAll($appointmentsSql, [$clientId]);

    // Fetch recent appointments
    $recentApptsSql = "SELECT
        a.id AS pc_eid,
        DATE(a.start_datetime) AS pc_eventDate,
        TIME(a.start_datetime) AS pc_startTime,
        a.duration_minutes,
        a.category_id AS pc_catid,
        ac.name AS pc_catname,
        ac.color AS pc_catcolor,
        a.status AS pc_apptstatus_raw,
        CASE a.status
            WHEN 'pending' THEN '-'
            WHEN 'confirmed' THEN '~'
            WHEN 'arrived' THEN '@'
            WHEN 'checkout' THEN '^'
            WHEN 'no_show' THEN '*'
            WHEN 'cancelled' THEN '?'
            WHEN 'deleted' THEN 'x'
            ELSE '-'
        END AS pc_apptstatus,
        a.title AS pc_title,
        a.comments AS pc_hometext,
        a.provider_id AS pc_aid,
        CONCAT(u.first_name, ' ', u.last_name) AS provider_name
    FROM appointments a
    LEFT JOIN appointment_categories ac ON a.category_id = ac.id
    LEFT JOIN users u ON a.provider_id = u.id
    WHERE a.client_id = ?
    AND a.start_datetime < NOW()
    ORDER BY a.start_datetime DESC
    LIMIT 5";

    $recentAppointments = $db->queryAll($recentApptsSql, [$clientId]);

    // Fetch active diagnoses
    $diagnosesSql = "SELECT
        d.id,
        d.diagnosis_code AS diagnosis,
        d.diagnosis_description AS title,
        d.start_date AS begdate,
        d.end_date AS enddate,
        d.occurrence,
        d.outcome,
        d.is_active AS activity,
        d.created_at AS date
    FROM diagnoses d
    WHERE d.client_id = ?
    AND (d.is_active = 1 OR d.end_date IS NULL OR d.end_date >= CURDATE())
    ORDER BY d.start_date DESC";

    $diagnoses = $db->queryAll($diagnosesSql, [$clientId]);

    // Check if clinical_notes table exists
    $notesSql = "SELECT COUNT(*) as count
                 FROM information_schema.COLUMNS
                 WHERE TABLE_SCHEMA = DATABASE()
                 AND TABLE_NAME = 'clinical_notes'";

    $notesTableCheck = $db->query($notesSql);
    $hasNotesTable = ($notesTableCheck && $notesTableCheck['count'] > 0);

    // Fetch recent clinical notes if table exists
    $clinicalNotes = [];
    if ($hasNotesTable) {
        try {
            $notesSql = "SELECT
                n.id,
                n.note_type,
                n.note_date,
                n.created_at,
                CONCAT(u.first_name, ' ', u.last_name) AS user_name
            FROM clinical_notes n
            LEFT JOIN users u ON n.created_by = u.id
            WHERE n.client_id = ?
            AND n.is_deleted = 0
            ORDER BY n.note_date DESC, n.created_at DESC
            LIMIT 10";

            $clinicalNotes = $db->queryAll($notesSql, [$clientId]);
        } catch (Exception $e) {
            error_log("Clinical notes query failed: " . $e->getMessage());
            $clinicalNotes = [];
        }
    }

    // Fetch recent encounters (Mindline doesn't use encounters, return empty)
    $encounters = [];

    // Build comprehensive response
    $response = [
        'patient' => $patient,
        'employer' => $employer,
        'insurance' => $insurance,
        'upcoming_appointments' => $upcomingAppointments,
        'recent_appointments' => $recentAppointments,
        'diagnoses' => $diagnoses,
        'clinical_notes' => $clinicalNotes,
        'encounters' => $encounters,
        'summary' => [
            'total_diagnoses' => count($diagnoses),
            'total_upcoming_appointments' => count($upcomingAppointments),
            'total_recent_appointments' => count($recentAppointments),
            'total_clinical_notes' => count($clinicalNotes),
            'has_insurance' => !empty($insurance['primary'])
        ]
    ];

    error_log("Client detail: Successfully built comprehensive response for client " . $clientId);
    http_response_code(200);
    echo json_encode($response);

} catch (Exception $e) {
    error_log("Error fetching client detail: " . $e->getMessage());
    error_log("Stack trace: " . $e->getTraceAsString());
    http_response_code(500);
    echo json_encode([
        'error' => 'Failed to fetch client detail',
        'message' => $e->getMessage()
    ]);
}
