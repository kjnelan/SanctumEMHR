/**
 * SanctumEMHR EMHR
 * About page - System information, version, copyright
 *
 * Author: Kenneth J. Nelan
 * License: Proprietary and Confidential
 * Version: ALPHA
 *
 * Copyright © 2026 Sacred Wandering
 * Proprietary and Confidential
 */

function About() {
  return (
    <div className="glass-card p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">About SanctumEMHR EMHR</h2>

      {/* Logo, Branding, and Author Info */}
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/30">
        <div className="flex items-center gap-6">
          <div className="w-48 h-48 backdrop-blur-xl bg-white/40 rounded-2xl flex items-center justify-center p-3 shadow-lg">
            <img src="/app/SanctumLogo.png" alt="SanctumEMHR Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h3 className="text-3xl font-bold text-gray-900">SanctumEMHR</h3>
            <p className="text-lg text-gray-700 mt-1">Electronic Mental Health Records</p>
            <p className="text-sm text-gray-600 mt-2 italic">Where modern design meets clinical insight</p>
          </div>
        </div>

        {/* Author and Organization */}
        <div className="text-right">
          <p className="text-gray-900 font-semibold">Kenneth J. Nelan</p>
          <p className="text-gray-700 mt-1">Sacred Wandering</p>
        </div>
      </div>

      {/* Version Information */}
      <div className="space-y-6">
        <div>
          <h4 className="text-lg font-semibold text-gray-800 mb-3">Version Information</h4>
          <div className="bg-white/40 backdrop-blur-sm rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-700 font-medium">Version:</span>
              <span className="text-gray-900 font-semibold">0.3.0-alpha</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700 font-medium">Release Stage:</span>
              <span className="text-gray-900 font-semibold">Alpha Testing</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700 font-medium">Build Date:</span>
              <span className="text-gray-900 font-semibold">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            </div>
          </div>
        </div>

        {/* What is EMHR? - with Product Description */}
        <div className="bg-blue-50/60 backdrop-blur-sm rounded-lg p-6 border border-blue-200/50">
          <h4 className="text-lg font-semibold text-blue-900 mb-3">What is EMHR?</h4>

          {/* Product Description */}
          <div className="mb-4 pb-4 border-b border-blue-200/30">
            <p className="text-gray-700 leading-relaxed">
              SanctumEMHR is a purpose-built Electronic Mental Health Records (EMHR) system designed specifically
              for outpatient mental health practices. Combining modern design principles with specialized clinical
              functionality, SanctumEMHR streamlines client management, appointment scheduling, clinical documentation,
              and billing workflows—all within a beautiful, intuitive interface.
            </p>
          </div>

          {/* EMHR Definition */}
          <p className="text-gray-700 leading-relaxed mb-4">
            <strong className="text-blue-900">EMHR (Electronic Mental Health Records)</strong> is a term we've introduced
            to distinguish mental health-specific documentation systems from general medical EMRs.
            While EMRs focus on physical health, EMHRs are purpose-built for the unique workflows,
            documentation requirements, and clinical needs of mental health and behavioral health practices.
          </p>
          <p className="text-gray-600 text-sm">
            SanctumEMHR represents a new generation of EMHR systems designed from the ground up
            for outpatient mental health providers, combining modern UX with specialized clinical functionality.
          </p>
        </div>

        {/* Features */}
        <div>
          <h4 className="text-lg font-semibold text-gray-800 mb-3">Current Features</h4>
          <div className="bg-white/40 backdrop-blur-sm rounded-lg p-4">
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">Client management with comprehensive demographics</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">Calendar with day/week/month views</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">Appointment creation and scheduling</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">Insurance and billing information tracking</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">Guardian/related persons management</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">Modern glassmorphism UI design</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">HIPAA-compliant security and encryption</span>
              </li>
            </ul>
          </div>
        </div>

        {/* System Information */}
        <div>
          <h4 className="text-lg font-semibold text-gray-800 mb-3">System Information</h4>
          <div className="bg-white/40 backdrop-blur-sm rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-700 font-medium">Frontend Framework:</span>
              <span className="text-gray-900">React 18 + Vite</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700 font-medium">Styling:</span>
              <span className="text-gray-900">Tailwind CSS v4</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700 font-medium">Authentication:</span>
              <span className="text-gray-900">Session-based (PHP)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700 font-medium">Database:</span>
              <span className="text-gray-900">MySQL/MariaDB</span>
            </div>
          </div>
        </div>

        {/* Copyright and Legal - MOVED TO LAST */}
        <div className="bg-gradient-to-br from-blue-50/80 to-purple-50/80 backdrop-blur-sm rounded-lg p-6 border border-white/50">
          <div className="text-center space-y-3">
            <div>
              <p className="text-gray-900 font-semibold text-lg">
                SanctumEMHR is Copyright © 2026 Sacred Wandering
              </p>
              <p className="text-gray-700 font-medium mt-1">
                Proprietary and Confidential
              </p>
            </div>
            <div className="pt-3 border-t border-white/50">
              <p className="text-gray-600 text-sm">
                This software is licensed for authorized use only.
              </p>
              <p className="text-gray-600 text-sm mt-1">
                Unauthorized copying, modification, distribution, or use is strictly prohibited.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default About;
