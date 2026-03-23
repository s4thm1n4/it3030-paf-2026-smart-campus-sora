import { useState } from 'react';
import toast from 'react-hot-toast';
import ticketService from '../../services/ticketService';
import { getApiErrorMessage } from '../../utils/apiError';
import { TICKET_CATEGORIES, TICKET_PRIORITIES } from '../../constants/tickets';

const MAX_IMAGES = 3;
const ACCEPT = 'image/jpeg,image/png,image/gif,image/webp';

function emptyForm() {
  return {
    title: '',
    description: '',
    category: 'OTHER',
    priority: 'MEDIUM',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    location: '',
    facilityId: '',
  };
}

function ticketToForm(ticket) {
  return {
    title: ticket.title ?? '',
    description: ticket.description ?? '',
    category: ticket.category ?? 'OTHER',
    priority: ticket.priority ?? 'MEDIUM',
    contactName: ticket.contactName ?? '',
    contactEmail: ticket.contactEmail ?? '',
    contactPhone: ticket.contactPhone ?? '',
    location: ticket.location ?? '',
    facilityId: ticket.facility?.id != null ? String(ticket.facility.id) : '',
  };
}

export default function TicketForm({ mode, ticket, facilities = [], onSuccess, onCancel }) {
  const [values, setValues] = useState(
    mode === 'edit' && ticket ? ticketToForm(ticket) : emptyForm()
  );
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const set = (key, v) => {
    setValues((prev) => ({ ...prev, [key]: v }));
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = () => {
    const err = {};
    if (!values.title.trim()) err.title = 'Title is required';
    if (!values.description.trim()) err.description = 'Description is required';
    if (!values.category) err.category = 'Category is required';
    if (!values.priority) err.priority = 'Priority is required';
    if (values.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.contactEmail)) {
      err.contactEmail = 'Enter a valid email';
    }
    setFieldErrors(err);
    return Object.keys(err).length === 0;
  };

  const buildUpdatePayload = () => {
    const payload = {
      title: values.title.trim(),
      description: values.description.trim(),
      category: values.category,
      priority: values.priority,
      contactName: values.contactName.trim() || null,
      contactEmail: values.contactEmail.trim() || null,
      contactPhone: values.contactPhone.trim() || null,
      location: values.location.trim() || null,
      facilityId: values.facilityId ? Number(values.facilityId) : null,
    };
    return payload;
  };

  const handleFiles = (e) => {
    const picked = Array.from(e.target.files || []);
    const next = [...files, ...picked].slice(0, MAX_IMAGES);
    setFiles(next);
    e.target.value = '';
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      if (mode === 'create') {
        const fd = new FormData();
        fd.append('title', values.title.trim());
        fd.append('description', values.description.trim());
        fd.append('category', values.category);
        fd.append('priority', values.priority);
        if (values.contactName.trim()) fd.append('contactName', values.contactName.trim());
        if (values.contactEmail.trim()) fd.append('contactEmail', values.contactEmail.trim());
        if (values.contactPhone.trim()) fd.append('contactPhone', values.contactPhone.trim());
        if (values.location.trim()) fd.append('location', values.location.trim());
        if (values.facilityId) fd.append('facilityId', values.facilityId);
        files.forEach((f) => fd.append('images', f));
        const { data } = await ticketService.create(fd);
        toast.success('Ticket submitted');
        onSuccess(data);
      } else {
        const { data } = await ticketService.update(ticket.id, buildUpdatePayload());
        toast.success('Ticket updated');
        onSuccess(data);
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
        <input
          type="text"
          value={values.title}
          onChange={(e) => set('title', e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          placeholder="Short summary of the issue"
        />
        {fieldErrors.title && <p className="mt-1 text-xs text-red-600">{fieldErrors.title}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select
            value={values.category}
            onChange={(e) => set('category', e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            {TICKET_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          {fieldErrors.category && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.category}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
          <select
            value={values.priority}
            onChange={(e) => set('priority', e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            {TICKET_PRIORITIES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
          {fieldErrors.priority && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.priority}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          rows={5}
          value={values.description}
          onChange={(e) => set('description', e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          placeholder="What happened? Include steps, room numbers, or asset IDs if known."
        />
        {fieldErrors.description && (
          <p className="mt-1 text-xs text-red-600">{fieldErrors.description}</p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Preferred contact name</label>
          <input
            type="text"
            value={values.contactName}
            onChange={(e) => set('contactName', e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Preferred contact email</label>
          <input
            type="email"
            value={values.contactEmail}
            onChange={(e) => set('contactEmail', e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          {fieldErrors.contactEmail && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.contactEmail}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Preferred contact phone</label>
          <input
            type="tel"
            value={values.contactPhone}
            onChange={(e) => set('contactPhone', e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Location / area</label>
          <input
            type="text"
            value={values.location}
            onChange={(e) => set('location', e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            placeholder="Building, floor, room, or outdoor area"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Facility (optional)</label>
        <select
          value={values.facilityId}
          onChange={(e) => set('facilityId', e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        >
          <option value="">— None —</option>
          {facilities.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name} — {f.location}
            </option>
          ))}
        </select>
      </div>

      {mode === 'create' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Attachments (up to {MAX_IMAGES} images, max 5MB each)
          </label>
          <input
            type="file"
            accept={ACCEPT}
            multiple
            onChange={handleFiles}
            className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100"
          />
          {files.length > 0 && (
            <ul className="mt-2 space-y-1 text-sm text-gray-600">
              {files.map((f, i) => (
                <li key={`${f.name}-${i}`} className="flex items-center justify-between gap-2">
                  <span className="truncate">{f.name}</span>
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="text-red-600 text-xs font-medium hover:underline"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60"
        >
          {submitting ? 'Saving…' : mode === 'create' ? 'Submit ticket' : 'Save changes'}
        </button>
      </div>
    </form>
  );
}
