import React, { useState, useMemo } from 'react';
import { useSchool } from '../context/SchoolContext';
import { 
  StudentAttendanceStatus, 
  TeacherAttendanceStatus, 
  StudentAttendanceRecord, 
  TeacherAttendanceRecord 
} from '../types';
import { calculateStudentAttendancePercentage, calculateTeacherAttendancePercentage } from '../utils/calculations';
import { 
  CalendarCheck, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Clock, 
  ShieldCheck, 
  Users, 
  GraduationCap, 
  Save, 
  Check, 
  Filter, 
  Sparkles,
  Layers,
  Activity
} from 'lucide-react';
import { getTranslation } from '../utils/i18n';
import { Badge } from '../components/common/Badge';

interface AttendanceViewProps {
  initialSubTab?: 'student' | 'teacher';
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({ initialSubTab = 'student' }) => {
  const { 
    grades, 
    classes, 
    students, 
    teachers, 
    studentAttendance, 
    saveStudentAttendanceBulk, 
    teacherAttendance, 
    saveTeacherAttendanceBulk, 
    lang, 
    config 
  } = useSchool();

  const [activeTab, setActiveTab] = useState<'student' | 'teacher'>(initialSubTab);

  // Student Attendance Form States
  const [selectedGradeId, setSelectedGradeId] = useState<string>(grades[0]?.id || '');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Available classes for selected grade
  const classesForGrade = useMemo(() => {
    return classes.filter(c => c.grade_id === selectedGradeId);
  }, [classes, selectedGradeId]);

  // Set default class if current selected is not in grade
  React.useEffect(() => {
    if (classesForGrade.length > 0 && (!selectedClassId || !classesForGrade.some(c => c.id === selectedClassId))) {
      setSelectedClassId(classesForGrade[0].id);
    }
  }, [classesForGrade, selectedClassId]);

  // Students enrolled in selected class
  const classStudents = useMemo(() => {
    if (!selectedClassId) return [];
    return students.filter(s => s.class_id === selectedClassId && s.status === 'Active');
  }, [students, selectedClassId]);

  // Local attendance state for current date & class roster
  const [studentRosterStatus, setStudentRosterStatus] = useState<Record<string, StudentAttendanceStatus>>({});
  const [studentNotes, setStudentNotes] = useState<Record<string, string>>({});

  // Sync existing records for selected class + date into roster
  React.useEffect(() => {
    const existing = studentAttendance.filter(
      a => a.class_id === selectedClassId && a.date === selectedDate
    );
    const newStatusMap: Record<string, StudentAttendanceStatus> = {};
    const newNotesMap: Record<string, string> = {};

    classStudents.forEach(st => {
      const match = existing.find(e => e.student_id === st.id);
      newStatusMap[st.id] = match ? match.status : 'present'; // Default to present for quick roll call
      newNotesMap[st.id] = match?.notes || '';
    });

    setStudentRosterStatus(newStatusMap);
    setStudentNotes(newNotesMap);
  }, [selectedClassId, selectedDate, classStudents, studentAttendance]);

  // Bulk set all students to status
  const handleMarkAllStudents = (status: StudentAttendanceStatus) => {
    const updated: Record<string, StudentAttendanceStatus> = {};
    classStudents.forEach(st => {
      updated[st.id] = status;
    });
    setStudentRosterStatus(updated);
  };

  // Save Student Attendance
  const handleSaveStudentAttendance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId || classStudents.length === 0) return;

    const recordsToSave: Omit<StudentAttendanceRecord, 'id'>[] = classStudents.map(st => ({
      student_id: st.id,
      class_id: selectedClassId,
      grade_id: selectedGradeId,
      date: selectedDate,
      status: studentRosterStatus[st.id] || 'present',
      notes: studentNotes[st.id] || ''
    }));

    saveStudentAttendanceBulk(recordsToSave);
    setSaveSuccessMsg(`Saved attendance for ${recordsToSave.length} students on ${selectedDate}`);
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  // Teacher Attendance Form States
  const [teacherDate, setTeacherDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [teacherRosterStatus, setTeacherRosterStatus] = useState<Record<string, TeacherAttendanceStatus>>({});
  const [teacherNotesMap, setTeacherNotesMap] = useState<Record<string, string>>({});
  const [teacherSaveMsg, setTeacherSaveMsg] = useState<string | null>(null);

  // Sync existing teacher records for selected date
  React.useEffect(() => {
    const existing = teacherAttendance.filter(a => a.date === teacherDate);
    const newStatusMap: Record<string, TeacherAttendanceStatus> = {};
    const newNotesMap: Record<string, string> = {};

    teachers.forEach(t => {
      const match = existing.find(e => e.teacher_id === t.id);
      newStatusMap[t.id] = match ? match.status : 'present';
      newNotesMap[t.id] = match?.notes || '';
    });

    setTeacherRosterStatus(newStatusMap);
    setTeacherNotesMap(newNotesMap);
  }, [teacherDate, teachers, teacherAttendance]);

  const handleMarkAllTeachers = (status: TeacherAttendanceStatus) => {
    const updated: Record<string, TeacherAttendanceStatus> = {};
    teachers.forEach(t => {
      updated[t.id] = status;
    });
    setTeacherRosterStatus(updated);
  };

  const handleSaveTeacherAttendance = (e: React.FormEvent) => {
    e.preventDefault();
    if (teachers.length === 0) return;

    const recordsToSave: Omit<TeacherAttendanceRecord, 'id'>[] = teachers.map(t => ({
      teacher_id: t.id,
      date: teacherDate,
      status: teacherRosterStatus[t.id] || 'present',
      notes: teacherNotesMap[t.id] || ''
    }));

    saveTeacherAttendanceBulk(recordsToSave);
    setTeacherSaveMsg(`Saved attendance for ${recordsToSave.length} teachers on ${teacherDate}`);
    setTimeout(() => setTeacherSaveMsg(null), 3000);
  };

  // Overall Statistics calculations
  const overallStudentAttPct = calculateStudentAttendancePercentage(studentAttendance);
  const overallTeacherAttPct = calculateTeacherAttendancePercentage(teacherAttendance);

  // Daily roster statistics for current view
  const currentClassPresentCount = classStudents.filter(
    s => (studentRosterStatus[s.id] || 'present') === 'present'
  ).length;
  const currentClassRate = classStudents.length > 0 
    ? Math.round((currentClassPresentCount / classStudents.length) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              {getTranslation(lang, 'navAttendance')} Management
            </h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
              {config.academic_year}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Bulk daily attendance recording, unrecorded day protection, and cumulative percentage calculations.
          </p>
        </div>

        {/* Tab Switcher: Student vs Teacher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('student')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              activeTab === 'student' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4" /> {getTranslation(lang, 'navStudentAttendance')}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('teacher')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              activeTab === 'teacher' ? 'bg-white text-purple-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <GraduationCap className="w-4 h-4" /> {getTranslation(lang, 'navTeacherAttendance')}
          </button>
        </div>
      </div>

      {/* KPI Banners */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400 block uppercase">STUDENT ATTENDANCE %</span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">
            {overallStudentAttPct !== null ? `${overallStudentAttPct}%` : '—'}
          </span>
          <span className="text-[11px] text-slate-500">
            {studentAttendance.length > 0 ? `${studentAttendance.length} entries recorded` : 'No student records yet'}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400 block uppercase">TEACHER ATTENDANCE %</span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">
            {overallTeacherAttPct !== null ? `${overallTeacherAttPct}%` : '—'}
          </span>
          <span className="text-[11px] text-slate-500">
            {teacherAttendance.length > 0 ? `${teacherAttendance.length} entries recorded` : 'No teacher records yet'}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400 block uppercase">BENCHMARK THRESHOLD</span>
          <span className="text-2xl font-black text-emerald-600 mt-1 block">
            {config.thresholds.attendance_good}%
          </span>
          <span className="text-[11px] text-slate-500">
            Target institutional standard
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400 block uppercase">FORMULA SPECIFICATION</span>
          <span className="text-xs font-mono font-bold text-blue-700 mt-1 block">
            Present / Recorded × 100
          </span>
          <span className="text-[10px] text-slate-400">
            Unrecorded days are never counted as absent
          </span>
        </div>
      </div>

      {/* ================= STUDENT ATTENDANCE SECTION ================= */}
      {activeTab === 'student' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-6">
          {/* Step Selector: Grade -> Class -> Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200/80">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                1. Select Grade
              </label>
              <select
                value={selectedGradeId}
                onChange={e => setSelectedGradeId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white font-bold"
              >
                {grades.map(g => (
                  <option key={g.id} value={g.id}>{g.name} ({g.level})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                2. Select Class Section
              </label>
              <select
                value={selectedClassId}
                onChange={e => setSelectedClassId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white font-bold"
              >
                {classesForGrade.length === 0 ? (
                  <option value="">No classes in this grade</option>
                ) : (
                  classesForGrade.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                3. Attendance Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white font-semibold"
              />
            </div>
          </div>

          {/* Alert / Notification banner */}
          {saveSuccessMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{saveSuccessMsg}</span>
            </div>
          )}

          {/* Quick Roster Actions Bar */}
          {classStudents.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-blue-50/50 rounded-xl border border-blue-100">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <span className="font-extrabold text-blue-900">{classStudents.length} Students in Roster</span>
                <span>•</span>
                <span className="text-emerald-700 font-bold">{currentClassPresentCount} Present ({currentClassRate}%)</span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-slate-500 font-semibold mr-1">Quick Fill:</span>
                <button
                  type="button"
                  onClick={() => handleMarkAllStudents('present')}
                  className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                >
                  Mark All Present
                </button>
                <button
                  type="button"
                  onClick={() => handleMarkAllStudents('absent')}
                  className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
                >
                  Mark All Absent
                </button>
              </div>
            </div>
          )}

          {/* Student Roster Table */}
          {classStudents.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">No active students enrolled in this class</p>
              <p className="text-xs text-slate-400 mt-1">
                Go to the Students section to enroll students into this class section.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSaveStudentAttendance} className="space-y-4">
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                      <th className="py-3 px-4">Student ID</th>
                      <th className="py-3 px-4">Student Name</th>
                      <th className="py-3 px-4 text-center">Attendance Status</th>
                      <th className="py-3 px-4">Notes / Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {classStudents.map(student => {
                      const curStatus = studentRosterStatus[student.id] || 'present';

                      return (
                        <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-slate-900">
                            {student.student_id}
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-800">
                            {student.first_name} {student.middle_name} {student.last_name}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-center gap-1.5">
                              {(['present', 'absent', 'late', 'excused'] as StudentAttendanceStatus[]).map(st => {
                                const isSelected = curStatus === st;
                                const colors = {
                                  present: isSelected ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                                  absent: isSelected ? 'bg-rose-600 text-white font-bold' : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                                  late: isSelected ? 'bg-amber-500 text-white font-bold' : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                                  excused: isSelected ? 'bg-blue-600 text-white font-bold' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }[st];

                                return (
                                  <button
                                    key={st}
                                    type="button"
                                    onClick={() => setStudentRosterStatus(prev => ({ ...prev, [student.id]: st }))}
                                    className={`px-3 py-1.5 rounded-lg text-xs capitalize transition-colors ${colors}`}
                                  >
                                    {st}
                                  </button>
                                );
                              })}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <input
                              type="text"
                              placeholder="Reason if absent/late..."
                              value={studentNotes[student.id] || ''}
                              onChange={e => setStudentNotes(prev => ({ ...prev, [student.id]: e.target.value }))}
                              className="w-full px-2.5 py-1 text-xs border border-slate-200 rounded-lg"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Submit Save Button */}
              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  Save Student Attendance Records
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ================= TEACHER ATTENDANCE SECTION ================= */}
      {activeTab === 'teacher' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200/80">
            <div className="flex items-center gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Teacher Attendance Date
                </label>
                <input
                  type="date"
                  value={teacherDate}
                  onChange={e => setTeacherDate(e.target.value)}
                  className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white font-bold"
                />
              </div>
            </div>

            {teachers.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-semibold mr-1">Quick Fill:</span>
                <button
                  type="button"
                  onClick={() => handleMarkAllTeachers('present')}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700"
                >
                  Mark All Present
                </button>
                <button
                  type="button"
                  onClick={() => handleMarkAllTeachers('absent')}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-700"
                >
                  Mark All Absent
                </button>
              </div>
            )}
          </div>

          {teacherSaveMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{teacherSaveMsg}</span>
            </div>
          )}

          {teachers.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              <GraduationCap className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">No teachers registered yet</p>
              <p className="text-xs text-slate-400 mt-1">
                Add educators in the Teachers tab to track faculty presence.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSaveTeacherAttendance} className="space-y-4">
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                      <th className="py-3 px-4">Teacher ID</th>
                      <th className="py-3 px-4">Teacher Name</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {teachers.map(teacher => {
                      const curStatus = teacherRosterStatus[teacher.id] || 'present';

                      return (
                        <tr key={teacher.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-slate-900">
                            {teacher.teacher_id}
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-800">
                            {teacher.first_name} {teacher.last_name}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-center gap-1.5">
                              {(['present', 'absent', 'late', 'leave'] as TeacherAttendanceStatus[]).map(st => {
                                const isSelected = curStatus === st;
                                const colors = {
                                  present: isSelected ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                                  absent: isSelected ? 'bg-rose-600 text-white font-bold' : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                                  late: isSelected ? 'bg-amber-500 text-white font-bold' : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                                  leave: isSelected ? 'bg-purple-600 text-white font-bold' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }[st];

                                return (
                                  <button
                                    key={st}
                                    type="button"
                                    onClick={() => setTeacherRosterStatus(prev => ({ ...prev, [teacher.id]: st }))}
                                    className={`px-3 py-1.5 rounded-lg text-xs capitalize transition-colors ${colors}`}
                                  >
                                    {st}
                                  </button>
                                );
                              })}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <input
                              type="text"
                              placeholder="Notes if absent/leave..."
                              value={teacherNotesMap[teacher.id] || ''}
                              onChange={e => setTeacherNotesMap(prev => ({ ...prev, [teacher.id]: e.target.value }))}
                              className="w-full px-2.5 py-1 text-xs border border-slate-200 rounded-lg"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  Save Teacher Attendance Records
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
