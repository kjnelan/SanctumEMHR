import React, { useState, useEffect, useMemo } from 'react';
import { updateInsurance, getInsuranceCompanies, getListOptions } from '../../utils/api';

function InsuranceTab({ data, onDataUpdate }) {
  const [showSecondary, setShowSecondary] = useState(false);
  const [showTertiary, setShowTertiary] = useState(false);
  const [showInsuranceWhenSelfPay, setShowInsuranceWhenSelfPay] = useState(false);

  // Edit states for each insurance type
  const [editingPrimary, setEditingPrimary] = useState(false);
  const [editingSecondary, setEditingSecondary] = useState(false);
  const [editingTertiary, setEditingTertiary] = useState(false);

  // Form data for each insurance type
  const [primaryFormData, setPrimaryFormData] = useState({});
  const [secondaryFormData, setSecondaryFormData] = useState({});
  const [tertiaryFormData, setTertiaryFormData] = useState({});

  // UI states
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  // Dropdown options
  const [insuranceCompanies, setInsuranceCompanies] = useState([]);
  const [dropdownOptions, setDropdownOptions] = useState({});

  // Load dropdown options on component mount
  useEffect(() => {
    const loadOptions = async () => {
      try {
        // Load insurance companies
        const companiesResponse = await getInsuranceCompanies();
        const companies = companiesResponse?.companies || [];
        setInsuranceCompanies(companies.map(company => ({
          value: company.id,
          label: company.name
        })));

        // Load other dropdown options
        const [relationshipOptions, sexOptions, stateOptions, yesNoOptions] = await Promise.all([
          getListOptions('sub_relation'),
          getListOptions('sex'),
          getListOptions('state'),
          getListOptions('yesno')
        ]);

        setDropdownOptions({
          relationship: relationshipOptions.options || [],
          sex: sexOptions.options || [],
          state: stateOptions.options || [],
          accept_assignment: yesNoOptions.options || []
        });
      } catch (err) {
        console.error('Failed to load dropdown options:', err);
      }
    };

    loadOptions();
  }, []);

  if (!data) {
    return (
      <div className="text-gray-700 text-center py-8">
        Loading insurance data...
      </div>
    );
  }

  const { patient, insurances } = data;

  // Determine if client is self-pay based on payment_type field
  // Both 'client' and 'patient' mean self-pay (patient-responsibility)
  const isSelfPay = patient.payment_type === 'client' || patient.payment_type === 'patient';

  // Get insurance by type with placeholders - memoized to prevent re-render loops
  const { primaryInsurance, secondaryInsurance, tertiaryInsurance } = useMemo(() => {
    // Helper to create placeholder insurance object
    const createPlaceholder = (type) => ({
      id: null,
      type: type,
      provider: '',
      plan_name: '',
      effective_date: '',
      effective_date_end: '',
      policy_number: '',
      group_number: '',
      subscriber_relationship: '',
      subscriber_fname: '',
      subscriber_mname: '',
      subscriber_lname: '',
      subscriber_DOB: '',
      subscriber_sex: '',
      subscriber_ss: '',
      subscriber_street: '',
      subscriber_street_line_2: '',
      subscriber_city: '',
      subscriber_state: '',
      subscriber_postal_code: '',
      subscriber_employer: '',
      subscriber_employer_street: '',
      subscriber_employer_street_line_2: '',
      subscriber_employer_city: '',
      subscriber_employer_state: '',
      subscriber_employer_postal_code: '',
      copay: '',
      accept_assignment: ''
    });

    let primary = insurances?.find(ins => ins.type === 'primary');
    let secondary = insurances?.find(ins => ins.type === 'secondary');
    let tertiary = insurances?.find(ins => ins.type === 'tertiary');

    // Always show primary insurance with placeholder if needed
    if (!primary) {
      primary = createPlaceholder('primary');
    }

    // Only show secondary/tertiary placeholders if NOT self-pay (i.e., payment_type is 'insurance')
    if (!isSelfPay) {
      if (!secondary) {
        secondary = createPlaceholder('secondary');
      }
      if (!tertiary) {
        tertiary = createPlaceholder('tertiary');
      }
    }

    return {
      primaryInsurance: primary,
      secondaryInsurance: secondary,
      tertiaryInsurance: tertiary
    };
  }, [insurances, isSelfPay]);

  // Helper function to initialize form data from insurance record
  const initializeFormData = (insurance) => {
    if (!insurance) return {};

    return {
      provider: insurance.provider || '',
      plan_name: insurance.plan_name || '',
      date: insurance.effective_date || '',
      date_end: insurance.effective_date_end || '',
      policy_number: insurance.policy_number || '',
      group_number: insurance.group_number || '',
      subscriber_relationship: insurance.subscriber_relationship || '',
      subscriber_fname: insurance.subscriber_fname || '',
      subscriber_mname: insurance.subscriber_mname || '',
      subscriber_lname: insurance.subscriber_lname || '',
      subscriber_DOB: insurance.subscriber_DOB || '',
      subscriber_sex: insurance.subscriber_sex || '',
      subscriber_ss: insurance.subscriber_ss || '',
      subscriber_street: insurance.subscriber_street || '',
      subscriber_street_line_2: insurance.subscriber_street_line_2 || '',
      subscriber_city: insurance.subscriber_city || '',
      subscriber_state: insurance.subscriber_state || '',
      subscriber_postal_code: insurance.subscriber_postal_code || '',
      subscriber_employer: insurance.subscriber_employer || '',
      subscriber_employer_street: insurance.subscriber_employer_street || '',
      subscriber_employer_street_line_2: insurance.subscriber_employer_street_line_2 || '',
      subscriber_employer_city: insurance.subscriber_employer_city || '',
      subscriber_employer_state: insurance.subscriber_employer_state || '',
      subscriber_employer_postal_code: insurance.subscriber_employer_postal_code || '',
      copay: insurance.copay || '',
      accept_assignment: insurance.accept_assignment || '',
      policy_type: insurance.policy_type || '',
      type: insurance.type
    };
  };

  // Edit handlers
  const handleEdit = (insuranceType) => {
    let insurance;
    if (insuranceType === 'primary') {
      insurance = primaryInsurance;
      setPrimaryFormData(initializeFormData(insurance));
      setEditingPrimary(true);
    } else if (insuranceType === 'secondary') {
      insurance = secondaryInsurance;
      setSecondaryFormData(initializeFormData(insurance));
      setEditingSecondary(true);
    } else if (insuranceType === 'tertiary') {
      insurance = tertiaryInsurance;
      setTertiaryFormData(initializeFormData(insurance));
      setEditingTertiary(true);
    }
    setError(null);
  };

  const handleCancel = (insuranceType) => {
    if (insuranceType === 'primary') {
      setEditingPrimary(false);
      setPrimaryFormData({});
    } else if (insuranceType === 'secondary') {
      setEditingSecondary(false);
      setSecondaryFormData({});
    } else if (insuranceType === 'tertiary') {
      setEditingTertiary(false);
      setTertiaryFormData({});
    }
    setError(null);
  };

  const handleChange = (insuranceType, field, value) => {
    // Auto-populate subscriber info when relationship is set to "self"
    if (field === 'subscriber_relationship' && value.toLowerCase() === 'self') {
      const autoPopulatedData = {
        [field]: value,
        subscriber_fname: patient.fname || '',
        subscriber_mname: patient.mname || '',
        subscriber_lname: patient.lname || '',
        subscriber_DOB: patient.DOB || '',
        subscriber_sex: patient.sex || '',
        subscriber_ss: patient.ss || '',
        subscriber_street: patient.street || '',
        subscriber_street_line_2: patient.street_line_2 || '',
        subscriber_city: patient.city || '',
        subscriber_state: patient.state || '',
        subscriber_postal_code: patient.postal_code || ''
      };

      if (insuranceType === 'primary') {
        setPrimaryFormData(prev => ({ ...prev, ...autoPopulatedData }));
      } else if (insuranceType === 'secondary') {
        setSecondaryFormData(prev => ({ ...prev, ...autoPopulatedData }));
      } else if (insuranceType === 'tertiary') {
        setTertiaryFormData(prev => ({ ...prev, ...autoPopulatedData }));
      }
    } else {
      // Normal field update
      if (insuranceType === 'primary') {
        setPrimaryFormData(prev => ({ ...prev, [field]: value }));
      } else if (insuranceType === 'secondary') {
        setSecondaryFormData(prev => ({ ...prev, [field]: value }));
      } else if (insuranceType === 'tertiary') {
        setTertiaryFormData(prev => ({ ...prev, [field]: value }));
      }
    }
  };

  const validateFormData = (formData) => {
    const requiredFields = [
      { field: 'provider', label: 'Insurance Company' },
      { field: 'date', label: 'Effective Date' },
      { field: 'policy_number', label: 'Policy Number' },
      { field: 'subscriber_relationship', label: 'Relationship' },
      { field: 'subscriber_fname', label: 'Subscriber First Name' },
      { field: 'subscriber_lname', label: 'Subscriber Last Name' },
      { field: 'subscriber_DOB', label: 'D.O.B.' },
      { field: 'subscriber_sex', label: 'Sex' },
      { field: 'subscriber_ss', label: 'S.S.' },
      { field: 'subscriber_street', label: 'Subscriber Address' },
      { field: 'subscriber_city', label: 'City' },
      { field: 'subscriber_state', label: 'State' },
      { field: 'subscriber_postal_code', label: 'Zip Code' }
    ];

    const missingFields = requiredFields.filter(({ field }) => !formData[field] || formData[field].trim() === '');

    if (missingFields.length > 0) {
      throw new Error(`Required fields missing: ${missingFields.map(f => f.label).join(', ')}`);
    }
  };

  const handleSave = async (insuranceType) => {
    setIsSaving(true);
    setError(null);

    try {
      let formData, insurance;

      if (insuranceType === 'primary') {
        formData = primaryFormData;
        insurance = primaryInsurance;
      } else if (insuranceType === 'secondary') {
        formData = secondaryFormData;
        insurance = secondaryInsurance;
      } else if (insuranceType === 'tertiary') {
        formData = tertiaryFormData;
        insurance = tertiaryInsurance;
      }

      // Validate required fields
      validateFormData(formData);

      // If creating a new insurance (id is null), include patient_id and type
      const dataToSave = { ...formData };
      if (!insurance.id) {
        dataToSave.patient_id = patient.pid;
        dataToSave.type = insuranceType;
      }

      // Call API to update/create insurance
      await updateInsurance(insurance.id, dataToSave);

      // Refresh the data
      if (onDataUpdate) {
        await onDataUpdate();
      }

      // Exit edit mode
      handleCancel(insuranceType);
    } catch (err) {
      setError(err.message || 'Failed to save insurance changes');
    } finally {
      setIsSaving(false);
    }
  };

  // Helper to render field (read-only or editable)
  const renderField = (label, value, fieldName, insuranceType, isEditing, formData, options = null, type = 'text', isRequired = false) => {
    const labelClass = isRequired ? 'form-field-label required-field-label' : 'form-field-label';

    if (isEditing && fieldName) {
      if (options) {
        // Render select dropdown
        return (
          <div className="form-field">
            <div className={labelClass}>{label}{isRequired && ' *'}</div>
            <select
              value={formData[fieldName] || ''}
              onChange={(e) => handleChange(insuranceType, fieldName, e.target.value)}
              className="input-md"
              required={isRequired}
            >
              <option value="">Select...</option>
              {options.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        );
      } else {
        // Render text input
        return (
          <div className="form-field">
            <div className={labelClass}>{label}{isRequired && ' *'}</div>
            <input
              type={type}
              value={formData[fieldName] || ''}
              onChange={(e) => handleChange(insuranceType, fieldName, e.target.value)}
              className="input-md"
              required={isRequired}
            />
          </div>
        );
      }
    } else {
      // Render read-only view
      let displayValue = value || '';
      if (options && value) {
        const matchingOption = options.find(opt => opt.value === value);
        if (matchingOption) {
          displayValue = matchingOption.label;
        }
      }
      return (
        <div className="form-field">
          <div className="form-field-label">{label}</div>
          <div className="form-field-value">{displayValue}</div>
        </div>
      );
    }
  };

  // Render a single insurance section
  const renderInsuranceSection = (insurance, insuranceType, isCollapsible = false, isExpanded = true, toggleExpanded = null) => {
    if (!insurance) return null;

    const isEditing =
      (insuranceType === 'primary' && editingPrimary) ||
      (insuranceType === 'secondary' && editingSecondary) ||
      (insuranceType === 'tertiary' && editingTertiary);

    const formData =
      insuranceType === 'primary' ? primaryFormData :
      insuranceType === 'secondary' ? secondaryFormData :
      tertiaryFormData;

    const getInsuranceTypeLabel = (type) => {
      const types = {
        'primary': 'Primary Insurance',
        'secondary': 'Secondary Insurance',
        'tertiary': 'Tertiary Insurance'
      };
      return types[type] || `Insurance ${type}`;
    };

    return (
      <div key={insurance.id || `placeholder-${insuranceType}`} className="card-main mb-6">
        <div className="flex items-center justify-between mb-4">
          <div
            className={`flex items-center gap-4 ${isCollapsible ? 'cursor-pointer' : ''}`}
            onClick={isCollapsible ? toggleExpanded : undefined}
          >
            <h2 className="text-xl font-semibold text-gray-800">{getInsuranceTypeLabel(insurance.type)}</h2>
            {isCollapsible && (
              <button className="text-gray-600 hover:text-gray-800 transition-colors">
                {isExpanded ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </button>
            )}
          </div>

          {/* Edit/Save/Cancel buttons - Always visible */}
          <div className="flex space-x-2">
            {!isEditing ? (
              <button
                onClick={() => handleEdit(insuranceType)}
                className="btn-solid btn-solid-blue"
              >
                Edit Insurance
              </button>
            ) : (
              <>
                <button
                  onClick={() => handleCancel(insuranceType)}
                  disabled={isSaving}
                  className="btn-solid btn-solid-gray disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSave(insuranceType)}
                  disabled={isSaving}
                  className="btn-solid btn-solid-green disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Required fields legend - shown when editing */}
        {isExpanded && isEditing && (
          <div className="mb-4 px-4 py-2 bg-purple-50 border-l-4 border-purple-700 rounded">
            <p className="text-sm text-purple-900">
              <span className="required-field-label">*</span> Required fields are marked with an asterisk and displayed in <span className="required-field-label">purple</span>
            </p>
          </div>
        )}

        {isExpanded && (
          <div className="card-inner">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Column 1: Insurance Details */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Insurance Details</h3>
                {renderField('Insurance Company', insurance.insurance_company_name || insurance.provider, 'provider', insuranceType, isEditing, formData, insuranceCompanies, 'text', true)}
                {renderField('Plan Name', insurance.plan_name, 'plan_name', insuranceType, isEditing, formData)}
                {renderField('Effective Date', insurance.effective_date, 'date', insuranceType, isEditing, formData, null, 'date', true)}
                {renderField('Effective Date End', insurance.effective_date_end, 'date_end', insuranceType, isEditing, formData, null, 'date')}
                {renderField('Policy Number', insurance.policy_number, 'policy_number', insuranceType, isEditing, formData, null, 'text', true)}
                {renderField('Group Number', insurance.group_number, 'group_number', insuranceType, isEditing, formData)}
                {renderField('CoPay', insurance.copay, 'copay', insuranceType, isEditing, formData, null, 'text')}
                {renderField('Accept Assignment', insurance.accept_assignment, 'accept_assignment', insuranceType, isEditing, formData, dropdownOptions.accept_assignment || [])}
                {insurance.type === 'secondary' && renderField('Secondary Medicare Type', insurance.policy_type, 'policy_type', insuranceType, isEditing, formData)}
              </div>

              {/* Column 2: Subscriber Information */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Subscriber Information</h3>
                {renderField('Relationship', insurance.subscriber_relationship, 'subscriber_relationship', insuranceType, isEditing, formData, dropdownOptions.relationship || [], 'text', true)}
                {renderField('Subscriber First Name', insurance.subscriber_fname, 'subscriber_fname', insuranceType, isEditing, formData, null, 'text', true)}
                {renderField('Subscriber Middle Name', insurance.subscriber_mname, 'subscriber_mname', insuranceType, isEditing, formData)}
                {renderField('Subscriber Last Name', insurance.subscriber_lname, 'subscriber_lname', insuranceType, isEditing, formData, null, 'text', true)}
                {renderField('D.O.B.', insurance.subscriber_DOB, 'subscriber_DOB', insuranceType, isEditing, formData, null, 'date', true)}
                {renderField('Sex', insurance.subscriber_sex, 'subscriber_sex', insuranceType, isEditing, formData, dropdownOptions.sex || [], 'text', true)}
                {isEditing ? (
                  renderField('S.S.', formData.subscriber_ss, 'subscriber_ss', insuranceType, isEditing, formData, null, 'text', true)
                ) : (
                  <div className="form-field">
                    <div className="form-field-label">S.S.</div>
                    <div className="form-field-value">
                      {insurance.subscriber_ss ? '***-**-' + insurance.subscriber_ss.slice(-4) : ''}
                    </div>
                  </div>
                )}
                {renderField('Subscriber Address', insurance.subscriber_street, 'subscriber_street', insuranceType, isEditing, formData, null, 'text', true)}
                {renderField('Address Line 2', insurance.subscriber_street_line_2, 'subscriber_street_line_2', insuranceType, isEditing, formData)}
                {renderField('City', insurance.subscriber_city, 'subscriber_city', insuranceType, isEditing, formData, null, 'text', true)}
                {renderField('State', insurance.subscriber_state, 'subscriber_state', insuranceType, isEditing, formData, dropdownOptions.state || [], 'text', true)}
                {renderField('Zip Code', insurance.subscriber_postal_code, 'subscriber_postal_code', insuranceType, isEditing, formData, null, 'text', true)}
              </div>

              {/* Column 3: Subscriber Employer */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Subscriber Employer</h3>
                {renderField('Subscriber Employer (SE)', insurance.subscriber_employer, 'subscriber_employer', insuranceType, isEditing, formData)}
                {renderField('SE Address', insurance.subscriber_employer_street, 'subscriber_employer_street', insuranceType, isEditing, formData)}
                {renderField('SE Address Line 2', insurance.subscriber_employer_street_line_2, 'subscriber_employer_street_line_2', insuranceType, isEditing, formData)}
                {renderField('SE City', insurance.subscriber_employer_city, 'subscriber_employer_city', insuranceType, isEditing, formData)}
                {renderField('SE State', insurance.subscriber_employer_state, 'subscriber_employer_state', insuranceType, isEditing, formData, dropdownOptions.state || [])}
                {renderField('SE Zip Code', insurance.subscriber_employer_postal_code, 'subscriber_employer_postal_code', insuranceType, isEditing, formData)}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Check if employer section has any data
  const hasEmployerData = patient.employer || patient.employer_street || patient.employer_city ||
                         patient.employer_state || patient.employer_postal_code || patient.employer_occupation;

  // Payment type label for display
  const paymentTypeLabel = isSelfPay ? 'Self-Pay (Client)' : 'Insurance';

  // Determine if we should show insurance sections
  const showInsuranceSections = !isSelfPay || showInsuranceWhenSelfPay;

  // Auto-expand secondary/tertiary if they have data
  useEffect(() => {
    if (secondaryInsurance) setShowSecondary(true);
    if (tertiaryInsurance) setShowTertiary(true);
  }, [secondaryInsurance, tertiaryInsurance]);

  return (
    <div className="space-y-6">
      {/* Error message */}
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Payment Type Indicator - Always show */}
      <div className="card-main">
        <div className="card-inner">
          <div className="flex items-center justify-between py-3 px-2">
            <div className="flex items-center gap-3">
              <div className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Payment Type:</div>
              <div className={`text-lg font-bold ${isSelfPay ? 'text-orange-600' : 'text-blue-600'}`}>
                {paymentTypeLabel}
              </div>
            </div>
            {isSelfPay && insurances && insurances.length > 0 && (
              <button
                onClick={() => setShowInsuranceWhenSelfPay(!showInsuranceWhenSelfPay)}
                className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
              >
                {showInsuranceWhenSelfPay ? 'Hide Insurance Records' : 'Show Insurance Records'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Show employer and insurance sections if not self-pay OR user toggled on */}
      {showInsuranceSections && (
        <>
          {/* Employer Information Section - Only show if has data */}
          {hasEmployerData && (
            <div className="card-main">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Client Employer Information</h2>
              <div className="card-inner">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="col-span-2 form-field">
                    <div className="form-field-label">Employer Name</div>
                    <div className="form-field-value">{patient.employer || ''}</div>
                  </div>
                  <div className="form-field">
                    <div className="form-field-label">Start Date</div>
                    <div className="form-field-value">
                      {patient.employer_start_date ? new Date(patient.employer_start_date).toLocaleDateString() : ''}
                    </div>
                  </div>
                  <div className="form-field">
                    <div className="form-field-label">End Date</div>
                    <div className="form-field-value">
                      {patient.employer_end_date ? new Date(patient.employer_end_date).toLocaleDateString() : ''}
                    </div>
                  </div>
                  <div className="col-span-2 form-field">
                    <div className="form-field-label">Address</div>
                    <div className="form-field-value">
                      {patient.employer_street || ''}
                      {patient.employer_street_line_2 && `, ${patient.employer_street_line_2}`}
                    </div>
                  </div>
                  <div className="form-field">
                    <div className="form-field-label">City</div>
                    <div className="form-field-value">{patient.employer_city || ''}</div>
                  </div>
                  <div className="form-field">
                    <div className="form-field-label">State</div>
                    <div className="form-field-value">{patient.employer_state || ''}</div>
                  </div>
                  <div className="form-field">
                    <div className="form-field-label">Postal Code</div>
                    <div className="form-field-value">{patient.employer_postal_code || ''}</div>
                  </div>
                  <div className="form-field">
                    <div className="form-field-label">Country</div>
                    <div className="form-field-value">{patient.employer_country || ''}</div>
                  </div>
                  <div className="form-field">
                    <div className="form-field-label">Occupation</div>
                    <div className="form-field-value">{patient.employer_occupation || ''}</div>
                  </div>
                  <div className="form-field">
                    <div className="form-field-label">Industry</div>
                    <div className="form-field-value">{patient.employer_industry || ''}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Insurance Sections */}
          {primaryInsurance && renderInsuranceSection(primaryInsurance, 'primary', false, true, null)}
          {secondaryInsurance && renderInsuranceSection(
            secondaryInsurance,
            'secondary',
            true,
            showSecondary,
            () => setShowSecondary(!showSecondary)
          )}
          {tertiaryInsurance && renderInsuranceSection(
            tertiaryInsurance,
            'tertiary',
            true,
            showTertiary,
            () => setShowTertiary(!showTertiary)
          )}
        </>
      )}
    </div>
  );
}

export default InsuranceTab;
