import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import ticketService from '../../services/ticketService';
import { getApiErrorMessage } from '../../utils/apiError';

export default function TicketCommentThread({ ticketId, user, canView }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newText, setNewText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');

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

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId, canView]);

  const handleAdd = async (e) => {
    e.preventDefault();
    const t = newText.trim();
    if (!t) return;
    setSubmitting(true);
    try {
      const { data } = await ticketService.addComment(ticketId, { content: t });
      setComments((prev) => [...prev, data]);
      setNewText('');
      toast.success('Comment added');
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (c) => {
    setEditingId(c.id);
    setEditText(c.content);
  };

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
      toast.success('Comment removed');
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  if (!canView) {
    return null;
  }

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Discussion</h2>

      {loading ? (
        <p className="text-sm text-gray-500">Loading comments…</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-gray-500 mb-4">No comments yet.</p>
      ) : (
        <ul className="space-y-4 mb-6">
          {comments.map((c) => {
            const isOwner = user && c.author?.id === user.id;
            const isAdmin = user?.role === 'ADMIN';
            return (
              <li key={c.id} className="rounded-lg border border-gray-100 bg-gray-50/80 p-4">
                <div className="flex justify-between gap-2 mb-2">
                  <div>
                    <span className="font-medium text-gray-900">{c.author?.name ?? 'User'}</span>
                    <span className="text-xs text-gray-500 ml-2">
                      {dayjs(c.createdAt).format('MMM D, YYYY h:mm A')}
                      {c.updatedAt && c.updatedAt !== c.createdAt && ' · edited'}
                    </span>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {isOwner && editingId !== c.id && (
                      <button
                        type="button"
                        onClick={() => startEdit(c)}
                        className="text-xs font-medium text-blue-600 hover:underline"
                      >
                        Edit
                      </button>
                    )}
                    {(isOwner || isAdmin) && editingId !== c.id && (
                      <button
                        type="button"
                        onClick={() => remove(c.id)}
                        className="text-xs font-medium text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
                {editingId === c.id ? (
                  <div className="space-y-2">
                    <textarea
                      rows={3}
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
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
                        className="rounded-md border border-gray-300 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">{c.content}</p>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <form onSubmit={handleAdd} className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Add a comment</label>
        <textarea
          rows={3}
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          placeholder="Updates, questions, or coordination notes…"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={submitting || !newText.trim()}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          Post comment
        </button>
      </form>
    </section>
  );
}
