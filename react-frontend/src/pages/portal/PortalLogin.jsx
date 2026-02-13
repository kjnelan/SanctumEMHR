import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { portalLogin } from '../../services/PortalService';
import { branding } from '../../config/branding';

function PortalLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await portalLogin(username, password);

      if (data.success) {
        if (data.client?.forcePasswordChange) {
          navigate('/mycare/change-password');
        } else {
          navigate('/mycare/dashboard');
        }
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
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
        <div className="particle particle-4"></div>
        <div className="particle particle-5"></div>
      </div>

      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="sanctum-glass-main p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="sanctum-glass-card inline-block p-4 rounded-2xl mb-4">
              {branding.logoUrl ? (
                <img src={branding.logoUrl} alt={branding.companyName} className="h-16 w-auto mx-auto" />
              ) : (
                <div className="text-4xl text-gray-700 font-bold">{branding.logoText}</div>
              )}
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Client Portal</h1>
            <p className="text-gray-600 text-sm mt-1">Sign in to access your care information</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-gray-800 text-sm font-semibold mb-2">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-lg"
                placeholder="Enter your portal username"
                required
                autoComplete="username"
              />
            </div>

            <div>
              <label className="block text-gray-800 text-sm font-semibold mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-lg"
                placeholder="Enter your password"
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-search w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border sanctum-glass-card">
              <svg className="w-4 h-4 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              <span className="text-gray-700 text-xs font-semibold">HIPAA Compliant & Secure</span>
            </div>
          </div>

          <div className="mt-4 text-center">
            <p className="text-gray-500 text-xs">
              If you need portal access, please contact your provider.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PortalLogin;
