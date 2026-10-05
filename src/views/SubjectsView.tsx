import React, { useState } from 'react';
import { useSchool } from '../context/SchoolContext';
import { Subject } from '../types';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { EmptyState } from '../components/common/EmptyState';
import { Badge } from '../components/common/Badge';
import { BookOpen, Plus, Edit3, Trash2, Layers } from 'lucide-react';
import { getTranslation } from '../utils/i18n';

export const SubjectsView: React.FC = () => {
  const { subjects, addSubject, updateSubject, deleteSubject, grades, lang } = useSchool();

  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<Subject | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [selectedGrades, setSelectedGrades] = useState<string[]>([]);
  const [status, setStatus] = useState<'active' | 'inactive'>('active');

  const handleOpenAdd = () => {
    setEditingSubject(null);
    setName('');
    setCode('');
    setSelectedGrades(grades.map(g => g.id)); // select all by default
    setStatus('active');
    setIsAddEditOpen(true);
  };

  const handleOpenEdit = (subj: Subject) => {
    setEditingSubject(subj);
    setName(subj.name);
    setCode(subj.code);
    setSelectedGrades(subj.grade_ids || []);
    setStatus(subj.status);
    setIsAddEditOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const finalCode = code.trim() || name.substring(0, 4).toUpperCase();

    if (editingSubject) {
      updateSubject(editingSubject.id, {
        name: name.trim(),
        code: finalCode,
        grade_ids: selectedGrades,
        status
      });
    } else {
      addSubject({
        name: name.trim(),
        code: finalCode,
        grade_ids: selectedGrades,
        status
      });
    }

    setIsAddEditOpen(false);
  };

  const toggleGrade = (gId: string) => {
    setSelectedGrades(prev => 
      prev.includes(gId) ? prev.filter(id => id !== gId) : [...prev, gId]
    );
  };

  const gradeMap = new Map(grades.map(g => [g.id, g.name]));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              {getTranslation(lang, 'navSubjects')}
            </h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
              {subjects.length} Subjects
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Define curriculum subjects, course codes, and assign them across Kindergarten and Elementary grades.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          {getTranslation(lang, 'addSubject')}
        </button>
      </div>

      {deleteError && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
          {deleteError}
        </div>
      )}

      {subjects.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title={getTranslation(lang, 'noSubjects')}
          description={getTranslation(lang, 'noSubjectsSub')}
          actionText={getTranslation(lang, 'addSubject')}
          onAction={handleOpenAdd}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map(subj => {
            const gradeNames = (subj.grade_ids || []).map(id => gradeMap.get(id)).filter(Boolean);

            return (
              <div 
                key={subj.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                        {subj.code}
                      </span>
                      <h3 className="text-base font-extrabold text-slate-900 tracking-tight mt-1.5">
                        {subj.name}
                      </h3>
                    </div>
                    <Badge variant={subj.status === 'active' ? 'success' : 'neutral'} size="sm">
                      {subj.status}
                    </Badge>
                  </div>

                  <div className="mt-4">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                      Assigned Grades ({gradeNames.length})
                    </span>
                    <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                      {gradeNames.length > 0 ? (
                        gradeNames.map((gName, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-medium">
                            {gName}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400 italic text-xs">Not assigned to any grade yet</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(subj)}
                    className="p-1.5 text-slate-400 hover:text-amber-600 rounded-lg hover:bg-slate-100"
                    title="Edit Subject"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteError(null);
                      setDeleteCandidate(subj);
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100"
                    title="Delete Subject"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Subject Modal */}
      <Modal
        isOpen={isAddEditOpen}
        onClose={() => setIsAddEditOpen(false)}
        title={editingSubject ? 'Edit Subject' : 'Add Curriculum Subject'}
        subtitle="Configure Academic Subject Details"
        maxWidth="md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Subject Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Mathematics, English, Amharic"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-bold"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Code
              </label>
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="MATH-1"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono uppercase"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
              Assign to Grades
            </label>
            <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
              {grades.map(g => {
                const isSelected = selectedGrades.includes(g.id);
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => toggleGrade(g.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                      isSelected 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '} {g.name}
                  </button>
                );
              })}
            </div>
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
              {editingSubject ? 'Save Changes' : 'Add Subject'}
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
            const ok = deleteSubject(deleteCandidate.id);
            if (!ok) {
              setDeleteError(`Cannot delete "${deleteCandidate.name}" because assessment records are linked to this subject.`);
            }
            setDeleteCandidate(null);
          }
        }}
        title="Delete Subject"
        message={`Are you sure you want to remove "${deleteCandidate?.name}" (${deleteCandidate?.code})?`}
        confirmText="Delete Subject"
      />
    </div>
  );
};
