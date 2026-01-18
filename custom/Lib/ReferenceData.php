<?php

namespace Custom\Lib;

/**
 * Static Reference Data
 *
 * Contains constants for dropdown lists that don't need to be in the database.
 * Use settings_lists table for user-customizable options.
 */
class ReferenceData
{
    /**
     * US States
     */
    const US_STATES = [
        'AL' => 'Alabama',
        'AK' => 'Alaska',
        'AZ' => 'Arizona',
        'AR' => 'Arkansas',
        'CA' => 'California',
        'CO' => 'Colorado',
        'CT' => 'Connecticut',
        'DE' => 'Delaware',
        'DC' => 'District of Columbia',
        'FL' => 'Florida',
        'GA' => 'Georgia',
        'HI' => 'Hawaii',
        'ID' => 'Idaho',
        'IL' => 'Illinois',
        'IN' => 'Indiana',
        'IA' => 'Iowa',
        'KS' => 'Kansas',
        'KY' => 'Kentucky',
        'LA' => 'Louisiana',
        'ME' => 'Maine',
        'MD' => 'Maryland',
        'MA' => 'Massachusetts',
        'MI' => 'Michigan',
        'MN' => 'Minnesota',
        'MS' => 'Mississippi',
        'MO' => 'Missouri',
        'MT' => 'Montana',
        'NE' => 'Nebraska',
        'NV' => 'Nevada',
        'NH' => 'New Hampshire',
        'NJ' => 'New Jersey',
        'NM' => 'New Mexico',
        'NY' => 'New York',
        'NC' => 'North Carolina',
        'ND' => 'North Dakota',
        'OH' => 'Ohio',
        'OK' => 'Oklahoma',
        'OR' => 'Oregon',
        'PA' => 'Pennsylvania',
        'RI' => 'Rhode Island',
        'SC' => 'South Carolina',
        'SD' => 'South Dakota',
        'TN' => 'Tennessee',
        'TX' => 'Texas',
        'UT' => 'Utah',
        'VT' => 'Vermont',
        'VA' => 'Virginia',
        'WA' => 'Washington',
        'WV' => 'West Virginia',
        'WI' => 'Wisconsin',
        'WY' => 'Wyoming'
    ];

    /**
     * Marital Status Options
     */
    const MARITAL_STATUS = [
        'single' => 'Single',
        'married' => 'Married',
        'domestic_partner' => 'Domestic Partner',
        'separated' => 'Separated',
        'divorced' => 'Divorced',
        'widowed' => 'Widowed',
        'other' => 'Other',
        'unknown' => 'Unknown'
    ];

    /**
     * Relationship Types (for emergency contacts, related persons)
     */
    const RELATIONSHIP_TYPES = [
        'spouse' => 'Spouse',
        'partner' => 'Partner',
        'parent' => 'Parent',
        'child' => 'Child',
        'sibling' => 'Sibling',
        'grandparent' => 'Grandparent',
        'grandchild' => 'Grandchild',
        'guardian' => 'Legal Guardian',
        'friend' => 'Friend',
        'other_family' => 'Other Family',
        'emergency_contact' => 'Emergency Contact',
        'other' => 'Other'
    ];

    /**
     * Gender Identity Options (basic - can be expanded in settings_lists)
     */
    const GENDER_IDENTITY = [
        'male' => 'Male',
        'female' => 'Female',
        'transgender_male' => 'Transgender Male',
        'transgender_female' => 'Transgender Female',
        'non_binary' => 'Non-Binary',
        'genderqueer' => 'Genderqueer',
        'gender_fluid' => 'Gender Fluid',
        'two_spirit' => 'Two-Spirit',
        'other' => 'Other',
        'prefer_not_to_say' => 'Prefer Not to Say'
    ];

    /**
     * Sexual Orientation Options
     */
    const SEXUAL_ORIENTATION = [
        'heterosexual' => 'Heterosexual/Straight',
        'homosexual_gay' => 'Homosexual/Gay',
        'homosexual_lesbian' => 'Homosexual/Lesbian',
        'bisexual' => 'Bisexual',
        'pansexual' => 'Pansexual',
        'asexual' => 'Asexual',
        'queer' => 'Queer',
        'questioning' => 'Questioning',
        'other' => 'Other',
        'prefer_not_to_say' => 'Prefer Not to Say'
    ];

    /**
     * Contact Method Preferences
     */
    const CONTACT_METHODS = [
        'phone' => 'Phone',
        'mobile' => 'Mobile/Text',
        'email' => 'Email',
        'mail' => 'Mail'
    ];

    /**
     * Appointment Status
     */
    const APPOINTMENT_STATUS = [
        'scheduled' => 'Scheduled',
        'confirmed' => 'Confirmed',
        'arrived' => 'Arrived',
        'in_session' => 'In Session',
        'completed' => 'Completed',
        'cancelled' => 'Cancelled',
        'no_show' => 'No Show',
        'rescheduled' => 'Rescheduled'
    ];

    /**
     * Billing Status
     */
    const BILLING_STATUS = [
        'unbilled' => 'Unbilled',
        'billed' => 'Billed',
        'paid' => 'Paid',
        'partial_paid' => 'Partially Paid',
        'denied' => 'Denied',
        'written_off' => 'Written Off'
    ];

    /**
     * Payment Methods
     */
    const PAYMENT_METHODS = [
        'cash' => 'Cash',
        'check' => 'Check',
        'credit_card' => 'Credit Card',
        'debit_card' => 'Debit Card',
        'insurance' => 'Insurance',
        'ach' => 'ACH/Bank Transfer',
        'other' => 'Other'
    ];

    /**
     * Insurance Types
     */
    const INSURANCE_TYPES = [
        'commercial' => 'Commercial',
        'medicare' => 'Medicare',
        'medicaid' => 'Medicaid',
        'tricare' => 'Tricare',
        'self_pay' => 'Self Pay',
        'other' => 'Other'
    ];

    /**
     * Primary Language Options
     */
    const LANGUAGES = [
        'english' => 'English',
        'spanish' => 'Spanish',
        'french' => 'French',
        'german' => 'German',
        'chinese' => 'Chinese',
        'arabic' => 'Arabic',
        'russian' => 'Russian',
        'portuguese' => 'Portuguese',
        'japanese' => 'Japanese',
        'korean' => 'Korean',
        'vietnamese' => 'Vietnamese',
        'tagalog' => 'Tagalog',
        'other' => 'Other'
    ];

    /**
     * User Types
     */
    const USER_TYPES = [
        'admin' => 'Administrator',
        'provider' => 'Provider/Clinician',
        'staff' => 'Staff',
        'billing' => 'Billing Specialist'
    ];

    /**
     * Client Status
     */
    const CLIENT_STATUS = [
        'active' => 'Active',
        'inactive' => 'Inactive',
        'discharged' => 'Discharged',
        'deceased' => 'Deceased'
    ];

    /**
     * Helper: Get options for a given constant
     *
     * @param string $constantName Name of the constant (e.g., 'US_STATES')
     * @return array
     */
    public static function getOptions(string $constantName): array
    {
        $reflection = new \ReflectionClass(self::class);
        $constants = $reflection->getConstants();

        return $constants[$constantName] ?? [];
    }

    /**
     * Helper: Get single option label
     *
     * @param string $constantName Name of the constant
     * @param string $key Option key
     * @return string|null
     */
    public static function getLabel(string $constantName, string $key): ?string
    {
        $options = self::getOptions($constantName);
        return $options[$key] ?? null;
    }

    /**
     * Helper: Get all reference data as JSON (for API endpoints)
     *
     * @return array
     */
    public static function getAllAsArray(): array
    {
        return [
            'us_states' => self::US_STATES,
            'marital_status' => self::MARITAL_STATUS,
            'relationship_types' => self::RELATIONSHIP_TYPES,
            'gender_identity' => self::GENDER_IDENTITY,
            'sexual_orientation' => self::SEXUAL_ORIENTATION,
            'contact_methods' => self::CONTACT_METHODS,
            'appointment_status' => self::APPOINTMENT_STATUS,
            'billing_status' => self::BILLING_STATUS,
            'payment_methods' => self::PAYMENT_METHODS,
            'insurance_types' => self::INSURANCE_TYPES,
            'languages' => self::LANGUAGES,
            'user_types' => self::USER_TYPES,
            'client_status' => self::CLIENT_STATUS
        ];
    }
}
