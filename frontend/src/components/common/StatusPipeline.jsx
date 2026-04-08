import Icon from './Icon';

/**
 * ClickUp-inspired status pipeline — shows workflow steps with active state.
 * Usage: <StatusPipeline steps={['OPEN','IN_PROGRESS','RESOLVED','CLOSED']} current="IN_PROGRESS" />
 */
export default function StatusPipeline({ steps = [], current, onStepClick }) {
  const currentIndex = steps.indexOf(current);

  return (
    <div className="flex items-center gap-0 overflow-x-auto">
      {steps.map((step, i) => {
        const isPast = i < currentIndex;
        const isCurrent = i === currentIndex;
        const isFuture = i > currentIndex;

        return (
          <div key={step} className="flex items-center">
            {/* Step */}
            <button
              onClick={() => onStepClick?.(step)}
              disabled={!onStepClick}
              className={`flex items-center gap-1.5 px-3 py-1.5 font-mono text-[10px] tracking-wider transition-colors ${
                isCurrent
                  ? 'bg-primary text-on-primary font-bold'
                  : isPast
                    ? 'bg-primary-container text-primary'
                    : 'bg-surface-container text-outline'
              } ${onStepClick ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
            >
              {isPast && <Icon name="check_circle" size={12} />}
              {isCurrent && <Icon name="radio_button_checked" size={12} />}
              {isFuture && <Icon name="radio_button_unchecked" size={12} />}
              {step.replace(/_/g, ' ')}
            </button>

            {/* Connector arrow */}
            {i < steps.length - 1 && (
              <div className={`flex items-center ${isPast ? 'text-primary' : 'text-outline-variant'}`}>
                <Icon name="chevron_right" size={16} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
