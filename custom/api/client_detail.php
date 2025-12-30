<?php
/**
 * Client Detail API - Session-based
 * Returns comprehensive client/patient details
 */

// Start output buffering to prevent any PHP warnings/notices from breaking JSON
ob_start();

// IMPORTANT: Set these BEFORE loading globals.php to prevent redirects
$ignoreAuth = true;
$ignoreAuth_onsite_portal = true;
$ignoreAuth_onsite_portal_two = true;

require_once(__DIR__ . '/../../interface/globals.php');

// Clear any output that globals.php might have generated
ob_end_clean();

// Enable error logging
error_log("Client detail API called - Session ID: " . session_id());

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

// Check if user is authenticated via session
if (!isset($_SESSION['authUserID']) || empty($_SESSION['authUserID'])) {
    error_log("Client detail: Not authenticated - authUserID not set");
    http_response_code(401);
    echo json_encode(['error' => 'Not authenticated']);
    exit;
}

// Get client ID from query parameter
$clientId = $_GET['id'] ?? null;

if (!$clientId) {
    error_log("Client detail: No client ID provided");
    http_response_code(400);
    echo json_encode(['error' => 'Client ID is required']);
    exit;
}

error_log("Client detail: User authenticated - " . $_SESSION['authUserID'] . ", fetching client ID: " . $clientId);

try {
    // Fetch patient demographics - join users for provider names and list_options for coded values
    $patientSql = "SELECT
        pd.pid,
        pd.fname,
        pd.lname,
        pd.mname,
        pd.DOB,
        pd.sex,
        pd.financial,
        pd.phone_cell,
        pd.phone_home,
        pd.phone_biz,
        pd.phone_contact,
        pd.email,
        pd.email_direct,
        pd.street,
        pd.street_line_2,
        pd.city,
        pd.state,
        pd.postal_code,
        pd.county,
        pd.contact_relationship,
        pd.care_team_status,
        pd.providerID,
        pd.ref_providerID,
        CONCAT(u_provider.fname, ' ', u_provider.lname) AS provider_name,
        CONCAT(u_referring.fname, ' ', u_referring.lname) AS referring_provider_name,
        pd.ss,
        pd.status,
        pd.sexual_orientation,
        pd.gender_identity,
        lo_gender.title AS gender_identity_text,
        lo_orientation.title AS sexual_orientation_text,
        pd.birth_fname,
        pd.birth_lname,
        pd.birth_mname,
        pd.name_history,
        pd.preferred_name,
        pd.regdate,
        pd.hipaa_mail,
        pd.hipaa_voice,
        pd.hipaa_notice,
        pd.hipaa_message,
        pd.hipaa_allowsms,
        pd.hipaa_allowemail,
        pd.allow_patient_portal,
        pd.cmsportal_login,
        pd.publicity_code,
        pd.publ_code_eff_date,
        lo_publicity.title AS publicity_code_text,
        pd.protect_indicator,
        pd.prot_indi_effdate,
        lo_protection.title AS protection_indicator_text,
        pd.patient_groups,
        pd.language,
        pd.ethnicity,
        pd.race,
        pd.nationality_country,
        pd.referral_source,
        pd.religion,
        pd.tribal_affiliations,
        pd.guardiansname,
        pd.guardianrelationship,
        pd.guardianaddress,
        pd.guardiancity,
        pd.guardianstate,
        pd.guardianpostalcode,
        pd.guardianphone,
        pd.guardianemail,
        pd.homeless,
        pd.financial_review,
        pd.family_size,
        pd.monthly_income,
        pd.userlist1,
        YEAR(CURDATE()) - YEAR(pd.DOB) - (DATE_FORMAT(CURDATE(), '%m%d') < DATE_FORMAT(pd.DOB, '%m%d')) AS age
    FROM patient_data pd
    LEFT JOIN users u_provider ON u_provider.id = pd.providerID
    LEFT JOIN users u_referring ON u_referring.id = pd.ref_providerID
    LEFT JOIN list_options lo_gender ON lo_gender.list_id = 'gender_identity' AND lo_gender.option_id = pd.gender_identity
    LEFT JOIN list_options lo_orientation ON lo_orientation.list_id = 'sexual_orientation' AND lo_orientation.option_id = pd.sexual_orientation
    LEFT JOIN list_options lo_publicity ON lo_publicity.list_id = 'publicity_code' AND lo_publicity.option_id = pd.publicity_code
    LEFT JOIN list_options lo_protection ON lo_protection.list_id = 'pt_protect_indica' AND lo_protection.option_id = pd.protect_indicator
    WHERE pd.pid = ?";

    error_log("Patient SQL: " . $patientSql);
    $patientResult = sqlStatement($patientSql, [$clientId]);
    $patient = sqlFetchArray($patientResult);

    if (!$patient) {
        error_log("Client detail: Client not found - " . $clientId);
        http_response_code(404);
        echo json_encode(['error' => 'Client not found']);
        exit;
    }

    error_log("Client detail: Found patient - " . $patient['fname'] . " " . $patient['lname']);

    // Fetch employer data
    $employerSql = "SELECT
        id,
        name,
        street,
        street_line_2,
        city,
        state,
        postal_code,
        country,
        start_date,
        end_date,
        occupation,
        industry
    FROM employer_data
    WHERE pid = ?
    ORDER BY start_date DESC
    LIMIT 1";

    error_log("Employer SQL: " . $employerSql);
    $employerResult = sqlStatement($employerSql, [$clientId]);
    $employer = sqlFetchArray($employerResult);
    error_log("Found employer: " . ($employer ? $employer['name'] : 'none'));

    // Fetch insurance data (primary, secondary, tertiary)
    $insurances = [];
    try {
        $insuranceSql = "SELECT
            id.id,
            id.type,
            id.provider,
            id.plan_name,
            id.policy_number,
            id.group_number,
            id.subscriber_fname,
            id.subscriber_mname,
            id.subscriber_lname,
            id.subscriber_relationship,
            id.subscriber_ss,
            id.subscriber_DOB,
            id.subscriber_sex,
            id.subscriber_street,
            id.subscriber_city,
            id.subscriber_state,
            id.subscriber_postal_code,
            id.subscriber_country,
            id.subscriber_phone,
            id.subscriber_employer,
            id.subscriber_employer_street,
            id.subscriber_employer_city,
            id.subscriber_employer_state,
            id.subscriber_employer_postal_code,
            id.subscriber_employer_country,
            id.copay,
            id.date AS effective_date,
            id.date_end AS effective_date_end,
            id.accept_assignment,
            id.policy_type,
            ic.name AS insurance_company_name,
            ic.attn,
            ic.cms_id,
            ic.ins_type_code,
            ic.x12_receiver_id,
            ic.x12_default_partner_id
        FROM insurance_data id
        LEFT JOIN insurance_companies ic ON id.provider = ic.id
        WHERE id.pid = ?
        ORDER BY id.type ASC, id.date DESC";

        error_log("Insurance SQL: " . $insuranceSql);
        $insuranceResult = sqlStatement($insuranceSql, [$clientId]);

        // Separate active and historical insurance records
        $activeInsurances = [];
        $historicalInsurances = [];
        $seenTypes = []; // Track which types we've seen for active insurance

        while ($row = sqlFetchArray($insuranceResult)) {
            $type = $row['type'];
            $endDate = $row['date_end'];

            // Check if insurance is active (no end date OR end date is in the future)
            $isActive = empty($endDate) || strtotime($endDate) >= strtotime('today');

            // For active insurance, only keep the most recent one of each type
            if ($isActive && !isset($seenTypes[$type])) {
                $activeInsurances[] = $row;
                $seenTypes[$type] = true;
            } else {
                // Everything else goes to historical
                $historicalInsurances[] = $row;
            }
        }

        $insurances = $activeInsurances;
        error_log("Found " . count($activeInsurances) . " active insurance records, " . count($historicalInsurances) . " historical records");
    } catch (Exception $e) {
        error_log("Insurance query failed: " . $e->getMessage());
        error_log("Insurance query error - continuing without insurance data");
    }

    // Fetch upcoming appointments
    // NOTE: pc_catname requires JOIN with openemr_postcalendar_categories table
    $upcomingSql = "SELECT
        e.pc_eid,
        e.pc_eventDate,
        e.pc_startTime,
        e.pc_endTime,
        c.pc_catname,
        e.pc_apptstatus
    FROM openemr_postcalendar_events e
    LEFT JOIN openemr_postcalendar_categories c ON e.pc_catid = c.pc_catid
    WHERE e.pc_pid = ? AND e.pc_eventDate >= CURDATE()
    ORDER BY e.pc_eventDate, e.pc_startTime
    LIMIT 10";

    error_log("Upcoming appointments SQL: " . $upcomingSql);
    $upcomingResult = sqlStatement($upcomingSql, [$clientId]);
    $upcomingAppointments = [];
    while ($row = sqlFetchArray($upcomingResult)) {
        $upcomingAppointments[] = $row;
    }
    error_log("Found " . count($upcomingAppointments) . " upcoming appointments");

    // Fetch recent appointments
    $recentSql = "SELECT
        e.pc_eid,
        e.pc_eventDate,
        e.pc_startTime,
        e.pc_endTime,
        c.pc_catname,
        e.pc_apptstatus
    FROM openemr_postcalendar_events e
    LEFT JOIN openemr_postcalendar_categories c ON e.pc_catid = c.pc_catid
    WHERE e.pc_pid = ? AND e.pc_eventDate < CURDATE()
    ORDER BY e.pc_eventDate DESC, e.pc_startTime DESC
    LIMIT 5";

    error_log("Recent appointments SQL: " . $recentSql);
    $recentResult = sqlStatement($recentSql, [$clientId]);
    $recentAppointments = [];
    while ($row = sqlFetchArray($recentResult)) {
        $recentAppointments[] = $row;
    }
    error_log("Found " . count($recentAppointments) . " recent appointments");

    // Fetch active problems/diagnoses
    $problemsSql = "SELECT
        id,
        diagnosis,
        title,
        begdate,
        enddate,
        outcome
    FROM lists
    WHERE pid = ? AND type = 'medical_problem' AND activity = 1
    ORDER BY begdate DESC
    LIMIT 20";

    error_log("Problems SQL: " . $problemsSql);
    $problemsResult = sqlStatement($problemsSql, [$clientId]);
    $problems = [];
    while ($row = sqlFetchArray($problemsResult)) {
        $problems[] = $row;
    }
    error_log("Found " . count($problems) . " active problems");

    // Fetch active medications
    // NOTE: 'interval' is a reserved keyword - must escape with backticks
    $medicationsSql = "SELECT
        id,
        drug,
        dosage,
        `interval`,
        refills,
        date_added,
        date_modified
    FROM prescriptions
    WHERE patient_id = ? AND active = 1
    ORDER BY date_added DESC
    LIMIT 20";

    error_log("Medications SQL: " . $medicationsSql);
    $medicationsResult = sqlStatement($medicationsSql, [$clientId]);
    $medications = [];
    while ($row = sqlFetchArray($medicationsResult)) {
        $medications[] = $row;
    }
    error_log("Found " . count($medications) . " active medications");

    // Fetch all encounters with provider and facility information
    $encountersSql = "SELECT
        fe.encounter,
        fe.date,
        fe.reason,
        fe.provider_id,
        fe.facility_id,
        fe.encounter_type_code,
        fe.encounter_type_description,
        CONCAT(u.fname, ' ', u.lname) AS provider_name,
        f.name AS facility_name
    FROM form_encounter fe
    LEFT JOIN users u ON u.id = fe.provider_id
    LEFT JOIN facility f ON f.id = fe.facility_id
    WHERE fe.pid = ?
    ORDER BY fe.date DESC";

    error_log("Encounters SQL: " . $encountersSql);
    $encountersResult = sqlStatement($encountersSql, [$clientId]);
    $encounters = [];
    while ($row = sqlFetchArray($encountersResult)) {
        $encounters[] = $row;
    }
    error_log("Found " . count($encounters) . " encounters");

    // Build response - map all demographic fields
    $response = [
        'patient' => [
            'pid' => $patient['pid'],
            'fname' => $patient['fname'],
            'lname' => $patient['lname'],
            'mname' => $patient['mname'],
            'DOB' => $patient['DOB'],
            'age' => $patient['age'],
            'sex' => $patient['sex'],
            'birth_sex' => $patient['sex'],
            'financial' => $patient['financial'],
            'gender_identity' => $patient['gender_identity_text'] ?? $patient['gender_identity'],
            'gender_identity_code' => $patient['gender_identity'],
            'sexual_orientation' => $patient['sexual_orientation_text'] ?? $patient['sexual_orientation'],
            'sexual_orientation_code' => $patient['sexual_orientation'],
            'phone_cell' => $patient['phone_cell'],
            'phone_home' => $patient['phone_home'],
            'phone_biz' => $patient['phone_biz'],
            'phone_contact' => $patient['phone_contact'],
            'email' => $patient['email'],
            'email_direct' => $patient['email_direct'],
            'street' => $patient['street'],
            'street_line_2' => $patient['street_line_2'],
            'city' => $patient['city'],
            'state' => $patient['state'],
            'postal_code' => $patient['postal_code'],
            'county' => $patient['county'],
            'contact_relationship' => $patient['contact_relationship'],
            'care_team_status' => $patient['care_team_status'],
            'ss' => $patient['ss'],
            'marital_status' => $patient['status'],
            'birth_name' => trim(($patient['birth_fname'] ?? '') . ' ' . ($patient['birth_mname'] ?? '') . ' ' . ($patient['birth_lname'] ?? '')),
            'preferred_name' => $patient['preferred_name'],
            'previous_names' => $patient['name_history'],
            'user_defined' => null,
            'provider' => $patient['provider_name'] ?? 'Not assigned',
            'provider_id' => $patient['providerID'],
            'referring_provider' => $patient['referring_provider_name'] ?? 'Not assigned',
            'referring_provider_id' => $patient['ref_providerID'],
            'hipaa_notice' => $patient['hipaa_notice'],
            'hipaa_message' => $patient['hipaa_message'],
            'hipaa_allowsms' => $patient['hipaa_allowsms'],
            'hipaa_voice' => $patient['hipaa_voice'],
            'hipaa_mail' => $patient['hipaa_mail'],
            'hipaa_email' => $patient['hipaa_allowemail'],
            'allow_patient_portal' => $patient['allow_patient_portal'],
            'cmsportal_login' => $patient['cmsportal_login'],
            'publicity_code' => $patient['publicity_code_text'] ?? $patient['publicity_code'],
            'publicity_code_date' => $patient['publ_code_eff_date'],
            'protection_indicator' => $patient['protection_indicator_text'] ?? $patient['protect_indicator'],
            'protection_indicator_code' => $patient['protect_indicator'],
            'protection_indicator_date' => $patient['prot_indi_effdate'],
            'patient_categories' => $patient['patient_groups'],
            'client_since' => $patient['regdate'],
            'language' => $patient['language'],
            'ethnicity' => $patient['ethnicity'],
            'race' => $patient['race'],
            'nationality' => $patient['nationality_country'],
            'referral_source' => $patient['referral_source'],
            'religion' => $patient['religion'],
            'tribal_affiliations' => $patient['tribal_affiliations'],
            'guardian_name' => $patient['guardiansname'],
            'guardian_relationship' => $patient['guardianrelationship'],
            'guardian_address' => $patient['guardianaddress'],
            'guardian_city' => $patient['guardiancity'],
            'guardian_state' => $patient['guardianstate'],
            'guardian_postal_code' => $patient['guardianpostalcode'],
            'guardian_phone' => $patient['guardianphone'],
            'guardian_email' => $patient['guardianemail'],
            'homeless_status' => $patient['homeless'],
            'financial_review_date' => $patient['financial_review'],
            'family_size' => $patient['family_size'],
            'monthly_income' => $patient['monthly_income'],
            'payment_type' => $patient['userlist1'],
            'employer' => $employer['name'] ?? '',
            'employer_street' => $employer['street'] ?? '',
            'employer_street_line_2' => $employer['street_line_2'] ?? '',
            'employer_city' => $employer['city'] ?? '',
            'employer_state' => $employer['state'] ?? '',
            'employer_postal_code' => $employer['postal_code'] ?? '',
            'employer_country' => $employer['country'] ?? '',
            'employer_start_date' => $employer['start_date'] ?? '',
            'employer_end_date' => $employer['end_date'] ?? '',
            'employer_occupation' => $employer['occupation'] ?? '',
            'employer_industry' => $employer['industry'] ?? ''
        ],
        'insurances' => $insurances,
        'historical_insurances' => $historicalInsurances ?? [],
        'upcomingAppointments' => $upcomingAppointments,
        'recentAppointments' => $recentAppointments,
        'problems' => $problems,
        'medications' => $medications,
        'encounters' => $encounters
    ];

    error_log("Client detail: Successfully built response for client " . $clientId);
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
