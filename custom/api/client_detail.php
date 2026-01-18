<?php
/**
 * Mindline EMHR - Client Detail API
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

    // Fetch patient demographics - mapped to Mindline schema
    $patientSql = "SELECT
        c.id AS pid,
        c.first_name AS fname,
        c.last_name AS lname,
        c.middle_name AS mname,
        c.date_of_birth AS DOB,
        c.sex,
        NULL AS financial,
        c.phone_mobile AS phone_cell,
        c.phone_home,
        c.phone_work AS phone_biz,
        c.preferred_contact_method AS phone_contact,
        c.email,
        NULL AS email_direct,
        c.address_line1 AS street,
        c.address_line2 AS street_line_2,
        c.city,
        c.state,
        c.zip AS postal_code,
        c.county,
        c.emergency_contact_relation AS contact_relationship,
        c.status AS care_team_status,
        c.primary_provider_id AS providerID,
        NULL AS ref_providerID,
        CONCAT(u_provider.first_name, ' ', u_provider.last_name) AS provider_name,
        NULL AS referring_provider_name,
        c.ssn_encrypted AS ss,
        NULL AS status,
        c.sexual_orientation,
        c.gender_identity,
        lo_gender.title AS gender_identity_text,
        lo_orientation.title AS sexual_orientation_text,
        NULL AS birth_fname,
        NULL AS birth_lname,
        NULL AS birth_mname,
        NULL AS name_history,
        c.preferred_name,
        c.race,
        c.ethnicity,
        c.primary_language AS language,
        c.needs_interpreter AS interpreter_required,
        NULL AS hipaa_notice,
        NULL AS hipaa_allowsms,
        NULL AS hipaa_voice,
        NULL AS hipaa_mail,
        NULL AS hipaa_allowemail,
        c.portal_access AS allow_patient_portal,
        c.portal_username AS cmsportal_login,
        NULL AS publicity_code,
        NULL AS publicity_code_text,
        NULL AS protect_indicator,
        NULL AS protect_indicator_text,
        NULL AS deceased_date,
        NULL AS deceased_reason,
        NULL AS patient_groups,
        NULL AS userlist1,
        c.emergency_contact_name,
        c.emergency_contact_relation AS emergency_contact_relationship,
        c.emergency_contact_phone,
        c.intake_date,
        c.discharge_date,
        c.created_at,
        c.updated_at,
        c.facility_id,
        f.name AS facility_name,
        YEAR(CURDATE()) - YEAR(c.date_of_birth) - (DATE_FORMAT(CURDATE(), '%m%d') < DATE_FORMAT(c.date_of_birth, '%m%d')) AS age
    FROM clients c
    LEFT JOIN users u_provider ON u_provider.id = c.primary_provider_id
    LEFT JOIN facilities f ON f.id = c.facility_id
    LEFT JOIN settings_lists lo_gender ON lo_gender.list_id = 'gender_identity' AND lo_gender.option_id = c.gender_identity
    LEFT JOIN settings_lists lo_orientation ON lo_orientation.list_id = 'sexual_orientation' AND lo_orientation.option_id = c.sexual_orientation
    WHERE c.id = ?";

    $patient = $db->query($patientSql, [$clientId]);

    if (!$patient) {
        error_log("Client detail: Client not found - " . $clientId);
        http_response_code(404);
        echo json_encode(['error' => 'Client not found']);
        exit;
    }

    error_log("Client detail: Found client " . $patient['fname'] . " " . $patient['lname']);

    // Fetch employer data - mapped to Mindline schema
    $employerSql = "SELECT
        id,
        employer_name AS name,
        occupation,
        phone,
        address,
        NULL AS street,
        NULL AS city,
        NULL AS state,
        NULL AS postal_code,
        NULL AS country,
        start_date,
        end_date,
        is_current
    FROM client_employers
    WHERE client_id = ?
    AND is_current = 1
    LIMIT 1";

    try {
        $employer = $db->query($employerSql, [$clientId]);
    } catch (Exception $e) {
        error_log("Employer query failed: " . $e->getMessage());
        $employer = null;
    }

    // Fetch insurance data (primary, secondary, tertiary) - mapped to Mindline schema
    $insuranceSql = "SELECT
        ci.id,
        ci.priority AS type,
        ci.insurance_provider_id AS provider,
        ip.name AS provider_name,
        NULL AS plan_name,
        ci.policy_number,
        ci.group_number,
        ci.subscriber_relationship,
        ci.subscriber_name AS subscriber_fname,
        NULL AS subscriber_mname,
        NULL AS subscriber_lname,
        ci.subscriber_dob AS subscriber_DOB,
        ci.subscriber_sex,
        NULL AS subscriber_street,
        NULL AS subscriber_city,
        NULL AS subscriber_state,
        NULL AS subscriber_postal_code,
        NULL AS subscriber_phone,
        ci.subscriber_ssn_encrypted AS subscriber_ss,
        NULL AS subscriber_employer,
        ci.effective_date AS date,
        ci.expiration_date AS date_end,
        ci.copay_amount AS copay,
        NULL AS accept_assignment,
        NULL AS policy_type,
        ci.is_active
    FROM client_insurance ci
    LEFT JOIN insurance_providers ip ON ci.insurance_provider_id = ip.id
    WHERE ci.client_id = ?
    AND ci.is_active = 1
    ORDER BY FIELD(ci.priority, 'primary', 'secondary', 'tertiary')";

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

    // Fetch upcoming appointments - mapped to Mindline schema
    $appointmentsSql = "SELECT
        a.id AS pc_eid,
        DATE(a.start_datetime) AS pc_eventDate,
        TIME(a.start_datetime) AS pc_startTime,
        a.duration AS duration_minutes,
        a.category_id AS pc_catid,
        ac.name AS pc_catname,
        ac.color AS pc_catcolor,
        a.status AS pc_apptstatus_raw,
        CASE a.status
            WHEN 'scheduled' THEN '-'
            WHEN 'confirmed' THEN '~'
            WHEN 'arrived' THEN '@'
            WHEN 'in_session' THEN '@'
            WHEN 'completed' THEN '^'
            WHEN 'no_show' THEN '*'
            WHEN 'cancelled' THEN '?'
            ELSE '-'
        END AS pc_apptstatus,
        a.title AS pc_title,
        a.notes AS pc_hometext,
        a.provider_id AS pc_aid,
        CONCAT(u.first_name, ' ', u.last_name) AS provider_name
    FROM appointments a
    LEFT JOIN appointment_categories ac ON a.category_id = ac.id
    LEFT JOIN users u ON a.provider_id = u.id
    WHERE a.client_id = ?
    AND a.start_datetime >= NOW()
    AND a.status NOT IN ('cancelled')
    ORDER BY a.start_datetime ASC
    LIMIT 5";

    $upcomingAppointments = $db->queryAll($appointmentsSql, [$clientId]);

    // Fetch recent appointments - mapped to Mindline schema
    $recentApptsSql = "SELECT
        a.id AS pc_eid,
        DATE(a.start_datetime) AS pc_eventDate,
        TIME(a.start_datetime) AS pc_startTime,
        a.duration AS duration_minutes,
        a.category_id AS pc_catid,
        ac.name AS pc_catname,
        ac.color AS pc_catcolor,
        a.status AS pc_apptstatus_raw,
        CASE a.status
            WHEN 'scheduled' THEN '-'
            WHEN 'confirmed' THEN '~'
            WHEN 'arrived' THEN '@'
            WHEN 'in_session' THEN '@'
            WHEN 'completed' THEN '^'
            WHEN 'no_show' THEN '*'
            WHEN 'cancelled' THEN '?'
            ELSE '-'
        END AS pc_apptstatus,
        a.title AS pc_title,
        a.notes AS pc_hometext,
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

    // Fetch active diagnoses - mapped to Mindline schema
    $diagnosesSql = "SELECT
        d.id,
        d.code AS diagnosis,
        d.code_type,
        d.description AS title,
        d.diagnosis_date AS begdate,
        d.resolution_date AS enddate,
        NULL AS occurrence,
        NULL AS outcome,
        d.is_primary,
        d.is_active AS activity,
        d.diagnosed_by,
        d.created_at AS date,
        CONCAT(u.first_name, ' ', u.last_name) AS diagnosed_by_name
    FROM diagnoses d
    LEFT JOIN users u ON d.diagnosed_by = u.id
    WHERE d.client_id = ?
    AND (d.is_active = 1 OR d.resolution_date IS NULL OR d.resolution_date >= CURDATE())
    ORDER BY d.diagnosis_date DESC";

    $diagnoses = $db->queryAll($diagnosesSql, [$clientId]);

    // Check if clinical_notes table exists
    $notesSql = "SELECT COUNT(*) as count
                 FROM information_schema.COLUMNS
                 WHERE TABLE_SCHEMA = DATABASE()
                 AND TABLE_NAME = 'clinical_notes'";

    $notesTableCheck = $db->query($notesSql);
    $hasNotesTable = ($notesTableCheck && $notesTableCheck['count'] > 0);

    // Fetch recent clinical notes if table exists - mapped to Mindline schema
    $clinicalNotes = [];
    if ($hasNotesTable) {
        try {
            $notesSql = "SELECT
                n.id,
                n.encounter_id,
                n.note_type,
                n.status,
                n.created_at,
                n.signed_at,
                CONCAT(u.first_name, ' ', u.last_name) AS user_name,
                CONCAT(u_signed.first_name, ' ', u_signed.last_name) AS signed_by_name
            FROM clinical_notes n
            LEFT JOIN users u ON n.provider_id = u.id
            LEFT JOIN users u_signed ON n.signed_by = u_signed.id
            WHERE n.client_id = ?
            ORDER BY n.created_at DESC
            LIMIT 10";

            $clinicalNotes = $db->queryAll($notesSql, [$clientId]);
        } catch (Exception $e) {
            error_log("Clinical notes query failed: " . $e->getMessage());
            $clinicalNotes = [];
        }
    }

    // Fetch recent encounters - mapped to Mindline schema
    try {
        $encountersSql = "SELECT
            e.id,
            e.encounter_date,
            e.encounter_datetime,
            e.encounter_type,
            e.chief_complaint,
            e.status,
            e.signed_at,
            CONCAT(u.first_name, ' ', u.last_name) AS provider_name,
            CONCAT(u_signed.first_name, ' ', u_signed.last_name) AS signed_by_name,
            f.name AS facility_name
        FROM encounters e
        LEFT JOIN users u ON e.provider_id = u.id
        LEFT JOIN users u_signed ON e.signed_by = u_signed.id
        LEFT JOIN facilities f ON e.facility_id = f.id
        WHERE e.client_id = ?
        ORDER BY e.encounter_datetime DESC
        LIMIT 10";

        $encounters = $db->queryAll($encountersSql, [$clientId]);
    } catch (Exception $e) {
        error_log("Encounters query failed: " . $e->getMessage());
        $encounters = [];
    }

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
            'total_encounters' => count($encounters),
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
