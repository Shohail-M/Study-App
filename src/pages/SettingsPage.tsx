import React, { useState } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { getAllRanks } from '../utils/progression';

export const SettingsPage: React.FC = () => {
  const { user, updateUser, changePassword, isGoogleUser, resetProgress } = useAuth();
  
  const [name, setName] = useState(user?.name || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState<{ success?: boolean; error?: string } | null>(null);
  
  const [newSubject, setNewSubject] = useState('');
  const [subjects, setSubjects] = useState<string[]>(user?.settings?.defaultSubjects || ['Math', 'Science', 'History', 'English']);
  const [bgMusic, setBgMusic] = useState(user?.settings?.bgMusic || 'none');
  const [theme, setTheme] = useState(user?.settings?.theme || 'dark');
  const [geminiApiKey, setGeminiApiKey] = useState(user?.settings?.geminiApiKey || '');
  const [isSaved, setIsSaved] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetStatus, setResetStatus] = useState<{ success?: boolean; error?: string } | null>(null);
  const [confirmResetText, setConfirmResetText] = useState('');
  const [isRanksOpen, setIsRanksOpen] = useState(false);

  const handleAddSubject = () => {
    if (newSubject.trim() && !subjects.includes(newSubject.trim())) {
      setSubjects([...subjects, newSubject.trim()]);
      setNewSubject('');
    }
  };

  const handleRemoveSubject = (subject: string) => {
    setSubjects(subjects.filter(s => s !== subject));
  };

  const handleSave = async () => {
    if (!user) return;
    
    // Update name if changed
    if (name !== user.name) {
      await updateUser({ name });
    }
    
    // Update other settings
    await updateUser({
      settings: {
        ...user.settings,
        defaultSubjects: subjects,
        bgMusic,
        theme,
        geminiApiKey
      }
    });
    
    // Handle password change if filled
    if (newPassword) {
      if (newPassword !== confirmPassword) {
        setPasswordStatus({ success: false, error: 'Passwords do not match.' });
        return;
      }
      if (newPassword.length < 6) {
        setPasswordStatus({ success: false, error: 'Password must be at least 6 characters.' });
        return;
      }
      
      const res = await changePassword(newPassword);
      if (res.success) {
        setPasswordStatus({ success: true });
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordStatus({ success: false, error: res.error });
      }
    }
    
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <DashboardLayout>
      <div className="mb-8 animate-fade-in-up flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-extrabold headline-text text-white">Settings</h2>
          <p className="text-on-surface-variant mt-2">Customize your Study Success experience.</p>
        </div>
        <button 
          onClick={handleSave}
          className="px-6 py-3 bg-primary text-on-primary font-bold rounded-xl shadow-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2"
        >
          <span className="material-symbols-outlined">{isSaved ? 'check' : 'save'}</span>
          {isSaved ? 'Saved!' : 'Save Settings'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in-up delay-100 mb-8">
        
        {/* Profile Settings */}
        <div className="bg-surface-container-high rounded-2xl p-6 sm:p-8 border border-white/5">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">account_circle</span>
            Profile Information
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">Display Name</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full bg-surface-container border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">Email Address</label>
              <div className="flex items-center gap-2 w-full bg-surface-container/50 border border-white/5 rounded-lg px-4 py-3 text-sm text-on-surface-variant italic">
                <span className="material-symbols-outlined text-xs">mail</span>
                {user?.email}
                {isGoogleUser && (
                  <span className="ml-auto flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter not-italic text-white">
                    Logged with Google
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-surface-container-high rounded-2xl p-6 sm:p-8 border border-white/5">
          <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-error">lock</span>
            Security & Password
          </h3>
          <p className="text-sm text-on-surface-variant mb-6">
            {isGoogleUser 
              ? "You're using Google login. You can also set a password here to enable signing in with your email/password later."
              : "Update your account password. Use at least 6 characters."
            }
          </p>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <input 
                  type="password" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password"
                  className="w-full bg-surface-container border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <div>
                <input 
                  type="password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full bg-surface-container border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>
            {passwordStatus && (
              <div className={`p-3 rounded-lg flex items-center gap-2 text-xs font-bold ${passwordStatus.success ? 'bg-tertiary/10 text-tertiary' : 'bg-error/10 text-error'}`}>
                <span className="material-symbols-outlined text-sm">{passwordStatus.success ? 'check_circle' : 'error'}</span>
                {passwordStatus.success ? 'Password successfully updated!' : passwordStatus.error}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Progress Reset */}
      <div className="bg-surface-container-high rounded-2xl p-6 sm:p-8 border border-white/5 animate-fade-in-up delay-150 mb-8">
        <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
          <span className="material-symbols-outlined text-error">restart_alt</span>
          Reset Progress
        </h3>
        <p className="text-sm text-on-surface-variant mb-6">
          This will reset your XP, level, streak, focus time and clear your study sessions. Your tasks will be set back to incomplete and your book progress will be reset.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="md:col-span-2">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">
              Type <span className="text-white">RESET</span> to confirm
            </label>
            <input
              type="text"
              value={confirmResetText}
              onChange={(e) => setConfirmResetText(e.target.value)}
              placeholder="RESET"
              className="w-full bg-surface-container border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-error/40"
            />
          </div>

          <button
            disabled={isResetting || confirmResetText.trim().toUpperCase() !== 'RESET'}
            onClick={async () => {
              if (confirmResetText.trim().toUpperCase() !== 'RESET') return;
              setIsResetting(true);
              setResetStatus(null);
              const res = await resetProgress();
              setIsResetting(false);
              setResetStatus(res.success ? { success: true } : { success: false, error: res.error || 'Reset failed.' });
              if (res.success) setConfirmResetText('');
            }}
            className={`px-6 py-3 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 ${
              isResetting || confirmResetText.trim().toUpperCase() !== 'RESET'
                ? 'bg-surface-container-highest text-on-surface-variant cursor-not-allowed'
                : 'bg-error text-white hover:scale-[1.02] active:scale-95'
            }`}
          >
            <span className="material-symbols-outlined">{isResetting ? 'hourglass_top' : 'delete_forever'}</span>
            {isResetting ? 'Resetting…' : 'Reset Now'}
          </button>
        </div>

        {resetStatus && (
          <div className={`mt-4 p-3 rounded-lg flex items-center gap-2 text-xs font-bold ${resetStatus.success ? 'bg-tertiary/10 text-tertiary' : 'bg-error/10 text-error'}`}>
            <span className="material-symbols-outlined text-sm">{resetStatus.success ? 'check_circle' : 'error'}</span>
            {resetStatus.success ? 'Progress reset successfully.' : resetStatus.error}
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={() => setIsRanksOpen(true)}
            className="px-4 py-2 bg-surface-container-highest text-on-surface font-bold rounded-lg hover:bg-surface-bright transition-colors flex items-center gap-2 text-sm"
          >
            <span className="material-symbols-outlined text-base">military_tech</span>
            View Ranks
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in-up delay-100">
        
        {/* Subjects Settings */}
        <div className="bg-surface-container-high rounded-2xl p-6 sm:p-8 border border-white/5">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-tertiary">school</span>
            Default Subjects
          </h3>
          <p className="text-sm text-on-surface-variant mb-6">Manage the subjects that appear in dropdowns for tasks and study sessions.</p>
          
          <div className="flex gap-2 mb-6">
            <input 
              type="text" 
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddSubject()}
              placeholder="Add new subject..."
              className="flex-1 bg-surface-container border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <button 
              onClick={handleAddSubject}
              className="w-10 h-10 bg-surface-container-highest rounded-lg flex items-center justify-center hover:bg-surface-bright transition-colors"
            >
              <span className="material-symbols-outlined text-white">add</span>
            </button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {subjects.map(subject => (
              <div key={subject} className="flex items-center gap-1 bg-surface-container px-3 py-1.5 rounded-full border border-white/5">
                <span className="text-sm font-medium text-white">{subject}</span>
                <button 
                  onClick={() => handleRemoveSubject(subject)}
                  className="w-5 h-5 rounded-full hover:bg-error/20 text-on-surface-variant hover:text-error flex items-center justify-center transition-colors ml-1"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>
            ))}
            {subjects.length === 0 && <span className="text-sm text-on-surface-variant">No subjects added.</span>}
          </div>
        </div>

        {/* Environment Settings */}
        <div className="bg-surface-container-high rounded-2xl p-6 sm:p-8 border border-white/5 flex flex-col gap-8">
          <div>
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">headphones</span>
              Background Music
            </h3>
            <p className="text-sm text-on-surface-variant mb-4">Select default background audio for your study timer.</p>
            <select 
              value={bgMusic}
              onChange={(e) => setBgMusic(e.target.value)}
              className="w-full bg-surface-container border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/40 appearance-none"
            >
              <option value="none">None (Silent block)</option>
              <option value="lofi">Lo-Fi Beats</option>
              <option value="rain">Rain Sounds</option>
              <option value="whitenoise">White Noise</option>
            </select>
          </div>

          <div>
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">palette</span>
              Theme Preference
            </h3>
            <div className="flex gap-4">
              <button 
                onClick={() => setTheme('dark')}
                className={`flex-1 py-3 rounded-lg border text-sm font-bold flex items-center justify-center gap-2 transition-all ${theme === 'dark' ? 'border-primary bg-primary/10 text-primary' : 'border-white/5 bg-surface-container text-on-surface-variant hover:bg-surface-bright hover:text-white'}`}
              >
                <span className="material-symbols-outlined text-[18px]">dark_mode</span> Dark
              </button>
              <button 
                onClick={() => setTheme('light')}
                className={`flex-1 py-3 rounded-lg border text-sm font-bold flex items-center justify-center gap-2 transition-all ${theme === 'light' ? 'border-primary bg-primary/10 text-primary' : 'border-white/5 bg-surface-container text-on-surface-variant hover:bg-surface-bright hover:text-white'}`}
              >
                <span className="material-symbols-outlined text-[18px]">light_mode</span> Light
              </button>
            </div>
            <p className="text-xs text-on-surface-variant mt-3 italic">* Light theme styling may require application reload to be fully visible depending on implementation.</p>
          </div>
        </div>

        {/* Integration Settings */}
        <div className="bg-surface-container-high rounded-2xl p-6 sm:p-8 border border-white/5 md:col-span-2">
           <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#ffab40]">smart_toy</span>
            AI Integration (Gemini)
          </h3>
          <p className="text-sm text-on-surface-variant mb-6">Connect the Gemini API to unlock smart AI features like automated summaries, quiz generation, and your personal AI tutor.</p>
          
          <div className="max-w-xl">
             <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">
              Gemini API Key
            </label>
            <input 
              type="password"
              value={geminiApiKey}
              onChange={(e) => setGeminiApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full bg-surface-container border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#ffab40]/50 font-mono"
            />
            <p className="text-xs mt-2 text-on-surface-variant">
              Get an API key from <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" className="text-primary hover:underline">Google AI Studio</a>. Your key is stored securely in your database instance.
            </p>
          </div>
        </div>

      </div>

      {isRanksOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm animate-fade-in"
            onClick={() => setIsRanksOpen(false)}
          />
          <div className="relative w-full max-w-2xl bg-surface-container-high rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl animate-scale-in">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold headline-text text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary">military_tech</span>
                  Ranks
                </h2>
                <p className="text-sm text-on-surface-variant mt-1">Rank increases with your overall score (XP + streak + tasks + books).</p>
              </div>
              <button
                onClick={() => setIsRanksOpen(false)}
                className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-white hover:bg-surface-bright transition-colors"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            <div className="max-h-[60vh] overflow-auto pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {getAllRanks().map(r => (
                  <div
                    key={r.name}
                    className={`p-4 rounded-2xl border ${user?.rank === r.name ? 'border-primary bg-primary/10' : 'border-white/5 bg-surface-container'} transition-colors`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-black text-white headline-text">{r.name}</p>
                      {user?.rank === r.name && (
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary">Current</span>
                      )}
                    </div>
                    <p className="text-xs text-on-surface-variant mt-1">
                      Unlock at <span className="text-white font-bold">{r.minScore.toLocaleString()}</span> score
                      {r.nextMinScore ? (
                        <> · Next at <span className="text-white font-bold">{r.nextMinScore.toLocaleString()}</span></>
                      ) : (
                        <> · <span className="text-tertiary font-bold">Top Rank</span></>
                      )}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default SettingsPage;

