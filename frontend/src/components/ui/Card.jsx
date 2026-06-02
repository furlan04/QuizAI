/**
 * Card neo-brutalist: bordo nero, ombra "hard", angoli arrotondati.
 *
 * Props:
 *   - shadow: 'hard' | 'lg' | 'xl' | 'none'  (default 'hard')
 *   - bg:     classe Tailwind di background (default 'bg-white')
 *   - className
 */
const SHADOW = {
  hard: 'shadow-hard',
  lg:   'shadow-hard-lg',
  xl:   'shadow-hard-xl',
  none: '',
};

export default function Card({
  shadow = 'hard',
  bg = 'bg-white',
  className = '',
  children,
  ...rest
}) {
  const cls = [
    bg,
    'border-3 border-ink rounded-DEFAULT overflow-hidden',
    SHADOW[shadow] ?? SHADOW.hard,
    className,
  ].filter(Boolean).join(' ');

  return <div className={cls} {...rest}>{children}</div>;
}
