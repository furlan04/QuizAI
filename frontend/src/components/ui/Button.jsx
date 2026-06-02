/**
 * Bottone neo-brutalist del progetto.
 *
 * Varianti:
 *   - primary  (default): sfondo violet, testo bianco
 *   - outline:            bordo ink, sfondo trasparente
 *   - secondary:          sfondo cream
 *   - danger:             sfondo coral
 *   - ghost:              senza bordo, hover light
 *
 * Dimensioni: sm | md (default) | lg
 *
 * Supporta `as` per renderizzarsi come Link/anchor mantenendo lo styling.
 */
const VARIANTS = {
  primary:   'bg-violet text-white hover:bg-violet-deep',
  outline:   'bg-white text-ink hover:bg-cream',
  secondary: 'bg-cream text-ink hover:bg-cream-2',
  danger:    'bg-coral text-ink hover:brightness-95',
  ghost:     'bg-transparent text-ink border-transparent hover:bg-cream-2',
};

const SIZES = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-2.5 text-[15px]',
  lg: 'px-6 py-3.5 text-base',
};

export default function Button({
  as: Component = 'button',
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  fullWidth = false,
  children,
  ...rest
}) {
  const base =
    'inline-flex items-center justify-center gap-2 font-display font-bold tracking-tight ' +
    'border-3 border-ink rounded-sm shadow-hard transition-all ' +
    'hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard-lg ' +
    'active:translate-x-0 active:translate-y-0 active:shadow-hard ' +
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-hard';

  const cls = [
    base,
    VARIANTS[variant] || VARIANTS.primary,
    SIZES[size] || SIZES.md,
    fullWidth ? 'w-full' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <Component className={cls} disabled={Component === 'button' ? disabled : undefined} {...rest}>
      {children}
    </Component>
  );
}
