import { useState, useEffect, useCallback } from 'react';
import ticketService from '../../services/ticketService';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import {
  HiOutlineTicket,
  HiOutlinePlus,
  HiOutlineArrowLeft,
  HiOutlineFunnel,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineChatBubbleLeft,
  HiOutlineMapPin,
  HiOutlinePhone,
  HiOutlineUser,
  HiOutlineClock,
  HiOutlinePhoto,
  HiOutlineXMark,
  HiOutlineCheck,
} from 'react-icons/hi2';

dayjs.extend(relativeTime);

// ── Constants ──

const CATEGORIES = [
  'ELECTRICAL', 'PLUMBING', 'HVAC', 'IT_NETWORK',
  'FURNITURE', 'CLEANING', 'SECURITY', 'OTHER',
];

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

const STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED'];

const PRIORITY_COLORS = {
  LOW: 'bg-gray-100 text-gray-700',
  MEDIUM: 'bg-blue-100 text-blue-700',
  HIGH: 'bg-orange-100 text-orange-700',
  CRITICAL: 'bg-red-100 text-red-700',
};

const STATUS_COLORS = {
  OPEN: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-700',
  RESOLVED: 'bg-green-100 text-green-700',
  CLOSED: 'bg-gray-100 text-gray-700',
  REJECTED: 'bg-red-100 text-red-700',
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
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
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
          className="flex items-center gap-1 text-gray-600 hover:text-gray-900 mb-4"
        >
          <HiOutlineArrowLeft className="w-5 h-5" /> Back to Tickets
        </button>

        <h1 className="text-2xl font-bold text-gray-800 mb-6">Create New Ticket</h1>

        <form onSubmit={handleCreateTicket} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              type="text" required value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="Brief summary of the issue"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <textarea
              required rows={4} value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="Describe the issue in detail"
            />
          </div>

          {/* Category + Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority *</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text" value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="e.g. Building A, Room 201"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
              <input
                type="tel" value={form.contactPhone}
                onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="077-123-4567"
              />
            </div>
          </div>

          {/* Image URLs */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Image URLs (max 3)</label>
            <div className="flex gap-2 mb-2">
              <input
                type="url" value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="https://example.com/image.jpg"
              />
              <button
                type="button" onClick={addImageUrl}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium"
              >
                Add
              </button>
            </div>
            {form.imageUrls.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {form.imageUrls.map((url, i) => (
                  <div key={i} className="flex items-center gap-1 bg-gray-100 rounded-lg px-2 py-1 text-sm">
                    <HiOutlinePhoto className="w-4 h-4 text-gray-500" />
                    <span className="truncate max-w-[200px]">{url}</span>
                    <button type="button" onClick={() => removeImageUrl(i)}>
                      <HiOutlineXMark className="w-4 h-4 text-red-500 hover:text-red-700" />
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
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit" disabled={submitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
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
          className="flex items-center gap-1 text-gray-600 hover:text-gray-900 mb-4"
        >
          <HiOutlineArrowLeft className="w-5 h-5" /> Back to Tickets
        </button>

        {/* Ticket header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-4">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{t.title}</h1>
              <p className="text-sm text-gray-500 mt-1">
                Created {dayjs(t.createdAt).fromNow()} by {t.createdBy?.name || 'Unknown'}
              </p>
            </div>
            {isOwner && (
              <button
                onClick={() => handleDeleteTicket(t.id)}
                className="text-red-500 hover:text-red-700 p-2"
                title="Delete ticket"
              >
                <HiOutlineTrash className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge text={t.category} colorClass="bg-purple-100 text-purple-700" />
            <Badge text={t.priority} colorClass={PRIORITY_COLORS[t.priority]} />
            <Badge text={t.status} colorClass={STATUS_COLORS[t.status]} />
          </div>

          {/* Description */}
          <div className="prose prose-sm max-w-none mb-4">
            <p className="text-gray-700 whitespace-pre-wrap">{t.description}</p>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            {t.location && (
              <div className="flex items-center gap-2 text-gray-600">
                <HiOutlineMapPin className="w-4 h-4" /> {t.location}
              </div>
            )}
            {t.contactPhone && (
              <div className="flex items-center gap-2 text-gray-600">
                <HiOutlinePhone className="w-4 h-4" /> {t.contactPhone}
              </div>
            )}
            {t.assignedTo && (
              <div className="flex items-center gap-2 text-gray-600">
                <HiOutlineUser className="w-4 h-4" /> Assigned to: {t.assignedTo.name}
              </div>
            )}
            <div className="flex items-center gap-2 text-gray-600">
              <HiOutlineClock className="w-4 h-4" /> Updated {dayjs(t.updatedAt).fromNow()}
            </div>
          </div>

          {/* Images */}
          {t.imageUrls && t.imageUrls.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Attachments</h3>
              <div className="flex flex-wrap gap-3">
                {t.imageUrls.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noreferrer"
                    className="block w-32 h-32 rounded-lg border border-gray-200 overflow-hidden hover:opacity-80">
                    <img src={url} alt={`Attachment ${i + 1}`} className="w-full h-full object-cover" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Status workflow buttons */}
          <div className="mt-6 pt-4 border-t border-gray-100">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Actions</h3>
            <div className="flex flex-wrap gap-2">
              {STATUSES.filter((s) => s !== t.status).map((s) => (
                <button
                  key={s}
                  onClick={() => handleStatusChange(t.id, s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${STATUS_COLORS[s]} border-current hover:opacity-80`}
                >
                  Mark as {s.replace('_', ' ')}
                </button>
              ))}
              <button
                onClick={() => handleAssign(t.id)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border border-purple-300 bg-purple-50 text-purple-700 hover:opacity-80"
              >
                Assign Technician
              </button>
            </div>
          </div>
        </div>

        {/* Comments section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <HiOutlineChatBubbleLeft className="w-5 h-5" />
            Comments ({comments.length})
          </h2>

          {/* Comment list */}
          {comments.length === 0 ? (
            <p className="text-gray-400 text-sm mb-4">No comments yet. Be the first to comment.</p>
          ) : (
            <div className="space-y-4 mb-6">
              {comments.map((c) => {
                const isCommentOwner = user?.id === c.author?.id;
                return (
                  <div key={c.id} className="flex gap-3">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      {c.author?.profilePictureUrl ? (
                        <img
                          src={c.author.profilePictureUrl}
                          alt={c.author.name}
                          className="w-8 h-8 rounded-full"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium text-sm">
                          {c.author?.name?.charAt(0) || '?'}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-800">{c.author?.name || 'Unknown'}</span>
                        <span className="text-xs text-gray-400">{dayjs(c.createdAt).fromNow()}</span>
                      </div>

                      {editingCommentId === c.id ? (
                        <div className="mt-1">
                          <textarea
                            value={editingCommentText}
                            onChange={(e) => setEditingCommentText(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            rows={2}
                          />
                          <div className="flex gap-2 mt-1">
                            <button
                              onClick={() => handleUpdateComment(c.id)}
                              className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => { setEditingCommentId(null); setEditingCommentText(''); }}
                              className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-700 mt-0.5 whitespace-pre-wrap">{c.content}</p>
                      )}

                      {/* Edit / Delete for own comments */}
                      {isCommentOwner && editingCommentId !== c.id && (
                        <div className="flex gap-2 mt-1">
                          <button
                            onClick={() => { setEditingCommentId(c.id); setEditingCommentText(c.content); }}
                            className="text-xs text-gray-400 hover:text-blue-600"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteComment(c.id)}
                            className="text-xs text-gray-400 hover:text-red-600"
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
          <form onSubmit={handleAddComment} className="flex gap-2">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment..."
              rows={2}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
            />
            <button
              type="submit" disabled={submitting || !commentText.trim()}
              className="self-end px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
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
          <h1 className="text-2xl font-bold text-gray-800">Maintenance & Incident Tickets</h1>
          <p className="text-sm text-gray-500 mt-1">Report and track campus maintenance issues</p>
        </div>
        <button
          onClick={() => setView('create')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm"
        >
          <HiOutlinePlus className="w-5 h-5" /> Create Ticket
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => setTab('all')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === 'all' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          All Tickets
        </button>
        <button
          onClick={() => setTab('my')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === 'my' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          My Tickets
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <HiOutlineFunnel className="w-5 h-5 text-gray-400" />
        <select
          value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        >
          <option value="">All Statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s.replace('_', ' ')}</option>
          ))}
        </select>
        <select
          value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        >
          <option value="">All Priorities</option>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <select
          value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
          ))}
        </select>
        {(statusFilter || priorityFilter || categoryFilter) && (
          <button
            onClick={() => { setStatusFilter(''); setPriorityFilter(''); setCategoryFilter(''); }}
            className="text-xs text-blue-600 hover:text-blue-800 underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
        </div>
      )}

      {/* Empty state */}
      {!loading && filteredTickets.length === 0 && (
        <div className="text-center py-16">
          <HiOutlineTicket className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-1">No tickets found</h3>
          <p className="text-sm text-gray-400">
            {tickets.length === 0
              ? 'Create your first maintenance ticket to get started.'
              : 'Try adjusting your filters.'}
          </p>
        </div>
      )}

      {/* Ticket cards */}
      {!loading && filteredTickets.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTickets.map((t) => (
            <div
              key={t.id}
              onClick={() => openTicketDetail(t.id)}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-gray-800 text-sm line-clamp-2 leading-snug">{t.title}</h3>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-3">
                <Badge text={t.category} colorClass="bg-purple-100 text-purple-700" />
                <Badge text={t.priority} colorClass={PRIORITY_COLORS[t.priority]} />
                <Badge text={t.status} colorClass={STATUS_COLORS[t.status]} />
              </div>

              <div className="space-y-1 text-xs text-gray-500">
                {t.location && (
                  <div className="flex items-center gap-1">
                    <HiOutlineMapPin className="w-3.5 h-3.5" /> {t.location}
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <HiOutlineClock className="w-3.5 h-3.5" /> {dayjs(t.createdAt).fromNow()}
                </div>
                {t.assignedTo && (
                  <div className="flex items-center gap-1">
                    <HiOutlineUser className="w-3.5 h-3.5" /> {t.assignedTo.name}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
