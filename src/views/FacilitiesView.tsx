import React, { useState } from 'react';
import { useSchool } from '../context/SchoolContext';
import { Facility, FacilityStatus } from '../types';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { EmptyState } from '../components/common/EmptyState';
import { Badge } from '../components/common/Badge';
import { Building, Plus, Edit3, Trash2, CalendarCheck, CheckCircle2, AlertTriangle, AlertOctagon } from 'lucide-react';
import { getTranslation } from '../utils/i18n';

export const FacilitiesView: React.FC = () => {
  const { facilities, addFacility, updateFacility, deleteFacility, lang } = useSchool();

  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingFacility, setEditingFacility] = useState<Facility | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<Facility | null>(null);

  const [name, setName] = useState('');
  const [status, setStatus] = useState<FacilityStatus>('Good');
  const [description, setDescription] = useState('');
  const [inspectionDate, setInspectionDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  const handleOpenAdd = () => {
    setEditingFacility(null);
    setName('');
    setStatus('Good');
    setDescription('');
    setInspectionDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setIsAddEditOpen(true);
  };

  const handleOpenEdit = (fac: Facility) => {
    setEditingFacility(fac);
    setName(fac.name);
    setStatus(fac.status);
    setDescription(fac.description || '');
    setInspectionDate(fac.inspection_date || new Date().toISOString().split('T')[0]);
    setNotes(fac.notes || '');
    setIsAddEditOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingFacility) {
      updateFacility(editingFacility.id, {
        name: name.trim(),
        status,
        description: description.trim(),
        inspection_date: inspectionDate,
        notes: notes.trim()
      });
    } else {
      addFacility({
        name: name.trim(),
        status,
        description: description.trim(),
        inspection_date: inspectionDate,
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
              {getTranslation(lang, 'navFacilities')} & Infrastructure
            </h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-800">
              {facilities.length} Assets
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Monitor classrooms, libraries, laboratories, sanitation, water, and electrical infrastructure health.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          {getTranslation(lang, 'addFacility')}
        </button>
      </div>

      {facilities.length === 0 ? (
        <EmptyState
          icon={Building}
          title={getTranslation(lang, 'noFacilities')}
          description={getTranslation(lang, 'noFacilitiesSub')}
          actionText={getTranslation(lang, 'addFacility')}
          onAction={handleOpenAdd}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {facilities.map(fac => {
            const statusConfig = {
              'Good': {
                variant: 'success' as const,
                border: 'border-slate-200',
                icon: CheckCircle2,
                color: 'text-emerald-600'
              },
              'Needs Maintenance': {
                variant: 'warning' as const,
                border: 'border-amber-300 ring-2 ring-amber-500/10',
                icon: AlertTriangle,
                color: 'text-amber-600'
              },
              'Critical': {
                variant: 'danger' as const,
                border: 'border-rose-400 ring-2 ring-rose-500/10',
                icon: AlertOctagon,
                color: 'text-rose-600'
              }
            }[fac.status];

            const StatusIcon = statusConfig.icon;

            return (
              <div 
                key={fac.id}
                className={`bg-white rounded-2xl border p-5 shadow-xs flex flex-col justify-between transition-all ${statusConfig.border}`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <StatusIcon className={`w-5 h-5 ${statusConfig.color}`} />
                      <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                        {fac.name}
                      </h3>
                    </div>
                    <Badge variant={statusConfig.variant} size="sm" dot>
                      {fac.status}
                    </Badge>
                  </div>

                  {fac.description && (
                    <p className="text-xs text-slate-600 mt-2.5 leading-relaxed">
                      {fac.description}
                    </p>
                  )}

                  {fac.notes && (
                    <div className="mt-3 p-2 bg-slate-50 rounded-lg border border-slate-100 text-[11px] text-slate-500 italic">
                      Notes: {fac.notes}
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1 text-[11px]">
                    <CalendarCheck className="w-3.5 h-3.5 text-slate-400" /> Inspected: {fac.inspection_date || 'N/A'}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(fac)}
                      className="p-1.5 text-slate-400 hover:text-amber-600 rounded-lg hover:bg-slate-100"
                      title="Edit Facility"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteCandidate(fac)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100"
                      title="Delete Facility"
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

      {/* Add / Edit Facility Modal */}
      <Modal
        isOpen={isAddEditOpen}
        onClose={() => setIsAddEditOpen(false)}
        title={editingFacility ? 'Edit Campus Facility' : 'Register Campus Facility'}
        subtitle="Catalog Classrooms, Utilities & Infrastructure"
        maxWidth="md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
              Facility Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Science Laboratory, Elementary Toilets Block, Main Generator"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Condition Status *
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as FacilityStatus)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-bold"
              >
                <option value="Good">🟢 Good</option>
                <option value="Needs Maintenance">🟡 Needs Maintenance</option>
                <option value="Critical">🔴 Critical (Broken / Hazard)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Inspection Date
              </label>
              <input
                type="date"
                value={inspectionDate}
                onChange={e => setInspectionDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
              Description & Specifications
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Capacity, equipment list, or location details..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
              Inspection Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Repairs needed, maintenance contractor, etc."
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
              {editingFacility ? 'Save Changes' : 'Register Facility'}
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
            deleteFacility(deleteCandidate.id);
            setDeleteCandidate(null);
          }
        }}
        title="Delete Facility Record"
        message={`Are you sure you want to remove the facility record "${deleteCandidate?.name}"?`}
        confirmText="Delete Facility"
      />
    </div>
  );
};
