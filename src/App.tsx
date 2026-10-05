import React, { useState, useEffect } from 'react';
import { SchoolProvider, useSchool } from './context/SchoolContext';
import { Layout } from './components/layout/Layout';
import { LoginView } from './views/LoginView';
import { DashboardView } from './views/DashboardView';
import { StudentsView } from './views/StudentsView';
import { TeachersView } from './views/TeachersView';
import { ClassesView } from './views/ClassesView';
import { GradesView } from './views/GradesView';
import { SubjectsView } from './views/SubjectsView';
import { AttendanceView } from './views/AttendanceView';
import { AcademicsView } from './views/AcademicsView';
import { TargetsView } from './views/TargetsView';
import { IssuesView } from './views/IssuesView';
import { FacilitiesView } from './views/FacilitiesView';
import { ReportsView } from './views/ReportsView';
import { ActivityLogView } from './views/ActivityLogView';
import { SettingsView } from './views/SettingsView';

// Map browser URL pathname to internal tab identifier
const pathToTab = (pathname: string): string => {
  const clean = pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
  if (!clean || clean === 'dashboard' || clean === 'login') return 'dashboard';
  if (clean === 'students') return 'students';
  if (clean === 'teachers') return 'teachers';
  if (clean === 'classes') return 'classes';
  if (clean === 'grades') return 'grades';
  if (clean === 'subjects') return 'subjects';
  if (clean === 'attendance' || clean === 'attendance/student' || clean === 'attendance_student') return 'attendance_student';
  if (clean === 'attendance/teacher' || clean === 'attendance_teacher') return 'attendance_teacher';
  if (clean === 'academic' || clean === 'academics' || clean === 'academics/marks' || clean === 'academics_marks') return 'academics_marks';
  if (clean === 'academics/assessments' || clean === 'academics_assessments') return 'academics_assessments';
  if (clean === 'academics/performance' || clean === 'academics_performance') return 'academics_performance';
  if (clean === 'targets') return 'targets';
  if (clean === 'issues') return 'issues';
  if (clean === 'facilities') return 'facilities';
  if (clean === 'reports') return 'reports';
  if (clean === 'activity' || clean === 'audit') return 'activity';
  if (clean === 'settings/account' || clean === 'settings_account') return 'settings_account';
  if (clean === 'settings') return 'settings';
  return 'dashboard';
};

// Map internal tab to URL path
const tabToPath = (tab: string): string => {
  switch (tab) {
    case 'dashboard':
      return '/';
    case 'settings_account':
      return '/settings/account';
    case 'attendance_student':
      return '/attendance/student';
    case 'attendance_teacher':
      return '/attendance/teacher';
    case 'academics_assessments':
      return '/academics/assessments';
    case 'academics_marks':
      return '/academics/marks';
    case 'academics_performance':
      return '/academics/performance';
    default:
      return `/${tab}`;
  }
};

function AppContent() {
  const { isAuthenticated } = useSchool();
  const [currentTab, setCurrentTab] = useState<string>(() => {
    return pathToTab(window.location.pathname);
  });

  // Modal triggers from dashboard quick actions
  const [studentModalTrigger, setStudentModalTrigger] = useState(false);
  const [teacherModalTrigger, setTeacherModalTrigger] = useState(false);
  const [classModalTrigger, setClassModalTrigger] = useState(false);
  const [targetModalTrigger, setTargetModalTrigger] = useState(false);
  const [issueModalTrigger, setIssueModalTrigger] = useState(false);

  // Synchronize browser history when back/forward button is pressed
  useEffect(() => {
    const handlePopState = () => {
      setCurrentTab(pathToTab(window.location.pathname));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleSelectTab = (tab: string) => {
    // Clear quick triggers
    setStudentModalTrigger(false);
    setTeacherModalTrigger(false);
    setClassModalTrigger(false);
    setTargetModalTrigger(false);
    setIssueModalTrigger(false);

    setCurrentTab(tab);
    const targetPath = tabToPath(tab);
    if (window.location.pathname !== targetPath) {
      window.history.pushState(null, '', targetPath);
    }
  };

  if (!isAuthenticated) {
    return <LoginView />;
  }

  const renderActiveView = () => {
    switch (currentTab) {
      case 'dashboard':
        return (
          <DashboardView
            onNavigate={(tab) => handleSelectTab(tab)}
            onOpenAddStudent={() => {
              handleSelectTab('students');
              setStudentModalTrigger(true);
            }}
            onOpenAddTeacher={() => {
              handleSelectTab('teachers');
              setTeacherModalTrigger(true);
            }}
            onOpenAddClass={() => {
              handleSelectTab('classes');
              setClassModalTrigger(true);
            }}
            onOpenAddTarget={() => {
              handleSelectTab('targets');
              setTargetModalTrigger(true);
            }}
            onOpenAddIssue={() => {
              handleSelectTab('issues');
              setIssueModalTrigger(true);
            }}
          />
        );

      case 'students':
        return (
          <StudentsView
            initialOpenAdd={studentModalTrigger}
          />
        );

      case 'teachers':
        return (
          <TeachersView
            initialOpenAdd={teacherModalTrigger}
          />
        );

      case 'classes':
        return (
          <ClassesView
            initialOpenAdd={classModalTrigger}
          />
        );

      case 'grades':
        return <GradesView />;

      case 'subjects':
        return <SubjectsView />;

      case 'attendance':
      case 'attendance_student':
        return <AttendanceView initialSubTab="student" />;

      case 'attendance_teacher':
        return <AttendanceView initialSubTab="teacher" />;

      case 'academics':
      case 'academics_marks':
        return <AcademicsView initialSubTab="marks" />;

      case 'academics_assessments':
        return <AcademicsView initialSubTab="assessments" />;

      case 'academics_performance':
        return <AcademicsView initialSubTab="performance" />;

      case 'targets':
        return (
          <TargetsView
            initialOpenAdd={targetModalTrigger}
          />
        );

      case 'issues':
        return (
          <IssuesView
            initialOpenAdd={issueModalTrigger}
          />
        );

      case 'facilities':
        return <FacilitiesView />;

      case 'reports':
        return <ReportsView />;

      case 'activity':
        return <ActivityLogView />;

      case 'settings':
        return <SettingsView initialSection="school" />;

      case 'settings_account':
        return <SettingsView initialSection="account" />;

      default:
        return (
          <DashboardView
            onNavigate={(tab) => handleSelectTab(tab)}
            onOpenAddStudent={() => handleSelectTab('students')}
            onOpenAddTeacher={() => handleSelectTab('teachers')}
            onOpenAddClass={() => handleSelectTab('classes')}
            onOpenAddTarget={() => handleSelectTab('targets')}
            onOpenAddIssue={() => handleSelectTab('issues')}
          />
        );
    }
  };

  return (
    <Layout currentTab={currentTab} onSelectTab={handleSelectTab}>
      {renderActiveView()}
    </Layout>
  );
}

export default function App() {
  return (
    <SchoolProvider>
      <AppContent />
    </SchoolProvider>
  );
}
