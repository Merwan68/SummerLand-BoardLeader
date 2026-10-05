import React, { useState } from 'react';
import { useSchool } from '../context/SchoolContext';
import { SchoolTarget, TargetIndicator, TargetStatus } from '../types';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { EmptyState } from '../components/common/EmptyState';
import { Badge } from '../components/common/Badge';
import { Target, Plus, Edit3, Trash2, CheckCircle2, TrendingUp, Calendar, AlertCircle } from 'lucide-react';
import { calculateStudentAttendancePercentage, calculateTeacherAttendancePercentage, calculateAcademicAverage, calculatePassRate } from '../utils/calculations';
import { getTranslation } from '../utils/i18n';

interface TargetsViewProps {
  initialOpenAdd?: boolean;
}

export const TargetsView: React.FC<TargetsViewProps> = ({ initialOpenAdd = false }) => {
  const { 
    targets, 
    addTarget, 
    updateTarget, 
    deleteTarget, 
    studentAttendance, 
    teacherAttendance, 
    marks, 
    assessments, 
    config, 
    lang 
  } = useSchool();

  const [isAddEditOpen, setIsAddEditOpen] = useState(initialOpenAdd);
  const [editingTarget, setEditingTarget] = useState<SchoolTarget | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<SchoolTarget | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [indicator, setIndicator] = useState<TargetIndicator>('student_attendance');
  const [targetValue, setTargetValue] = useState<number>(95);
  const [unit, setUnit] = useState('%');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('2027-06-30');
  const [status, setStatus] = useState<TargetStatus>('in_progress');
  const [notes, setNotes] = useState('');

  // Calculate real live metrics
  const liveStudentAtt = calculateStudentAttendancePercentage(studentAttendance);
  const liveTeacherAtt = calculateTeacherAttendancePercentage(teacherAttendance);
  const liveAcademicAvg = calculateAcademicAverage(marks, assessments);
  const livePassRate = calculatePassRate(marks, assessments, config.thresholds.pass_mark);

  const getMetricValue = (ind: TargetIndicator): number | null => {
    switch (ind) {
      case 'student_attendance': return liveStudentAtt;
      case 'teacher_attendance': return liveTeacherAtt;
      case 'academic_performance': return liveAcademicAvg;
      case 'pass_rate': return livePassRate;
      default: return null;
    }
  };

  const handleOpenAdd = () => {
    setEditingTarget(null);
    setTitle('Overall Student Attendance Goal');
    setIndicator('student_attendance');
    setTargetValue(95);
    setUnit('%');
    setStartDate(new Date().toISOString().split('T')[0]);
    setEndDate('2027-06-30');
    setStatus('in_progress');
    setNotes('');
    setIsAddEditOpen(true);
  };

  const handleOpenEdit = (tgt: SchoolTarget) => {
    setEditingTarget(tgt);
    setTitle(tgt.title);
    setIndicator(tgt.indicator);
    setTargetValue(tgt.target_value);
    setUnit(tgt.unit);
    setStartDate(tgt.start_date);
    setEndDate(tgt.end_date);
    setStatus(tgt.status);
    setNotes(tgt.notes || '');
    setIsAddEditOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || targetValue <= 0) return;

    if (editingTarget) {
      updateTarget(editingTarget.id, {
        title: title.trim(),
        indicator,
        target_value: targetValue,
        unit,
        start_date: startDate,
        end_date: endDate,
        status,
        notes: notes.trim()
      });
    } else {
      addTarget({
        title: title.trim(),
        indicator,
        target_value: targetValue,
        unit,
        start_date: startDate,
        end_date: endDate,
        status,
        notes: notes.trim()
      });
    }

    setIsAddEditOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              {getTranslation(lang, 'navTargets')} & Strategic Goals
            </h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
              {targets.length} Tracked
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Establish performance targets for student attendance, teacher attendance, academic averages, and pass rates.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          {getTranslation(lang, 'addTarget')}
        </button>
      </div>

      {targets.length === 0 ? (
        <EmptyState
          icon={Target}
          title={getTranslation(lang, 'noTargets')}
          description={getTranslation(lang, 'noTargetsSub')}
          actionText={getTranslation(lang, 'addTarget')}
          onAction={handleOpenAdd}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {targets.map(tgt => {
            const currentVal = getMetricValue(tgt.indicator);
            const achievementPct = currentVal !== null 
              ? Math.round((currentVal / tgt.target_value) * 100) 
              : null;
            const diff = currentVal !== null 
              ? Math.round((currentVal - tgt.target_value) * 10) / 10 
              : null;
            const isAchieved = achievementPct !== null && achievementPct >= 100;

            const statusBadgeVariant = {
              in_progress: 'info',
              achieved: 'success',
              missed: 'danger'
            }[tgt.status] as any;

            return (
              <div 
                key={tgt.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                        {tgt.title}
                      </h3>
                      <span className="text-[11px] font-semibold text-slate-400 block capitalize">
                        Indicator: {tgt.indicator.replace('_', ' ')}
                      </span>
                    </div>
                    <Badge variant={statusBadgeVariant} size="sm">
                      {tgt.status.replace('_', ' ')}
                    </Badge>
                  </div>

                  {/* Benchmark & Current Values */}
                  <div className="grid grid-cols-2 gap-3 mt-4 p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">TARGET VALUE</span>
                      <span className="text-xl font-extrabold text-slate-900">
                        {tgt.target_value}{tgt.unit}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">CURRENT RECORD</span>
                      <span className="text-xl font-extrabold text-blue-600">
                        {currentVal !== null ? `${currentVal}${tgt.unit}` : '— (No data)'}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4 space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-600">Achievement Rate:</span>
                      <span className={`font-bold ${isAchieved ? 'text-emerald-600' : 'text-slate-800'}`}>
                        {achievementPct !== null ? `${achievementPct}%` : 'Awaiting records'}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div 
                        className={`h-2.5 rounded-full transition-all duration-300 ${
                          isAchieved ? 'bg-emerald-500' : (achievementPct && achievementPct >= 75) ? 'bg-blue-600' : 'bg-amber-500'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(3, achievementPct || 0))}%` }}
                      />
                    </div>
                  </div>

                  {/* Difference from Target */}
                  {diff !== null && (
                    <p className={`text-xs mt-2 font-semibold ${diff >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {diff >= 0 ? `+${diff}${tgt.unit} above institutional target` : `${diff}${tgt.unit} below institutional target`}
                    </p>
                  )}

                  {tgt.notes && (
                    <p className="text-xs text-slate-500 mt-2 italic">
                      "{tgt.notes}"
                    </p>
                  )}
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1 text-[11px]">
                    <Calendar className="w-3.5 h-3.5" /> Until {tgt.end_date}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(tgt)}
                      className="p-1.5 text-slate-400 hover:text-amber-600 rounded-lg hover:bg-slate-100"
                      title="Edit Target"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteCandidate(tgt)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100"
                      title="Delete Target"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Target Modal */}
      <Modal
        isOpen={isAddEditOpen}
        onClose={() => setIsAddEditOpen(false)}
        title={editingTarget ? 'Edit Strategic Target' : 'Establish School Target'}
        subtitle="Institutional Key Performance Indicator (KPI)"
        maxWidth="md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
              Target Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Student Attendance Rate Benchmark"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-bold"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
              Metric Indicator *
            </label>
            <select
              value={indicator}
              onChange={e => {
                const ind = e.target.value as TargetIndicator;
                setIndicator(ind);
                if (ind === 'student_attendance') { setTargetValue(95); setTitle('Student Attendance Goal'); }
                else if (ind === 'teacher_attendance') { setTargetValue(95); setTitle('Teacher Attendance Goal'); }
                else if (ind === 'academic_performance') { setTargetValue(85); setTitle('Academic Performance Average Goal'); }
                else if (ind === 'pass_rate') { setTargetValue(90); setTitle('Institutional Pass Rate Goal'); }
              }}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-semibold"
            >
              <option value="student_attendance">Student Attendance</option>
              <option value="teacher_attendance">Teacher Attendance</option>
              <option value="academic_performance">Academic Performance Average</option>
              <option value="pass_rate">Pass Rate</option>
              <option value="custom">Custom Metric</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Target Value *
              </label>
              <input
                type="number"
                min="1"
                max="1000"
                value={targetValue}
                onChange={e => setTargetValue(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-bold"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Unit
              </label>
              <input
                type="text"
                value={unit}
                onChange={e => setUnit(e.target.value)}
                placeholder="%, students, pts"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Target Deadline
              </label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
              Target Status
            </label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as TargetStatus)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-semibold"
            >
              <option value="in_progress">In Progress</option>
              <option value="achieved">Achieved</option>
              <option value="missed">Missed</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
              Strategic Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Action plan or notes to reach this objective..."
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
              {editingTarget ? 'Save Changes' : 'Save Target'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteCandidate)}
        onClose={() => setDeleteCandidate(null)}
        onConfirm={() => {
          if (deleteCandidate) {
            deleteTarget(deleteCandidate.id);
            setDeleteCandidate(null);
          }
        }}
        title="Delete Target"
        message={`Are you sure you want to remove the target "${deleteCandidate?.title}"?`}
        confirmText="Delete Target"
      />
    </div>
  );
};
