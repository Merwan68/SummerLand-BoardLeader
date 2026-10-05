import React, { useState, useMemo } from 'react';
import { useSchool } from '../context/SchoolContext';
import { Assessment, Mark, AssessmentType, AcademicTerm } from '../types';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { EmptyState } from '../components/common/EmptyState';
import { Badge } from '../components/common/Badge';
import { SimpleBarChart, DonutChart } from '../components/charts/Charts';
import { 
  Award, 
  Plus, 
  BookOpen, 
  School, 
  Edit3, 
  Trash2, 
  Save, 
  TrendingUp, 
  Check, 
  Search, 
  FileSpreadsheet, 
  Sparkles,
  ArrowUpRight,
  AlertCircle
} from 'lucide-react';
import { calculateAcademicAverage, calculatePassRate, getGradeLetter } from '../utils/calculations';
import { getTranslation } from '../utils/i18n';

interface AcademicsViewProps {
  initialSubTab?: 'assessments' | 'marks' | 'performance';
}

export const AcademicsView: React.FC<AcademicsViewProps> = ({ initialSubTab = 'marks' }) => {
  const { 
    grades, 
    classes, 
    subjects, 
    students, 
    assessments, 
    addAssessment, 
    updateAssessment, 
    deleteAssessment, 
    marks, 
    saveMarksBulk, 
    config, 
    lang 
  } = useSchool();

  const [activeTab, setActiveTab] = useState<'assessments' | 'marks' | 'performance'>(initialSubTab);

  // ASSESSMENT MODAL STATE
  const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState<Assessment | null>(null);
  const [deleteCandidateAsm, setDeleteCandidateAsm] = useState<Assessment | null>(null);
  const [asmFormError, setAsmFormError] = useState<string | null>(null);

  const [asmName, setAsmName] = useState('');
  const [asmType, setAsmType] = useState<AssessmentType>('Midterm');
  const [asmTerm, setAsmTerm] = useState<AcademicTerm>('Term 1');
  const [asmDate, setAsmDate] = useState(new Date().toISOString().split('T')[0]);
  const [asmMaxScore, setAsmMaxScore] = useState<number>(100);
  const [asmGradeId, setAsmGradeId] = useState(grades[0]?.id || '');
  const [asmClassId, setAsmClassId] = useState('');
  const [asmSubjectId, setAsmSubjectId] = useState(subjects[0]?.id || '');

  // MARKS ENTRY STATE
  const [entryGradeId, setEntryGradeId] = useState<string>(grades[0]?.id || '');
  const [entryClassId, setEntryClassId] = useState<string>('');
  const [entrySubjectId, setEntrySubjectId] = useState<string>('');
  const [entryAssessmentId, setEntryAssessmentId] = useState<string>('');
  const [marksInput, setMarksInput] = useState<Record<string, number | ''>>({});
  const [marksNotes, setMarksNotes] = useState<Record<string, string>>({});
  const [marksSaveSuccess, setMarksSaveSuccess] = useState<string | null>(null);

  // Synchronize available classes and subjects for Grade
  const availableClassesForGrade = useMemo(() => {
    return classes.filter(c => c.grade_id === entryGradeId);
  }, [classes, entryGradeId]);

  React.useEffect(() => {
    if (availableClassesForGrade.length > 0 && (!entryClassId || !availableClassesForGrade.some(c => c.id === entryClassId))) {
      setEntryClassId(availableClassesForGrade[0].id);
    }
  }, [availableClassesForGrade, entryClassId]);

  // Assessments matching the selected Class and Grade
  const eligibleAssessments = useMemo(() => {
    return assessments.filter(a => {
      if (entryClassId && a.class_id && a.class_id !== entryClassId) return false;
      if (entryGradeId && a.grade_id && a.grade_id !== entryGradeId) return false;
      if (entrySubjectId && a.subject_id !== entrySubjectId) return false;
      return true;
    });
  }, [assessments, entryGradeId, entryClassId, entrySubjectId]);

  React.useEffect(() => {
    if (eligibleAssessments.length > 0 && (!entryAssessmentId || !eligibleAssessments.some(a => a.id === entryAssessmentId))) {
      setEntryAssessmentId(eligibleAssessments[0].id);
    }
  }, [eligibleAssessments, entryAssessmentId]);

  const currentAssessment = assessments.find(a => a.id === entryAssessmentId);

  // Enrolled students in target class
  const classStudents = useMemo(() => {
    if (!entryClassId) return [];
    return students.filter(s => s.class_id === entryClassId && s.status === 'Active');
  }, [students, entryClassId]);

  // Load existing marks into entry inputs
  React.useEffect(() => {
    if (!entryAssessmentId) {
      setMarksInput({});
      return;
    }
    const existing = marks.filter(m => m.assessment_id === entryAssessmentId);
    const newInputs: Record<string, number | ''> = {};
    const newNotes: Record<string, string> = {};

    classStudents.forEach(st => {
      const match = existing.find(e => e.student_id === st.id);
      newInputs[st.id] = match !== undefined ? match.score : '';
      newNotes[st.id] = match?.notes || '';
    });

    setMarksInput(newInputs);
    setMarksNotes(newNotes);
  }, [entryAssessmentId, classStudents, marks]);

  // Save Marks Handler
  const handleSaveMarks = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAssessment) return;

    const listToSave: Omit<Mark, 'id' | 'created_at'>[] = [];
    for (const student of classStudents) {
      const val = marksInput[student.id];
      if (val !== '' && val !== undefined) {
        const numVal = Number(val);
        // Validations: cannot exceed max_score and cannot be negative
        if (numVal < 0 || numVal > currentAssessment.max_score) {
          alert(`Score for ${student.first_name} ${student.last_name} must be between 0 and ${currentAssessment.max_score}`);
          return;
        }
        listToSave.push({
          assessment_id: currentAssessment.id,
          student_id: student.id,
          score: numVal,
          notes: marksNotes[student.id] || ''
        });
      }
    }

    saveMarksBulk(listToSave);
    setMarksSaveSuccess(`Saved marks for ${listToSave.length} students in "${currentAssessment.name}"`);
    setTimeout(() => setMarksSaveSuccess(null), 3000);
  };

  // Assessment Creation Handler
  const handleOpenAddAssessment = () => {
    setEditingAssessment(null);
    setAsmFormError(null);
    setAsmName('');
    setAsmType('Midterm');
    setAsmTerm('Term 1');
    setAsmDate(new Date().toISOString().split('T')[0]);
    setAsmMaxScore(100);
    setAsmGradeId(grades[0]?.id || '');
    setAsmClassId(classes[0]?.id || '');
    setAsmSubjectId(subjects[0]?.id || '');
    setIsAssessmentModalOpen(true);
  };

  const handleSaveAssessment = (e: React.FormEvent) => {
    e.preventDefault();
    setAsmFormError(null);

    if (!asmName.trim() || !asmGradeId || !asmSubjectId || asmMaxScore <= 0) {
      setAsmFormError('Assessment name, grade, subject, and valid maximum score (>0) are required.');
      return;
    }

    if (editingAssessment) {
      updateAssessment(editingAssessment.id, {
        name: asmName.trim(),
        type: asmType,
        term: asmTerm,
        date: asmDate,
        max_score: asmMaxScore,
        grade_id: asmGradeId,
        class_id: asmClassId,
        subject_id: asmSubjectId
      });
    } else {
      const created = addAssessment({
        name: asmName.trim(),
        type: asmType,
        term: asmTerm,
        date: asmDate,
        max_score: asmMaxScore,
        grade_id: asmGradeId,
        class_id: asmClassId,
        subject_id: asmSubjectId
      });
      // Auto select created assessment
      setEntryAssessmentId(created.id);
      setEntryGradeId(created.grade_id);
      setEntryClassId(created.class_id);
      setEntrySubjectId(created.subject_id);
    }

    setIsAssessmentModalOpen(false);
  };

  // Maps
  const gradeMap = useMemo(() => new Map(grades.map(g => [g.id, g.name])), [grades]);
  const classMap = useMemo(() => new Map(classes.map(c => [c.id, c.name])), [classes]);
  const subjectMap = useMemo(() => new Map(subjects.map(s => [s.id, s.name])), [subjects]);

  // Performance Analytics computations
  const overallAvg = calculateAcademicAverage(marks, assessments);
  const overallPassRate = calculatePassRate(marks, assessments, config.thresholds.pass_mark);

  // Subject Performance Ranking
  const subjectPerformance = useMemo(() => {
    if (marks.length === 0 || assessments.length === 0) return [];
    const asmMap = new Map(assessments.map(a => [a.id, a]));

    const subScores = new Map<string, { totalNormalized: number; count: number }>();
    marks.forEach(m => {
      const asm = asmMap.get(m.assessment_id);
      if (asm && asm.max_score > 0) {
        const norm = (m.score / asm.max_score) * 100;
        const entry = subScores.get(asm.subject_id) || { totalNormalized: 0, count: 0 };
        entry.totalNormalized += norm;
        entry.count++;
        subScores.set(asm.subject_id, entry);
      }
    });

    return Array.from(subScores.entries()).map(([subId, stat]) => {
      const avg = Math.round((stat.totalNormalized / stat.count) * 10) / 10;
      return {
        label: subjectMap.get(subId) || 'Subject',
        value: avg,
        count: stat.count
      };
    }).sort((a, b) => b.value - a.value);
  }, [marks, assessments, subjectMap]);

  // Grade Performance Breakdown
  const gradePerformance = useMemo(() => {
    if (marks.length === 0 || assessments.length === 0) return [];
    const asmMap = new Map(assessments.map(a => [a.id, a]));

    const grScores = new Map<string, { totalNormalized: number; count: number }>();
    marks.forEach(m => {
      const asm = asmMap.get(m.assessment_id);
      if (asm && asm.max_score > 0) {
        const norm = (m.score / asm.max_score) * 100;
        const entry = grScores.get(asm.grade_id) || { totalNormalized: 0, count: 0 };
        entry.totalNormalized += norm;
        entry.count++;
        grScores.set(asm.grade_id, entry);
      }
    });

    return Array.from(grScores.entries()).map(([grId, stat]) => {
      const avg = Math.round((stat.totalNormalized / stat.count) * 10) / 10;
      return {
        label: gradeMap.get(grId) || 'Grade',
        value: avg
      };
    });
  }, [marks, assessments, gradeMap]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Academic & Marks Management
            </h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
              {config.academic_year}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Assessments registry, bulk marks entry, grade calculation, and institutional performance monitoring.
          </p>
        </div>

        {/* Sub-tab Navigation */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('marks')}
            className={`px-3.5 py-2 rounded-lg transition-all ${
              activeTab === 'marks' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Enter Marks
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('assessments')}
            className={`px-3.5 py-2 rounded-lg transition-all ${
              activeTab === 'assessments' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Assessments ({assessments.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('performance')}
            className={`px-3.5 py-2 rounded-lg transition-all ${
              activeTab === 'performance' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Analytics & Reports
          </button>
        </div>
      </div>

      {/* ================= TAB 1: MARKS ENTRY ================= */}
      {activeTab === 'marks' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Student Examination & Assessment Marks</h2>
              <p className="text-xs text-slate-500">
                Select grade, class, and assessment to record student scores. Grade letters (A+ to F) compute automatically.
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenAddAssessment}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> + New Assessment
            </button>
          </div>

          {/* Cascading Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200/80">
            <div>
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                1. Select Grade
              </label>
              <select
                value={entryGradeId}
                onChange={e => setEntryGradeId(e.target.value)}
                className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg bg-white font-bold"
              >
                {grades.map(g => (
                  <option key={g.id} value={g.id}>{g.name} ({g.level})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                2. Select Class
              </label>
              <select
                value={entryClassId}
                onChange={e => setEntryClassId(e.target.value)}
                className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg bg-white font-bold"
              >
                {availableClassesForGrade.length === 0 ? (
                  <option value="">No classes in this grade</option>
                ) : (
                  availableClassesForGrade.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                3. Subject Filter
              </label>
              <select
                value={entrySubjectId}
                onChange={e => setEntrySubjectId(e.target.value)}
                className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg bg-white"
              >
                <option value="">All Subjects</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                4. Select Assessment
              </label>
              <select
                value={entryAssessmentId}
                onChange={e => setEntryAssessmentId(e.target.value)}
                className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg bg-white font-bold text-blue-700"
              >
                {eligibleAssessments.length === 0 ? (
                  <option value="">No assessment found</option>
                ) : (
                  eligibleAssessments.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.name} (Max: {a.max_score})
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* Success banner */}
          {marksSaveSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{marksSaveSuccess}</span>
            </div>
          )}

          {/* Marks Entry Grid */}
          {!currentAssessment ? (
            <div className="p-12 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              <Award className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">No assessment selected</p>
              <p className="text-xs text-slate-400 mt-1 mb-4">
                Create an assessment (e.g. Mathematics Midterm) to begin entering student marks.
              </p>
              <button
                type="button"
                onClick={handleOpenAddAssessment}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700"
              >
                + Create Assessment
              </button>
            </div>
          ) : classStudents.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              <p className="text-sm font-bold text-slate-700">No active students in this class section</p>
              <p className="text-xs text-slate-400 mt-1">Enroll students into this class to grade them.</p>
            </div>
          ) : (
            <form onSubmit={handleSaveMarks} className="space-y-4">
              <div className="flex items-center justify-between text-xs p-3 bg-blue-50/70 rounded-xl border border-blue-100">
                <span className="font-bold text-blue-900">
                  Assessment: <strong>{currentAssessment.name}</strong> • Subject: <strong>{subjectMap.get(currentAssessment.subject_id)}</strong> • Maximum Score: <strong>{currentAssessment.max_score}</strong>
                </span>
                <span className="text-slate-500 font-semibold">
                  Passing Standard: {config.thresholds.pass_mark}%
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                      <th className="py-3 px-4">Student ID</th>
                      <th className="py-3 px-4">Student Name</th>
                      <th className="py-3 px-4 w-36">Score (Max: {currentAssessment.max_score})</th>
                      <th className="py-3 px-4 text-center">Score %</th>
                      <th className="py-3 px-4 text-center">Computed Grade</th>
                      <th className="py-3 px-4">Teacher Remark</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {classStudents.map(student => {
                      const rawScore = marksInput[student.id];
                      const hasScore = rawScore !== '' && rawScore !== undefined;
                      const scoreNum = hasScore ? Number(rawScore) : 0;
                      const pct = hasScore ? Math.round((scoreNum / currentAssessment.max_score) * 100) : null;
                      const gradeInfo = pct !== null ? getGradeLetter(pct, config.grading_rules) : null;
                      const isPassing = pct !== null ? pct >= config.thresholds.pass_mark : true;

                      return (
                        <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-slate-900">
                            {student.student_id}
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-800">
                            {student.first_name} {student.last_name}
                          </td>
                          <td className="py-3 px-4">
                            <input
                              type="number"
                              min="0"
                              max={currentAssessment.max_score}
                              step="0.5"
                              value={rawScore}
                              onChange={e => {
                                const val = e.target.value === '' ? '' : Number(e.target.value);
                                setMarksInput(prev => ({ ...prev, [student.id]: val }));
                              }}
                              placeholder="0 - 100"
                              className="w-28 px-3 py-1.5 text-xs font-bold text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                          </td>
                          <td className="py-3 px-4 text-center font-bold font-mono">
                            {pct !== null ? `${pct}%` : '—'}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {gradeInfo ? (
                              <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-extrabold ${
                                isPassing ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                              }`}>
                                {gradeInfo.grade}
                              </span>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <input
                              type="text"
                              value={marksNotes[student.id] || ''}
                              onChange={e => setMarksNotes(prev => ({ ...prev, [student.id]: e.target.value }))}
                              placeholder="Optional feedback..."
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
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  Save Assessment Marks
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ================= TAB 2: ASSESSMENTS LIST ================= */}
      {activeTab === 'assessments' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">School Examination & Assessment Registry</h2>
              <p className="text-xs text-slate-500">Configure Quizzes, Assignments, Midterms, and Final Examinations.</p>
            </div>

            <button
              type="button"
              onClick={handleOpenAddAssessment}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" /> New Assessment
            </button>
          </div>

          {assessments.length === 0 ? (
            <EmptyState
              icon={Award}
              title="No assessments created yet"
              description="Define tests, midterms, or continuous assessments to grade students."
              actionText="+ Create Assessment"
              onAction={handleOpenAddAssessment}
            />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                    <th className="py-3 px-4">Assessment Name</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Term</th>
                    <th className="py-3 px-4">Subject</th>
                    <th className="py-3 px-4">Grade & Section</th>
                    <th className="py-3 px-4 text-center">Max Score</th>
                    <th className="py-3 px-4 text-center">Marks Entered</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {assessments.map(asm => {
                    const enteredCount = marks.filter(m => m.assessment_id === asm.id).length;

                    return (
                      <tr key={asm.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {asm.name}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-[11px]">
                            {asm.type}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 font-semibold">
                          {asm.term}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-blue-700">
                          {subjectMap.get(asm.subject_id) || 'Subject'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {gradeMap.get(asm.grade_id) || 'Grade'} {asm.class_id ? `• ${classMap.get(asm.class_id)}` : ''}
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold font-mono">
                          {asm.max_score}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            enteredCount > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {enteredCount} records
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setEntryAssessmentId(asm.id);
                                setEntryGradeId(asm.grade_id);
                                setEntryClassId(asm.class_id);
                                setEntrySubjectId(asm.subject_id);
                                setActiveTab('marks');
                              }}
                              className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-[11px] font-bold mr-1"
                            >
                              Grade
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteCandidateAsm(asm)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100"
                              title="Delete Assessment"
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
          )}
        </div>
      )}

      {/* ================= TAB 3: ACADEMIC PERFORMANCE & ANALYTICS ================= */}
      {activeTab === 'performance' && (
        <div className="space-y-6">
          {/* KPI Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                OVERALL ACADEMIC AVERAGE
              </span>
              <span className="text-3xl font-black text-slate-900 mt-2 block">
                {overallAvg !== null ? `${overallAvg}%` : '—'}
              </span>
              <span className="text-xs text-slate-500 mt-1 block">
                {marks.length > 0 ? `Across ${marks.length} marks recorded` : 'No marks entered yet'}
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                OVERALL PASS RATE
              </span>
              <span className="text-3xl font-black text-emerald-600 mt-2 block">
                {overallPassRate !== null ? `${overallPassRate}%` : '—'}
              </span>
              <span className="text-xs text-slate-500 mt-1 block">
                Pass mark benchmark: {config.thresholds.pass_mark}%
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                FAIL RATE
              </span>
              <span className="text-3xl font-black text-rose-600 mt-2 block">
                {overallPassRate !== null ? `${Math.round((100 - overallPassRate) * 10) / 10}%` : '—'}
              </span>
              <span className="text-xs text-slate-500 mt-1 block">
                Requiring academic remediation
              </span>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight mb-1">
                Average Academic Performance by Subject
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Identifies highest-performing and subjects requiring instructional support
              </p>

              <SimpleBarChart
                data={subjectPerformance}
                height={220}
                emptyMessage="No academic data available yet. Add student marks to see performance analytics."
              />
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight mb-1">
                Average Academic Performance by Grade
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Progression across Kindergarten and Elementary grade levels
              </p>

              <SimpleBarChart
                data={gradePerformance}
                height={220}
                color="#8b5cf6"
                emptyMessage="No grade data recorded yet."
              />
            </div>
          </div>

          {/* Empty state alert if no marks at all */}
          {marks.length === 0 && (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-xs">
              <Award className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h3 className="text-base font-bold text-slate-800">No academic data available yet</h3>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                Add student marks to see performance analytics, pass rates, and grade distribution charts.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('marks')}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
              >
                + Add Marks
              </button>
            </div>
          )}
        </div>
      )}

      {/* New / Edit Assessment Modal */}
      <Modal
        isOpen={isAssessmentModalOpen}
        onClose={() => setIsAssessmentModalOpen(false)}
        title={editingAssessment ? 'Edit Assessment' : 'Create Examination / Assessment'}
        subtitle="Define Assessment Structure for Marks Entry"
        maxWidth="md"
      >
        <form onSubmit={handleSaveAssessment} className="space-y-4">
          {asmFormError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {asmFormError}
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
              Assessment Title *
            </label>
            <input
              type="text"
              required
              value={asmName}
              onChange={e => setAsmName(e.target.value)}
              placeholder="e.g. Mathematics Midterm Exam"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Assessment Type *
              </label>
              <select
                value={asmType}
                onChange={e => setAsmType(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-semibold"
              >
                <option value="Midterm">Midterm Exam</option>
                <option value="Final Exam">Final Exam</option>
                <option value="Quiz">Quiz</option>
                <option value="Assignment">Assignment</option>
                <option value="Continuous Assessment">Continuous Assessment</option>
                <option value="Practical">Practical / Project</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Academic Term *
              </label>
              <select
                value={asmTerm}
                onChange={e => setAsmTerm(e.target.value as AcademicTerm)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-semibold"
              >
                <option value="Term 1">Term 1</option>
                <option value="Term 2">Term 2</option>
                <option value="Term 3">Term 3</option>
                <option value="Term 4">Term 4</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Subject *
              </label>
              <select
                value={asmSubjectId}
                onChange={e => setAsmSubjectId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-bold text-blue-700"
              >
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Maximum Score *
              </label>
              <input
                type="number"
                min="1"
                max="500"
                value={asmMaxScore}
                onChange={e => setAsmMaxScore(Number(e.target.value) || 100)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Grade *
              </label>
              <select
                value={asmGradeId}
                onChange={e => setAsmGradeId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-bold"
              >
                {grades.map(g => (
                  <option key={g.id} value={g.id}>{g.name} ({g.level})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Assessment Date
              </label>
              <input
                type="date"
                value={asmDate}
                onChange={e => setAsmDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsAssessmentModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs cursor-pointer"
            >
              {editingAssessment ? 'Save Changes' : 'Create Assessment'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Assessment Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteCandidateAsm)}
        onClose={() => setDeleteCandidateAsm(null)}
        onConfirm={() => {
          if (deleteCandidateAsm) {
            deleteAssessment(deleteCandidateAsm.id);
            setDeleteCandidateAsm(null);
          }
        }}
        title="Delete Assessment"
        message={`Are you sure you want to delete assessment "${deleteCandidateAsm?.name}"? All student marks associated with this assessment will also be removed.`}
        confirmText="Yes, Delete Assessment"
      />
    </div>
  );
};
