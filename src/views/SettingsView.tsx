import React, { useState } from 'react';
import { useSchool } from '../context/SchoolContext';
import { GradingRule } from '../types';
import { 
  Settings, 
  Building2, 
  Award, 
  ShieldCheck, 
  Sliders, 
  KeyRound, 
  Download, 
  Upload, 
  RefreshCcw, 
  Check, 
  AlertCircle, 
  Lock,
  Layers
} from 'lucide-react';
import { getTranslation } from '../utils/i18n';

interface SettingsViewProps {
  initialSection?: 'school' | 'grading' | 'status' | 'account' | 'backup';
}

export const SettingsView: React.FC<SettingsViewProps> = ({ initialSection = 'school' }) => {
  const { 
    config, 
    updateConfig, 
    lang, 
    setLang, 
    user, 
    updateLeaderAccount,
    changePassword, 
    exportDatabaseJson, 
    importDatabaseJson, 
    clearAllData,
    resetSetupPrompt 
  } = useSchool();

  const [activeSection, setActiveSection] = useState<'school' | 'grading' | 'status' | 'account' | 'backup'>(initialSection);

  // School General
  const [name, setName] = useState(config.name);
  const [academicYear, setAcademicYear] = useState(config.academic_year);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  // Account Profile (Name & Email)
  const [accountName, setAccountName] = useState(user?.name || 'Board Leader');
  const [accountEmail, setAccountEmail] = useState(user?.email || '');
  const [profileMsg, setProfileMsg] = useState<{ text: string; isError: boolean } | null>(null);

  // Password Change
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ text: string; isError: boolean } | null>(null);

  // Backup file upload
  const [importJsonText, setImportJsonText] = useState('');
  const [backupMsg, setBackupMsg] = useState<{ text: string; isError: boolean } | null>(null);

  // Thresholds state
  const [thresholds, setThresholds] = useState(config.thresholds);
  const [weights, setWeights] = useState(config.status_weights);

  // Grading rules state
  const [gradingRules, setGradingRules] = useState<GradingRule[]>(config.grading_rules);

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    updateConfig({
      name,
      academic_year: academicYear
    });
    setSaveMsg('School information updated successfully.');
    setTimeout(() => setSaveMsg(null), 3000);
  };

  const handleSaveThresholds = (e: React.FormEvent) => {
    e.preventDefault();
    updateConfig({
      thresholds,
      status_weights: weights
    });
    setSaveMsg('Calculation thresholds and weights updated.');
    setTimeout(() => setSaveMsg(null), 3000);
  };

  const handleSaveGrading = (e: React.FormEvent) => {
    e.preventDefault();
    updateConfig({
      grading_rules: gradingRules,
      thresholds: {
        ...config.thresholds,
        pass_mark: thresholds.pass_mark
      }
    });
    setSaveMsg('Grading scale rules updated.');
    setTimeout(() => setSaveMsg(null), 3000);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    if (!accountName.trim()) {
      setProfileMsg({ text: 'Please enter a valid name or title.', isError: true });
      return;
    }
    if (!accountEmail.trim() || !accountEmail.includes('@')) {
      setProfileMsg({ text: 'Please enter a valid email address.', isError: true });
      return;
    }

    const res = await updateLeaderAccount({
      name: accountName.trim(),
      email: accountEmail.trim().toLowerCase()
    });

    if (res.success) {
      setProfileMsg({ text: 'Board Leader profile successfully saved to Firebase database.', isError: false });
      setTimeout(() => setProfileMsg(null), 4000);
    } else {
      setProfileMsg({ text: res.error || 'Failed to update profile.', isError: true });
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ text: 'New passwords do not match.', isError: true });
      return;
    }

    const res = await changePassword(oldPassword, newPassword);
    if (!res.success) {
      setPasswordMsg({ text: res.message, isError: true });
    } else {
      setPasswordMsg({ text: 'Password successfully changed.', isError: false });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  const handleDownloadBackup = () => {
    const jsonStr = exportDatabaseJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `summerland_academy_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = () => {
    if (!importJsonText.trim()) return;
    const ok = importDatabaseJson(importJsonText.trim());
    if (ok) {
      setBackupMsg({ text: 'Database successfully imported and restored!', isError: false });
      setImportJsonText('');
    } else {
      setBackupMsg({ text: 'Failed to parse JSON backup. Please check format.', isError: true });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
        <h1 className="text-xl font-black text-slate-900 tracking-tight">
          {getTranslation(lang, 'navSettings')} & Configuration
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage Summerland Academy institutional parameters, status weights, grading scale, and security.
        </p>
      </div>

      {saveMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{saveMsg}</span>
        </div>
      )}

      {/* Main Settings Tabs Layout */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Navigation Sidebar */}
        <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-xs space-y-1 md:col-span-1 self-start">
          <button
            type="button"
            onClick={() => setActiveSection('school')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-colors ${
              activeSection === 'school' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Building2 className="w-4 h-4" /> School Profile
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('grading')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-colors ${
              activeSection === 'grading' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Award className="w-4 h-4" /> Grading Scale
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('status')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-colors ${
              activeSection === 'status' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Sliders className="w-4 h-4" /> Status & Benchmarks
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('account')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-colors ${
              activeSection === 'account' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <KeyRound className="w-4 h-4" /> Board Leader Account
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('backup')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-colors ${
              activeSection === 'backup' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Download className="w-4 h-4" /> Backup & Data Restore
          </button>
        </div>

        {/* Section Content */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs md:col-span-3">
          {/* 1. School Profile */}
          {activeSection === 'school' && (
            <form onSubmit={handleSaveGeneral} className="space-y-5">
              <div>
                <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                  Institutional Profile
                </h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    School Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    School Structure / Type
                  </label>
                  <input
                    type="text"
                    disabled
                    value={config.type}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-500 font-semibold"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Configured for Kindergarten (KG 1–3) & Elementary (Grade 1–Grade 8) education tiers.</p>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Academic Year
                  </label>
                  <input
                    type="text"
                    required
                    value={academicYear}
                    onChange={e => setAcademicYear(e.target.value)}
                    placeholder="2019 E.C. / 2026–2027 G.C."
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono font-semibold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Language Interface
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setLang('en')}
                      className={`px-4 py-2 rounded-lg text-xs font-bold border ${
                        lang === 'en' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 border-slate-300'
                      }`}
                    >
                      English
                    </button>
                    <button
                      type="button"
                      onClick={() => setLang('am')}
                      className={`px-4 py-2 rounded-lg text-xs font-bold border ${
                        lang === 'am' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 border-slate-300'
                      }`}
                    >
                      አማርኛ (Amharic)
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={resetSetupPrompt}
                    className="text-xs text-blue-600 hover:underline font-semibold"
                  >
                    Reset and Re-run First-Time Setup Wizard
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  Save School Profile
                </button>
              </div>
            </form>
          )}

          {/* 2. Grading Scale */}
          {activeSection === 'grading' && (
            <form onSubmit={handleSaveGrading} className="space-y-5">
              <div>
                <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                  Academic Grading Scale Configuration
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Adjust score intervals and grade designations (A+ to F).
                </p>
              </div>

              <div className="flex items-center gap-3 p-3 bg-blue-50/70 rounded-xl border border-blue-100">
                <label className="text-xs font-bold text-slate-800">
                  Minimum Institutional Pass Mark (%):
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={thresholds.pass_mark}
                  onChange={e => setThresholds({ ...thresholds, pass_mark: Number(e.target.value) || 50 })}
                  className="w-20 px-2.5 py-1 text-xs border border-slate-300 rounded-lg text-center font-bold bg-white"
                />
              </div>

              <div className="space-y-2">
                {gradingRules.map((rule, idx) => (
                  <div key={idx} className="grid grid-cols-4 gap-2 items-center p-2.5 rounded-lg border border-slate-200 bg-slate-50">
                    <input
                      type="text"
                      value={rule.grade}
                      onChange={e => {
                        const copy = [...gradingRules];
                        copy[idx].grade = e.target.value;
                        setGradingRules(copy);
                      }}
                      className="px-2 py-1 text-xs border border-slate-300 rounded font-bold text-center bg-white text-blue-700"
                    />
                    <div className="flex items-center gap-1 text-xs">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={rule.min_score}
                        onChange={e => {
                          const copy = [...gradingRules];
                          copy[idx].min_score = Number(e.target.value);
                          setGradingRules(copy);
                        }}
                        className="w-16 px-1.5 py-1 text-xs border border-slate-300 rounded text-center bg-white"
                      />
                      <span>to</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={rule.max_score}
                        onChange={e => {
                          const copy = [...gradingRules];
                          copy[idx].max_score = Number(e.target.value);
                          setGradingRules(copy);
                        }}
                        className="w-16 px-1.5 py-1 text-xs border border-slate-300 rounded text-center bg-white"
                      />
                    </div>
                    <input
                      type="text"
                      value={rule.description}
                      onChange={e => {
                        const copy = [...gradingRules];
                        copy[idx].description = e.target.value;
                        setGradingRules(copy);
                      }}
                      className="col-span-2 px-2 py-1 text-xs border border-slate-300 rounded bg-white text-slate-700"
                    />
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  Save Grading System
                </button>
              </div>
            </form>
          )}

          {/* 3. Status Benchmarks & Calculation Weights */}
          {activeSection === 'status' && (
            <form onSubmit={handleSaveThresholds} className="space-y-5">
              <div>
                <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                  School Status Calculation Logic
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Adjust benchmarks and weighting for automatic status evaluation (🟢 Good, 🟡 Needs Attention, 🔴 Critical).
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Evaluation Benchmarks (%)</h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-slate-600 block mb-1 font-semibold">Attendance Good Benchmark</label>
                    <input
                      type="number"
                      value={thresholds.attendance_good}
                      onChange={e => setThresholds({ ...thresholds, attendance_good: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 block mb-1 font-semibold">Attendance Warning Benchmark</label>
                    <input
                      type="number"
                      value={thresholds.attendance_warning}
                      onChange={e => setThresholds({ ...thresholds, attendance_warning: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 block mb-1 font-semibold">Academic Good Benchmark</label>
                    <input
                      type="number"
                      value={thresholds.academic_good}
                      onChange={e => setThresholds({ ...thresholds, academic_good: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 block mb-1 font-semibold">Academic Warning Benchmark</label>
                    <input
                      type="number"
                      value={thresholds.academic_warning}
                      onChange={e => setThresholds({ ...thresholds, academic_warning: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-bold"
                    />
                  </div>
                </div>

                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider pt-2">Calculation Factor Weights (%)</h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-slate-600 block mb-1 font-semibold">Student Attendance Weight</label>
                    <input
                      type="number"
                      value={weights.student_attendance}
                      onChange={e => setWeights({ ...weights, student_attendance: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 block mb-1 font-semibold">Teacher Attendance Weight</label>
                    <input
                      type="number"
                      value={weights.teacher_attendance}
                      onChange={e => setWeights({ ...weights, teacher_attendance: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 block mb-1 font-semibold">Academic Score Weight</label>
                    <input
                      type="number"
                      value={weights.academic_performance}
                      onChange={e => setWeights({ ...weights, academic_performance: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 block mb-1 font-semibold">Pass Rate Weight</label>
                    <input
                      type="number"
                      value={weights.pass_rate}
                      onChange={e => setWeights({ ...weights, pass_rate: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  Save Status Calculation Rules
                </button>
              </div>
            </form>
          )}

          {/* 4. Board Leader Account */}
          {activeSection === 'account' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                  Board Leader Profile & Credentials
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Manage your personal credentials and identity for executive access to Summerland Academy.
                </p>
              </div>

              {/* Single Account Security Notice */}
              <div className="p-3.5 bg-blue-50/80 rounded-xl border border-blue-200 text-xs text-blue-900 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-blue-800">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>Single Executive Account Policy</span>
                </div>
                <p className="text-[11px] text-blue-700">
                  This web app is strictly locked to this single Board Leader account. Public registration of secondary accounts is blocked. You may update your title/name, authorized email, and password below.
                </p>
              </div>

              {/* Form 1: Identity & Email */}
              <form onSubmit={handleSaveProfile} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Profile Information (Name & Email)
                </h4>

                {profileMsg && (
                  <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                    profileMsg.isError ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  }`}>
                    {profileMsg.isError ? <AlertCircle className="w-4 h-4 flex-shrink-0" /> : <Check className="w-4 h-4 flex-shrink-0" />}
                    <span>{profileMsg.text}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Full Name / Title
                    </label>
                    <input
                      type="text"
                      required
                      value={accountName}
                      onChange={e => setAccountName(e.target.value)}
                      placeholder="e.g. Board Leader Merwan"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Authorized Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={accountEmail}
                      onChange={e => setAccountEmail(e.target.value)}
                      placeholder="e.g. merwanabdusomed@gmail.com"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white font-medium"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                  >
                    Save Profile Changes
                  </button>
                </div>
              </form>

              {/* Form 2: Password Management */}
              <form onSubmit={handleChangePassword} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Update Account Password
                </h4>

                {passwordMsg && (
                  <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                    passwordMsg.isError ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  }`}>
                    {passwordMsg.isError ? <AlertCircle className="w-4 h-4 flex-shrink-0" /> : <Check className="w-4 h-4 flex-shrink-0" />}
                    <span>{passwordMsg.text}</span>
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Current Password
                    </label>
                    <input
                      type="password"
                      required
                      value={oldPassword}
                      onChange={e => setOldPassword(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                        New Password
                      </label>
                      <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        placeholder="Min 6 characters"
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter new password"
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                  >
                    Change Password
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* 5. Backup & Data Restore */}
          {activeSection === 'backup' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                  Database Backup & Restoration
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Export complete school operational records to JSON or restore from an existing backup file.
                </p>
              </div>

              {backupMsg && (
                <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                  backupMsg.isError ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                }`}>
                  <span>{backupMsg.text}</span>
                </div>
              )}

              {/* Export Card */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                <h4 className="text-xs font-bold text-slate-800">Export Institutional Records</h4>
                <p className="text-xs text-slate-500">
                  Creates a downloadable JSON snapshot containing students, teachers, marks, attendance, and settings.
                </p>
                <button
                  type="button"
                  onClick={handleDownloadBackup}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" /> Export Backup File (.JSON)
                </button>
              </div>

              {/* Import Card */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                <h4 className="text-xs font-bold text-slate-800">Restore from JSON</h4>
                <p className="text-xs text-slate-500">
                  Paste backup JSON content to restore school database state.
                </p>
                <textarea
                  rows={4}
                  value={importJsonText}
                  onChange={e => setImportJsonText(e.target.value)}
                  placeholder="Paste database JSON string here..."
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg bg-white"
                />
                <button
                  type="button"
                  onClick={handleImportBackup}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  <Upload className="w-4 h-4" /> Restore Database
                </button>
              </div>

              {/* Danger Zone: Clear */}
              <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/60 space-y-2">
                <h4 className="text-xs font-bold text-rose-800">Reset School Database</h4>
                <p className="text-xs text-rose-600">
                  Resets operational data (students, marks, attendance, issues) back to clean zero state.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Are you sure you want to clear all operational records? This action cannot be undone.')) {
                      clearAllData();
                      alert('Database reset to clean zero state.');
                    }
                  }}
                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg"
                >
                  Clear Operational Data
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
