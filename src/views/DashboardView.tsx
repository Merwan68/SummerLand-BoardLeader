import React, { useMemo } from 'react';
import { useSchool } from '../context/SchoolContext';
import { getTranslation } from '../utils/i18n';
import { StatCard } from '../components/common/StatCard';
import { TrendLineChart, SimpleBarChart, DonutChart } from '../components/charts/Charts';
import { 
  Users, 
  GraduationCap, 
  School, 
  BookOpen, 
  CalendarCheck, 
  Award, 
  TrendingUp, 
  CheckCircle2, 
  AlertTriangle, 
  AlertOctagon, 
  Plus, 
  FileText, 
  Target, 
  AlertCircle, 
  ArrowUpRight, 
  Activity,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';
import { calculateStudentAttendancePercentage, calculateTeacherAttendancePercentage, calculateAcademicAverage, calculatePassRate } from '../utils/calculations';

interface DashboardViewProps {
  onNavigate: (tab: string) => void;
  onOpenAddStudent: () => void;
  onOpenAddTeacher: () => void;
  onOpenAddClass: () => void;
  onOpenAddTarget: () => void;
  onOpenAddIssue: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onOpenAddStudent,
  onOpenAddTeacher,
  onOpenAddClass,
  onOpenAddTarget,
  onOpenAddIssue
}) => {
  const { 
    config, 
    lang, 
    schoolStatus, 
    students, 
    teachers, 
    classes, 
    subjects, 
    studentAttendance, 
    teacherAttendance, 
    marks, 
    assessments, 
    targets, 
    issues, 
    facilities, 
    grades 
  } = useSchool();

  // Real KPIs calculations
  const totalStudents = students.length;
  const activeStudents = students.filter(s => s.status === 'Active').length;
  
  const totalTeachers = teachers.length;
  const activeTeachers = teachers.filter(t => t.employment_status === 'Active').length;

  const totalClasses = classes.length;
  const totalSubjects = subjects.length;

  const studentAttPct = calculateStudentAttendancePercentage(studentAttendance);
  const teacherAttPct = calculateTeacherAttendancePercentage(teacherAttendance);
  const academicAvg = calculateAcademicAverage(marks, assessments);
  const passRate = calculatePassRate(marks, assessments, config.thresholds.pass_mark);

  // Recent attendance trend (aggregating records by date)
  const attendanceTrendData = useMemo(() => {
    if (studentAttendance.length === 0) return [];
    
    // Group student attendance by date
    const dateGroups = new Map<string, { present: number; total: number }>();
    studentAttendance.forEach(rec => {
      const g = dateGroups.get(rec.date) || { present: 0, total: 0 };
      if (rec.status === 'present') g.present++;
      g.total++;
      dateGroups.set(rec.date, g);
    });

    // Sort dates ascending
    const sortedDates = Array.from(dateGroups.keys()).sort();
    // Take the last 7 recorded dates
    const recentDates = sortedDates.slice(-7);

    return recentDates.map(date => {
      const g = dateGroups.get(date)!;
      const pct = Math.round((g.present / g.total) * 100);
      
      // Also calculate teacher attendance for this date if exists
      const teachForDate = teacherAttendance.filter(t => t.date === date);
      let teachPct: number | undefined = undefined;
      if (teachForDate.length > 0) {
        const tp = teachForDate.filter(t => t.status === 'present').length;
        teachPct = Math.round((tp / teachForDate.length) * 100);
      }

      // Format date label e.g. "Sep 12"
      const dateParts = date.split('-');
      const label = dateParts.length === 3 ? `${dateParts[1]}/${dateParts[2]}` : date;

      return {
        label,
        value: pct,
        secondaryValue: teachPct
      };
    });
  }, [studentAttendance, teacherAttendance]);

  // Performance by Grade Bar Chart
  const gradePerformanceData = useMemo(() => {
    if (marks.length === 0 || assessments.length === 0) return [];

    const assessmentMap = new Map(assessments.map(a => [a.id, a]));
    const gradeMap = new Map(grades.map(g => [g.id, g.name]));

    // Group scores by grade_id
    const gradeScores = new Map<string, { totalNormalized: number; count: number }>();

    marks.forEach(m => {
      const asm = assessmentMap.get(m.assessment_id);
      if (asm && asm.max_score > 0) {
        const norm = (m.score / asm.max_score) * 100;
        const g = gradeScores.get(asm.grade_id) || { totalNormalized: 0, count: 0 };
        g.totalNormalized += norm;
        g.count++;
        gradeScores.set(asm.grade_id, g);
      }
    });

    return Array.from(gradeScores.entries()).map(([gradeId, stats]) => {
      const avg = Math.round((stats.totalNormalized / stats.count) * 10) / 10;
      return {
        label: gradeMap.get(gradeId) || 'Grade',
        value: avg
      };
    });
  }, [marks, assessments, grades]);

  // Pass vs Fail distribution for Donut Chart
  const passFailDistribution = useMemo(() => {
    if (marks.length === 0 || assessments.length === 0) return [];
    
    const assessmentMap = new Map(assessments.map(a => [a.id, a]));
    let passed = 0;
    let failed = 0;

    marks.forEach(m => {
      const asm = assessmentMap.get(m.assessment_id);
      if (asm && asm.max_score > 0) {
        const pct = (m.score / asm.max_score) * 100;
        if (pct >= config.thresholds.pass_mark) passed++;
        else failed++;
      }
    });

    if (passed + failed === 0) return [];

    return [
      { label: 'Passed', value: passed, color: '#10b981' },
      { label: 'Needs Improvement / Failed', value: failed, color: '#ef4444' }
    ];
  }, [marks, assessments, config.thresholds.pass_mark]);

  // Open issues count
  const openIssues = issues.filter(i => i.status !== 'Resolved');
  const criticalIssues = openIssues.filter(i => i.priority === 'Critical');

  // School status styling
  const statusConfig = {
    'Good': {
      border: 'border-emerald-300 bg-gradient-to-br from-emerald-50 via-white to-emerald-50/30',
      icon: CheckCircle2,
      iconColor: 'text-emerald-600 bg-emerald-100',
      tagColor: 'bg-emerald-600 text-white',
      badgeText: '🟢 All Core Metrics Stable'
    },
    'Needs Attention': {
      border: 'border-amber-300 bg-gradient-to-br from-amber-50 via-white to-amber-50/30',
      icon: AlertTriangle,
      iconColor: 'text-amber-600 bg-amber-100',
      tagColor: 'bg-amber-600 text-white',
      badgeText: '🟡 Attention Required'
    },
    'Critical': {
      border: 'border-rose-400 bg-gradient-to-br from-rose-50 via-white to-rose-50/40',
      icon: AlertOctagon,
      iconColor: 'text-rose-600 bg-rose-100',
      tagColor: 'bg-rose-600 text-white',
      badgeText: '🔴 Urgent Action Required'
    }
  }[schoolStatus.status];

  const StatusIcon = statusConfig.icon;

  return (
    <div className="space-y-6">
      {/* Top Banner / Executive Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 text-white p-4 sm:p-6 lg:p-7 rounded-2xl shadow-xl shadow-slate-900/10">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500 text-slate-950">
              Board Leader Briefing
            </span>
            <span className="text-[11px] sm:text-xs text-slate-400">
              {config.academic_year}
            </span>
          </div>
          <h1 className="text-lg sm:text-2xl font-black tracking-tight text-white">
            {config.name}
          </h1>
          <p className="text-xs text-slate-300 max-w-xl hidden sm:block">
            Real-time school performance, kindergarten & elementary monitoring, academic targets, and administrative health.
          </p>
        </div>

        {/* Quick Action Buttons Bar */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onOpenAddStudent}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> {getTranslation(lang, 'addStudent')}
          </button>
          <button
            type="button"
            onClick={() => onNavigate('attendance_student')}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-all cursor-pointer"
          >
            <CalendarCheck className="w-3.5 h-3.5 text-blue-400" /> {getTranslation(lang, 'recordAttendance')}
          </button>
          <button
            type="button"
            onClick={() => onNavigate('academics_marks')}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-all cursor-pointer"
          >
            <Award className="w-3.5 h-3.5 text-amber-400" /> {getTranslation(lang, 'enterMarks')}
          </button>
          <button
            type="button"
            onClick={() => onNavigate('reports')}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-all cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-400" /> {getTranslation(lang, 'generateReport')}
          </button>
        </div>
      </div>

      {/* Prominent School Status Card */}
      <div className={`rounded-2xl border-2 p-5 sm:p-6 shadow-md transition-all ${statusConfig.border}`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className={`p-3.5 rounded-2xl flex-shrink-0 ${statusConfig.iconColor}`}>
              <StatusIcon className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {getTranslation(lang, 'schoolStatus')}
                </span>
                <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full ${statusConfig.tagColor}`}>
                  {schoolStatus.status}
                </span>
                <span className="text-[11px] text-slate-400">
                  Calculated Score: <strong className="text-slate-800">{schoolStatus.overallScore}/100</strong>
                </span>
              </div>

              <p className="text-sm font-semibold text-slate-800 mt-1 leading-snug">
                {schoolStatus.summaryReason}
              </p>
              
              <div className="flex items-center gap-4 text-[11px] text-slate-400 mt-2">
                <span>{getTranslation(lang, 'lastCalculated')}: {schoolStatus.lastUpdated}</span>
                <span>•</span>
                <span>Year: {config.academic_year}</span>
              </div>
            </div>
          </div>

          {/* Factor pill indicators */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 lg:border-l lg:border-slate-200/80 lg:pl-6 text-xs">
            <div className="bg-white/80 p-2 rounded-lg border border-slate-200/60">
              <span className="text-[10px] text-slate-400 block font-semibold">STUDENT ATTENDANCE</span>
              <span className="font-extrabold text-slate-900">
                {studentAttPct !== null ? `${studentAttPct}%` : 'No data yet'}
              </span>
            </div>
            <div className="bg-white/80 p-2 rounded-lg border border-slate-200/60">
              <span className="text-[10px] text-slate-400 block font-semibold">TEACHER ATTENDANCE</span>
              <span className="font-extrabold text-slate-900">
                {teacherAttPct !== null ? `${teacherAttPct}%` : 'No data yet'}
              </span>
            </div>
            <div className="bg-white/80 p-2 rounded-lg border border-slate-200/60">
              <span className="text-[10px] text-slate-400 block font-semibold">ACADEMIC AVERAGE</span>
              <span className="font-extrabold text-slate-900">
                {academicAvg !== null ? `${academicAvg}%` : 'No data yet'}
              </span>
            </div>
            <div className="bg-white/80 p-2 rounded-lg border border-slate-200/60">
              <span className="text-[10px] text-slate-400 block font-semibold">PASS RATE</span>
              <span className="font-extrabold text-slate-900">
                {passRate !== null ? `${passRate}%` : 'No data yet'}
              </span>
            </div>
            <div className="bg-white/80 p-2 rounded-lg border border-slate-200/60">
              <span className="text-[10px] text-slate-400 block font-semibold">CRITICAL ISSUES</span>
              <span className={`font-extrabold ${criticalIssues.length > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                {criticalIssues.length} active
              </span>
            </div>
            <div className="bg-white/80 p-2 rounded-lg border border-slate-200/60">
              <span className="text-[10px] text-slate-400 block font-semibold">ACTIVE TARGETS</span>
              <span className="font-extrabold text-slate-900">
                {targets.length} tracked
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 8 Real KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Students */}
        <StatCard
          title={getTranslation(lang, 'kpiTotalStudents')}
          value={totalStudents > 0 ? totalStudents : null}
          subtitle={totalStudents > 0 ? `${activeStudents} Active Students` : 'No students enrolled'}
          icon={Users}
          colorScheme="blue"
          emptyText="0 (No students added)"
          onClick={() => onNavigate('students')}
        />

        {/* 2. Teachers */}
        <StatCard
          title={getTranslation(lang, 'kpiTotalTeachers')}
          value={totalTeachers > 0 ? totalTeachers : null}
          subtitle={totalTeachers > 0 ? `${activeTeachers} Active Faculty` : 'No teachers registered'}
          icon={GraduationCap}
          colorScheme="indigo"
          emptyText="0 (No teachers added)"
          onClick={() => onNavigate('teachers')}
        />

        {/* 3. Classes */}
        <StatCard
          title={getTranslation(lang, 'kpiTotalClasses')}
          value={totalClasses > 0 ? totalClasses : null}
          subtitle={totalClasses > 0 ? `Across ${grades.length} Grades` : 'No class sections'}
          icon={School}
          colorScheme="emerald"
          emptyText="0 (No classes created)"
          onClick={() => onNavigate('classes')}
        />

        {/* 4. Subjects */}
        <StatCard
          title={getTranslation(lang, 'kpiTotalSubjects')}
          value={totalSubjects > 0 ? totalSubjects : null}
          subtitle={totalSubjects > 0 ? 'Curriculum Subjects' : 'No subjects defined'}
          icon={BookOpen}
          colorScheme="amber"
          emptyText="0 (No subjects added)"
          onClick={() => onNavigate('subjects')}
        />

        {/* 5. Student Attendance */}
        <StatCard
          title={getTranslation(lang, 'kpiStudentAttendance')}
          value={studentAttPct !== null ? `${studentAttPct}%` : null}
          subtitle={studentAttendance.length > 0 ? `Based on ${studentAttendance.length} records` : 'No attendance recorded'}
          icon={CalendarCheck}
          colorScheme={studentAttPct !== null && studentAttPct >= config.thresholds.attendance_good ? 'emerald' : studentAttPct !== null ? 'amber' : 'slate'}
          emptyText="— (No records yet)"
          onClick={() => onNavigate('attendance_student')}
        />

        {/* 6. Teacher Attendance */}
        <StatCard
          title={getTranslation(lang, 'kpiTeacherAttendance')}
          value={teacherAttPct !== null ? `${teacherAttPct}%` : null}
          subtitle={teacherAttendance.length > 0 ? `Based on ${teacherAttendance.length} records` : 'No attendance recorded'}
          icon={Activity}
          colorScheme={teacherAttPct !== null && teacherAttPct >= config.thresholds.attendance_good ? 'emerald' : teacherAttPct !== null ? 'amber' : 'slate'}
          emptyText="— (No records yet)"
          onClick={() => onNavigate('attendance_teacher')}
        />

        {/* 7. Academic Performance */}
        <StatCard
          title={getTranslation(lang, 'kpiAcademicScore')}
          value={academicAvg !== null ? `${academicAvg}%` : null}
          subtitle={marks.length > 0 ? `Across ${marks.length} marks entered` : 'No marks entered'}
          icon={Award}
          colorScheme={academicAvg !== null && academicAvg >= config.thresholds.academic_good ? 'emerald' : academicAvg !== null ? 'amber' : 'slate'}
          emptyText="— (No marks yet)"
          onClick={() => onNavigate('academics_performance')}
        />

        {/* 8. Pass Rate */}
        <StatCard
          title={getTranslation(lang, 'kpiPassRate')}
          value={passRate !== null ? `${passRate}%` : null}
          subtitle={`Pass threshold: ${config.thresholds.pass_mark}%`}
          icon={TrendingUp}
          colorScheme={passRate !== null && passRate >= 80 ? 'emerald' : passRate !== null ? 'amber' : 'slate'}
          emptyText="— (No marks yet)"
          onClick={() => onNavigate('academics_performance')}
        />
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Trend Chart */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Attendance Trends Over Recorded Days
              </h3>
              <p className="text-xs text-slate-500">
                Calculated strictly as Present Days / Total Recorded Days × 100
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('attendance_student')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              Record Attendance <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <TrendLineChart
            data={attendanceTrendData}
            primaryLabel="Student Attendance %"
            secondaryLabel="Teacher Attendance %"
            height={220}
            emptyMessage="No attendance records entered yet. Click 'Record Attendance' to log daily roster."
          />
        </div>

        {/* Academic Performance by Grade */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Academic Performance by Grade
              </h3>
              <p className="text-xs text-slate-500">
                Normalized scores across all assessments and subjects
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('academics_marks')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              Enter Marks <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <SimpleBarChart
            data={gradePerformanceData}
            height={220}
            emptyMessage="No marks recorded yet. Add assessments and enter student scores."
          />
        </div>
      </div>

      {/* Secondary Analytics: Pass/Fail Breakdown & Strategic Targets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pass/Fail Donut */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Pass Rate Distribution</h3>
            <p className="text-xs text-slate-500 mb-4">Passing Benchmark: {config.thresholds.pass_mark}%</p>
          </div>

          <DonutChart
            slices={passFailDistribution}
            totalLabel="Evaluated"
            centerNumber={passRate !== null ? `${passRate}%` : '—'}
            emptyMessage="No academic marks evaluated yet."
          />

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Overall Status: <strong>{passRate !== null ? (passRate >= 75 ? 'Satisfactory' : 'Needs Action') : 'Pending'}</strong></span>
            <button
              onClick={() => onNavigate('academics_performance')}
              className="text-blue-600 hover:underline font-semibold"
            >
              View Analytics
            </button>
          </div>
        </div>

        {/* Strategic School Targets Progress */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">Strategic Targets & Benchmarks</h3>
              <p className="text-xs text-slate-500">Monitored progress toward Board Leader school improvement goals</p>
            </div>
            <button
              type="button"
              onClick={onOpenAddTarget}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add Target
            </button>
          </div>

          {targets.length === 0 ? (
            <div className="h-44 flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50 p-6 text-center">
              <Target className="w-8 h-8 text-slate-300 mb-2" />
              <p className="text-xs font-semibold text-slate-700">No school targets defined yet</p>
              <p className="text-[11px] text-slate-400 max-w-sm mt-0.5 mb-3">
                Establish institutional goals (e.g. 95% attendance, 85% academic score) to measure school growth.
              </p>
              <button
                type="button"
                onClick={onOpenAddTarget}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700"
              >
                + Create School Target
              </button>
            </div>
          ) : (
            <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
              {targets.map(tgt => {
                let currentVal: number | null = null;
                if (tgt.indicator === 'student_attendance') currentVal = studentAttPct;
                else if (tgt.indicator === 'teacher_attendance') currentVal = teacherAttPct;
                else if (tgt.indicator === 'academic_performance') currentVal = academicAvg;
                else if (tgt.indicator === 'pass_rate') currentVal = passRate;

                const achievement = currentVal !== null ? Math.round((currentVal / tgt.target_value) * 100) : null;
                const isAchieved = achievement !== null && achievement >= 100;

                return (
                  <div key={tgt.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50/50">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-bold text-slate-800">{tgt.title}</span>
                      <span className="text-[11px] text-slate-500">
                        Current: <strong className="text-slate-900">{currentVal !== null ? `${currentVal}${tgt.unit}` : '—'}</strong> / Target: <strong>{tgt.target_value}{tgt.unit}</strong>
                      </span>
                    </div>

                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          isAchieved ? 'bg-emerald-500' : (achievement && achievement >= 75) ? 'bg-blue-600' : 'bg-amber-500'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(5, achievement || 0))}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                      <span>Status: {tgt.status}</span>
                      <span className={isAchieved ? 'text-emerald-600 font-bold' : 'text-slate-500'}>
                        {achievement !== null ? `${achievement}% Achieved` : 'Awaiting data'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Tracking {targets.length} active target indicator(s)</span>
            <button
              onClick={() => onNavigate('targets')}
              className="text-blue-600 hover:underline font-semibold"
            >
              Manage Targets
            </button>
          </div>
        </div>
      </div>

      {/* Facilities & Open Issues Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Open Critical / High Priority Issues */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">Active School Issues</h3>
              <p className="text-xs text-slate-500">Operational, infrastructure, and administrative matters</p>
            </div>
            <button
              type="button"
              onClick={onOpenAddIssue}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Log Issue
            </button>
          </div>

          {openIssues.length === 0 ? (
            <div className="p-6 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-800">No open issues recorded</p>
              <p className="text-[11px] text-slate-400 mt-0.5">School operations and facilities are reporting zero pending incidents.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {openIssues.slice(0, 5).map(issue => (
                <div key={issue.id} className="flex items-start justify-between p-3 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100/70 transition-colors">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800">{issue.title}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        issue.priority === 'Critical' ? 'bg-rose-100 text-rose-700' :
                        issue.priority === 'High' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {issue.priority}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-1">{issue.description}</p>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-400 whitespace-nowrap ml-2">
                    {issue.status}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>{openIssues.length} open issue(s) • {criticalIssues.length} critical</span>
            <button onClick={() => onNavigate('issues')} className="text-blue-600 hover:underline font-semibold">
              View All Issues
            </button>
          </div>
        </div>

        {/* Facilities Status Summary */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">Campus Facilities Health</h3>
              <p className="text-xs text-slate-500">Classrooms, labs, sanitation, water, and safety status</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('facilities')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              Manage Facilities
            </button>
          </div>

          {facilities.length === 0 ? (
            <div className="p-6 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              <School className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-800">No facilities registered yet</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Catalog classrooms, libraries, or computer labs to monitor condition.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
              {facilities.slice(0, 6).map(fac => (
                <div key={fac.id} className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800 truncate mr-2">{fac.name}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    fac.status === 'Good' ? 'bg-emerald-100 text-emerald-800' :
                    fac.status === 'Needs Maintenance' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {fac.status}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>{facilities.length} monitored facility assets</span>
            <button onClick={() => onNavigate('facilities')} className="text-blue-600 hover:underline font-semibold">
              Inspect Facilities
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
