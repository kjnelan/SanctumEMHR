import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { branding } from './config/branding';

function Login() {
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
      const response = await fetch('/custom/api/login.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for session
        body: JSON.stringify({
          username: username,
          password: password,
        }),
      });

      if (!response.ok) {
        throw new Error('Invalid credentials');
      }

      const data = await response.json();

      if (data.success) {
        // Session is now established via cookie
        // Store user info in localStorage for quick access
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
        }

        navigate('/dashboard');
      } else {
        throw new Error(data.error || 'Login failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Invalid username or password');
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

      <div className="relative z-10 w-full max-w-6xl mx-4">
        {/* Two-column layout */}
        <div className="backdrop-blur-3xl bg-white/30 rounded-3xl shadow-2xl border border-white/50 overflow-hidden">
          <div className="grid md:grid-cols-2 gap-8 items-center">

            {/* Left side - Logo and branding */}
            <div className="p-12 flex flex-col items-center justify-center bg-white/20">
              <div className="w-full max-w-md">
                {branding.logoUrl ? (
                  <img src={branding.logoUrl} alt={`${branding.companyName} logo`} className="w-full h-auto object-contain" />
                ) : (
                  <div className="text-9xl text-gray-700 font-bold text-center">{branding.logoText}</div>
                )}
              </div>
            </div>

            {/* Right side - Login form */}
            <div className="p-8">

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-gray-800 text-sm font-semibold mb-2">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-lg"
                placeholder="Enter your username"
                required
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
                <div className="inline-flex items-center gap-2 bg-white/60 px-4 py-2 rounded-full border border-gray-300 backdrop-blur-sm shadow-sm">
                  <svg className="w-4 h-4 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700 text-xs font-semibold">HIPAA Compliant & Secure</span>
                </div>
              </div>

              <div className="mt-4 text-center">
                <p className="text-gray-600 text-xs">Version 0.3.0-alpha</p>
              </div>
            </div>
            {/* End right side */}

          </div>
          {/* End grid */}
        </div>
        {/* End card */}
      </div>
      {/* End container */}
    </div>
  );
}

export default Login;
