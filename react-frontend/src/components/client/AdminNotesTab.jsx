import React from 'react';

function AdminNotesTab({ data }) {
  if (!data) {
    return (
      <div className="text-gray-700 text-center py-8">
        Loading admin notes...
      </div>
    );
  }

  const { patient } = data;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left Column */}
      <div className="space-y-6">
        {/* Demographics & Statistics Section */}
        <div className="card-main">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Demographics & Statistics</h2>
          <div className="card-inner">
            <div className="grid grid-cols-2 gap-3">
              <div className="form-field">
                <div className="form-field-label">Language</div>
                <div className="form-field-value">{patient.language || ''}</div>
              </div>
              <div className="form-field">
                <div className="form-field-label">Ethnicity</div>
                <div className="form-field-value">{patient.ethnicity || ''}</div>
              </div>
              <div className="form-field">
                <div className="form-field-label">Race</div>
                <div className="form-field-value">{patient.race || ''}</div>
              </div>
              <div className="form-field">
                <div className="form-field-label">Nationality</div>
                <div className="form-field-value">{patient.nationality || ''}</div>
              </div>
              <div className="form-field">
                <div className="form-field-label">Religion</div>
                <div className="form-field-value">{patient.religion || ''}</div>
              </div>
              <div className="form-field">
                <div className="form-field-label">Referral Source</div>
                <div className="form-field-value">{patient.referral_source || ''}</div>
              </div>
              <div className="col-span-2 form-field">
                <div className="form-field-label">Tribal Affiliations</div>
                <div className="form-field-value">{patient.tribal_affiliations || ''}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Financial & Housing Status Section */}
        <div className="card-main">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Financial & Housing Status</h2>
          <div className="card-inner">
            <div className="grid grid-cols-2 gap-3">
              <div className="form-field">
                <div className="form-field-label">Homeless</div>
                <div className="form-field-value">{patient.homeless_status || ''}</div>
              </div>
              <div className="form-field">
                <div className="form-field-label">Financial Review</div>
                <div className="form-field-value">
                  {patient.financial_review_date ? new Date(patient.financial_review_date).toLocaleDateString() : ''}
                </div>
              </div>
              <div className="form-field">
                <div className="form-field-label">Family Size</div>
                <div className="form-field-value">{patient.family_size || ''}</div>
              </div>
              <div className="form-field">
                <div className="form-field-label">Monthly Income</div>
                <div className="form-field-value">{patient.monthly_income ? `$${patient.monthly_income}` : ''}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column */}
      <div className="space-y-6">
        {/* Administrative Notes Section */}
        <div className="card-main">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Administrative Notes</h2>
          <div className="card-inner">
            <div className="form-field">
              <div className="form-field-label">Notes</div>
              <div className="form-field-value whitespace-pre-wrap">{patient.admin_notes || 'No administrative notes on file.'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminNotesTab;
