import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const isFirebaseConfigured = !!(
  import.meta.env.VITE_FIREBASE_API_KEY &&
  import.meta.env.VITE_FIREBASE_API_KEY !== 'your_api_key_here' &&
  import.meta.env.VITE_FIREBASE_API_KEY !== 'dummy_api_key'
);

const passwordStrength = (pw: string) => {
  if (pw.length === 0) return { score: 0, label: '', color: '' };
  if (pw.length < 6) return { score: 1, label: 'Too short', color: 'bg-error' };
  if (pw.length < 8) return { score: 2, label: 'Weak', color: 'bg-orange-400' };
  if (/[A-Z]/.test(pw) && /[0-9]/.test(pw)) return { score: 4, label: 'Strong', color: 'bg-tertiary' };
  return { score: 3, label: 'Good', color: 'bg-primary' };
};

export const SignupPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signup, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const strength = passwordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setIsLoading(true);
    try {
      const result = await signup(name, email, password);
      if (result.success) {
        navigate('/');
      } else {
        setError(result.error || 'Signup failed');
      }
    } catch (err: any) {
      console.error('Signup form error:', err);
      setError(err?.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] bg-surface-container-high border-r border-white/5 p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-secondary/10 blur-[160px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-tertiary/10 blur-[130px] rounded-full -translate-x-1/4 translate-y-1/4 pointer-events-none" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
          </div>
          <span className="font-black text-lg text-white tracking-tight headline-text">Study Success</span>
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="text-4xl font-black text-white headline-text leading-tight mb-4">
              Start learning<br />
              <span className="text-secondary">smarter today.</span>
            </h2>
            <p className="text-on-surface-variant text-base leading-relaxed">
              Join thousands of students using Study Success to stay organized, focused, and motivated.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { value: '10K+', label: 'Study sessions logged' },
              { value: '500+', label: 'Books tracked' },
              { value: '98%', label: 'Users stay consistent' },
              { value: '∞', label: 'Cloud sync across devices' },
            ].map(stat => (
              <div key={stat.label} className="bg-surface-container rounded-xl p-4 border border-white/5">
                <p className="text-2xl font-black text-white headline-text">{stat.value}</p>
                <p className="text-xs text-on-surface-variant mt-1">{stat.label}</p>
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
          <p className="text-sm text-on-surface-variant mt-1">Begin your learning journey</p>
        </div>

        <div className="w-full max-w-md">
          {/* Firebase warning */}
          {!isFirebaseConfigured && (
            <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex gap-3 animate-fade-in-up">
              <span className="material-symbols-outlined text-amber-400 text-xl flex-shrink-0 mt-0.5">warning</span>
              <div>
                <p className="text-amber-300 font-bold text-sm mb-1">Local Mode — No Cloud Sync</p>
                <p className="text-amber-200/70 text-xs leading-relaxed">
                  Data is stored locally on this device only. To sync across devices, add your Firebase credentials to a <code className="bg-amber-500/20 px-1 rounded">.env</code> file.
                </p>
              </div>
            </div>
          )}

          <div className="bg-surface-container-high rounded-2xl p-8 border border-white/5 shadow-2xl animate-scale-in">
            <div className="mb-8">
              <h2 className="text-2xl font-bold headline-text text-white">Create account</h2>
              <p className="text-sm text-on-surface-variant mt-1">It's free and takes 30 seconds</p>
            </div>

            {error && (
              <div className="mb-5 p-3.5 bg-error/10 border border-error/20 rounded-xl text-error text-sm flex items-start gap-2 animate-fade-in">
                <span className="material-symbols-outlined text-sm mt-0.5">error</span>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  className="w-full bg-surface-container border border-white/10 rounded-xl py-3.5 px-4 text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="Your full name"
                  required
                />
              </div>

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
                    autoComplete="new-password"
                    className="w-full bg-surface-container border border-white/10 rounded-xl py-3.5 px-4 pr-12 text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                    placeholder="Min. 6 characters"
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
                {/* Password strength bar */}
                {password.length > 0 && (
                  <div className="mt-2">
                    <div className="h-1 w-full bg-surface-container rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${strength.color}`}
                        style={{ width: `${(strength.score / 4) * 100}%` }}
                      />
                    </div>
                    <p className={`text-xs mt-1 font-bold transition-colors ${
                      strength.score === 1 ? 'text-error' :
                      strength.score === 2 ? 'text-orange-400' :
                      strength.score === 3 ? 'text-primary' : 'text-tertiary'
                    }`}>{strength.label}</p>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    className={`w-full bg-surface-container border rounded-xl py-3.5 px-4 pr-12 text-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 transition-all ${
                      confirmPassword && confirmPassword !== password
                        ? 'border-error/40 focus:ring-error/20 focus:border-error/50'
                        : confirmPassword && confirmPassword === password
                        ? 'border-tertiary/40 focus:ring-tertiary/20 focus:border-tertiary/50'
                        : 'border-white/10 focus:ring-primary/20 focus:border-primary/50'
                    }`}
                    placeholder="••••••••"
                    required
                  />
                  {confirmPassword && (
                    <span className={`material-symbols-outlined text-lg absolute right-3.5 top-1/2 -translate-y-1/2 ${
                      confirmPassword === password ? 'text-tertiary' : 'text-error'
                    }`} style={{ fontVariationSettings: "'FILL' 1" }}>
                      {confirmPassword === password ? 'check_circle' : 'cancel'}
                    </span>
                  )}
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
                    Creating account…
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>person_add</span>
                    Create Account
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
                        setError(err?.message || 'Google signup failed');
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
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
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
                Already have an account?{' '}
                <Link to="/login" className="text-primary font-bold hover:underline">
                  Sign in →
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
