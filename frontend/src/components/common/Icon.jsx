/**
 * Material Symbols Outlined icon wrapper.
 * Usage: <Icon name="home" className="text-primary" size={24} />
 */
export default function Icon({ name, className = '', size = 20, filled = false }) {
  return (
    <span
      className={`material-symbols-outlined select-none ${className}`}
      style={{
        fontSize: size,
        fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' 400`,
      }}
    >
      {name}
    </span>
  );
}
