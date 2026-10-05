import React from 'react';
import { useSchool } from '../../context/SchoolContext';
import { getTranslation } from '../../utils/i18n';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  School,
  Layers,
  BookOpen,
  CalendarCheck,
  Award,
  Target,
  AlertCircle,
  Building,
  FileText,
  History,
  Settings,
  X,
  LogOut,
  Sparkles
} from 'lucide-react';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenSetup?: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  isOpen,
  onClose,
  currentTab,
  onSelectTab,
  onOpenSetup
}) => {
  const { config, lang, setLang, logout, user } = useSchool();

  if (!isOpen) return null;

  const navItems = [
    { id: 'dashboard', label: getTranslation(lang, 'navDashboard'), icon: LayoutDashboard },
    { id: 'students', label: getTranslation(lang, 'navStudents'), icon: Users },
    { id: 'teachers', label: getTranslation(lang, 'navTeachers'), icon: GraduationCap },
    { id: 'classes', label: getTranslation(lang, 'navClasses'), icon: School },
    { id: 'grades', label: getTranslation(lang, 'navGrades'), icon: Layers },
    { id: 'subjects', label: getTranslation(lang, 'navSubjects'), icon: BookOpen },
    { id: 'attendance_student', label: getTranslation(lang, 'navStudentAttendance'), icon: CalendarCheck },
    { id: 'attendance_teacher', label: getTranslation(lang, 'navTeacherAttendance'), icon: CalendarCheck },
    { id: 'academics_assessments', label: getTranslation(lang, 'navAssessments'), icon: Award },
    { id: 'academics_marks', label: getTranslation(lang, 'navMarks'), icon: Award },
    { id: 'academics_performance', label: getTranslation(lang, 'navPerformance'), icon: Award },
    { id: 'targets', label: getTranslation(lang, 'navTargets'), icon: Target },
    { id: 'issues', label: getTranslation(lang, 'navIssues'), icon: AlertCircle },
    { id: 'facilities', label: getTranslation(lang, 'navFacilities'), icon: Building },
    { id: 'reports', label: getTranslation(lang, 'navReports'), icon: FileText },
    { id: 'activity', label: getTranslation(lang, 'navActivityLog'), icon: History },
    { id: 'settings', label: getTranslation(lang, 'navSettings'), icon: Settings },
  ];

  return (
    <div className="fixed inset-0 z-50 lg:hidden overflow-hidden no-print">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 left-0 max-w-xs w-full bg-slate-900 shadow-2xl flex flex-col z-50 text-slate-300">
        {/* Top Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 font-black text-sm">
              S
            </div>
            <div>
              <h2 className="text-sm font-bold text-white leading-none">{config.name}</h2>
              <span className="text-[10px] text-amber-400">{config.academic_year}</span>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Nav Items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.id || (item.id === 'settings' && currentTab === 'settings_account');
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectTab(item.id);
                  onClose();
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 space-y-3">
          {/* Language Switcher */}
          <div className="flex items-center justify-between bg-slate-800/80 p-1.5 rounded-xl border border-slate-700/50">
            <span className="text-[11px] text-slate-400 font-medium pl-1.5">Language:</span>
            <div className="flex gap-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`px-3 py-1 rounded-lg transition-all ${lang === 'en' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setLang('am')}
                className={`px-3 py-1 rounded-lg transition-all ${lang === 'am' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                አማርኛ
              </button>
            </div>
          </div>

          {onOpenSetup && (
            <button
              type="button"
              onClick={() => {
                onOpenSetup();
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-slate-800 text-xs font-semibold text-amber-400 hover:bg-slate-700"
            >
              <Sparkles className="w-3.5 h-3.5" /> Launch Setup Wizard
            </button>
          )}

          <div className="flex items-center justify-between pt-2">
            <div>
              <span className="text-xs font-bold text-white block truncate">{user?.name || 'Board Leader'}</span>
              <span className="text-[10px] text-slate-400 block">Summerland Academy</span>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                logout();
              }}
              className="p-2 text-rose-400 hover:bg-rose-950/40 rounded-lg"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
