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
  LogOut,
  Sparkles
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenSetup?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab, onOpenSetup }) => {
  const { config, lang, logout, user } = useSchool();

  const navItems = [
    { id: 'dashboard', label: getTranslation(lang, 'navDashboard'), icon: LayoutDashboard },
    { id: 'students', label: getTranslation(lang, 'navStudents'), icon: Users },
    { id: 'teachers', label: getTranslation(lang, 'navTeachers'), icon: GraduationCap },
    { id: 'classes', label: getTranslation(lang, 'navClasses'), icon: School },
    { id: 'grades', label: getTranslation(lang, 'navGrades'), icon: Layers },
    { id: 'subjects', label: getTranslation(lang, 'navSubjects'), icon: BookOpen },
    { 
      id: 'attendance', 
      label: getTranslation(lang, 'navAttendance'), 
      icon: CalendarCheck,
      subItems: [
        { id: 'attendance_student', label: getTranslation(lang, 'navStudentAttendance') },
        { id: 'attendance_teacher', label: getTranslation(lang, 'navTeacherAttendance') },
      ]
    },
    { 
      id: 'academics', 
      label: getTranslation(lang, 'navAcademic'), 
      icon: Award,
      subItems: [
        { id: 'academics_assessments', label: getTranslation(lang, 'navAssessments') },
        { id: 'academics_marks', label: getTranslation(lang, 'navMarks') },
        { id: 'academics_performance', label: getTranslation(lang, 'navPerformance') },
      ]
    },
    { id: 'targets', label: getTranslation(lang, 'navTargets'), icon: Target },
    { id: 'issues', label: getTranslation(lang, 'navIssues'), icon: AlertCircle },
    { id: 'facilities', label: getTranslation(lang, 'navFacilities'), icon: Building },
    { id: 'reports', label: getTranslation(lang, 'navReports'), icon: FileText },
    { id: 'activity', label: getTranslation(lang, 'navActivityLog'), icon: History },
    { id: 'settings', label: getTranslation(lang, 'navSettings'), icon: Settings },
  ];

  return (
    <aside className="hidden lg:flex lg:flex-col w-64 bg-slate-900 border-r border-slate-800 text-slate-300 h-screen sticky top-0 flex-shrink-0 z-30 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-slate-950 font-black text-lg shadow-md shadow-amber-500/20">
            S
          </div>
          <div className="overflow-hidden">
            <h1 className="text-sm font-bold text-white tracking-tight truncate leading-tight">
              {config.name}
            </h1>
            <p className="text-[11px] font-medium text-amber-400 truncate">
              {config.type}
            </p>
          </div>
        </div>
        
        {/* Academic Session Pill */}
        <div className="mt-3 px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700/50 flex items-center justify-between text-[11px]">
          <span className="text-slate-400">Academic Year:</span>
          <span className="font-semibold text-slate-200">{config.academic_year}</span>
        </div>
      </div>

      {/* Nav Menu Items */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentTab === item.id || (item.id === 'settings' && currentTab === 'settings_account') || (item.subItems && item.subItems.some(sub => currentTab === sub.id));

          return (
            <div key={item.id} className="space-y-0.5">
              <button
                type="button"
                onClick={() => onSelectTab(item.subItems ? item.subItems[0].id : item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 text-left ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
                }`}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="truncate flex-1">{item.label}</span>
              </button>

              {/* Sub-items if expanded */}
              {item.subItems && isActive && (
                <div className="pl-9 pr-2 py-1 space-y-0.5">
                  {item.subItems.map(sub => {
                    const isSubActive = currentTab === sub.id;
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => onSelectTab(sub.id)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${
                          isSubActive
                            ? 'text-amber-400 bg-slate-800/90 font-bold'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                        }`}
                      >
                        • {sub.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Board Leader Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60 space-y-2">
        {onOpenSetup && (
          <button
            type="button"
            onClick={onOpenSetup}
            className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-[11px] font-semibold text-amber-400 border border-amber-500/20 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" /> Launch Setup Wizard
          </button>
        )}

        <div className="flex items-center justify-between px-2 pt-1">
          <div className="overflow-hidden">
            <span className="text-xs font-bold text-white block truncate">
              {user?.name || 'Board Leader'}
            </span>
            <span className="text-[10px] text-slate-400 block truncate">
              Executive Administrator
            </span>
          </div>

          <button
            type="button"
            onClick={logout}
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
