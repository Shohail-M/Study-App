import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const isFirebaseConfigured = !!(
  import.meta.env.VITE_FIREBASE_API_KEY &&
  import.meta.env.VITE_FIREBASE_API_KEY !== 'your_api_key_here' &&
  import.meta.env.VITE_FIREBASE_API_KEY !== 'dummy_api_key'
);

const features = [
  { icon: 'timer', label: 'Pomodoro Timer', desc: 'Stay focused with smart sessions' },
  { icon: 'menu_book', label: 'PDF Library', desc: 'Read & track your study materials' },
  { icon: 'description', label: 'Smart Notes', desc: 'Capture ideas, anywhere' },
  { icon: 'analytics', label: 'Progress Analytics', desc: 'See how far you\'ve come' },
];

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const result = await login(email, password);
      if (result.success) {
        navigate('/');
      } else {
        setError(result.error || 'Login failed');
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] bg-surface-container-high border-r border-white/5 p-12 relative overflow-hidden">
        {/* Animated glows */}
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/10 blur-[160px] rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-secondary/10 blur-[130px] rounded-full translate-x-1/4 translate-y-1/4 pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
            </div>
            <span className="font-black text-lg text-white tracking-tight headline-text">Study Success</span>
          </div>
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="text-4xl font-black text-white headline-text leading-tight mb-4">
              Your study journey,<br />
              <span className="text-primary">anywhere.</span>
            </h2>
            <p className="text-on-surface-variant text-base leading-relaxed">
              Track sessions, read PDFs, and hit your goals — all synced to the cloud.
            </p>
          </div>

          <div className="space-y-4">
            {features.map(f => (
              <div key={f.icon} className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-surface-container border border-white/5 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-primary text-lg">{f.icon}</span>
                </div>
                <div>
                  <p className="text-white font-bold text-sm">{f.label}</p>
                  <p className="text-on-surface-variant text-xs">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-xs text-outline">© 2026 Study Success. Built for learners.</p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10">
        {/* Mobile logo */}
        <div className="lg:hidden text-center mb-8">
          <h1 className="text-3xl font-black text-white headline-text">Study Success</h1>
          <p className="text-sm text-on-surface-variant mt-1">Your personal study companion</p>
        </div>

        <div className="w-full max-w-md">
          {/* Firebase warning */}
          {!isFirebaseConfigured && (
            <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex gap-3 animate-fade-in-up">
              <span className="material-symbols-outlined text-amber-400 text-xl flex-shrink-0 mt-0.5">warning</span>
              <div>
                <p className="text-amber-300 font-bold text-sm mb-1">Local Mode — No Cloud Sync</p>
                <p className="text-amber-200/70 text-xs leading-relaxed">
                  Your data is stored only on this device. To use the same account across devices, add Firebase credentials to a <code className="bg-amber-500/20 px-1 rounded">.env</code> file. See <code className="bg-amber-500/20 px-1 rounded">.env.example</code> for the format.
                </p>
              </div>
            </div>
          )}

          <div className="bg-surface-container-high rounded-2xl p-8 border border-white/5 shadow-2xl animate-scale-in">
            <div className="mb-8">
              <h2 className="text-2xl font-bold headline-text text-white">Welcome back</h2>
              <p className="text-sm text-on-surface-variant mt-1">Sign in to continue your journey</p>
            </div>

            {error && (
              <div className="mb-5 p-3.5 bg-error/10 border border-error/20 rounded-xl text-error text-sm flex items-start gap-2 animate-fade-in">
                <span className="material-symbols-outlined text-sm mt-0.5">error</span>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  className="w-full bg-surface-container border border-white/10 rounded-xl py-3.5 px-4 text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    className="w-full bg-surface-container border border-white/10 rounded-xl py-3.5 px-4 pr-12 text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-outline hover:text-white transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">{showPassword ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-gradient-to-r from-primary to-primary-container text-on-primary-container rounded-xl font-bold text-sm uppercase tracking-wider hover:opacity-95 hover:scale-[1.01] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
              >
                {isLoading ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                    Signing in…
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>login</span>
                    Sign In
                  </>
                )}
              </button>

              {isFirebaseConfigured && (
                <>
                  <div className="relative py-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/5"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-surface-container-high px-2 text-outline font-bold tracking-widest">Or continue with</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={async () => {
                      setError('');
                      try {
                        const res = await loginWithGoogle();
                        if (res.success) {
                          navigate('/');
                        } else {
                          setError(res.error || 'Google login failed');
                        }
                      } catch (err: any) {
                        setError(err?.message || 'Google login failed');
                      }
                    }}
                    disabled={isLoading}
                    className="w-full py-3.5 bg-white text-black rounded-xl font-bold text-sm hover:bg-white/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1.01.67-2.28 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    Google
                  </button>
                </>
              )}
            </form>

            <div className="mt-6 pt-6 border-t border-white/5 text-center">
              <p className="text-sm text-on-surface-variant">
                Don't have an account?{' '}
                <Link to="/signup" className="text-primary font-bold hover:underline">
                  Create one free →
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
