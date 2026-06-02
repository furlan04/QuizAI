/**
 * Alert messaggio — varianti: success | error | info | warning
 */
const VARIANTS = {
  success: 'bg-mint',
  error:   'bg-coral',
  warning: 'bg-butter',
  info:    'bg-sky',
};

export default function Alert({ variant = 'info', className = '', children }) {
  const cls = [
    VARIANTS[variant] ?? VARIANTS.info,
    'border-3 border-ink rounded-sm shadow-hard px-4 py-3',
    'text-ink font-display font-semibold',
    className,
  ].filter(Boolean).join(' ');

  return <div role="alert" className={cls}>{children}</div>;
}
