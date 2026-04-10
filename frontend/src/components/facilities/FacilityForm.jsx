import Icon from '../common/Icon';

const FACILITY_TYPES = ['ROOM', 'LAB', 'EQUIPMENT'];
const FACILITY_STATUSES = ['ACTIVE', 'OUT_OF_SERVICE'];

const TYPE_LABELS = { ROOM: 'Room', LAB: 'Lab', EQUIPMENT: 'Equipment' };
const STATUS_LABELS = { ACTIVE: 'Active', OUT_OF_SERVICE: 'Out of Service' };

export default function FacilityForm({ editingId, form, setForm, onSubmit, onClose, submitting }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-surface border border-cell-border rounded-none shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-cell-border">
          <h2 className="text-lg font-semibold font-display text-on-surface uppercase label-caps">
            {editingId ? 'Edit Facility' : 'Add Facility'}
          </h2>
          <button onClick={onClose} className="p-1 text-on-surface-variant hover:text-on-surface transition-colors">
            <Icon name="close" size={20} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium font-display text-on-surface-variant mb-1 uppercase label-caps">
              Name *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 border border-outline-variant rounded-none bg-surface-container-lowest text-on-surface text-sm font-sans focus:outline-none focus:border-primary transition-colors"
              minLength={3}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium font-display text-on-surface-variant mb-1 uppercase label-caps">
                Type *
              </label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full px-3 py-2 border border-outline-variant rounded-none bg-surface-container-lowest text-on-surface text-sm font-sans focus:outline-none focus:border-primary transition-colors"
              >
                {FACILITY_TYPES.map((t) => (
                  <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium font-display text-on-surface-variant mb-1 uppercase label-caps">
                Status
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-3 py-2 border border-outline-variant rounded-none bg-surface-container-lowest text-on-surface text-sm font-sans focus:outline-none focus:border-primary transition-colors"
              >
                {FACILITY_STATUSES.map((s) => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium font-display text-on-surface-variant mb-1 uppercase label-caps">
              Location *
            </label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="w-full px-3 py-2 border border-outline-variant rounded-none bg-surface-container-lowest text-on-surface text-sm font-sans focus:outline-none focus:border-primary transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium font-display text-on-surface-variant mb-1 uppercase label-caps">
              Capacity {(form.type === 'ROOM' || form.type === 'LAB') ? '*' : ''}
            </label>
            <input
              type="number"
              min="1"
              value={form.capacity}
              onChange={(e) => setForm({ ...form, capacity: e.target.value })}
              className="w-full px-3 py-2 border border-outline-variant rounded-none bg-surface-container-lowest text-on-surface text-sm font-sans focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium font-display text-on-surface-variant mb-1 uppercase label-caps">
                Available From
              </label>
              <input
                type="time"
                value={form.availableFrom}
                onChange={(e) => setForm({ ...form, availableFrom: e.target.value })}
                className="w-full px-3 py-2 border border-outline-variant rounded-none bg-surface-container-lowest text-on-surface text-sm font-sans focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium font-display text-on-surface-variant mb-1 uppercase label-caps">
                Available To
              </label>
              <input
                type="time"
                value={form.availableTo}
                onChange={(e) => setForm({ ...form, availableTo: e.target.value })}
                className="w-full px-3 py-2 border border-outline-variant rounded-none bg-surface-container-lowest text-on-surface text-sm font-sans focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium font-display text-on-surface bg-surface-container-high rounded-none hover:bg-surface-container-high/80 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium font-display text-on-primary bg-primary rounded-none hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {submitting ? 'Saving...' : editingId ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}