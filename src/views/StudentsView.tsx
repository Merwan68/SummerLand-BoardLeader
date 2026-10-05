import React, { useState, useMemo } from 'react';
import { useSchool } from '../context/SchoolContext';
import { Student, StudentStatus, Gender } from '../types';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { EmptyState } from '../components/common/EmptyState';
import { Badge } from '../components/common/Badge';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  Eye, 
  Download, 
  Calendar, 
  BookOpen, 
  School,
  X,
  FileSpreadsheet
} from 'lucide-react';
import { getTranslation } from '../utils/i18n';

interface StudentsViewProps {
  initialOpenAdd?: boolean;
}

export const StudentsView: React.FC<StudentsViewProps> = ({ initialOpenAdd = false }) => {
  const { 
    students, 
    addStudent, 
    updateStudent, 
    deleteStudent, 
    grades, 
    classes, 
    config, 
    lang, 
    studentAttendance,
    marks,
    assessments 
  } = useSchool();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGrade, setFilterGrade] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterGender, setFilterGender] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Modals state
  const [isAddEditOpen, setIsAddEditOpen] = useState(initialOpenAdd);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<Student | null>(null);

  // Form state
  const [formError, setFormError] = useState<string | null>(null);
  const [studentId, setStudentId] = useState('');
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState<Gender>('Male');
  const [dob, setDob] = useState('2018-05-15');
  const [gradeId, setGradeId] = useState(grades[0]?.id || '');
  const [classId, setClassId] = useState('');
  const [enrollmentDate, setEnrollmentDate] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<StudentStatus>('Active');
  const [notes, setNotes] = useState('');

  // Open Add modal with reset
  const handleOpenAdd = () => {
    setEditingStudent(null);
    setFormError(null);
    // Suggest ID
    const nextNum = students.length + 1;
    setStudentId(`SA-${String(nextNum).padStart(3, '0')}`);
    setFirstName('');
    setMiddleName('');
    setLastName('');
    setGender('Male');
    setDob('2018-01-01');
    setGradeId(grades[0]?.id || '');
    // Auto-select class for this grade if available
    const matchedClass = classes.find(c => c.grade_id === (grades[0]?.id || ''));
    setClassId(matchedClass?.id || '');
    setEnrollmentDate(new Date().toISOString().split('T')[0]);
    setStatus('Active');
    setNotes('');
    setIsAddEditOpen(true);
  };

  // Open Edit modal
  const handleOpenEdit = (student: Student) => {
    setEditingStudent(student);
    setFormError(null);
    setStudentId(student.student_id);
    setFirstName(student.first_name);
    setMiddleName(student.middle_name || '');
    setLastName(student.last_name);
    setGender(student.gender);
    setDob(student.date_of_birth);
    setGradeId(student.grade_id);
    setClassId(student.class_id);
    setEnrollmentDate(student.enrollment_date);
    setStatus(student.status);
    setNotes(student.notes || '');
    setIsAddEditOpen(true);
  };

  // Save Student (Add or Edit)
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!studentId.trim() || !firstName.trim() || !lastName.trim() || !gradeId) {
      setFormError('Please fill in all required fields (Student ID, First Name, Last Name, Grade).');
      return;
    }

    if (editingStudent) {
      const res = updateStudent(editingStudent.id, {
        student_id: studentId.trim(),
        first_name: firstName.trim(),
        middle_name: middleName.trim(),
        last_name: lastName.trim(),
        gender,
        date_of_birth: dob,
        grade_id: gradeId,
        class_id: classId,
        enrollment_date: enrollmentDate,
        status,
        notes: notes.trim()
      });
      if (!res.success) {
        setFormError(res.error || 'Failed to update student');
        return;
      }
    } else {
      const res = addStudent({
        student_id: studentId.trim(),
        first_name: firstName.trim(),
        middle_name: middleName.trim(),
        last_name: lastName.trim(),
        gender,
        date_of_birth: dob,
        grade_id: gradeId,
        class_id: classId,
        academic_year: config.academic_year,
        enrollment_date: enrollmentDate,
        status,
        notes: notes.trim()
      });
      if (!res.success) {
        setFormError(res.error || 'Failed to enroll student');
        return;
      }
    }

    setIsAddEditOpen(false);
  };

  // Dynamic classes available for selected grade
  const filteredClassesForGrade = useMemo(() => {
    return classes.filter(c => c.grade_id === gradeId);
  }, [classes, gradeId]);

  // Filtered Students List
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const fullName = `${s.first_name} ${s.middle_name || ''} ${s.last_name}`.toLowerCase();
      const idMatch = s.student_id.toLowerCase().includes(searchTerm.toLowerCase());
      const nameMatch = fullName.includes(searchTerm.toLowerCase());
      
      if (searchTerm && !idMatch && !nameMatch) return false;
      if (filterGrade && s.grade_id !== filterGrade) return false;
      if (filterClass && s.class_id !== filterClass) return false;
      if (filterGender && s.gender !== filterGender) return false;
      if (filterStatus && s.status !== filterStatus) return false;
      
      return true;
    });
  }, [students, searchTerm, filterGrade, filterClass, filterGender, filterStatus]);

  // Maps for quick lookups
  const gradeMap = useMemo(() => new Map(grades.map(g => [g.id, g.name])), [grades]);
  const classMap = useMemo(() => new Map(classes.map(c => [c.id, c.name])), [classes]);

  // Calculate detailed student stats for view modal
  const studentStats = useMemo(() => {
    if (!viewingStudent) return null;
    const attRecords = studentAttendance.filter(a => a.student_id === viewingStudent.id);
    const totalDays = attRecords.length;
    const presentDays = attRecords.filter(a => a.status === 'present').length;
    const attPct = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : null;

    const studentMarks = marks.filter(m => m.student_id === viewingStudent.id);
    const assessmentMap = new Map(assessments.map(a => [a.id, a]));
    
    let sumPct = 0;
    let markCount = 0;
    studentMarks.forEach(m => {
      const asm = assessmentMap.get(m.assessment_id);
      if (asm && asm.max_score > 0) {
        sumPct += (m.score / asm.max_score) * 100;
        markCount++;
      }
    });

    const academicAvg = markCount > 0 ? Math.round((sumPct / markCount) * 10) / 10 : null;

    return {
      totalDays,
      presentDays,
      attPct,
      markCount,
      academicAvg
    };
  }, [viewingStudent, studentAttendance, marks, assessments]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              {getTranslation(lang, 'navStudents')}
            </h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
              {students.length} Enrolled
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage Kindergarten and Elementary student directory, enrollment records, and individual profiles.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          {getTranslation(lang, 'addStudent')}
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Input */}
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or student ID..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Grade filter */}
          <div>
            <select
              value={filterGrade}
              onChange={e => setFilterGrade(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Grades</option>
              {grades.map(g => (
                <option key={g.id} value={g.id}>{g.name} ({g.level})</option>
              ))}
            </select>
          </div>

          {/* Class filter */}
          <div>
            <select
              value={filterClass}
              onChange={e => setFilterClass(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Classes</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Status filter */}
          <div>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Graduated">Graduated</option>
              <option value="Transferred">Transferred</option>
            </select>
          </div>
        </div>

        {(searchTerm || filterGrade || filterClass || filterStatus) && (
          <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
            <span>Showing {filteredStudents.length} of {students.length} students</span>
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterGrade('');
                setFilterClass('');
                setFilterGender('');
                setFilterStatus('');
              }}
              className="text-blue-600 hover:underline font-semibold flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" /> Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Main Table / Empty State */}
      {students.length === 0 ? (
        <EmptyState
          icon={Users}
          title={getTranslation(lang, 'noStudents')}
          description={getTranslation(lang, 'noStudentsSub')}
          actionText={getTranslation(lang, 'addStudent')}
          onAction={handleOpenAdd}
        />
      ) : filteredStudents.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <p className="text-sm font-bold text-slate-700">No students matching your filter criteria</p>
          <p className="text-xs text-slate-400 mt-1 mb-3">Try adjusting your search terms or grade selections.</p>
          <button
            onClick={() => {
              setSearchTerm('');
              setFilterGrade('');
              setFilterClass('');
              setFilterStatus('');
            }}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-xs font-semibold rounded-lg text-slate-700"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Student ID</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Gender</th>
                  <th className="py-3 px-4">Grade & Level</th>
                  <th className="py-3 px-4">Class Section</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {filteredStudents.map(student => {
                  const gradeName = gradeMap.get(student.grade_id) || 'Unassigned';
                  const gradeObj = grades.find(g => g.id === student.grade_id);
                  const className = classMap.get(student.class_id) || 'Unassigned';

                  const statusVariant = {
                    'Active': 'success',
                    'Inactive': 'neutral',
                    'Graduated': 'purple',
                    'Transferred': 'warning'
                  }[student.status] as any;

                  return (
                    <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {student.student_id}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        <button
                          type="button"
                          onClick={() => setViewingStudent(student)}
                          className="hover:text-blue-600 hover:underline text-left cursor-pointer"
                        >
                          {student.first_name} {student.middle_name} {student.last_name}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {student.gender}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-900">{gradeName}</span>
                        {gradeObj && (
                          <span className="text-[10px] text-slate-400 block capitalize">{gradeObj.level}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {className}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant={statusVariant} size="sm" dot>
                          {student.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setViewingStudent(student)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                            title="View Profile & Stats"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(student)}
                            className="p-1.5 text-slate-400 hover:text-amber-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Edit Student"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteCandidate(student)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Delete Student"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Student Modal */}
      <Modal
        isOpen={isAddEditOpen}
        onClose={() => setIsAddEditOpen(false)}
        title={editingStudent ? 'Edit Student Record' : 'Enroll New Student'}
        subtitle="Summerland Academy Student Registry"
        maxWidth="lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Student ID *
              </label>
              <input
                type="text"
                required
                value={studentId}
                onChange={e => setStudentId(e.target.value)}
                placeholder="e.g. SA-001"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono uppercase focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Gender *
              </label>
              <select
                value={gender}
                onChange={e => setGender(e.target.value as Gender)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                First Name *
              </label>
              <input
                type="text"
                required
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                placeholder="First name"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Middle Name
              </label>
              <input
                type="text"
                value={middleName}
                onChange={e => setMiddleName(e.target.value)}
                placeholder="Father's name"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Last Name *
              </label>
              <input
                type="text"
                required
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                placeholder="Grandfather's name"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Date of Birth
              </label>
              <input
                type="date"
                value={dob}
                onChange={e => setDob(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Enrollment Date
              </label>
              <input
                type="date"
                value={enrollmentDate}
                onChange={e => setEnrollmentDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Grade *
              </label>
              <select
                value={gradeId}
                onChange={e => {
                  setGradeId(e.target.value);
                  const matched = classes.find(c => c.grade_id === e.target.value);
                  setClassId(matched?.id || '');
                }}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-semibold"
              >
                {grades.map(g => (
                  <option key={g.id} value={g.id}>{g.name} ({g.level})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Class Section
              </label>
              <select
                value={classId}
                onChange={e => setClassId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              >
                <option value="">-- No Class Assigned --</option>
                {filteredClassesForGrade.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as StudentStatus)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-semibold"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Graduated">Graduated</option>
                <option value="Transferred">Transferred</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
              Internal Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Health information, parent contacts, or special academic instructions..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsAddEditOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs cursor-pointer"
            >
              {editingStudent ? 'Save Changes' : 'Enroll Student'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Student Profile Modal */}
      {viewingStudent && (
        <Modal
          isOpen={true}
          onClose={() => setViewingStudent(null)}
          title={`${viewingStudent.first_name} ${viewingStudent.last_name}`}
          subtitle={`Student Profile • ${viewingStudent.student_id}`}
          maxWidth="md"
        >
          <div className="space-y-5">
            {/* Header info card */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 font-semibold block uppercase">ENROLLED GRADE</span>
                <span className="text-base font-extrabold text-slate-900">
                  {gradeMap.get(viewingStudent.grade_id) || 'Unassigned'}
                </span>
                <span className="text-xs text-slate-500 block">
                  Class: {classMap.get(viewingStudent.class_id) || 'None'}
                </span>
              </div>
              <Badge variant={viewingStudent.status === 'Active' ? 'success' : 'neutral'} dot>
                {viewingStudent.status}
              </Badge>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100">
                <span className="text-[10px] uppercase font-bold text-blue-700 block">ATTENDANCE RATE</span>
                <span className="text-xl font-black text-blue-900">
                  {studentStats?.attPct !== null ? `${studentStats?.attPct}%` : '—'}
                </span>
                <span className="text-[10px] text-blue-600 block mt-0.5">
                  {studentStats?.presentDays} of {studentStats?.totalDays} recorded days
                </span>
              </div>

              <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100">
                <span className="text-[10px] uppercase font-bold text-amber-700 block">ACADEMIC AVERAGE</span>
                <span className="text-xl font-black text-amber-900">
                  {studentStats?.academicAvg !== null ? `${studentStats?.academicAvg}%` : '—'}
                </span>
                <span className="text-[10px] text-amber-600 block mt-0.5">
                  Across {studentStats?.markCount} assessment(s)
                </span>
              </div>
            </div>

            {/* Details list */}
            <div className="text-xs space-y-2 border-t border-slate-100 pt-3">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-medium">Full Name:</span>
                <span className="font-bold text-slate-800">{viewingStudent.first_name} {viewingStudent.middle_name} {viewingStudent.last_name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-medium">Gender:</span>
                <span className="font-semibold text-slate-800">{viewingStudent.gender}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-medium">Date of Birth:</span>
                <span className="font-semibold text-slate-800">{viewingStudent.date_of_birth}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-medium">Enrollment Date:</span>
                <span className="font-semibold text-slate-800">{viewingStudent.enrollment_date}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-medium">Academic Year:</span>
                <span className="font-semibold text-slate-800">{viewingStudent.academic_year}</span>
              </div>
              {viewingStudent.notes && (
                <div className="pt-2">
                  <span className="text-slate-400 font-medium block mb-1">Notes:</span>
                  <p className="p-2.5 bg-slate-50 rounded-lg text-slate-700 italic border border-slate-200">
                    {viewingStudent.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setViewingStudent(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-xs font-semibold rounded-lg text-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteCandidate)}
        onClose={() => setDeleteCandidate(null)}
        onConfirm={() => {
          if (deleteCandidate) {
            deleteStudent(deleteCandidate.id);
            setDeleteCandidate(null);
          }
        }}
        title="Delete Student Record"
        message={`Are you sure you want to permanently remove student "${deleteCandidate?.first_name} ${deleteCandidate?.last_name}" (${deleteCandidate?.student_id})? This will also remove any attendance and marks associated with this student.`}
        confirmText="Yes, Delete Student"
      />
    </div>
  );
};
