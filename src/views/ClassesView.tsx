import React, { useState, useMemo } from 'react';
import { useSchool } from '../context/SchoolContext';
import { ClassRoom } from '../types';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { EmptyState } from '../components/common/EmptyState';
import { Badge } from '../components/common/Badge';
import { 
  School, 
  Plus, 
  Edit3, 
  Trash2, 
  Users, 
  GraduationCap, 
  Layers, 
  AlertCircle 
} from 'lucide-react';
import { getTranslation } from '../utils/i18n';

interface ClassesViewProps {
  initialOpenAdd?: boolean;
}

export const ClassesView: React.FC<ClassesViewProps> = ({ initialOpenAdd = false }) => {
  const { 
    classes, 
    addClass, 
    updateClass, 
    deleteClass, 
    grades, 
    teachers, 
    students, 
    config, 
    lang 
  } = useSchool();

  const [isAddEditOpen, setIsAddEditOpen] = useState(initialOpenAdd);
  const [editingClass, setEditingClass] = useState<ClassRoom | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<ClassRoom | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Form
  const [gradeId, setGradeId] = useState(grades[0]?.id || '');
  const [section, setSection] = useState('A');
  const [teacherId, setTeacherId] = useState('');
  const [capacity, setCapacity] = useState(30);
  const [status, setStatus] = useState<'active' | 'inactive'>('active');

  const gradeMap = useMemo(() => new Map(grades.map(g => [g.id, g.name])), [grades]);
  const teacherMap = useMemo(() => new Map(teachers.map(t => [t.id, `${t.first_name} ${t.last_name}`])), [teachers]);

  const handleOpenAdd = () => {
    setEditingClass(null);
    setFormError(null);
    setGradeId(grades[0]?.id || '');
    setSection('A');
    setTeacherId('');
    setCapacity(30);
    setStatus('active');
    setIsAddEditOpen(true);
  };

  const handleOpenEdit = (cls: ClassRoom) => {
    setEditingClass(cls);
    setFormError(null);
    setGradeId(cls.grade_id);
    setSection(cls.section);
    setTeacherId(cls.teacher_id || '');
    setCapacity(cls.capacity);
    setStatus(cls.status);
    setIsAddEditOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!gradeId || !section.trim()) {
      setFormError('Grade and section are required.');
      return;
    }

    const gradeName = gradeMap.get(gradeId) || 'Class';
    const computedName = `${gradeName} - Section ${section.trim()}`;

    if (editingClass) {
      updateClass(editingClass.id, {
        name: computedName,
        grade_id: gradeId,
        section: section.trim(),
        teacher_id: teacherId || undefined,
        capacity,
        status
      });
    } else {
      addClass({
        name: computedName,
        grade_id: gradeId,
        section: section.trim(),
        academic_year: config.academic_year,
        teacher_id: teacherId || undefined,
        capacity,
        status
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
              {getTranslation(lang, 'navClasses')}
            </h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              {classes.length} Class Sections
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Organize kindergarten and elementary grade cohorts, assign homeroom class teachers, and manage capacity.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          {getTranslation(lang, 'addClass')}
        </button>
      </div>

      {classes.length === 0 ? (
        <EmptyState
          icon={School}
          title={getTranslation(lang, 'noClasses')}
          description={getTranslation(lang, 'noClassesSub')}
          actionText={getTranslation(lang, 'addClass')}
          onAction={handleOpenAdd}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map(cls => {
            const studentCount = students.filter(s => s.class_id === cls.id).length;
            const teacherName = cls.teacher_id ? teacherMap.get(cls.teacher_id) : 'Unassigned';
            const gradeObj = grades.find(g => g.id === cls.grade_id);
            const occupancyPct = Math.round((studentCount / cls.capacity) * 100);

            return (
              <div 
                key={cls.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-blue-200 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                        {cls.name}
                      </h3>
                      <span className="text-[11px] font-semibold text-slate-500 block capitalize">
                        {gradeObj?.level || 'Grade'} • Section {cls.section}
                      </span>
                    </div>
                    <Badge variant={cls.status === 'active' ? 'success' : 'neutral'} size="sm">
                      {cls.status}
                    </Badge>
                  </div>

                  {/* Class Teacher */}
                  <div className="mt-4 p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2.5 text-xs">
                    <GraduationCap className="w-4 h-4 text-purple-600 flex-shrink-0" />
                    <div className="truncate">
                      <span className="text-slate-400 block text-[10px]">CLASS TEACHER</span>
                      <span className="font-bold text-slate-800 truncate block">{teacherName}</span>
                    </div>
                  </div>

                  {/* Capacity & Occupancy Bar */}
                  <div className="mt-4 space-y-1 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span className="flex items-center gap-1 font-medium">
                        <Users className="w-3.5 h-3.5 text-blue-600" /> Enrolled Students:
                      </span>
                      <span className="font-bold text-slate-900">
                        {studentCount} / {cls.capacity} ({occupancyPct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div 
                        className={`h-2 rounded-full transition-all ${
                          occupancyPct > 100 ? 'bg-rose-500' : occupancyPct >= 80 ? 'bg-amber-500' : 'bg-blue-600'
                        }`}
                        style={{ width: `${Math.min(100, occupancyPct)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400 text-[11px] font-mono">{config.academic_year}</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(cls)}
                      className="p-1.5 text-slate-400 hover:text-amber-600 rounded-lg hover:bg-slate-100"
                      title="Edit Class"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteCandidate(cls)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100"
                      title="Delete Class"
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

      {/* Add / Edit Class Modal */}
      <Modal
        isOpen={isAddEditOpen}
        onClose={() => setIsAddEditOpen(false)}
        title={editingClass ? 'Edit Class Section' : 'Create Class Section'}
        subtitle="Summerland Academy Cohort Setup"
        maxWidth="md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {formError}
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
              Select Grade *
            </label>
            <select
              value={gradeId}
              onChange={e => setGradeId(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-bold"
            >
              {grades.map(g => (
                <option key={g.id} value={g.id}>{g.name} ({g.level})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Section Name *
              </label>
              <input
                type="text"
                required
                value={section}
                onChange={e => setSection(e.target.value)}
                placeholder="e.g. A, B, Blue, Red"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-bold"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Capacity
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={capacity}
                onChange={e => setCapacity(Number(e.target.value) || 30)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
              Assign Homeroom / Class Teacher
            </label>
            <select
              value={teacherId}
              onChange={e => setTeacherId(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-medium"
            >
              <option value="">-- No Teacher Assigned --</option>
              {teachers.map(t => (
                <option key={t.id} value={t.id}>{t.first_name} {t.last_name} ({t.teacher_id})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
              Status
            </label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as any)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
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
              {editingClass ? 'Save Changes' : 'Create Class'}
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
            const ok = deleteClass(deleteCandidate.id);
            if (!ok) {
              alert('Cannot delete class while students are enrolled. Please reassign or remove students first.');
            }
            setDeleteCandidate(null);
          }
        }}
        title="Delete Class Section"
        message={`Are you sure you want to delete "${deleteCandidate?.name}"? You cannot delete a class that currently has enrolled students.`}
        confirmText="Delete Class"
      />
    </div>
  );
};
