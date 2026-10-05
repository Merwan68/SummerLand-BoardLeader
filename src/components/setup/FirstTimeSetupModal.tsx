import React, { useState } from 'react';
import { useSchool } from '../../context/SchoolContext';
import { 
  Building2, 
  Layers, 
  School, 
  BookOpen, 
  GraduationCap, 
  Users, 
  Award, 
  Target, 
  Check, 
  ChevronRight, 
  ChevronLeft, 
  X,
  Plus,
  Trash2
} from 'lucide-react';

interface SetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FirstTimeSetupModal: React.FC<SetupModalProps> = ({ isOpen, onClose }) => {
  const { 
    config, 
    updateConfig, 
    grades, 
    addGrade, 
    deleteGrade, 
    classes, 
    addClass, 
    subjects, 
    addSubject, 
    teachers, 
    addTeacher, 
    students, 
    addStudent,
    completeSetup 
  } = useSchool();

  const [step, setStep] = useState(1);

  // Form states for inline creation during setup
  const [schoolName, setSchoolName] = useState(config.name);
  const [academicYear, setAcademicYear] = useState(config.academic_year);

  // New grade inline
  const [newGradeName, setNewGradeName] = useState('');
  const [newGradeLevel, setNewGradeLevel] = useState<'kindergarten' | 'elementary'>('elementary');

  // New class inline
  const [newClassName, setNewClassName] = useState('');
  const [newClassGrade, setNewClassGrade] = useState(grades[0]?.id || '');
  const [newClassSection, setNewClassSection] = useState('A');
  const [newClassCapacity, setNewClassCapacity] = useState(30);

  // New subject inline
  const [newSubjName, setNewSubjName] = useState('');
  const [newSubjCode, setNewSubjCode] = useState('');

  // New teacher inline
  const [newTeacherId, setNewTeacherId] = useState('');
  const [newTeacherFirst, setNewTeacherFirst] = useState('');
  const [newTeacherLast, setNewTeacherLast] = useState('');

  // New student inline
  const [newStudId, setNewStudId] = useState('');
  const [newStudFirst, setNewStudFirst] = useState('');
  const [newStudLast, setNewStudLast] = useState('');
  const [newStudGrade, setNewStudGrade] = useState(grades[0]?.id || '');

  if (!isOpen) return null;

  const totalSteps = 8;

  const handleNext = () => {
    if (step === 1) {
      updateConfig({ name: schoolName, academic_year: academicYear });
    }
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      completeSetup();
      onClose();
    }
  };

  const handleSkipAll = () => {
    completeSetup();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto no-print">
      <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs" onClick={handleSkipAll} />

      <div className="min-h-full flex items-center justify-center p-4">
        <div 
          className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Top Progress Bar */}
          <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-sm font-bold">
                {step}
              </span>
              <div>
                <h3 className="text-sm font-bold">First-Time Setup Wizard</h3>
                <p className="text-[11px] text-slate-400">Step {step} of {totalSteps} — Summerland Academy</p>
              </div>
            </div>
            <button
              onClick={handleSkipAll}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors"
            >
              Skip Setup <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="w-full bg-slate-100 h-1">
            <div 
              className="bg-blue-600 h-1 transition-all duration-300"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>

          {/* Step Content */}
          <div className="p-6 sm:p-8 min-h-[360px] flex flex-col justify-between">
            {/* Step 1: School Info */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-blue-600 mb-2">
                  <Building2 className="w-6 h-6" />
                  <h4 className="text-base font-bold text-slate-900">Step 1: Confirm School Information</h4>
                </div>
                <p className="text-xs text-slate-500">
                  Verify the school credentials and academic session for the Board Leader portal.
                </p>

                <div className="space-y-3 pt-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">School Name</label>
                    <input
                      type="text"
                      value={schoolName}
                      onChange={e => setSchoolName(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">School Type</label>
                    <input
                      type="text"
                      disabled
                      value={config.type}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 text-slate-500 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Academic Year</label>
                    <input
                      type="text"
                      value={academicYear}
                      onChange={e => setAcademicYear(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Grades */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-indigo-600 mb-2">
                  <Layers className="w-6 h-6" />
                  <h4 className="text-base font-bold text-slate-900">Step 2: School Grades Structure</h4>
                </div>
                <p className="text-xs text-slate-500">
                  Summerland Academy includes Kindergarten (KG 1–3) and Elementary (Grade 1–Grade 8). You can customize or add grades anytime.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
                  {grades.map(g => (
                    <div key={g.id} className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs">
                      <div>
                        <span className="font-semibold text-slate-800">{g.name}</span>
                        <span className="text-[10px] text-slate-400 block capitalize">{g.level}</span>
                      </div>
                      <button 
                        onClick={() => deleteGrade(g.id)}
                        className="text-slate-300 hover:text-red-500"
                        title="Remove grade"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 pt-2">
                  <input
                    type="text"
                    placeholder="New Grade Name (e.g. KG 4 or Grade 9)"
                    value={newGradeName}
                    onChange={e => setNewGradeName(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                  <select
                    value={newGradeLevel}
                    onChange={e => setNewGradeLevel(e.target.value as any)}
                    className="px-2 py-1.5 text-xs border border-slate-300 rounded-lg"
                  >
                    <option value="kindergarten">Kindergarten</option>
                    <option value="elementary">Elementary</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      if (!newGradeName) return;
                      addGrade({
                        name: newGradeName,
                        level: newGradeLevel,
                        order_number: grades.length + 1
                      });
                      setNewGradeName('');
                    }}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700"
                  >
                    + Add
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Classes */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-emerald-600 mb-2">
                  <School className="w-6 h-6" />
                  <h4 className="text-base font-bold text-slate-900">Step 3: Create Class Sections</h4>
                </div>
                <p className="text-xs text-slate-500">
                  Classes link grade levels with sections (e.g., Grade 1 - Section A). You currently have {classes.length} classes.
                </p>

                <div className="space-y-2 max-h-36 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
                  {classes.length === 0 ? (
                    <p className="text-xs text-slate-400 italic text-center py-4">No classes created yet. Add your first class below.</p>
                  ) : (
                    classes.map(c => (
                      <div key={c.id} className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-slate-200 text-xs">
                        <span className="font-semibold text-slate-800">{c.name}</span>
                        <span className="text-slate-400">Cap: {c.capacity}</span>
                      </div>
                    ))
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2">
                  <select
                    value={newClassGrade}
                    onChange={e => setNewClassGrade(e.target.value)}
                    className="px-2 py-1.5 text-xs border border-slate-300 rounded-lg"
                  >
                    {grades.map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Section (e.g. Section A)"
                    value={newClassSection}
                    onChange={e => setNewClassSection(e.target.value)}
                    className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const selGrade = grades.find(g => g.id === newClassGrade);
                      const name = `${selGrade?.name || 'Class'} - ${newClassSection}`;
                      addClass({
                        name,
                        grade_id: newClassGrade,
                        section: newClassSection,
                        academic_year: config.academic_year,
                        capacity: newClassCapacity,
                        status: 'active'
                      });
                      setNewClassSection('B');
                    }}
                    className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700"
                  >
                    + Add Class
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Subjects */}
            {step === 4 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-amber-600 mb-2">
                  <BookOpen className="w-6 h-6" />
                  <h4 className="text-base font-bold text-slate-900">Step 4: School Curriculum Subjects</h4>
                </div>
                <p className="text-xs text-slate-500">
                  Register school subjects (e.g. Mathematics, English, Amharic, Environmental Science).
                </p>

                <div className="space-y-2 max-h-36 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
                  {subjects.length === 0 ? (
                    <p className="text-xs text-slate-400 italic text-center py-4">No subjects added yet.</p>
                  ) : (
                    subjects.map(s => (
                      <div key={s.id} className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-slate-200 text-xs">
                        <span className="font-semibold text-slate-800">{s.name}</span>
                        <span className="font-mono text-slate-400">{s.code}</span>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <input
                    type="text"
                    placeholder="Subject Name (e.g. Mathematics)"
                    value={newSubjName}
                    onChange={e => setNewSubjName(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="Code (e.g. MATH-1)"
                    value={newSubjCode}
                    onChange={e => setNewSubjCode(e.target.value)}
                    className="w-24 px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!newSubjName) return;
                      addSubject({
                        name: newSubjName,
                        code: newSubjCode || newSubjName.substring(0, 4).toUpperCase(),
                        grade_ids: grades.map(g => g.id),
                        status: 'active'
                      });
                      setNewSubjName('');
                      setNewSubjCode('');
                    }}
                    className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-semibold hover:bg-amber-700"
                  >
                    + Add Subject
                  </button>
                </div>
              </div>
            )}

            {/* Step 5: Teachers */}
            {step === 5 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-purple-600 mb-2">
                  <GraduationCap className="w-6 h-6" />
                  <h4 className="text-base font-bold text-slate-900">Step 5: Teaching Staff</h4>
                </div>
                <p className="text-xs text-slate-500">
                  Register initial educators to record teacher attendance and class assignments.
                </p>

                <div className="space-y-2 max-h-36 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
                  {teachers.length === 0 ? (
                    <p className="text-xs text-slate-400 italic text-center py-4">No teachers added yet. You can add them now or later.</p>
                  ) : (
                    teachers.map(t => (
                      <div key={t.id} className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-slate-200 text-xs">
                        <span className="font-semibold text-slate-800">{t.first_name} {t.last_name}</span>
                        <span className="font-mono text-slate-400">{t.teacher_id}</span>
                      </div>
                    ))
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2">
                  <input
                    type="text"
                    placeholder="Teacher ID (e.g. T-101)"
                    value={newTeacherId}
                    onChange={e => setNewTeacherId(e.target.value)}
                    className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="First Name"
                    value={newTeacherFirst}
                    onChange={e => setNewTeacherFirst(e.target.value)}
                    className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="Last Name"
                    value={newTeacherLast}
                    onChange={e => setNewTeacherLast(e.target.value)}
                    className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!newTeacherId || !newTeacherFirst || !newTeacherLast) return;
                    addTeacher({
                      teacher_id: newTeacherId,
                      first_name: newTeacherFirst,
                      middle_name: '',
                      last_name: newTeacherLast,
                      gender: 'Female',
                      subject_ids: [],
                      grade_ids: [],
                      employment_status: 'Active',
                      hire_date: new Date().toISOString().split('T')[0]
                    });
                    setNewTeacherId('');
                    setNewTeacherFirst('');
                    setNewTeacherLast('');
                  }}
                  className="w-full py-1.5 bg-purple-600 text-white rounded-lg text-xs font-semibold hover:bg-purple-700"
                >
                  + Add Teacher
                </button>
              </div>
            )}

            {/* Step 6: Students */}
            {step === 6 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-blue-600 mb-2">
                  <Users className="w-6 h-6" />
                  <h4 className="text-base font-bold text-slate-900">Step 6: Enroll Students</h4>
                </div>
                <p className="text-xs text-slate-500">
                  Begin enrolling students into their assigned grades and classes. Currently {students.length} students enrolled.
                </p>

                <div className="space-y-2 max-h-36 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
                  {students.length === 0 ? (
                    <p className="text-xs text-slate-400 italic text-center py-4">No students enrolled yet. You can add them now or in Student Management.</p>
                  ) : (
                    students.map(s => (
                      <div key={s.id} className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-slate-200 text-xs">
                        <span className="font-semibold text-slate-800">{s.first_name} {s.last_name}</span>
                        <span className="font-mono text-slate-400">{s.student_id}</span>
                      </div>
                    ))
                  )}
                </div>

                <div className="grid grid-cols-4 gap-2 pt-2">
                  <input
                    type="text"
                    placeholder="ID (S-001)"
                    value={newStudId}
                    onChange={e => setNewStudId(e.target.value)}
                    className="px-2 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="First Name"
                    value={newStudFirst}
                    onChange={e => setNewStudFirst(e.target.value)}
                    className="px-2 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="Last Name"
                    value={newStudLast}
                    onChange={e => setNewStudLast(e.target.value)}
                    className="px-2 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                  <select
                    value={newStudGrade}
                    onChange={e => setNewStudGrade(e.target.value)}
                    className="px-2 py-1.5 text-xs border border-slate-300 rounded-lg"
                  >
                    {grades.map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!newStudId || !newStudFirst || !newStudLast) return;
                    const assignedClass = classes.find(c => c.grade_id === newStudGrade);
                    addStudent({
                      student_id: newStudId,
                      first_name: newStudFirst,
                      middle_name: '',
                      last_name: newStudLast,
                      gender: 'Male',
                      date_of_birth: '2018-01-01',
                      grade_id: newStudGrade,
                      class_id: assignedClass?.id || '',
                      academic_year: config.academic_year,
                      enrollment_date: new Date().toISOString().split('T')[0],
                      status: 'Active'
                    });
                    setNewStudId('');
                    setNewStudFirst('');
                    setNewStudLast('');
                  }}
                  className="w-full py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700"
                >
                  + Add Student
                </button>
              </div>
            )}

            {/* Step 7: Grading Scale */}
            {step === 7 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-yellow-600 mb-2">
                  <Award className="w-6 h-6" />
                  <h4 className="text-base font-bold text-slate-900">Step 7: Configure Grading System</h4>
                </div>
                <p className="text-xs text-slate-500">
                  Current grading scale for Summerland Academy. Passing mark is {config.thresholds.pass_mark}%.
                </p>

                <div className="space-y-1.5 max-h-48 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
                  {config.grading_rules.map((rule, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-xs">
                      <span className="font-bold text-blue-700 w-10">{rule.grade}</span>
                      <span className="text-slate-600 font-mono">{rule.min_score}% – {rule.max_score}%</span>
                      <span className="text-slate-400">{rule.description}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <label className="text-xs font-semibold text-slate-700">Minimum Passing Mark (%):</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={config.thresholds.pass_mark}
                    onChange={e => updateConfig({
                      thresholds: {
                        ...config.thresholds,
                        pass_mark: Number(e.target.value) || 50
                      }
                    })}
                    className="w-20 px-2 py-1 text-xs border border-slate-300 rounded-lg text-center font-bold"
                  />
                </div>
              </div>
            )}

            {/* Step 8: Targets & Thresholds */}
            {step === 8 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-rose-600 mb-2">
                  <Target className="w-6 h-6" />
                  <h4 className="text-base font-bold text-slate-900">Step 8: School Thresholds & Targets</h4>
                </div>
                <p className="text-xs text-slate-500">
                  Define benchmark thresholds used by the system to compute the overall School Status (🟢 Good, 🟡 Needs Attention, 🔴 Critical).
                </p>

                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Good Attendance Benchmark</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={config.thresholds.attendance_good}
                        onChange={e => updateConfig({
                          thresholds: { ...config.thresholds, attendance_good: Number(e.target.value) }
                        })}
                        className="w-16 px-2 py-1 border border-slate-300 rounded-md font-bold text-center"
                      />
                      <span className="text-slate-500">%</span>
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Warning Attendance Benchmark</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={config.thresholds.attendance_warning}
                        onChange={e => updateConfig({
                          thresholds: { ...config.thresholds, attendance_warning: Number(e.target.value) }
                        })}
                        className="w-16 px-2 py-1 border border-slate-300 rounded-md font-bold text-center"
                      />
                      <span className="text-slate-500">%</span>
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Good Academic Benchmark</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={config.thresholds.academic_good}
                        onChange={e => updateConfig({
                          thresholds: { ...config.thresholds, academic_good: Number(e.target.value) }
                        })}
                        className="w-16 px-2 py-1 border border-slate-300 rounded-md font-bold text-center"
                      />
                      <span className="text-slate-500">%</span>
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Warning Academic Benchmark</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={config.thresholds.academic_warning}
                        onChange={e => updateConfig({
                          thresholds: { ...config.thresholds, academic_warning: Number(e.target.value) }
                        })}
                        className="w-16 px-2 py-1 border border-slate-300 rounded-md font-bold text-center"
                      />
                      <span className="text-slate-500">%</span>
                    </div>
                  </div>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3 rounded-xl flex items-center gap-2">
                  <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <span>Setup is complete! You can update any setting at any time from the Settings tab.</span>
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
              ) : (
                <span />
              )}

              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors"
              >
                {step === totalSteps ? 'Finish & Open Dashboard' : 'Continue'} <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
