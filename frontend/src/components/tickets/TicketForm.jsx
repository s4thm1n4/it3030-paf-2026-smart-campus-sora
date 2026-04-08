import { useState } from 'react';
import toast from 'react-hot-toast';
import { HiOutlinePhoto, HiOutlineXCircle } from 'react-icons/hi2';
import ticketService from '../../services/ticketService';
import { getApiErrorMessage } from '../../utils/apiError';
import { TICKET_CATEGORIES, TICKET_PRIORITIES } from '../../constants/tickets';

const MAX_IMAGES = 3;
const MAX_SIZE_MB = 5;
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

function FilePreview({ file, onRemove }) {
  const [preview] = useState(() => URL.createObjectURL(file));
  return (
    <div className="relative group rounded-lg overflow-hidden border border-gray-200 bg-gray-50 aspect-square">
      <img src={preview} alt={file.name} className="h-full w-full object-cover" />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-1 right-1 rounded-full bg-white/90 p-0.5 text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 hover:text-red-600"
        aria-label="Remove"
      >
        <HiOutlineXCircle className="h-5 w-5" />
      </button>
      <p className="absolute bottom-0 left-0 right-0 bg-black/50 px-2 py-1 text-[10px] text-white truncate">
        {file.name}
      </p>
    </div>
  );
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
    const title = values.title.trim();
    const description = values.description.trim();
    const phone = values.contactPhone.trim().replace(/\D/g, ''); // digits only

    if (!title) {
      err.title = 'Title is required';
    } else if (title.length < 5) {
      err.title = 'Title must be at least 5 characters';
    }

    if (!description) {
      err.description = 'Description is required';
    } else if (description.length < 20) {
      err.description = 'Description must be at least 20 characters';
    }

    if (!values.category) err.category = 'Category is required';
    if (!values.priority) err.priority = 'Priority is required';

    if (values.contactEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.contactEmail.trim())) {
      err.contactEmail = 'Enter a valid email address (e.g. name@example.com)';
    }

    if (values.contactPhone.trim() && phone.length < 10) {
      err.contactPhone = 'Phone number must be at least 10 digits';
    }

    setFieldErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleFiles = (e) => {
    const picked = Array.from(e.target.files || []);
    const oversized = picked.filter((f) => f.size > MAX_SIZE_MB * 1024 * 1024);
    if (oversized.length > 0) {
      toast.error(`Each image must be under ${MAX_SIZE_MB}MB`);
      return;
    }
    const next = [...files, ...picked].slice(0, MAX_IMAGES);
    setFiles(next);
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files).filter((f) =>
      f.type.startsWith('image/')
    );
    const next = [...files, ...dropped].slice(0, MAX_IMAGES);
    setFiles(next);
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
        toast.success('Ticket submitted successfully');
        onSuccess(data);
      } else {
        const { data } = await ticketService.update(ticket.id, {
          title: values.title.trim(),
          description: values.description.trim(),
          category: values.category,
          priority: values.priority,
          contactName: values.contactName.trim() || null,
          contactEmail: values.contactEmail.trim() || null,
          contactPhone: values.contactPhone.trim() || null,
          location: values.location.trim() || null,
          facilityId: values.facilityId ? Number(values.facilityId) : null,
        });
        toast.success('Ticket updated');
        onSuccess(data);
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls =
    'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={values.title}
          onChange={(e) => set('title', e.target.value)}
          className={inputCls}
          placeholder="Short summary of the issue"
        />
        <div className="flex justify-between mt-1">
          {fieldErrors.title
            ? <p className="text-xs text-red-600">{fieldErrors.title}</p>
            : <span />}
          <span className={`text-xs ${values.title.trim().length < 5 ? 'text-gray-400' : 'text-emerald-600'}`}>
            {values.title.trim().length}/5 min
          </span>
        </div>
      </div>

      {/* Category + Priority */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category <span className="text-red-500">*</span>
          </label>
          <select
            value={values.category}
            onChange={(e) => set('category', e.target.value)}
            className={inputCls}
          >
            {TICKET_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          {fieldErrors.category && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.category}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Priority <span className="text-red-500">*</span>
          </label>
          <select
            value={values.priority}
            onChange={(e) => set('priority', e.target.value)}
            className={inputCls}
          >
            {TICKET_PRIORITIES.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
          {fieldErrors.priority && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.priority}</p>
          )}
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description <span className="text-red-500">*</span>
        </label>
        <textarea
          rows={4}
          value={values.description}
          onChange={(e) => set('description', e.target.value)}
          className={inputCls}
          placeholder="What happened? Include steps, room numbers, or asset IDs if known."
        />
        <div className="flex justify-between mt-1">
          {fieldErrors.description
            ? <p className="text-xs text-red-600">{fieldErrors.description}</p>
            : <span />}
          <span className={`text-xs ${values.description.trim().length < 20 ? 'text-gray-400' : 'text-emerald-600'}`}>
            {values.description.trim().length}/20 min
          </span>
        </div>
      </div>

      {/* Location + Facility */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Location / area</label>
          <input
            type="text"
            value={values.location}
            onChange={(e) => set('location', e.target.value)}
            className={inputCls}
            placeholder="Building, floor, room, outdoor area"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Facility <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <select
            value={values.facilityId}
            onChange={(e) => set('facilityId', e.target.value)}
            className={inputCls}
          >
            <option value="">— None —</option>
            {facilities.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name} — {f.location}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Contact preferences */}
      <fieldset className="rounded-lg border border-gray-200 p-4">
        <legend className="px-1 text-sm font-medium text-gray-600">
          Contact preferences <span className="text-gray-400 font-normal">(optional)</span>
        </legend>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
            <input
              type="text"
              value={values.contactName}
              onChange={(e) => set('contactName', e.target.value)}
              className={inputCls}
              placeholder="Contact name"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
            <input
              type="email"
              value={values.contactEmail}
              onChange={(e) => set('contactEmail', e.target.value)}
              className={inputCls}
              placeholder="contact@example.com"
            />
            {fieldErrors.contactEmail && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.contactEmail}</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
            <input
              type="tel"
              value={values.contactPhone}
              onChange={(e) => set('contactPhone', e.target.value)}
              className={inputCls}
              placeholder="+94 77 000 0000"
            />
            {fieldErrors.contactPhone && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.contactPhone}</p>
            )}
          </div>
        </div>
      </fieldset>

      {/* Image attachments (create only) */}
      {mode === 'create' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Photo evidence{' '}
            <span className="text-gray-400 font-normal">
              (up to {MAX_IMAGES} images, max {MAX_SIZE_MB}MB each)
            </span>
          </label>

          {files.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mb-3">
              {files.map((f, i) => (
                <FilePreview key={`${f.name}-${i}`} file={f} onRemove={() => removeFile(i)} />
              ))}
            </div>
          )}

          {files.length < MAX_IMAGES && (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 px-6 py-8 text-center hover:border-blue-400 hover:bg-blue-50/30 transition-colors cursor-pointer"
              onClick={() => document.getElementById('ticket-file-input').click()}
            >
              <HiOutlinePhoto className="h-8 w-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-600">
                <span className="font-medium text-blue-600">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-400 mt-1">JPEG, PNG, GIF, WebP</p>
              <input
                id="ticket-file-input"
                type="file"
                accept={ACCEPT}
                multiple
                onChange={handleFiles}
                className="hidden"
              />
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
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
          className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60"
        >
          {submitting ? 'Saving…' : mode === 'create' ? 'Submit ticket' : 'Save changes'}
        </button>
      </div>
    </form>
  );
}