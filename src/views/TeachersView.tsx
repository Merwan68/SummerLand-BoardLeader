import React, { useState, useMemo } from 'react';
import { useSchool } from '../context/SchoolContext';
import { Teacher, TeacherStatus, Gender } from '../types';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { EmptyState } from '../components/common/EmptyState';
import { Badge } from '../components/common/Badge';
import { 
  GraduationCap, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Eye, 
  Phone, 
  Mail, 
  Calendar, 
  BookOpen, 
  School,
  X 
} from 'lucide-react';
import { getTranslation } from '../utils/i18n';

interface TeachersViewProps {
  initialOpenAdd?: boolean;
}

export const TeachersView: React.FC<TeachersViewProps> = ({ initialOpenAdd = false }) => {
  const { 
    teachers, 
    addTeacher, 
    updateTeacher, 
    deleteTeacher, 
    subjects, 
    grades, 
    classes, 
    teacherAttendance, 
    lang 
  } = useSchool();

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSubject, setFilterSubject] = useState('');

  // Modals
  const [isAddEditOpen, setIsAddEditOpen] = useState(initialOpenAdd);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [viewingTeacher, setViewingTeacher] = useState<Teacher | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<Teacher | null>(null);

  // Form state
  const [formError, setFormError] = useState<string | null>(null);
  const [teacherId, setTeacherId] = useState('');
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState<Gender>('Female');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedGrades, setSelectedGrades] = useState<string[]>([]);
  const [employmentStatus, setEmploymentStatus] = useState<TeacherStatus>('Active');
  const [hireDate, setHireDate] = useState(new Date().toISOString().split('T')[0]);
  const [contact, setContact] = useState('');
  const [notes, setNotes] = useState('');

  const handleOpenAdd = () => {
    setEditingTeacher(null);
    setFormError(null);
    const nextNum = teachers.length + 1;
    setTeacherId(`T-${String(nextNum).padStart(3, '0')}`);
    setFirstName('');
    setMiddleName('');
    setLastName('');
    setGender('Female');
    setSelectedSubjects([]);
    setSelectedGrades([]);
    setEmploymentStatus('Active');
    setHireDate(new Date().toISOString().split('T')[0]);
    setContact('');
    setNotes('');
    setIsAddEditOpen(true);
  };

  const handleOpenEdit = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setFormError(null);
    setTeacherId(teacher.teacher_id);
    setFirstName(teacher.first_name);
    setMiddleName(teacher.middle_name || '');
    setLastName(teacher.last_name);
    setGender(teacher.gender);
    setSelectedSubjects(teacher.subject_ids || []);
    setSelectedGrades(teacher.grade_ids || []);
    setEmploymentStatus(teacher.employment_status);
    setHireDate(teacher.hire_date);
    setContact(teacher.contact || '');
    setNotes(teacher.notes || '');
    setIsAddEditOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!teacherId.trim() || !firstName.trim() || !lastName.trim()) {
      setFormError('Teacher ID, First Name, and Last Name are required.');
      return;
    }

    if (editingTeacher) {
      const res = updateTeacher(editingTeacher.id, {
        teacher_id: teacherId.trim(),
        first_name: firstName.trim(),
        middle_name: middleName.trim(),
        last_name: lastName.trim(),
        gender,
        subject_ids: selectedSubjects,
        grade_ids: selectedGrades,
        employment_status: employmentStatus,
        hire_date: hireDate,
        contact: contact.trim(),
        notes: notes.trim()
      });
      if (!res.success) {
        setFormError(res.error || 'Failed to update teacher');
        return;
      }
    } else {
      const res = addTeacher({
        teacher_id: teacherId.trim(),
        first_name: firstName.trim(),
        middle_name: middleName.trim(),
        last_name: lastName.trim(),
        gender,
        subject_ids: selectedSubjects,
        grade_ids: selectedGrades,
        employment_status: employmentStatus,
        hire_date: hireDate,
        contact: contact.trim(),
        notes: notes.trim()
      });
      if (!res.success) {
        setFormError(res.error || 'Failed to add teacher');
        return;
      }
    }

    setIsAddEditOpen(false);
  };

  const toggleSubject = (subId: string) => {
    setSelectedSubjects(prev => 
      prev.includes(subId) ? prev.filter(id => id !== subId) : [...prev, subId]
    );
  };

  const toggleGrade = (gId: string) => {
    setSelectedGrades(prev => 
      prev.includes(gId) ? prev.filter(id => id !== gId) : [...prev, gId]
    );
  };

  // Filtered list
  const filteredTeachers = useMemo(() => {
    return teachers.filter(t => {
      const fullName = `${t.first_name} ${t.middle_name || ''} ${t.last_name}`.toLowerCase();
      const matchSearch = t.teacher_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fullName.includes(searchTerm.toLowerCase());
      
      if (searchTerm && !matchSearch) return false;
      if (filterStatus && t.employment_status !== filterStatus) return false;
      if (filterSubject && !t.subject_ids?.includes(filterSubject)) return false;

      return true;
    });
  }, [teachers, searchTerm, filterStatus, filterSubject]);

  const subjectMap = useMemo(() => new Map(subjects.map(s => [s.id, s.name])), [subjects]);
  const gradeMap = useMemo(() => new Map(grades.map(g => [g.id, g.name])), [grades]);

  // Teacher statistics for view modal
  const teacherStats = useMemo(() => {
    if (!viewingTeacher) return null;
    const records = teacherAttendance.filter(a => a.teacher_id === viewingTeacher.id);
    const totalDays = records.length;
    const presentDays = records.filter(a => a.status === 'present').length;
    const attPct = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : null;

    const assignedClasses = classes.filter(c => c.teacher_id === viewingTeacher.id);

    return {
      totalDays,
      presentDays,
      attPct,
      assignedClasses
    };
  }, [viewingTeacher, teacherAttendance, classes]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              {getTranslation(lang, 'navTeachers')}
            </h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
              {teachers.length} Faculty
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage teaching faculty, subject qualifications, and grade assignments.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          {getTranslation(lang, 'addTeacher')}
        </button>
      </div>

      {/* Filter / Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or teacher ID..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <select
              value={filterSubject}
              onChange={e => setFilterSubject(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg text-slate-700"
            >
              <option value="">All Subjects</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg text-slate-700"
            >
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="On Leave">On Leave</option>
            </select>
          </div>
        </div>

        {(searchTerm || filterStatus || filterSubject) && (
          <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
            <span>Showing {filteredTeachers.length} of {teachers.length} teachers</span>
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterStatus('');
                setFilterSubject('');
              }}
              className="text-blue-600 hover:underline font-semibold flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" /> Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Main Table or Empty State */}
      {teachers.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title={getTranslation(lang, 'noTeachers')}
          description={getTranslation(lang, 'noTeachersSub')}
          actionText={getTranslation(lang, 'addTeacher')}
          onAction={handleOpenAdd}
        />
      ) : filteredTeachers.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <p className="text-sm font-bold text-slate-700">No teachers matching your filter criteria</p>
          <button
            onClick={() => {
              setSearchTerm('');
              setFilterStatus('');
              setFilterSubject('');
            }}
            className="mt-3 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-xs font-semibold rounded-lg text-slate-700"
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
                  <th className="py-3 px-4">Teacher ID</th>
                  <th className="py-3 px-4">Teacher Name</th>
                  <th className="py-3 px-4">Gender</th>
                  <th className="py-3 px-4">Subjects Taught</th>
                  <th className="py-3 px-4">Grades</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {filteredTeachers.map(teacher => {
                  const subjectNames = (teacher.subject_ids || [])
                    .map(id => subjectMap.get(id))
                    .filter(Boolean);

                  const gradeNames = (teacher.grade_ids || [])
                    .map(id => gradeMap.get(id))
                    .filter(Boolean);

                  const statusVariant = {
                    'Active': 'success',
                    'Inactive': 'neutral',
                    'On Leave': 'warning'
                  }[teacher.employment_status] as any;

                  return (
                    <tr key={teacher.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {teacher.teacher_id}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        <button
                          type="button"
                          onClick={() => setViewingTeacher(teacher)}
                          className="hover:text-blue-600 hover:underline text-left cursor-pointer"
                        >
                          {teacher.first_name} {teacher.middle_name} {teacher.last_name}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {teacher.gender}
                      </td>
                      <td className="py-3.5 px-4">
                        {subjectNames.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {subjectNames.map((sName, i) => (
                              <span key={i} className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-semibold">
                                {sName}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">None assigned</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {gradeNames.length > 0 ? (
                          <span className="text-slate-700">{gradeNames.join(', ')}</span>
                        ) : (
                          <span className="text-slate-400 italic">None assigned</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant={statusVariant} size="sm" dot>
                          {teacher.employment_status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setViewingTeacher(teacher)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(teacher)}
                            className="p-1.5 text-slate-400 hover:text-amber-600 rounded-lg hover:bg-slate-100"
                            title="Edit Teacher"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteCandidate(teacher)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100"
                            title="Delete Teacher"
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

      {/* Add / Edit Teacher Modal */}
      <Modal
        isOpen={isAddEditOpen}
        onClose={() => setIsAddEditOpen(false)}
        title={editingTeacher ? 'Edit Teacher Record' : 'Register Teaching Faculty'}
        subtitle="Summerland Academy Staff Directory"
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
                Teacher ID *
              </label>
              <input
                type="text"
                required
                value={teacherId}
                onChange={e => setTeacherId(e.target.value)}
                placeholder="e.g. T-101"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-500"
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
                <option value="Female">Female</option>
                <option value="Male">Male</option>
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
                placeholder="Middle name"
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
                placeholder="Last name"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Employment Status
              </label>
              <select
                value={employmentStatus}
                onChange={e => setEmploymentStatus(e.target.value as TeacherStatus)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-semibold"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="On Leave">On Leave</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Hire Date
              </label>
              <input
                type="date"
                value={hireDate}
                onChange={e => setHireDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          {/* Subjects selection */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
              Assigned Subjects
            </label>
            {subjects.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No curriculum subjects defined yet. You can assign subjects later.</p>
            ) : (
              <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
                {subjects.map(s => {
                  const isChecked = selectedSubjects.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggleSubject(s.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                        isChecked 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {isChecked ? '✓ ' : '+ '} {s.name} ({s.code})
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Grades selection */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
              Grade Levels Taught
            </label>
            <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
              {grades.map(g => {
                const isChecked = selectedGrades.includes(g.id);
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => toggleGrade(g.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                      isChecked 
                        ? 'bg-indigo-600 text-white' 
                        : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {isChecked ? '✓ ' : '+ '} {g.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Contact (Phone / Email)
              </label>
              <input
                type="text"
                value={contact}
                onChange={e => setContact(e.target.value)}
                placeholder="Optional teacher contact"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Notes
              </label>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Qualifications, role notes..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>
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
              {editingTeacher ? 'Save Changes' : 'Register Teacher'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Teacher Details Modal */}
      {viewingTeacher && (
        <Modal
          isOpen={true}
          onClose={() => setViewingTeacher(null)}
          title={`${viewingTeacher.first_name} ${viewingTeacher.last_name}`}
          subtitle={`Teacher Profile • ${viewingTeacher.teacher_id}`}
          maxWidth="md"
        >
          <div className="space-y-5">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 font-semibold block uppercase">EMPLOYMENT STATUS</span>
                <span className="text-base font-extrabold text-slate-900">
                  {viewingTeacher.employment_status}
                </span>
                <span className="text-xs text-slate-500 block">
                  Hired: {viewingTeacher.hire_date}
                </span>
              </div>
              <Badge variant={viewingTeacher.employment_status === 'Active' ? 'success' : 'neutral'} dot>
                {viewingTeacher.employment_status}
              </Badge>
            </div>

            {/* Attendance Rate */}
            <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 text-center">
              <span className="text-[10px] uppercase font-bold text-indigo-700 block">TEACHER ATTENDANCE RATE</span>
              <span className="text-2xl font-black text-indigo-900">
                {teacherStats?.attPct !== null ? `${teacherStats?.attPct}%` : '—'}
              </span>
              <span className="text-[10px] text-indigo-600 block mt-0.5">
                {teacherStats?.presentDays} of {teacherStats?.totalDays} recorded days
              </span>
            </div>

            <div className="text-xs space-y-2 border-t border-slate-100 pt-3">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-medium">Gender:</span>
                <span className="font-semibold text-slate-800">{viewingTeacher.gender}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-medium">Contact:</span>
                <span className="font-semibold text-slate-800">{viewingTeacher.contact || 'Not provided'}</span>
              </div>
              <div className="py-1 border-b border-slate-50">
                <span className="text-slate-400 font-medium block mb-1">Subjects Taught:</span>
                <div className="flex flex-wrap gap-1">
                  {(viewingTeacher.subject_ids || []).map(id => (
                    <span key={id} className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold text-[11px]">
                      {subjectMap.get(id) || id}
                    </span>
                  ))}
                  {(viewingTeacher.subject_ids || []).length === 0 && (
                    <span className="text-slate-400 italic">No subjects assigned</span>
                  )}
                </div>
              </div>
              {teacherStats?.assignedClasses && teacherStats.assignedClasses.length > 0 && (
                <div className="py-1 border-b border-slate-50">
                  <span className="text-slate-400 font-medium block mb-1">Class Teacher Assignment:</span>
                  <div className="flex flex-wrap gap-1">
                    {teacherStats.assignedClasses.map(c => (
                      <span key={c.id} className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold text-[11px]">
                        {c.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {viewingTeacher.notes && (
                <div className="pt-2">
                  <span className="text-slate-400 font-medium block mb-1">Notes:</span>
                  <p className="p-2.5 bg-slate-50 rounded-lg text-slate-700 italic border border-slate-200">
                    {viewingTeacher.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setViewingTeacher(null)}
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
            deleteTeacher(deleteCandidate.id);
            setDeleteCandidate(null);
          }
        }}
        title="Delete Teacher Record"
        message={`Are you sure you want to permanently remove "${deleteCandidate?.first_name} ${deleteCandidate?.last_name}" (${deleteCandidate?.teacher_id})? Any class teacher assignments will be unlinked.`}
        confirmText="Yes, Delete Teacher"
      />
    </div>
  );
};
