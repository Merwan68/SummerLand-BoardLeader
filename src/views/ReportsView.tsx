import React, { useState, useMemo } from 'react';
import { useSchool } from '../context/SchoolContext';
import { 
  FileText, 
  Printer, 
  Download, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  AlertOctagon, 
  Building2, 
  Layers, 
  Award, 
  Users, 
  GraduationCap 
} from 'lucide-react';
import { calculateStudentAttendancePercentage, calculateTeacherAttendancePercentage, calculateAcademicAverage, calculatePassRate } from '../utils/calculations';
import { getTranslation } from '../utils/i18n';

export const ReportsView: React.FC = () => {
  const { 
    config, 
    schoolStatus, 
    students, 
    teachers, 
    classes, 
    subjects, 
    grades, 
    studentAttendance, 
    teacherAttendance, 
    marks, 
    assessments, 
    targets, 
    issues, 
    facilities, 
    lang, 
    user 
  } = useSchool();

  const [reportType, setReportType] = useState<'Monthly' | 'Term' | 'Annual'>('Term');
  const [selectedTerm, setSelectedTerm] = useState('Term 1');
  const [selectedMonth, setSelectedMonth] = useState('October 2026');

  const generatedDate = useMemo(() => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }, []);

  // Compute report statistics based on real data
  const studentAttPct = calculateStudentAttendancePercentage(studentAttendance);
  const teacherAttPct = calculateTeacherAttendancePercentage(teacherAttendance);
  const academicAvg = calculateAcademicAverage(marks, assessments);
  const passRate = calculatePassRate(marks, assessments, config.thresholds.pass_mark);

  const openIssues = issues.filter(i => i.status !== 'Resolved');
  const criticalIssues = openIssues.filter(i => i.priority === 'Critical');

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Controls Bar (hidden during print) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs no-print">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            Executive School Performance Report
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Generate formal comprehensive briefing documents for the Board Leader and school governing body.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-600">Type:</label>
            <select
              value={reportType}
              onChange={e => setReportType(e.target.value as any)}
              className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg font-bold"
            >
              <option value="Monthly">Monthly Report</option>
              <option value="Term">Term Report</option>
              <option value="Annual">Annual Report</option>
            </select>
          </div>

          {reportType === 'Term' && (
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-600">Period:</label>
              <select
                value={selectedTerm}
                onChange={e => setSelectedTerm(e.target.value)}
                className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg font-bold"
              >
                <option value="Term 1">Term 1</option>
                <option value="Term 2">Term 2</option>
                <option value="Term 3">Term 3</option>
                <option value="Term 4">Term 4</option>
              </select>
            </div>
          )}

          {reportType === 'Monthly' && (
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-600">Month:</label>
              <input
                type="text"
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg font-semibold w-36"
              />
            </div>
          )}

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Print / Save as PDF
          </button>
        </div>
      </div>

      {/* ================= PRINTABLE EXECUTIVE REPORT DOCUMENT ================= */}
      <div className="bg-white rounded-2xl border border-slate-300 shadow-md p-8 sm:p-12 print:p-0 print:border-none print:shadow-none max-w-5xl mx-auto space-y-8">
        {/* Document Header */}
        <div className="border-b-2 border-slate-900 pb-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-black uppercase tracking-widest text-blue-700 block">
              OFFICIAL LEADERSHIP BRIEFING • CONFIDENTIAL
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {config.name}
            </h2>
            <p className="text-xs font-semibold text-slate-600">
              {config.type} • Academic Year {config.academic_year}
            </p>
          </div>

          <div className="text-right sm:self-end">
            <span className="text-xs font-bold px-3 py-1 rounded-md bg-slate-100 text-slate-800 border border-slate-200 uppercase tracking-wider block">
              {reportType} Performance Report
            </span>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Period: <strong>{reportType === 'Term' ? selectedTerm : reportType === 'Monthly' ? selectedMonth : 'Full Academic Session'}</strong>
            </span>
            <span className="text-[10px] text-slate-400 block">
              Generated: {generatedDate}
            </span>
          </div>
        </div>

        {/* Executive Summary & Overall School Status */}
        <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              EXECUTIVE EVALUATION & STATUS
            </span>
            <span className={`text-xs font-extrabold px-3 py-1 rounded-full ${
              schoolStatus.status === 'Good' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
              schoolStatus.status === 'Needs Attention' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
              'bg-rose-100 text-rose-800 border border-rose-300'
            }`}>
              Overall Status: {schoolStatus.status} ({schoolStatus.overallScore}/100)
            </span>
          </div>

          <p className="text-sm font-semibold text-slate-800 leading-relaxed">
            {schoolStatus.summaryReason}
          </p>
        </div>

        {/* 1. Core Institutional Metrics Table */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1.5">
            1. Core Institutional Performance Indicators
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
              <span className="text-[10px] text-slate-400 font-semibold block uppercase">ENROLLED STUDENTS</span>
              <span className="text-xl font-bold text-slate-900">{students.length}</span>
              <span className="text-[10px] text-slate-500 block">{students.filter(s => s.status === 'Active').length} Active</span>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
              <span className="text-[10px] text-slate-400 font-semibold block uppercase">FACULTY STAFF</span>
              <span className="text-xl font-bold text-slate-900">{teachers.length}</span>
              <span className="text-[10px] text-slate-500 block">{teachers.filter(t => t.employment_status === 'Active').length} Active</span>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
              <span className="text-[10px] text-slate-400 font-semibold block uppercase">STUDENT ATTENDANCE</span>
              <span className="text-xl font-bold text-blue-700">
                {studentAttPct !== null ? `${studentAttPct}%` : 'No data recorded'}
              </span>
              <span className="text-[10px] text-slate-500 block">Benchmark: {config.thresholds.attendance_good}%</span>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
              <span className="text-[10px] text-slate-400 font-semibold block uppercase">TEACHER ATTENDANCE</span>
              <span className="text-xl font-bold text-purple-700">
                {teacherAttPct !== null ? `${teacherAttPct}%` : 'No data recorded'}
              </span>
              <span className="text-[10px] text-slate-500 block">Benchmark: {config.thresholds.attendance_good}%</span>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
              <span className="text-[10px] text-slate-400 font-semibold block uppercase">ACADEMIC SCORE AVG</span>
              <span className="text-xl font-bold text-emerald-700">
                {academicAvg !== null ? `${academicAvg}%` : 'No data recorded'}
              </span>
              <span className="text-[10px] text-slate-500 block">Benchmark: {config.thresholds.academic_good}%</span>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
              <span className="text-[10px] text-slate-400 font-semibold block uppercase">PASS RATE</span>
              <span className="text-xl font-bold text-slate-900">
                {passRate !== null ? `${passRate}%` : 'No data recorded'}
              </span>
              <span className="text-[10px] text-slate-500 block">Pass mark: {config.thresholds.pass_mark}%</span>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
              <span className="text-[10px] text-slate-400 font-semibold block uppercase">TOTAL CLASSES</span>
              <span className="text-xl font-bold text-slate-900">{classes.length}</span>
              <span className="text-[10px] text-slate-500 block">{grades.length} Grades</span>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
              <span className="text-[10px] text-slate-400 font-semibold block uppercase">ACTIVE ISSUES</span>
              <span className="text-xl font-bold text-rose-600">{openIssues.length}</span>
              <span className="text-[10px] text-slate-500 block">{criticalIssues.length} Critical</span>
            </div>
          </div>
        </div>

        {/* 2. Grade & Section Breakdown */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1.5">
            2. Kindergarten & Elementary Enrollment Distribution
          </h3>

          {classes.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No data recorded.</p>
          ) : (
            <table className="w-full text-left text-xs border border-slate-200">
              <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2 px-3">Class Name</th>
                  <th className="py-2 px-3">Grade Level</th>
                  <th className="py-2 px-3">Section</th>
                  <th className="py-2 px-3 text-center">Enrolled</th>
                  <th className="py-2 px-3 text-center">Capacity</th>
                  <th className="py-2 px-3 text-center">Occupancy %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {classes.map(c => {
                  const studentCount = students.filter(s => s.class_id === c.id).length;
                  const gradeObj = grades.find(g => g.id === c.grade_id);
                  const occ = Math.round((studentCount / c.capacity) * 100);

                  return (
                    <tr key={c.id}>
                      <td className="py-2 px-3 font-semibold text-slate-800">{c.name}</td>
                      <td className="py-2 px-3 capitalize">{gradeObj?.level || 'Grade'}</td>
                      <td className="py-2 px-3 font-mono">{c.section}</td>
                      <td className="py-2 px-3 text-center font-bold">{studentCount}</td>
                      <td className="py-2 px-3 text-center">{c.capacity}</td>
                      <td className="py-2 px-3 text-center font-semibold">{occ}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* 3. Strategic Target Achievements */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1.5">
            3. Institutional Targets & Goals Progress
          </h3>

          {targets.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No data recorded.</p>
          ) : (
            <table className="w-full text-left text-xs border border-slate-200">
              <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2 px-3">Target Title</th>
                  <th className="py-2 px-3">Indicator</th>
                  <th className="py-2 px-3 text-center">Target Benchmark</th>
                  <th className="py-2 px-3 text-center">Current Database Value</th>
                  <th className="py-2 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {targets.map(t => {
                  let cur: number | null = null;
                  if (t.indicator === 'student_attendance') cur = studentAttPct;
                  else if (t.indicator === 'teacher_attendance') cur = teacherAttPct;
                  else if (t.indicator === 'academic_performance') cur = academicAvg;
                  else if (t.indicator === 'pass_rate') cur = passRate;

                  return (
                    <tr key={t.id}>
                      <td className="py-2 px-3 font-semibold text-slate-800">{t.title}</td>
                      <td className="py-2 px-3 capitalize">{t.indicator.replace('_', ' ')}</td>
                      <td className="py-2 px-3 text-center font-bold">{t.target_value}{t.unit}</td>
                      <td className="py-2 px-3 text-center font-bold text-blue-700">
                        {cur !== null ? `${cur}${t.unit}` : 'No data recorded'}
                      </td>
                      <td className="py-2 px-3 text-center capitalize">{t.status.replace('_', ' ')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* 4. Active Issues & Incidents */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1.5">
            4. Unresolved School Challenges & Incidents
          </h3>

          {openIssues.length === 0 ? (
            <p className="text-xs text-slate-500 italic">Zero active issues recorded. All institutional operations nominal.</p>
          ) : (
            <div className="space-y-2">
              {openIssues.map(iss => (
                <div key={iss.id} className="p-2.5 rounded-lg border border-slate-200 text-xs flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 mr-2">{iss.title}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 mr-2">
                      {iss.category}
                    </span>
                    <span className="text-slate-500">{iss.description}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    iss.priority === 'Critical' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {iss.priority}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 5. Campus Facilities Status */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1.5">
            5. Facilities & Infrastructure Audit
          </h3>

          {facilities.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No data recorded.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              {facilities.map(f => (
                <div key={f.id} className="p-2 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between">
                  <span className="font-medium text-slate-800 truncate mr-2">{f.name}</span>
                  <span className="font-bold text-[10px] text-slate-600">{f.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Signatures & Authentication Line */}
        <div className="pt-12 border-t-2 border-slate-900 grid grid-cols-2 gap-8 text-xs">
          <div>
            <span className="text-slate-400 block mb-8 font-semibold">PREPARED BY:</span>
            <div className="border-t border-slate-300 pt-1">
              <span className="font-bold text-slate-900 block">{user?.name || 'Board Leader'}</span>
              <span className="text-[11px] text-slate-500">Executive Leader • Summerland Academy</span>
            </div>
          </div>

          <div>
            <span className="text-slate-400 block mb-8 font-semibold">OFFICIAL VERIFICATION / SEAL:</span>
            <div className="border-t border-slate-300 pt-1">
              <span className="font-bold text-slate-900 block">Governing Board of Trustees</span>
              <span className="text-[11px] text-slate-500">Date: {generatedDate}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
