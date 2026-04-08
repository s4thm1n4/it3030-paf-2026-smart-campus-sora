import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import { HiOutlinePaperAirplane, HiOutlinePencilSquare, HiOutlineTrash } from 'react-icons/hi2';
import ticketService from '../../services/ticketService';
import { getApiErrorMessage } from '../../utils/apiError';

function initials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? '')
    .join('');
}

const AVATAR_COLOURS = [
  'bg-blue-500',
  'bg-violet-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-cyan-500',
  'bg-indigo-500',
  'bg-pink-500',
];

function avatarColour(id) {
  return AVATAR_COLOURS[(id ?? 0) % AVATAR_COLOURS.length];
}

function Avatar({ user }) {
  const colour = avatarColour(user?.id);
  return (
    <div
      className={`h-8 w-8 shrink-0 rounded-full ${colour} flex items-center justify-center text-xs font-bold text-white select-none`}
    >
      {initials(user?.name)}
    </div>
  );
}

export default function TicketCommentThread({ ticketId, user, canView }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newText, setNewText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const bottomRef = useRef(null);

  const load = async () => {
    if (!canView) return;
    setLoading(true);
    try {
      const { data } = await ticketService.getComments(ticketId);
      setComments(data);
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [ticketId, canView]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAdd = async (e) => {
    e.preventDefault();
    const t = newText.trim();
    if (!t) return;
    setSubmitting(true);
    try {
      const { data } = await ticketService.addComment(ticketId, { content: t });
      setComments((prev) => [...prev, data]);
      setNewText('');
      toast.success('Comment posted');
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (c) => { setEditingId(c.id); setEditText(c.content); };

  const saveEdit = async (commentId) => {
    const t = editText.trim();
    if (!t) return;
    try {
      const { data } = await ticketService.updateComment(ticketId, commentId, { content: t });
      setComments((prev) => prev.map((c) => (c.id === commentId ? data : c)));
      setEditingId(null);
      toast.success('Comment updated');
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const remove = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await ticketService.deleteComment(ticketId, commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      toast.success('Comment deleted');
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  if (!canView) return null;

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-4">
        Discussion {comments.length > 0 && `· ${comments.length}`}
      </h2>

      {loading ? (
        <p className="text-sm text-gray-400 py-4">Loading comments…</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-gray-400 mb-6">No comments yet — be the first to add an update.</p>
      ) : (
        <ul className="space-y-5 mb-6">
          {comments.map((c) => {
            const isOwner = user && c.author?.id === user.id;
            const isAdmin = user?.role === 'ADMIN';
            const wasEdited = c.updatedAt && c.updatedAt !== c.createdAt;
            return (
              <li key={c.id} className="flex gap-3">
                <Avatar user={c.author} />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-2 mb-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-semibold text-gray-900">
                        {c.author?.name ?? 'User'}
                      </span>
                      {c.author?.role && c.author.role !== 'USER' && (
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                          {c.author.role}
                        </span>
                      )}
                      <span className="text-xs text-gray-400">
                        {dayjs(c.createdAt).format('MMM D, YYYY · h:mm A')}
                        {wasEdited && ' · edited'}
                      </span>
                    </div>
                    {editingId !== c.id && (
                      <div className="flex gap-2">
                        {isOwner && (
                          <button
                            type="button"
                            onClick={() => startEdit(c)}
                            className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-blue-600"
                          >
                            <HiOutlinePencilSquare className="h-3.5 w-3.5" />
                            Edit
                          </button>
                        )}
                        {(isOwner || isAdmin) && (
                          <button
                            type="button"
                            onClick={() => remove(c.id)}
                            className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-red-600"
                          >
                            <HiOutlineTrash className="h-3.5 w-3.5" />
                            Delete
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {editingId === c.id ? (
                    <div className="space-y-2">
                      <textarea
                        rows={3}
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => saveEdit(c.id)}
                          className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="rounded-md border border-gray-300 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-lg bg-gray-50 border border-gray-100 px-4 py-3">
                      <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                        {c.content}
                      </p>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div ref={bottomRef} />

      {/* Add comment */}
      <form onSubmit={handleAdd} className="flex gap-3 items-start border-t border-gray-100 pt-4">
        <Avatar user={user} />
        <div className="flex-1 space-y-2">
          <textarea
            rows={3}
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="Add an update, question, or coordination note…"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting || !newText.trim()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              <HiOutlinePaperAirplane className="h-4 w-4" />
              {submitting ? 'Posting…' : 'Post comment'}
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}