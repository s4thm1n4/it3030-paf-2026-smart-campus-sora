import { useState, useEffect, useCallback } from 'react';
import ticketService from '../../services/ticketService';
import { useAuth } from '../../context/AuthContext';
import Icon from '../../components/common/Icon';
import ViewToggle from '../../components/common/ViewToggle';
import StatusPipeline from '../../components/common/StatusPipeline';
import StatusBadge from '../../components/common/StatusBadge';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

// ── Constants ──

const CATEGORIES = [
  'ELECTRICAL', 'PLUMBING', 'HVAC', 'IT_NETWORK',
  'FURNITURE', 'CLEANING', 'SECURITY', 'OTHER',
];

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

const STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED'];

const PRIORITY_COLORS = {
  LOW: 'bg-surface-container text-outline',
  MEDIUM: 'bg-primary-container text-primary',
  HIGH: 'bg-accent-container text-accent',
  CRITICAL: 'bg-error-container text-error',
};

const STATUS_COLORS = {
  OPEN: 'bg-primary-container text-primary',
  IN_PROGRESS: 'bg-warning-container text-on-warning',
  RESOLVED: 'bg-success-container text-success',
  CLOSED: 'bg-surface-container text-outline',
  REJECTED: 'bg-error-container text-error',
};

const CATEGORY_LABELS = {
  ELECTRICAL: 'Electrical',
  PLUMBING: 'Plumbing',
  HVAC: 'HVAC',
  IT_NETWORK: 'IT / Network',
  FURNITURE: 'Furniture',
  CLEANING: 'Cleaning',
  SECURITY: 'Security',
  OTHER: 'Other',
};

// ── Helpers ──

function Badge({ text, colorClass }) {
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-mono font-medium tracking-wide ${colorClass}`}>
      {text.replace('_', ' ')}
    </span>
  );
}

// ── Main Component ──

export default function TicketsPage() {
  const { user } = useAuth();

  // View state
  const [view, setView] = useState('list'); // 'list' | 'detail' | 'create'
  const [tab, setTab] = useState('all'); // 'all' | 'my'
  const [listMode, setListMode] = useState('grid'); // 'grid' | 'list'

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Data
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Forms
  const [form, setForm] = useState({
    title: '', description: '', category: 'ELECTRICAL',
    priority: 'MEDIUM', location: '', contactPhone: '', imageUrls: [],
  });
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [commentText, setCommentText] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // ── Fetch tickets ──
  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      const res = tab === 'my'
        ? await ticketService.getMyTickets()
        : await ticketService.getAll();
      setTickets(res.data);
    } catch {
      toast.error('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // ── Fetch single ticket + comments ──
  const openTicketDetail = async (ticketId) => {
    try {
      setLoading(true);
      const [ticketRes, commentsRes] = await Promise.all([
        ticketService.getById(ticketId),
        ticketService.getComments(ticketId),
      ]);
      setSelectedTicket(ticketRes.data);
      setComments(commentsRes.data);
      setView('detail');
    } catch {
      toast.error('Failed to load ticket details');
    } finally {
      setLoading(false);
    }
  };

  const refreshDetail = async () => {
    if (!selectedTicket) return;
    try {
      const [ticketRes, commentsRes] = await Promise.all([
        ticketService.getById(selectedTicket.id),
        ticketService.getComments(selectedTicket.id),
      ]);
      setSelectedTicket(ticketRes.data);
      setComments(commentsRes.data);
    } catch {
      toast.error('Failed to refresh ticket');
    }
  };

  // ── Filtered tickets ──
  const filteredTickets = tickets.filter((t) => {
    if (statusFilter && t.status !== statusFilter) return false;
    if (priorityFilter && t.priority !== priorityFilter) return false;
    if (categoryFilter && t.category !== categoryFilter) return false;
    return true;
  });

  // ── Ticket CRUD ──
  const handleCreateTicket = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await ticketService.create(form);
      toast.success('Ticket created');
      resetForm();
      setView('list');
      fetchTickets();
    } catch {
      toast.error('Failed to create ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTicket = async (id) => {
    if (!window.confirm('Are you sure you want to delete this ticket?')) return;
    try {
      await ticketService.delete(id);
      toast.success('Ticket deleted');
      setView('list');
      fetchTickets();
    } catch {
      toast.error('Failed to delete ticket');
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await ticketService.updateStatus(id, status);
      toast.success(`Status updated to ${status.replace('_', ' ')}`);
      refreshDetail();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleAssign = async (id) => {
    const techIdStr = window.prompt('Enter technician user ID:');
    if (!techIdStr) return;
    const techId = parseInt(techIdStr, 10);
    if (isNaN(techId)) { toast.error('Invalid ID'); return; }
    try {
      await ticketService.assign(id, techId);
      toast.success('Ticket assigned');
      refreshDetail();
    } catch {
      toast.error('Failed to assign ticket');
    }
  };

  // ── Comments ──
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      setSubmitting(true);
      await ticketService.addComment(selectedTicket.id, { content: commentText });
      setCommentText('');
      toast.success('Comment added');
      refreshDetail();
    } catch {
      toast.error('Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateComment = async (commentId) => {
    if (!editingCommentText.trim()) return;
    try {
      await ticketService.updateComment(selectedTicket.id, commentId, { content: editingCommentText });
      setEditingCommentId(null);
      setEditingCommentText('');
      toast.success('Comment updated');
      refreshDetail();
    } catch {
      toast.error('Failed to update comment');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await ticketService.deleteComment(selectedTicket.id, commentId);
      toast.success('Comment deleted');
      refreshDetail();
    } catch {
      toast.error('Failed to delete comment');
    }
  };

  // ── Image URL helpers ──
  const addImageUrl = () => {
    if (!imageUrlInput.trim()) return;
    if (form.imageUrls.length >= 3) { toast.error('Max 3 images'); return; }
    setForm({ ...form, imageUrls: [...form.imageUrls, imageUrlInput.trim()] });
    setImageUrlInput('');
  };

  const removeImageUrl = (index) => {
    setForm({ ...form, imageUrls: form.imageUrls.filter((_, i) => i !== index) });
  };

  const resetForm = () => {
    setForm({
      title: '', description: '', category: 'ELECTRICAL',
      priority: 'MEDIUM', location: '', contactPhone: '', imageUrls: [],
    });
    setImageUrlInput('');
  };

  // ══════════════════════════════════════
  // RENDER — CREATE VIEW
  // ══════════════════════════════════════
  if (view === 'create') {
    return (
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => { setView('list'); resetForm(); }}
          className="flex items-center gap-1.5 text-on-surface-variant hover:text-on-surface mb-6 font-sans text-sm transition-colors"
        >
          <Icon name="arrow_back" size={18} /> Back to Tickets
        </button>

        <h1 className="text-2xl font-display font-bold text-on-surface mb-6">Create New Ticket</h1>

        <form onSubmit={handleCreateTicket} className="bg-surface border border-cell-border p-6 space-y-5">
          {/* Title */}
          <div>
            <label className="label-caps block text-xs font-mono font-medium text-on-surface-variant uppercase tracking-widest mb-1.5">Title *</label>
            <input
              type="text" required value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full border border-outline-variant bg-surface-container-lowest px-3 py-2 text-on-surface font-sans text-sm focus:border-primary focus:outline-none transition-colors"
              placeholder="Brief summary of the issue"
            />
          </div>

          {/* Description */}
          <div>
            <label className="label-caps block text-xs font-mono font-medium text-on-surface-variant uppercase tracking-widest mb-1.5">Description *</label>
            <textarea
              required rows={4} value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full border border-outline-variant bg-surface-container-lowest px-3 py-2 text-on-surface font-sans text-sm focus:border-primary focus:outline-none transition-colors"
              placeholder="Describe the issue in detail"
            />
          </div>

          {/* Category + Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-caps block text-xs font-mono font-medium text-on-surface-variant uppercase tracking-widest mb-1.5">Category *</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full border border-outline-variant bg-surface-container-lowest px-3 py-2 text-on-surface font-sans text-sm focus:border-primary focus:outline-none transition-colors"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-caps block text-xs font-mono font-medium text-on-surface-variant uppercase tracking-widest mb-1.5">Priority *</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="w-full border border-outline-variant bg-surface-container-lowest px-3 py-2 text-on-surface font-sans text-sm focus:border-primary focus:outline-none transition-colors"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Location + Phone */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-caps block text-xs font-mono font-medium text-on-surface-variant uppercase tracking-widest mb-1.5">Location</label>
              <input
                type="text" value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="w-full border border-outline-variant bg-surface-container-lowest px-3 py-2 text-on-surface font-sans text-sm focus:border-primary focus:outline-none transition-colors"
                placeholder="e.g. Building A, Room 201"
              />
            </div>
            <div>
              <label className="label-caps block text-xs font-mono font-medium text-on-surface-variant uppercase tracking-widest mb-1.5">Contact Phone</label>
              <input
                type="tel" value={form.contactPhone}
                onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                className="w-full border border-outline-variant bg-surface-container-lowest px-3 py-2 text-on-surface font-sans text-sm focus:border-primary focus:outline-none transition-colors"
                placeholder="077-123-4567"
              />
            </div>
          </div>

          {/* Image URLs */}
          <div>
            <label className="label-caps block text-xs font-mono font-medium text-on-surface-variant uppercase tracking-widest mb-1.5">Image URLs (max 3)</label>
            <div className="flex gap-2 mb-2">
              <input
                type="url" value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                className="flex-1 border border-outline-variant bg-surface-container-lowest px-3 py-2 text-on-surface font-sans text-sm focus:border-primary focus:outline-none transition-colors"
                placeholder="https://example.com/image.jpg"
              />
              <button
                type="button" onClick={addImageUrl}
                className="px-3 py-2 bg-surface-container border border-cell-border text-on-surface-variant hover:bg-primary hover:text-white text-sm font-medium font-sans transition-colors"
              >
                Add
              </button>
            </div>
            {form.imageUrls.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {form.imageUrls.map((url, i) => (
                  <div key={i} className="flex items-center gap-1.5 bg-surface-container border border-cell-border px-2.5 py-1 text-sm font-mono">
                    <Icon name="image" size={16} className="text-on-surface-variant" />
                    <span className="truncate max-w-[200px] text-on-surface">{url}</span>
                    <button type="button" onClick={() => removeImageUrl(i)}>
                      <Icon name="close" size={16} className="text-error hover:text-error/80" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button" onClick={() => { setView('list'); resetForm(); }}
              className="px-4 py-2 border border-cell-border bg-surface text-on-surface-variant hover:bg-surface-container font-sans text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit" disabled={submitting}
              className="px-4 py-2 bg-primary text-white hover:bg-primary/90 disabled:opacity-50 font-sans text-sm font-medium transition-colors"
            >
              {submitting ? 'Creating...' : 'Create Ticket'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // ══════════════════════════════════════
  // RENDER — DETAIL VIEW
  // ══════════════════════════════════════
  if (view === 'detail' && selectedTicket) {
    const t = selectedTicket;
    const isOwner = user?.id === t.createdBy?.id;

    return (
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => { setView('list'); setSelectedTicket(null); }}
          className="flex items-center gap-1.5 text-on-surface-variant hover:text-on-surface mb-6 font-sans text-sm transition-colors"
        >
          <Icon name="arrow_back" size={18} /> Back to Tickets
        </button>

        {/* Ticket header */}
        <div className="bg-surface border border-cell-border p-6 mb-4">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-display font-bold text-on-surface">{t.title}</h1>
              <p className="text-sm text-on-surface-variant mt-1 font-sans">
                Created {dayjs(t.createdAt).fromNow()} by {t.createdBy?.name || 'Unknown'}
              </p>
            </div>
            {isOwner && (
              <button
                onClick={() => handleDeleteTicket(t.id)}
                className="text-error hover:text-error/80 p-2 transition-colors"
                title="Delete ticket"
              >
                <Icon name="delete" size={20} />
              </button>
            )}
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge text={t.category} colorClass="bg-primary-container text-primary" />
            <Badge text={t.priority} colorClass={PRIORITY_COLORS[t.priority]} />
            <Badge text={t.status} colorClass={STATUS_COLORS[t.status]} />
          </div>

          {/* Description */}
          <div className="mb-4">
            <p className="text-on-surface font-sans text-sm whitespace-pre-wrap leading-relaxed">{t.description}</p>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm border-t border-cell-border pt-4">
            {t.location && (
              <div className="flex items-center gap-2 text-on-surface-variant font-sans">
                <Icon name="location_on" size={16} /> {t.location}
              </div>
            )}
            {t.contactPhone && (
              <div className="flex items-center gap-2 text-on-surface-variant font-sans">
                <Icon name="phone" size={16} /> {t.contactPhone}
              </div>
            )}
            {t.assignedTo && (
              <div className="flex items-center gap-2 text-on-surface-variant font-sans">
                <Icon name="person" size={16} /> Assigned to: {t.assignedTo.name}
              </div>
            )}
            <div className="flex items-center gap-2 text-on-surface-variant font-sans">
              <Icon name="schedule" size={16} /> Updated {dayjs(t.updatedAt).fromNow()}
            </div>
          </div>

          {/* Images */}
          {t.imageUrls && t.imageUrls.length > 0 && (
            <div className="mt-4 border-t border-cell-border pt-4">
              <h3 className="label-caps text-xs font-mono font-medium text-on-surface-variant uppercase tracking-widest mb-2">Attachments</h3>
              <div className="flex flex-wrap gap-3">
                {t.imageUrls.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noreferrer"
                    className="block w-32 h-32 border border-cell-border overflow-hidden hover:opacity-80 transition-opacity">
                    <img src={url} alt={`Attachment ${i + 1}`} className="w-full h-full object-cover" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Status Pipeline — ClickUp-inspired workflow visualization */}
          <div className="mt-6 pt-4 border-t border-cell-border">
            <h3 className="label-caps text-xs font-mono font-medium text-on-surface-variant uppercase tracking-widest mb-3">WORKFLOW STATUS</h3>
            <StatusPipeline
              steps={['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']}
              current={t.status}
              onStepClick={(step) => handleStatusChange(t.id, step)}
            />
          </div>

          {/* Quick Actions */}
          <div className="mt-4 pt-4 border-t border-cell-border">
            <h3 className="label-caps text-xs font-mono font-medium text-on-surface-variant uppercase tracking-widest mb-3">ACTIONS</h3>
            <div className="flex flex-wrap gap-2">
              {t.status !== 'REJECTED' && (
                <button
                  onClick={() => handleStatusChange(t.id, 'REJECTED')}
                  className="px-3 py-1.5 text-xs font-mono font-medium border border-cell-border bg-error-container text-error hover:opacity-80 transition-opacity"
                >
                  Reject Ticket
                </button>
              )}
              <button
                onClick={() => handleAssign(t.id)}
                className="px-3 py-1.5 text-xs font-mono font-medium border border-cell-border bg-accent-container text-accent hover:opacity-80 transition-opacity"
              >
                Assign Technician
              </button>
            </div>
          </div>
        </div>

        {/* Comments section */}
        <div className="bg-surface border border-cell-border p-6">
          <h2 className="text-lg font-display font-semibold text-on-surface mb-4 flex items-center gap-2">
            <Icon name="chat" size={20} />
            Comments ({comments.length})
          </h2>

          {/* Comment list */}
          {comments.length === 0 ? (
            <p className="text-on-surface-variant text-sm mb-4 font-sans">No comments yet. Be the first to comment.</p>
          ) : (
            <div className="divide-y divide-cell-border mb-6">
              {comments.map((c) => {
                const isCommentOwner = user?.id === c.author?.id;
                return (
                  <div key={c.id} className="flex gap-3 py-4 first:pt-0">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      {c.author?.profilePictureUrl ? (
                        <img
                          src={c.author.profilePictureUrl}
                          alt={c.author.name}
                          className="w-8 h-8 rounded-full"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-primary font-display font-medium text-sm">
                          {c.author?.name?.charAt(0) || '?'}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-display font-medium text-on-surface">{c.author?.name || 'Unknown'}</span>
                        <span className="text-xs text-outline font-mono">{dayjs(c.createdAt).fromNow()}</span>
                      </div>

                      {editingCommentId === c.id ? (
                        <div className="mt-1">
                          <textarea
                            value={editingCommentText}
                            onChange={(e) => setEditingCommentText(e.target.value)}
                            className="w-full border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm font-sans text-on-surface focus:border-primary focus:outline-none transition-colors"
                            rows={2}
                          />
                          <div className="flex gap-2 mt-1.5">
                            <button
                              onClick={() => handleUpdateComment(c.id)}
                              className="text-xs px-2.5 py-1 bg-primary text-white font-sans font-medium hover:bg-primary/90 transition-colors"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => { setEditingCommentId(null); setEditingCommentText(''); }}
                              className="text-xs px-2.5 py-1 bg-surface-container border border-cell-border text-on-surface-variant font-sans font-medium hover:bg-surface transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-on-surface font-sans mt-0.5 whitespace-pre-wrap">{c.content}</p>
                      )}

                      {/* Edit / Delete for own comments */}
                      {isCommentOwner && editingCommentId !== c.id && (
                        <div className="flex gap-3 mt-1.5">
                          <button
                            onClick={() => { setEditingCommentId(c.id); setEditingCommentText(c.content); }}
                            className="text-xs text-outline hover:text-primary font-mono transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteComment(c.id)}
                            className="text-xs text-outline hover:text-error font-mono transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add comment form */}
          <form onSubmit={handleAddComment} className="flex gap-2 border-t border-cell-border pt-4">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment..."
              rows={2}
              className="flex-1 border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm font-sans text-on-surface focus:border-primary focus:outline-none resize-none transition-colors"
            />
            <button
              type="submit" disabled={submitting || !commentText.trim()}
              className="self-end px-4 py-2 bg-primary text-white hover:bg-primary/90 disabled:opacity-50 text-sm font-sans font-medium transition-colors"
            >
              Post
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════
  // RENDER — LIST VIEW
  // ══════════════════════════════════════
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-on-surface">Maintenance & Incident Tickets</h1>
          <p className="text-sm text-on-surface-variant mt-1 font-sans">Report and track campus maintenance issues</p>
        </div>
        <div className="flex items-center gap-3">
          <ViewToggle view={listMode} onChange={setListMode} views={['grid', 'list']} />
          <button
            onClick={() => setView('create')}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white hover:bg-primary/90 font-sans font-medium text-sm transition-colors"
          >
            <Icon name="add" size={18} /> Create Ticket
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 mb-4 border border-cell-border w-fit">
        <button
          onClick={() => setTab('all')}
          className={`px-4 py-2 text-sm font-mono font-medium transition-colors ${
            tab === 'all' ? 'bg-primary text-white' : 'bg-surface text-on-surface-variant hover:bg-surface-container'
          }`}
        >
          All Tickets
        </button>
        <button
          onClick={() => setTab('my')}
          className={`px-4 py-2 text-sm font-mono font-medium transition-colors border-l border-cell-border ${
            tab === 'my' ? 'bg-primary text-white' : 'bg-surface text-on-surface-variant hover:bg-surface-container'
          }`}
        >
          My Tickets
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Icon name="filter_list" size={18} className="text-outline" />
        <select
          value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-outline-variant bg-surface-container-lowest px-3 py-1.5 text-sm font-sans text-on-surface focus:border-primary focus:outline-none transition-colors"
        >
          <option value="">All Statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s.replace('_', ' ')}</option>
          ))}
        </select>
        <select
          value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}
          className="border border-outline-variant bg-surface-container-lowest px-3 py-1.5 text-sm font-sans text-on-surface focus:border-primary focus:outline-none transition-colors"
        >
          <option value="">All Priorities</option>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <select
          value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
          className="border border-outline-variant bg-surface-container-lowest px-3 py-1.5 text-sm font-sans text-on-surface focus:border-primary focus:outline-none transition-colors"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
          ))}
        </select>
        {(statusFilter || priorityFilter || categoryFilter) && (
          <button
            onClick={() => { setStatusFilter(''); setPriorityFilter(''); setCategoryFilter(''); }}
            className="text-xs text-primary hover:text-primary/80 font-mono underline transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      )}

      {/* Empty state */}
      {!loading && filteredTickets.length === 0 && (
        <div className="text-center py-16 border border-cell-border bg-surface">
          <Icon name="confirmation_number" size={48} className="text-outline mx-auto mb-4" />
          <h3 className="text-lg font-display font-medium text-on-surface-variant mb-1">No tickets found</h3>
          <p className="text-sm text-outline font-sans">
            {tickets.length === 0
              ? 'Create your first maintenance ticket to get started.'
              : 'Try adjusting your filters.'}
          </p>
        </div>
      )}

      {/* Ticket cards — GRID VIEW */}
      {!loading && filteredTickets.length > 0 && listMode === 'grid' && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTickets.map((t) => (
            <div
              key={t.id}
              onClick={() => openTicketDetail(t.id)}
              className="bg-surface border border-cell-border p-5 hover:border-primary transition-colors cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-display font-semibold text-on-surface text-sm line-clamp-2 leading-snug group-hover:text-primary transition-colors">{t.title}</h3>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-3">
                <Badge text={t.category} colorClass="bg-primary-container text-primary" />
                <Badge text={t.priority} colorClass={PRIORITY_COLORS[t.priority]} />
                <Badge text={t.status} colorClass={STATUS_COLORS[t.status]} />
              </div>

              <div className="space-y-1 text-xs text-on-surface-variant font-sans border-t border-cell-border pt-3">
                {t.location && (
                  <div className="flex items-center gap-1.5">
                    <Icon name="location_on" size={14} /> {t.location}
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Icon name="schedule" size={14} /> {dayjs(t.createdAt).fromNow()}
                </div>
                {t.assignedTo && (
                  <div className="flex items-center gap-1.5">
                    <Icon name="person" size={14} /> {t.assignedTo.name}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Ticket rows — LIST VIEW */}
      {!loading && filteredTickets.length > 0 && listMode === 'list' && (
        <div className="border border-cell-border bg-surface-container-lowest">
          {/* Table Header */}
          <div className="hidden sm:grid sm:grid-cols-12 gap-4 px-5 py-2.5 border-b border-cell-border bg-surface-container">
            <span className="col-span-4 label-caps text-[10px] text-outline">TITLE</span>
            <span className="col-span-2 label-caps text-[10px] text-outline">CATEGORY</span>
            <span className="col-span-1 label-caps text-[10px] text-outline">PRIORITY</span>
            <span className="col-span-2 label-caps text-[10px] text-outline">STATUS</span>
            <span className="col-span-1 label-caps text-[10px] text-outline">ASSIGNED</span>
            <span className="col-span-2 label-caps text-[10px] text-outline">CREATED</span>
          </div>
          {filteredTickets.map((t) => (
            <div
              key={t.id}
              onClick={() => openTicketDetail(t.id)}
              className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 items-center px-5 py-3 border-b border-cell-border last:border-b-0 hover:bg-surface-container-low cursor-pointer transition-colors"
            >
              <div className="col-span-4">
                <p className="text-sm font-semibold font-display text-on-surface truncate">{t.title}</p>
                {t.location && (
                  <p className="text-xs text-outline flex items-center gap-1 mt-0.5">
                    <Icon name="location_on" size={12} /> {t.location}
                  </p>
                )}
              </div>
              <div className="col-span-2">
                <Badge text={t.category} colorClass="bg-primary-container text-primary" />
              </div>
              <div className="col-span-1">
                <Badge text={t.priority} colorClass={PRIORITY_COLORS[t.priority]} />
              </div>
              <div className="col-span-2">
                <StatusBadge status={t.status} type="ticket" />
              </div>
              <div className="col-span-1 text-xs text-on-surface-variant truncate">
                {t.assignedTo?.name || '—'}
              </div>
              <div className="col-span-2 font-mono text-xs text-outline">
                {dayjs(t.createdAt).fromNow()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
