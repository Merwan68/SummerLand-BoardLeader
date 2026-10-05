import React, { useState } from 'react';
import { useSchool } from '../context/SchoolContext';
import { Grade, GradeLevel } from '../types';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { Badge } from '../components/common/Badge';
import { Layers, Plus, Edit3, Trash2, School, Users, Check } from 'lucide-react';
import { getTranslation } from '../utils/i18n';

export const GradesView: React.FC = () => {
  const { grades, addGrade, updateGrade, deleteGrade, classes, students, lang } = useSchool();

  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingGrade, setEditingGrade] = useState<Grade | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<Grade | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [level, setLevel] = useState<GradeLevel>('elementary');
  const [orderNumber, setOrderNumber] = useState(1);

  const handleOpenAdd = () => {
    setEditingGrade(null);
    setName('');
    setLevel('elementary');
    setOrderNumber(grades.length + 1);
    setIsAddEditOpen(true);
  };

  const handleOpenEdit = (grade: Grade) => {
    setEditingGrade(grade);
    setName(grade.name);
    setLevel(grade.level);
    setOrderNumber(grade.order_number);
    setIsAddEditOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingGrade) {
      updateGrade(editingGrade.id, {
        name: name.trim(),
        level,
        order_number: Number(orderNumber) || 1
      });
    } else {
      addGrade({
        name: name.trim(),
        level,
        order_number: Number(orderNumber) || grades.length + 1
      });
    }
    setIsAddEditOpen(false);
  };

  // Group grades by level
  const kindergartenGrades = grades
    .filter(g => g.level === 'kindergarten')
    .sort((a, b) => a.order_number - b.order_number);

  const elementaryGrades = grades
    .filter(g => g.level === 'elementary')
    .sort((a, b) => a.order_number - b.order_number);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              {getTranslation(lang, 'navGrades')}
            </h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
              {grades.length} Grade Levels
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Configure Kindergarten (KG 1–3) and Elementary (Grades 1–8) academic structure.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          {getTranslation(lang, 'addGrade')}
        </button>
      </div>

      {deleteError && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
          {deleteError}
        </div>
      )}

      {/* Two Columns: Kindergarten & Elementary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Kindergarten Group */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500" />
              <h2 className="text-sm font-bold text-slate-900">Kindergarten Program (Early Childhood)</h2>
            </div>
            <span className="text-xs font-bold text-slate-400">{kindergartenGrades.length} Grades</span>
          </div>

          <div className="space-y-2.5">
            {kindergartenGrades.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-6">No Kindergarten levels defined.</p>
            ) : (
              kindergartenGrades.map(grade => {
                const classCount = classes.filter(c => c.grade_id === grade.id).length;
                const studentCount = students.filter(s => s.grade_id === grade.id).length;

                return (
                  <div key={grade.id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 flex items-center justify-between transition-colors">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-slate-900">{grade.name}</span>
                        <Badge variant="warning" size="sm">KG</Badge>
                      </div>
                      <span className="text-[11px] text-slate-500 mt-0.5 block">
                        {classCount} Class Sections • {studentCount} Enrolled Students
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(grade)}
                        className="p-1.5 text-slate-400 hover:text-amber-600 rounded-lg hover:bg-slate-200"
                        title="Edit Grade"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteError(null);
                          setDeleteCandidate(grade);
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-200"
                        title="Delete Grade"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Elementary Group */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-600" />
              <h2 className="text-sm font-bold text-slate-900">Elementary Program (Grades 1 – 8)</h2>
            </div>
            <span className="text-xs font-bold text-slate-400">{elementaryGrades.length} Grades</span>
          </div>

          <div className="space-y-2.5">
            {elementaryGrades.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-6">No Elementary levels defined.</p>
            ) : (
              elementaryGrades.map(grade => {
                const classCount = classes.filter(c => c.grade_id === grade.id).length;
                const studentCount = students.filter(s => s.grade_id === grade.id).length;

                return (
                  <div key={grade.id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 flex items-center justify-between transition-colors">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-slate-900">{grade.name}</span>
                        <Badge variant="info" size="sm">Elementary</Badge>
                      </div>
                      <span className="text-[11px] text-slate-500 mt-0.5 block">
                        {classCount} Class Sections • {studentCount} Enrolled Students
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(grade)}
                        className="p-1.5 text-slate-400 hover:text-amber-600 rounded-lg hover:bg-slate-200"
                        title="Edit Grade"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteError(null);
                          setDeleteCandidate(grade);
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-200"
                        title="Delete Grade"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Add / Edit Grade Modal */}
      <Modal
        isOpen={isAddEditOpen}
        onClose={() => setIsAddEditOpen(false)}
        title={editingGrade ? 'Edit Grade Level' : 'Add Grade Level'}
        subtitle="Configure Academic Progression"
        maxWidth="md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
              Grade Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. KG 1, Grade 1, Grade 7"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                School Tier *
              </label>
              <select
                value={level}
                onChange={e => setLevel(e.target.value as GradeLevel)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-semibold"
              >
                <option value="kindergarten">Kindergarten</option>
                <option value="elementary">Elementary</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Sort Order
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={orderNumber}
                onChange={e => setOrderNumber(Number(e.target.value) || 1)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono"
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
              {editingGrade ? 'Save Changes' : 'Add Grade Level'}
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
            const ok = deleteGrade(deleteCandidate.id);
            if (!ok) {
              setDeleteError(`Cannot delete "${deleteCandidate.name}" because classes are currently linked to this grade. Please delete or reassign classes first.`);
            }
            setDeleteCandidate(null);
          }
        }}
        title="Delete Grade Level"
        message={`Are you sure you want to remove grade "${deleteCandidate?.name}"? You cannot delete a grade level while class sections are assigned to it.`}
        confirmText="Delete Grade"
      />
    </div>
  );
};
