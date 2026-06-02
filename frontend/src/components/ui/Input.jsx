/**
 * Input + label wrapped. Accetta tutte le props standard di <input>.
 *
 * Props extra:
 *   - label: stringa
 *   - hint:  testo aiuto sotto
 *   - error: messaggio errore (prevale su hint)
 *   - icon:  ReactNode mostrato a sinistra
 */
import { forwardRef } from 'react';

const Input = forwardRef(function Input(
  { label, hint, error, icon, className = '', ...rest },
  ref
) {
  return (
    <label className="block">
      {label && (
        <span className="block text-xs font-bold uppercase tracking-wider text-ink-soft mb-1.5">
          {label}
        </span>
      )}
      <span className="relative flex items-center">
        {icon && <span className="absolute left-3 text-ink-soft">{icon}</span>}
        <input
          ref={ref}
          className={[
            'w-full font-display font-semibold text-ink',
            'border-3 border-ink rounded-sm bg-cream',
            'py-2.5 px-3',
            icon ? 'pl-10' : '',
            'focus:outline-none focus:ring-0 focus:border-violet focus:bg-white',
            'placeholder:font-normal placeholder:text-ink-soft',
            className,
          ].filter(Boolean).join(' ')}
          {...rest}
        />
      </span>
      {(error || hint) && (
        <span className={['block mt-1 text-xs', error ? 'text-coral font-bold' : 'text-ink-soft'].join(' ')}>
          {error || hint}
        </span>
      )}
    </label>
  );
});

export default Input;
