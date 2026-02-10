import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { portalChangePassword } from '../../services/PortalService';
import { branding } from '../../config/branding';

function PortalChangePassword() {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (!/[a-z]/.test(newPassword) || !/[A-Z]/.test(newPassword) ||
        !/[0-9]/.test(newPassword) || !/[^a-zA-Z0-9]/.test(newPassword)) {
      setError('Password must include uppercase, lowercase, number, and special character');
      return;
    }

    setLoading(true);
    try {
      await portalChangePassword(newPassword, confirmPassword);
      navigate('/mycare/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
      <div className="absolute inset-0 bg-gradient-mental"></div>

      <div className="absolute inset-0 overflow-hidden">
        <div className="particle particle-1"></div>
        <div className="particle particle-2"></div>
        <div className="particle particle-3"></div>
      </div>

      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="sanctum-glass-main p-8">
          <div className="text-center mb-8">
            <div className="sanctum-glass-card inline-block p-4 rounded-2xl mb-4">
              {branding.logoUrl ? (
                <img src={branding.logoUrl} alt={branding.companyName} className="h-12 w-auto mx-auto" />
              ) : (
                <div className="text-3xl text-gray-700 font-bold">{branding.logoText}</div>
              )}
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Change Your Password</h1>
            <p className="text-gray-600 text-sm mt-1">
              For your security, please create a new password before continuing.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-gray-800 text-sm font-semibold mb-2">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="input-lg"
                placeholder="Enter new password"
                required
                autoComplete="new-password"
              />
            </div>

            <div>
              <label className="block text-gray-800 text-sm font-semibold mb-2">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input-lg"
                placeholder="Confirm new password"
                required
                autoComplete="new-password"
              />
            </div>

            <div className="sanctum-glass-card p-3 rounded-xl">
              <p className="text-xs text-gray-600 font-medium">Password requirements:</p>
              <ul className="text-xs text-gray-500 mt-1 space-y-0.5">
                <li className={newPassword.length >= 8 ? 'text-green-600' : ''}>At least 8 characters</li>
                <li className={/[A-Z]/.test(newPassword) ? 'text-green-600' : ''}>One uppercase letter</li>
                <li className={/[a-z]/.test(newPassword) ? 'text-green-600' : ''}>One lowercase letter</li>
                <li className={/[0-9]/.test(newPassword) ? 'text-green-600' : ''}>One number</li>
                <li className={/[^a-zA-Z0-9]/.test(newPassword) ? 'text-green-600' : ''}>One special character</li>
              </ul>
            </div>

            {error && <div className="error-message">{error}</div>}

            <button
              type="submit"
              disabled={loading}
              className="btn-search w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Updating...' : 'Set New Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default PortalChangePassword;
