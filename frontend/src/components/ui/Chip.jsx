/**
 * Chip / Pill — etichetta piccola con bordo.
 *
 * Tono:
 *   - default: sfondo cream
 *   - lime / coral / sky / butter / mint / violet
 */
const TONE = {
  default: 'bg-cream',
  lime:    'bg-lime',
  coral:   'bg-coral',
  sky:     'bg-sky',
  butter:  'bg-butter',
  mint:    'bg-mint',
  violet:  'bg-violet text-white',
  ink:     'bg-ink text-white',
};

export default function Chip({
  tone = 'default',
  size = 'md',
  className = '',
  mono = true,
  children,
}) {
  const cls = [
    'inline-flex items-center gap-1 rounded-full border-2 border-ink',
    mono ? 'font-mono uppercase tracking-wider' : 'font-display',
    size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs',
    'font-bold',
    TONE[tone] ?? TONE.default,
    className,
  ].filter(Boolean).join(' ');

  return <span className={cls}>{children}</span>;
}
