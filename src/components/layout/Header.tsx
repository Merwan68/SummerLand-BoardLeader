import React, { useState } from 'react';
import { useSchool } from '../../context/SchoolContext';
import { getTranslation } from '../../utils/i18n';
import { 
  Menu, 
  ShieldAlert, 
  LogOut, 
  ChevronDown, 
  Sparkles,
  Database,
  Calendar,
  KeyRound,
  Globe
} from 'lucide-react';

interface HeaderProps {
  onOpenMobileNav: () => void;
  onOpenSetup?: () => void;
  onNavigateToSettings?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  onOpenMobileNav, 
  onOpenSetup, 
  onNavigateToSettings 
}) => {
  const { config, lang, setLang, schoolStatus, logout, user, issues, isCloudSynced } = useSchool();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const criticalIssuesCount = issues.filter(i => i.status !== 'Resolved' && i.priority === 'Critical').length;

  const statusBadgeStyle = {
    'Good': 'bg-emerald-50 text-emerald-700 border-emerald-300 ring-emerald-500/20',
    'Needs Attention': 'bg-amber-50 text-amber-800 border-amber-300 ring-amber-500/20',
    'Critical': 'bg-rose-50 text-rose-800 border-rose-300 ring-rose-500/20 animate-pulse'
  }[schoolStatus.status];

  const statusDot = {
    'Good': 'bg-emerald-500',
    'Needs Attention': 'bg-amber-500',
    'Critical': 'bg-rose-500'
  }[schoolStatus.status];

  return (
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200 px-2.5 sm:px-6 py-1.5 sm:py-2.5 no-print">
      <div className="flex items-center justify-between gap-1.5 sm:gap-4 max-w-7xl mx-auto">
        {/* Left: Mobile hamburger menu toggle & School Brand */}
        <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
          <button
            type="button"
            onClick={onOpenMobileNav}
            className="lg:hidden p-1.5 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors flex-shrink-0 cursor-pointer"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h2 className="text-xs sm:text-base lg:text-lg font-black text-slate-900 tracking-tight truncate leading-tight">
                {config.name}
              </h2>
              <span className="hidden md:inline-flex text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 flex-shrink-0">
                {config.type}
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-400 hidden sm:block truncate">
              {getTranslation(lang, 'appSubtitle')} • {config.academic_year}
            </p>
          </div>
        </div>

        {/* Right: Status badge, Cloud Sync, Language toggle, Profile */}
        <div className="flex items-center gap-1 sm:gap-2.5 flex-shrink-0">
          {/* Cloud Database Sync Pill (hidden on mobile, visible on tablet/desktop) */}
          <div 
            title={isCloudSynced ? 'Firebase Firestore: Connected & Synced' : 'Firebase Firestore: Auto-syncing'}
            className="hidden md:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[11px] font-semibold text-slate-700"
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isCloudSynced ? 'bg-emerald-500' : 'bg-blue-500 animate-pulse'}`} />
            <span className="text-slate-500">Firebase:</span>
            <span>{isCloudSynced ? 'Synced' : 'Active'}</span>
          </div>

          {/* School Status Indicator: Compact on mobile, descriptive pill on desktop */}
          <div 
            title={`Overall School Status: ${schoolStatus.status} (${schoolStatus.overallScore}/100)`}
            className={`flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full border text-[10px] sm:text-[11px] font-bold ${statusBadgeStyle}`}
          >
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${statusDot}`} />
            <span className="hidden sm:inline text-[10px] uppercase tracking-wider text-slate-500 font-semibold mr-0.5">Status:</span>
            <span className="whitespace-nowrap">{schoolStatus.status}</span>
          </div>

          {/* Critical Alert Indicator if any (desktop only) */}
          {criticalIssuesCount > 0 && (
            <div className="hidden lg:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-bold animate-bounce">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
              <span>{criticalIssuesCount}</span>
            </div>
          )}

          {/* Language Switcher: Visible on sm+ screens, mobile has it in drawer & profile menu */}
          <div className="hidden sm:flex items-center bg-slate-100 rounded-lg p-0.5 text-[11px] font-semibold">
            <button
              type="button"
              onClick={() => setLang('en')}
              className={`px-2 py-0.5 sm:py-1 rounded-md transition-all ${
                lang === 'en' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLang('am')}
              className={`px-2 py-0.5 sm:py-1 rounded-md transition-all ${
                lang === 'am' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              አማ
            </button>
          </div>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-1 sm:gap-1.5 p-0.5 sm:px-2 sm:py-1 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors text-left cursor-pointer"
            >
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center text-[10px] sm:text-xs font-bold shadow-xs">
                BL
              </div>
              <div className="hidden md:block leading-tight pr-1">
                <span className="text-xs font-bold text-slate-800 block truncate max-w-[110px]">
                  {user?.name || 'Board Leader'}
                </span>
                <span className="text-[10px] text-slate-400 block">Executive</span>
              </div>
              <ChevronDown className="w-3 h-3 text-slate-400 hidden sm:block" />
            </button>

            {profileDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-30" 
                  onClick={() => setProfileDropdownOpen(false)} 
                />
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-40 text-xs divide-y divide-slate-100">
                  <div className="px-3.5 py-2.5">
                    <p className="font-bold text-slate-900 truncate">{user?.name || 'Board Leader'}</p>
                    <p className="text-slate-400 text-[11px] truncate">{user?.email}</p>
                    <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Sole Board Leader
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500">
                        {isCloudSynced ? '☁️ Firebase Synced' : '☁️ Cloud Active'}
                      </span>
                    </div>
                  </div>

                  {/* Mobile Language Switcher inside dropdown */}
                  <div className="px-3.5 py-2 sm:hidden flex items-center justify-between">
                    <span className="text-slate-500 font-medium flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5" /> Language
                    </span>
                    <div className="flex bg-slate-100 rounded-md p-0.5 text-[10px] font-bold">
                      <button
                        type="button"
                        onClick={() => setLang('en')}
                        className={`px-2 py-0.5 rounded ${lang === 'en' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500'}`}
                      >
                        EN
                      </button>
                      <button
                        type="button"
                        onClick={() => setLang('am')}
                        className={`px-2 py-0.5 rounded ${lang === 'am' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500'}`}
                      >
                        አማ
                      </button>
                    </div>
                  </div>

                  <div className="py-1">
                    {onNavigateToSettings && (
                      <button
                        type="button"
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          onNavigateToSettings();
                        }}
                        className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-semibold cursor-pointer"
                      >
                        <KeyRound className="w-4 h-4 text-blue-600" /> Edit Account & Credentials
                      </button>
                    )}

                    {onOpenSetup && (
                      <button
                        type="button"
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          onOpenSetup();
                        }}
                        className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-medium cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4 text-amber-500" /> Setup Wizard
                      </button>
                    )}
                  </div>

                  <div className="py-1">
                    <button
                      type="button"
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        logout();
                      }}
                      className="w-full text-left px-3.5 py-2 hover:bg-rose-50 text-rose-600 font-semibold flex items-center gap-2 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" /> {getTranslation(lang, 'logout')}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
