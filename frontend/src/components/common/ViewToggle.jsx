import Icon from './Icon';

/**
 * ClickUp-inspired view toggle — switch between grid/list/board views.
 * Usage: <ViewToggle view={view} onChange={setView} views={['grid','list']} />
 */
const VIEW_CONFIG = {
  grid:  { icon: 'grid_view',   label: 'Grid' },
  list:  { icon: 'view_list',   label: 'List' },
  board: { icon: 'view_kanban', label: 'Board' },
};

export default function ViewToggle({ view, onChange, views = ['grid', 'list'] }) {
  return (
    <div className="flex items-center border border-cell-border bg-surface-container-lowest">
      {views.map((v) => {
        const cfg = VIEW_CONFIG[v];
        if (!cfg) return null;
        const active = view === v;
        return (
          <button
            key={v}
            onClick={() => onChange(v)}
            title={cfg.label}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
              active
                ? 'bg-primary text-on-primary'
                : 'text-outline hover:text-on-surface hover:bg-surface-container-high'
            }`}
          >
            <Icon name={cfg.icon} size={16} filled={active} />
            <span className="hidden sm:inline font-display tracking-wider">{cfg.label.toUpperCase()}</span>
          </button>
        );
      })}
    </div>
  );
}
