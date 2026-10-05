import React, { useState, useMemo } from 'react';
import { useSchool } from '../context/SchoolContext';
import { SchoolIssue, IssuePriority, IssueStatus, IssueCategory } from '../types';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { EmptyState } from '../components/common/EmptyState';
import { Badge } from '../components/common/Badge';
import { 
  AlertCircle, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  ShieldAlert, 
  Calendar,
  X 
} from 'lucide-react';
import { getTranslation } from '../utils/i18n';

interface IssuesViewProps {
  initialOpenAdd?: boolean;
}

export const IssuesView: React.FC<IssuesViewProps> = ({ initialOpenAdd = false }) => {
  const { issues, addIssue, updateIssue, deleteIssue, lang } = useSchool();

  const [isAddEditOpen, setIsAddEditOpen] = useState(initialOpenAdd);
  const [editingIssue, setEditingIssue] = useState<SchoolIssue | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<SchoolIssue | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<IssueCategory>('Infrastructure');
  const [priority, setPriority] = useState<IssuePriority>('Medium');
  const [responsiblePerson, setResponsiblePerson] = useState('');
  const [deadline, setDeadline] = useState('');
  const [status, setStatus] = useState<IssueStatus>('Open');
  const [notes, setNotes] = useState('');

  const handleOpenAdd = () => {
    setEditingIssue(null);
    setTitle('');
    setDescription('');
    setCategory('Infrastructure');
    setPriority('Medium');
    setResponsiblePerson('');
    setDeadline('');
    setStatus('Open');
    setNotes('');
    setIsAddEditOpen(true);
  };

  const handleOpenEdit = (issue: SchoolIssue) => {
    setEditingIssue(issue);
    setTitle(issue.title);
    setDescription(issue.description);
    setCategory(issue.category);
    setPriority(issue.priority);
    setResponsiblePerson(issue.responsible_person || '');
    setDeadline(issue.deadline || '');
    setStatus(issue.status);
    setNotes(issue.notes || '');
    setIsAddEditOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    if (editingIssue) {
      updateIssue(editingIssue.id, {
        title: title.trim(),
        description: description.trim(),
        category,
        priority,
        responsible_person: responsiblePerson.trim(),
        deadline: deadline || undefined,
        status,
        notes: notes.trim()
      });
    } else {
      addIssue({
        title: title.trim(),
        description: description.trim(),
        category,
        priority,
        responsible_person: responsiblePerson.trim(),
        deadline: deadline || undefined,
        status,
        notes: notes.trim()
      });
    }

    setIsAddEditOpen(false);
  };

  // Filtered issues
  const filteredIssues = useMemo(() => {
    return issues.filter(issue => {
      const matchSearch = issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        issue.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (searchTerm && !matchSearch) return false;
      if (filterPriority && issue.priority !== filterPriority) return false;
      if (filterStatus && issue.status !== filterStatus) return false;
      if (filterCategory && issue.category !== filterCategory) return false;

      return true;
    });
  }, [issues, searchTerm, filterPriority, filterStatus, filterCategory]);

  // Statistics
  const openCount = issues.filter(i => i.status === 'Open').length;
  const inProgressCount = issues.filter(i => i.status === 'In Progress').length;
  const criticalCount = issues.filter(i => i.status !== 'Resolved' && i.priority === 'Critical').length;
  const resolvedCount = issues.filter(i => i.status === 'Resolved').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              {getTranslation(lang, 'navIssues')} & Challenges
            </h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
              {issues.length} Logged
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Track operational incidents, infrastructure breakdowns, and academic challenges directly impacting school status.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          {getTranslation(lang, 'addIssue')}
        </button>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 block uppercase">OPEN ISSUES</span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">{openCount}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 block uppercase">IN PROGRESS</span>
          <span className="text-2xl font-black text-blue-600 mt-1 block">{inProgressCount}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 block uppercase">CRITICAL PRIORITY</span>
          <span className={`text-2xl font-black mt-1 block ${criticalCount > 0 ? 'text-rose-600 animate-pulse' : 'text-slate-900'}`}>
            {criticalCount}
          </span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 block uppercase">RESOLVED</span>
          <span className="text-2xl font-black text-emerald-600 mt-1 block">{resolvedCount}</span>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search issues..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <select
              value={filterPriority}
              onChange={e => setFilterPriority(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg text-slate-700"
            >
              <option value="">All Priorities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg text-slate-700"
            >
              <option value="">All Statuses</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>

          <div>
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg text-slate-700"
            >
              <option value="">All Categories</option>
              <option value="Academic">Academic</option>
              <option value="Attendance">Attendance</option>
              <option value="Staff">Staff</option>
              <option value="Student">Student</option>
              <option value="Infrastructure">Infrastructure</option>
              <option value="Safety">Safety</option>
              <option value="Administration">Administration</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        {(searchTerm || filterPriority || filterStatus || filterCategory) && (
          <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
            <span>Showing {filteredIssues.length} of {issues.length} issues</span>
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterPriority('');
                setFilterStatus('');
                setFilterCategory('');
              }}
              className="text-blue-600 hover:underline font-semibold flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" /> Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Issues List or Empty State */}
      {issues.length === 0 ? (
        <EmptyState
          icon={AlertCircle}
          title={getTranslation(lang, 'noIssues')}
          description={getTranslation(lang, 'noIssuesSub')}
          actionText={getTranslation(lang, 'addIssue')}
          onAction={handleOpenAdd}
        />
      ) : filteredIssues.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <p className="text-sm font-bold text-slate-700">No issues matching filters</p>
          <button
            onClick={() => {
              setSearchTerm('');
              setFilterPriority('');
              setFilterStatus('');
              setFilterCategory('');
            }}
            className="mt-3 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-xs font-semibold rounded-lg text-slate-700"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredIssues.map(issue => {
            const isCritical = issue.priority === 'Critical';
            const priorityBadgeVariant = {
              Critical: 'danger',
              High: 'warning',
              Medium: 'info',
              Low: 'neutral'
            }[issue.priority] as any;

            const statusBadgeVariant = {
              Open: 'danger',
              'In Progress': 'warning',
              Resolved: 'success'
            }[issue.status] as any;

            return (
              <div 
                key={issue.id}
                className={`bg-white rounded-2xl border p-5 shadow-xs transition-all ${
                  isCritical && issue.status !== 'Resolved' ? 'border-rose-300 ring-2 ring-rose-500/10' : 'border-slate-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={priorityBadgeVariant} size="sm" dot>
                        {issue.priority} Priority
                      </Badge>
                      <Badge variant={statusBadgeVariant} size="sm">
                        {issue.status}
                      </Badge>
                      <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {issue.category}
                      </span>
                    </div>

                    <h3 className="text-base font-extrabold text-slate-900 tracking-tight mt-1">
                      {issue.title}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                      {issue.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(issue)}
                      className="p-1.5 text-slate-400 hover:text-amber-600 rounded-lg hover:bg-slate-100"
                      title="Edit Issue"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteCandidate(issue)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100"
                      title="Delete Issue"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Footer details */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
                  <div className="flex items-center gap-4">
                    {issue.responsible_person && (
                      <span>Assignee: <strong className="text-slate-700">{issue.responsible_person}</strong></span>
                    )}
                    {issue.deadline && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" /> Deadline: <strong className="text-slate-700">{issue.deadline}</strong>
                      </span>
                    )}
                  </div>
                  <span className="text-[11px]">Logged on {new Date(issue.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Issue Modal */}
      <Modal
        isOpen={isAddEditOpen}
        onClose={() => setIsAddEditOpen(false)}
        title={editingIssue ? 'Edit School Issue' : 'Log School Incident / Issue'}
        subtitle="School Operational & Administrative Matters"
        maxWidth="lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
              Issue Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Science Laboratory water supply interruption"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-bold"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Category *
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as IssueCategory)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-semibold"
              >
                <option value="Infrastructure">Infrastructure</option>
                <option value="Academic">Academic</option>
                <option value="Attendance">Attendance</option>
                <option value="Staff">Staff</option>
                <option value="Student">Student</option>
                <option value="Safety">Safety</option>
                <option value="Administration">Administration</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Priority *
              </label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as IssuePriority)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-bold text-rose-700"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical (Immediate Action)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Status *
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as IssueStatus)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-semibold"
              >
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
              Description *
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe the incident, location, and operational impact..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Responsible Person
              </label>
              <input
                type="text"
                value={responsiblePerson}
                onChange={e => setResponsiblePerson(e.target.value)}
                placeholder="Staff or technician assigned"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Resolution Deadline
              </label>
              <input
                type="date"
                value={deadline}
                onChange={e => setDeadline(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
              Action Notes / Progress
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Progress updates..."
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
              {editingIssue ? 'Save Changes' : 'Log Issue'}
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
            deleteIssue(deleteCandidate.id);
            setDeleteCandidate(null);
          }
        }}
        title="Delete School Issue"
        message={`Are you sure you want to remove the issue record "${deleteCandidate?.title}"?`}
        confirmText="Delete Issue"
      />
    </div>
  );
};
